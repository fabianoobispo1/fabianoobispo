import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { getTerminalUser, requireTerminalUser } from './authz'

/**
 * Metadados das sessões tmux do terminal web (apelido, cor, pasta), por
 * usuário e por conexão. A sessão vive no host; a lista "de verdade" vem do
 * Terminal Server (`list`) e a UI junta as duas pelo nome.
 *
 * `connectionKey` = _id de uma sshConnection do usuário, ou 'default' para a
 * credencial SSH_* do .env do Terminal Server.
 */

export const SESSION_NAME_RE = /^agent-\d{1,6}$/
// Mesma regra do Terminal Server (scripts/terminal-server/lib/tmux.js)
export const CWD_RE =
  /^(~|~\/[A-Za-z0-9 ._/-]{0,255}|\/[A-Za-z0-9 ._/-]{0,255})$/
export const SESSION_COLORS = [
  'slate',
  'red',
  'orange',
  'amber',
  'emerald',
  'teal',
  'sky',
  'blue',
  'violet',
  'pink',
] as const
const MAX_APELIDO = 40
const MAX_SESSIONS_PER_CONNECTION = 200

async function assertConnectionKey(
  ctx: QueryCtx | MutationCtx,
  user: Doc<'user'>,
  connectionKey: string,
): Promise<boolean> {
  if (connectionKey === 'default') return true
  const id = ctx.db.normalizeId('sshConnection', connectionKey)
  if (!id) return false
  const conn = await ctx.db.get(id)
  return Boolean(conn && conn.userId === user._id)
}

function getMeta(
  ctx: QueryCtx | MutationCtx,
  user: Doc<'user'>,
  connectionKey: string,
  name: string,
) {
  return ctx.db
    .query('terminalSession')
    .withIndex('by_user_connection_name', (q) =>
      q
        .eq('userId', user._id)
        .eq('connectionKey', connectionKey)
        .eq('name', name),
    )
    .unique()
}

export const listByConnection = query({
  args: { connectionKey: v.string() },
  handler: async (ctx, { connectionKey }) => {
    const user = await getTerminalUser(ctx)
    if (!user || !(await assertConnectionKey(ctx, user, connectionKey))) {
      return []
    }
    return await ctx.db
      .query('terminalSession')
      .withIndex('by_user_connection', (q) =>
        q.eq('userId', user._id).eq('connectionKey', connectionKey),
      )
      .take(MAX_SESSIONS_PER_CONNECTION)
  },
})

/** Cria/atualiza. Campo ausente = mantém; null = apaga o valor. */
export const upsert = mutation({
  args: {
    connectionKey: v.string(),
    name: v.string(),
    apelido: v.optional(v.union(v.string(), v.null())),
    cor: v.optional(v.union(v.string(), v.null())),
    pasta: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const user = await requireTerminalUser(ctx)
    if (!(await assertConnectionKey(ctx, user, args.connectionKey))) {
      throw new Error('Conexão não encontrada')
    }
    if (!SESSION_NAME_RE.test(args.name)) {
      throw new Error('Nome de sessão inválido')
    }

    const apelido =
      typeof args.apelido === 'string' ? args.apelido.trim() : args.apelido
    if (typeof apelido === 'string' && apelido.length > MAX_APELIDO) {
      throw new Error(`Apelido com no máximo ${MAX_APELIDO} caracteres`)
    }
    if (
      typeof args.cor === 'string' &&
      !(SESSION_COLORS as readonly string[]).includes(args.cor)
    ) {
      throw new Error('Cor inválida')
    }
    if (typeof args.pasta === 'string' && !CWD_RE.test(args.pasta)) {
      throw new Error('Pasta inválida')
    }

    // undefined = não mexe; null/'' = limpa
    const patch: Partial<Doc<'terminalSession'>> = { updated_at: Date.now() }
    if (apelido !== undefined) patch.apelido = apelido || undefined
    if (args.cor !== undefined) patch.cor = args.cor || undefined
    if (args.pasta !== undefined) patch.pasta = args.pasta || undefined

    const existing = await getMeta(ctx, user, args.connectionKey, args.name)
    if (existing) {
      await ctx.db.patch(existing._id, patch)
      return existing._id
    }

    const count = (
      await ctx.db
        .query('terminalSession')
        .withIndex('by_user_connection', (q) =>
          q.eq('userId', user._id).eq('connectionKey', args.connectionKey),
        )
        .take(MAX_SESSIONS_PER_CONNECTION)
    ).length
    if (count >= MAX_SESSIONS_PER_CONNECTION) {
      throw new Error('Limite de sessões salvas atingido')
    }

    return await ctx.db.insert('terminalSession', {
      userId: user._id,
      connectionKey: args.connectionKey,
      name: args.name,
      apelido: patch.apelido,
      cor: patch.cor,
      pasta: patch.pasta,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { connectionKey: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireTerminalUser(ctx)
    const existing = await getMeta(ctx, user, args.connectionKey, args.name)
    if (existing) await ctx.db.delete(existing._id)
  },
})
