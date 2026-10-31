import { v } from 'convex/values'

import { query, mutation, internalQuery } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import {
  getCurrentUser,
  requireAdmin,
  requireService,
  requireUser,
  toSafeUser,
} from './authz'

// ============================================================ usuário logado

/** Dados do usuário autenticado (sem hash de senha). null se não logado. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    return user ? toSafeUser(user) : null
  },
})

/** Atualiza o próprio perfil. Senha é trocada via /api/profile/password. */
export const updateMe = mutation({
  args: {
    nome: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    image_key: v.optional(v.string()),
    data_nascimento: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    if (args.nome !== undefined && args.nome.trim().length < 3) {
      throw new Error('Nome precisa ter ao menos 3 caracteres')
    }

    if (args.email !== undefined && args.email !== user.email) {
      // E-mail é a chave de login: só contas por senha podem trocá-lo, e o
      // novo não pode pertencer a outra conta
      if (user.provider !== 'credentials') {
        throw new Error('Contas Google/GitHub não podem alterar o e-mail')
      }
      const existing = await ctx.db
        .query('user')
        .withIndex('by_email', (q) => q.eq('email', args.email!))
        .unique()
      if (existing) throw new Error('Email já cadastrado')
    }

    await ctx.db.patch(user._id, {
      nome: args.nome,
      email: args.email,
      image: args.image,
      image_key: args.image_key,
      data_nascimento: args.data_nascimento,
    })
    return user._id
  },
})

// ==================================================================== admin

export const getAllUserRole = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const users = await ctx.db.query('user').collect()
    return users.map(toSafeUser)
  },
})

export const toggleUserRole = mutation({
  args: { targetUserId: v.id('user') },
  handler: async (ctx, { targetUserId }) => {
    const admin = await requireAdmin(ctx)
    if (admin._id === targetUserId) {
      throw new Error('Você não pode alterar o próprio papel')
    }

    const user = await ctx.db.get(targetUserId)
    if (!user) throw new Error('Usuário não encontrado')

    await ctx.db.patch(targetUserId, {
      role: user.role === 'admin' ? 'user' : 'admin',
    })
  },
})

// ========================================== só o servidor Next.js (serviço)
// Chamadas pelo NextAuth/rotas de API com o token de serviço — nunca pelo
// navegador. São as únicas que tocam no hash de senha.

/** Usado pelo login por credenciais (precisa do hash para o bcrypt). */
export const getAuthByEmailService = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    await requireService(ctx)
    return await ctx.db
      .query('user')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique()
  },
})

export const getAuthByIdService = query({
  args: { userId: v.id('user') },
  handler: async (ctx, { userId }) => {
    await requireService(ctx)
    return await ctx.db.get(userId)
  },
})

/** Cadastro por e-mail/senha. O papel é sempre 'user'. */
export const registerWithPasswordService = mutation({
  args: { nome: v.string(), email: v.string(), passwordHash: v.string() },
  handler: async (ctx, { nome, email, passwordHash }) => {
    await requireService(ctx)
    const existing = await ctx.db
      .query('user')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique()
    if (existing) return { ok: false as const, reason: 'email_taken' as const }

    const userId = await ctx.db.insert('user', {
      nome,
      email,
      provider: 'credentials',
      role: 'user',
      image: '',
      password: passwordHash,
      last_login_at: Date.now(),
    })
    return { ok: true as const, userId }
  },
})

/**
 * Login OAuth: cria o usuário se não existir ou atualiza imagem/provider.
 * Não mexe na senha de quem também tem login por credenciais.
 */
export const upsertOAuthService = mutation({
  args: {
    email: v.string(),
    nome: v.string(),
    provider: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireService(ctx)
    const existing = await ctx.db
      .query('user')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .unique()

    let userId: Id<'user'>
    if (existing) {
      userId = existing._id
      const patch: Partial<Doc<'user'>> = { last_login_at: Date.now() }
      if (args.image) patch.image = args.image
      // Mantém 'credentials' se a conta tem senha, para não bloquear o login
      if (!existing.password) patch.provider = args.provider
      await ctx.db.patch(userId, patch)
    } else {
      userId = await ctx.db.insert('user', {
        nome: args.nome,
        email: args.email,
        provider: args.provider,
        role: 'user',
        image: args.image ?? '',
        password: '',
        last_login_at: Date.now(),
      })
    }

    const user = (await ctx.db.get(userId))!
    return {
      _id: user._id,
      nome: user.nome,
      role: user.role,
      image: user.image,
    }
  },
})

export const touchLoginService = mutation({
  args: { userId: v.id('user') },
  handler: async (ctx, { userId }) => {
    await requireService(ctx)
    if (await ctx.db.get(userId)) {
      await ctx.db.patch(userId, { last_login_at: Date.now() })
    }
  },
})

export const setPasswordHashService = mutation({
  args: { userId: v.id('user'), passwordHash: v.string() },
  handler: async (ctx, { userId, passwordHash }) => {
    await requireService(ctx)
    const user = await ctx.db.get(userId)
    if (!user) throw new Error('Usuário não encontrado')
    await ctx.db.patch(userId, { password: passwordHash })
  },
})

// ================================================================= internal

/** Usado por requireUserAction (actions não têm acesso ao db). */
export const getAuthInfoInternal = internalQuery({
  args: { subject: v.string() },
  handler: async (ctx, { subject }) => {
    const userId = ctx.db.normalizeId('user', subject)
    if (!userId) return null
    const user = await ctx.db.get(userId)
    return user ? { _id: user._id, role: user.role } : null
  },
})
