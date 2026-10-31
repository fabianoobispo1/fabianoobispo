import { v } from 'convex/values'

import { query, mutation, internalMutation } from './_generated/server'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import {
  getCurrentUser,
  requireTerminalUser,
  terminalAuthorizedEmail,
} from './authz'

/**
 * Conexões SSH salvas do usuário do terminal.
 *
 * Só o usuário com e-mail TERMINAL_AUTHORIZED_EMAIL (env do Convex) acessa.
 * Nenhuma função devolve senha/chave privada: a UI recebe só os metadados
 * e `hasCredential`. (A criptografia das credenciais entra na Fase 2.)
 */

type SafeConnection = Omit<
  Doc<'sshConnection'>,
  'password' | 'privateKey' | 'privateKeyPassphrase'
> & { hasCredential: boolean }

function toSafeConnection(conn: Doc<'sshConnection'>): SafeConnection {
  const { password, privateKey, privateKeyPassphrase, ...rest } = conn
  void privateKeyPassphrase
  return { ...rest, hasCredential: Boolean(password || privateKey) }
}

async function getOwnConnection(
  ctx: MutationCtx,
  connectionId: Id<'sshConnection'>,
) {
  const user = await requireTerminalUser(ctx)
  const connection = await ctx.db.get(connectionId)
  if (!connection || connection.userId !== user._id) {
    throw new Error('Conexão não encontrada')
  }
  return { user, connection }
}

async function clearOtherDefaults(ctx: MutationCtx, userId: Id<'user'>) {
  const oldDefault = await ctx.db
    .query('sshConnection')
    .withIndex('by_user_default', (q) =>
      q.eq('userId', userId).eq('isDefault', true),
    )
    .collect()
  for (const conn of oldDefault) {
    await ctx.db.patch(conn._id, { isDefault: false })
  }
}

/** Usuário logado é o usuário autorizado do terminal? */
async function getTerminalUserOrNull(
  ctx: Parameters<typeof getCurrentUser>[0],
) {
  const user = await getCurrentUser(ctx)
  const allowed = terminalAuthorizedEmail()
  if (!user || !allowed || user.email.trim().toLowerCase() !== allowed) {
    return null
  }
  return user
}

function validateEndpoint(args: { host?: string; port?: number }) {
  if (args.host !== undefined && !/^[a-zA-Z0-9.:_-]{1,253}$/.test(args.host)) {
    throw new Error('Host inválido')
  }
  if (
    args.port !== undefined &&
    (!Number.isInteger(args.port) || args.port < 1 || args.port > 65535)
  ) {
    throw new Error('Porta inválida')
  }
}

export const getConnectionsByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getTerminalUserOrNull(ctx)
    if (!user) return []
    const connections = await ctx.db
      .query('sshConnection')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
    return connections.map(toSafeConnection)
  },
})

export const getConnectionById = query({
  args: { connectionId: v.id('sshConnection') },
  handler: async (ctx, args) => {
    const user = await getTerminalUserOrNull(ctx)
    if (!user) return null
    const connection = await ctx.db.get(args.connectionId)
    if (!connection || connection.userId !== user._id) return null
    return toSafeConnection(connection)
  },
})

export const getDefaultConnection = query({
  args: {},
  handler: async (ctx) => {
    const user = await getTerminalUserOrNull(ctx)
    if (!user) return null
    const defaultConn = await ctx.db
      .query('sshConnection')
      .withIndex('by_user_default', (q) =>
        q.eq('userId', user._id).eq('isDefault', true),
      )
      .first()
    return defaultConn ? toSafeConnection(defaultConn) : null
  },
})

export const createConnection = mutation({
  args: {
    name: v.string(),
    host: v.string(),
    port: v.number(),
    username: v.string(),
    authMethod: v.union(v.literal('password'), v.literal('privateKey')),
    password: v.optional(v.string()),
    privateKey: v.optional(v.string()),
    privateKeyPassphrase: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireTerminalUser(ctx)
    validateEndpoint(args)

    if (args.authMethod === 'password' && !args.password) {
      throw new Error('Senha é obrigatória para autenticação por senha')
    }
    if (args.authMethod === 'privateKey' && !args.privateKey) {
      throw new Error('Chave privada é obrigatória para autenticação por chave')
    }

    if (args.isDefault) await clearOtherDefaults(ctx, user._id)

    const now = Date.now()
    return await ctx.db.insert('sshConnection', {
      ...args,
      userId: user._id,
      created_at: now,
      updated_at: now,
    })
  },
})

export const updateConnection = mutation({
  args: {
    connectionId: v.id('sshConnection'),
    name: v.optional(v.string()),
    host: v.optional(v.string()),
    port: v.optional(v.number()),
    username: v.optional(v.string()),
    authMethod: v.optional(
      v.union(v.literal('password'), v.literal('privateKey')),
    ),
    // Vazio/ausente = manter a credencial atual
    password: v.optional(v.string()),
    privateKey: v.optional(v.string()),
    privateKeyPassphrase: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user, connection } = await getOwnConnection(ctx, args.connectionId)
    validateEndpoint(args)

    if (args.isDefault === true && !connection.isDefault) {
      await clearOtherDefaults(ctx, user._id)
    }

    const {
      connectionId,
      password,
      privateKey,
      privateKeyPassphrase,
      ...rest
    } = args
    const updates: Partial<Doc<'sshConnection'>> = {
      ...rest,
      updated_at: Date.now(),
    }
    if (password) updates.password = password
    if (privateKey) updates.privateKey = privateKey
    if (privateKeyPassphrase)
      updates.privateKeyPassphrase = privateKeyPassphrase

    await ctx.db.patch(connectionId, updates)
    return connectionId
  },
})

export const updateLastUsed = mutation({
  args: { connectionId: v.id('sshConnection') },
  handler: async (ctx, args) => {
    await getOwnConnection(ctx, args.connectionId)
    await ctx.db.patch(args.connectionId, { lastUsed: Date.now() })
  },
})

export const deleteConnection = mutation({
  args: { connectionId: v.id('sshConnection') },
  handler: async (ctx, args) => {
    await getOwnConnection(ctx, args.connectionId)
    await ctx.db.delete(args.connectionId)
    return { success: true }
  },
})

/** Limpeza: só via `npx convex run sshConnection:deleteAllConnections`. */
export const deleteAllConnections = internalMutation({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query('sshConnection')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()
    for (const conn of connections) await ctx.db.delete(conn._id)
    return { deleted: connections.length }
  },
})
