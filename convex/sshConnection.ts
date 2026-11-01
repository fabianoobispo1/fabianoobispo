import { v } from 'convex/values'

import {
  query,
  mutation,
  internalMutation,
  internalQuery,
} from './_generated/server'
import type { MutationCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { getTerminalUser, requireTerminalUser } from './authz'

/**
 * Conexões SSH salvas do usuário do terminal.
 *
 * - Só o usuário com e-mail TERMINAL_AUTHORIZED_EMAIL (env do Convex) acessa.
 * - A credencial chega aqui JÁ SELADA pelo navegador com a chave pública do
 *   Terminal Server (`sealedCredential`). O Convex guarda só o ciphertext e
 *   não consegue lê-lo; quem abre é o Terminal Server na VPS.
 * - O conteúdo selado inclui host/porta/usuário e o dono: o Terminal Server
 *   conecta no host de DENTRO do blob e confere o dono com o token, então
 *   um ciphertext não pode ser redirecionado para outro host nem reutilizado
 *   por outro usuário. Por isso, mudar host/porta/usuário/método exige
 *   selar a credencial de novo.
 */

// Sealed box = 48 bytes de overhead; uma chave RSA 4096 em PEM tem ~3.3 KB.
const MAX_SEALED_LENGTH = 32_000
const FINGERPRINT_RE = /^SHA256:[A-Za-z0-9+/]{43}$/

type SafeConnection = Omit<
  Doc<'sshConnection'>,
  'password' | 'privateKey' | 'privateKeyPassphrase' | 'sealedCredential'
> & { hasCredential: boolean }

function toSafeConnection(conn: Doc<'sshConnection'>): SafeConnection {
  const {
    password,
    privateKey,
    privateKeyPassphrase,
    sealedCredential,
    ...rest
  } = conn
  void password
  void privateKey
  void privateKeyPassphrase
  return { ...rest, hasCredential: Boolean(sealedCredential) }
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

function validateEndpoint(args: {
  host?: string
  port?: number
  username?: string
}) {
  if (args.host !== undefined && !/^[a-zA-Z0-9.:_-]{1,253}$/.test(args.host)) {
    throw new Error('Host inválido')
  }
  if (
    args.port !== undefined &&
    (!Number.isInteger(args.port) || args.port < 1 || args.port > 65535)
  ) {
    throw new Error('Porta inválida')
  }
  if (
    args.username !== undefined &&
    !/^[a-zA-Z0-9._-]{1,64}$/.test(args.username)
  ) {
    throw new Error('Usuário inválido')
  }
}

function validateSealed(sealed: string) {
  if (
    sealed.length < 64 ||
    sealed.length > MAX_SEALED_LENGTH ||
    !/^[A-Za-z0-9+/=_-]+$/.test(sealed)
  ) {
    throw new Error('Credencial selada inválida')
  }
}

export const getConnectionsByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getTerminalUser(ctx)
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
    const user = await getTerminalUser(ctx)
    if (!user) return null
    const connection = await ctx.db.get(args.connectionId)
    if (!connection || connection.userId !== user._id) return null
    return toSafeConnection(connection)
  },
})

/**
 * Ciphertext para o navegador repassar ao Terminal Server no `start`.
 * Não é segredo utilizável: só a TERMINAL_PRIVATE_KEY abre, e o servidor
 * exige que o dono selado seja o mesmo do token.
 */
export const getSealedCredential = query({
  args: { connectionId: v.id('sshConnection') },
  handler: async (ctx, args) => {
    const user = await getTerminalUser(ctx)
    if (!user) return null
    const connection = await ctx.db.get(args.connectionId)
    if (!connection || connection.userId !== user._id) return null
    return connection.sealedCredential ?? null
  },
})

export const getDefaultConnection = query({
  args: {},
  handler: async (ctx) => {
    const user = await getTerminalUser(ctx)
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
    sealedCredential: v.string(),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireTerminalUser(ctx)
    validateEndpoint(args)
    validateSealed(args.sealedCredential)

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
    // Ausente = manter a credencial atual
    sealedCredential: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user, connection } = await getOwnConnection(ctx, args.connectionId)
    validateEndpoint(args)
    if (args.sealedCredential !== undefined) {
      validateSealed(args.sealedCredential)
    }

    // host/porta/usuário/método estão DENTRO do blob selado: mudá-los sem
    // selar de novo deixaria metadados e credencial divergentes
    const bindingChanged =
      (args.host !== undefined && args.host !== connection.host) ||
      (args.port !== undefined && args.port !== connection.port) ||
      (args.username !== undefined && args.username !== connection.username) ||
      (args.authMethod !== undefined &&
        args.authMethod !== connection.authMethod)
    if (bindingChanged && args.sealedCredential === undefined) {
      throw new Error(
        'Ao alterar host, porta, usuário ou método, digite a credencial novamente',
      )
    }

    if (args.isDefault === true && !connection.isDefault) {
      await clearOtherDefaults(ctx, user._id)
    }

    const { connectionId, ...rest } = args
    await ctx.db.patch(connectionId, {
      ...rest,
      // Outro host/porta: a host key fixada não vale mais
      ...(bindingChanged ? { hostKeyFingerprint: undefined } : {}),
      updated_at: Date.now(),
    })
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

/**
 * TOFU: grava a fingerprint vista na 1ª conexão. Se já houver outra
 * gravada, recusa — trocar exige `resetHostKey` (ação explícita na UI).
 */
export const pinHostKey = mutation({
  args: { connectionId: v.id('sshConnection'), fingerprint: v.string() },
  handler: async (ctx, args) => {
    const { connection } = await getOwnConnection(ctx, args.connectionId)
    if (!FINGERPRINT_RE.test(args.fingerprint)) {
      throw new Error('Fingerprint inválida')
    }
    if (connection.hostKeyFingerprint === args.fingerprint) return
    if (connection.hostKeyFingerprint) {
      throw new Error('Já existe outra host key fixada para esta conexão')
    }
    await ctx.db.patch(args.connectionId, {
      hostKeyFingerprint: args.fingerprint,
    })
  },
})

/** Esquece a host key fixada (a próxima conexão grava a nova). */
export const resetHostKey = mutation({
  args: { connectionId: v.id('sshConnection') },
  handler: async (ctx, args) => {
    await getOwnConnection(ctx, args.connectionId)
    await ctx.db.patch(args.connectionId, { hostKeyFingerprint: undefined })
  },
})

export const deleteConnection = mutation({
  args: { connectionId: v.id('sshConnection') },
  handler: async (ctx, args) => {
    const { user } = await getOwnConnection(ctx, args.connectionId)
    // Metadados das sessões tmux desta conexão vão junto
    const sessions = await ctx.db
      .query('terminalSession')
      .withIndex('by_user_connection', (q) =>
        q.eq('userId', user._id).eq('connectionKey', args.connectionId),
      )
      .collect()
    for (const s of sessions) await ctx.db.delete(s._id)
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

// ============================================== migração: texto puro → selado

/** Quantas conexões ainda têm segredo em texto puro (sem expor valores). */
export const countPlaintextSecretsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('sshConnection').collect()
    const withPlaintext = all.filter(
      (c) =>
        c.password !== undefined ||
        c.privateKey !== undefined ||
        c.privateKeyPassphrase !== undefined,
    )
    return {
      total: all.length,
      withPlaintext: withPlaintext.length,
      sealed: all.filter((c) => c.sealedCredential).length,
      names: withPlaintext.map((c) => `${c.name} (${c.username}@${c.host})`),
    }
  },
})

/**
 * Apaga password/privateKey/privateKeyPassphrase em texto puro de todas as
 * conexões. Metadados (nome, host, porta, usuário) ficam; a credencial deve
 * ser digitada de novo na UI, que já a sela.
 *   npx convex run sshConnection:purgePlaintextSecretsInternal [--prod]
 */
export const purgePlaintextSecretsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('sshConnection').collect()
    let purged = 0
    for (const c of all) {
      if (
        c.password !== undefined ||
        c.privateKey !== undefined ||
        c.privateKeyPassphrase !== undefined
      ) {
        await ctx.db.patch(c._id, {
          password: undefined,
          privateKey: undefined,
          privateKeyPassphrase: undefined,
        })
        purged++
      }
    }
    return { purged }
  },
})
