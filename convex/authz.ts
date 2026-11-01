import type { Doc, Id } from './_generated/dataModel'
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server'
import { internal } from './_generated/api'

/**
 * Helpers de autorização baseados na identidade autenticada (JWT validado
 * pelo Convex, ver auth.config.ts). NUNCA aceite "quem está chamando" como
 * argumento vindo do cliente — use sempre estes helpers.
 *
 * Tokens:
 * - usuário: `sub` = _id do documento em `user` (emitido em /api/convex/token)
 * - serviço: `sub` = SERVICE_SUBJECT (emitido só no servidor Next.js, usado
 *   pelo NextAuth para login/cadastro quando ainda não existe sessão)
 */

export const SERVICE_SUBJECT = 'service:next'

type DbCtx = QueryCtx | MutationCtx

export type SafeUser = Omit<Doc<'user'>, 'password'> & { hasPassword: boolean }

/** Remove o hash de senha antes de devolver um usuário ao cliente. */
export function toSafeUser(user: Doc<'user'>): SafeUser {
  const { password, ...rest } = user
  return { ...rest, hasPassword: Boolean(password) }
}

export async function getCurrentUser(ctx: DbCtx): Promise<Doc<'user'> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity || identity.subject.startsWith('service:')) return null
  const userId = ctx.db.normalizeId('user', identity.subject)
  if (!userId) return null
  return await ctx.db.get(userId)
}

export async function requireUser(ctx: DbCtx): Promise<Doc<'user'>> {
  const user = await getCurrentUser(ctx)
  if (!user) throw new Error('Não autenticado')
  return user
}

export async function requireAdmin(ctx: DbCtx): Promise<Doc<'user'>> {
  const user = await requireUser(ctx)
  if (user.role !== 'admin') {
    throw new Error(
      'Acesso negado: apenas administradores podem realizar esta ação',
    )
  }
  return user
}

/** Só o servidor Next.js (token de serviço) pode chamar. */
export async function requireService(ctx: {
  auth: QueryCtx['auth']
}): Promise<void> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity || identity.subject !== SERVICE_SUBJECT) {
    throw new Error('Acesso negado')
  }
}

/**
 * E-mail autorizado a usar o terminal (env do Convex). Sem ele, o terminal
 * fica desabilitado — não existe fallback no código.
 */
export function terminalAuthorizedEmail(): string | null {
  const email = process.env.TERMINAL_AUTHORIZED_EMAIL?.trim().toLowerCase()
  return email || null
}

export async function requireTerminalUser(ctx: DbCtx): Promise<Doc<'user'>> {
  const user = await requireUser(ctx)
  const allowed = terminalAuthorizedEmail()
  if (!allowed) throw new Error('Terminal desabilitado')
  if (user.email.trim().toLowerCase() !== allowed) {
    throw new Error('Acesso negado')
  }
  return user
}

/** Versão de query: o usuário do terminal, ou null (sem lançar). */
export async function getTerminalUser(ctx: DbCtx): Promise<Doc<'user'> | null> {
  const user = await getCurrentUser(ctx)
  const allowed = terminalAuthorizedEmail()
  if (!user || !allowed || user.email.trim().toLowerCase() !== allowed) {
    return null
  }
  return user
}

// ---------------------------------------------------------------- actions

/** Actions não têm `db`: resolve o usuário via internalQuery. */
export async function requireUserAction(
  ctx: ActionCtx,
): Promise<{ _id: Id<'user'>; role: 'admin' | 'user' }> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity || identity.subject.startsWith('service:')) {
    throw new Error('Não autenticado')
  }
  const user: { _id: Id<'user'>; role: 'admin' | 'user' } | null =
    await ctx.runQuery(internal.user.getAuthInfoInternal, {
      subject: identity.subject,
    })
  if (!user) throw new Error('Não autenticado')
  return user
}

export async function requireAdminAction(
  ctx: ActionCtx,
): Promise<{ _id: Id<'user'>; role: 'admin' | 'user' }> {
  const user = await requireUserAction(ctx)
  if (user.role !== 'admin') {
    throw new Error(
      'Acesso negado: apenas administradores podem realizar esta ação',
    )
  }
  return user
}
