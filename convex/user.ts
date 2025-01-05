import { v } from 'convex/values'

import { query, mutation } from './_generated/server'
import { userSchema } from './schema'

export const create = mutation({
  args: userSchema,
  handler: async ({ db }, args) => {
    const user = await db.insert('user', args)
    return user
  },
})

export const getByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async ({ db }, { email }) => {
    const user = await db
      .query('user')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique()
    return user
  },
})

export const getById = query({
  args: {
    userId: v.id('user'),
  },
  handler: async ({ db }, { userId }) => {
    const user = await db
      .query('user')
      .withIndex('by_id', (q) => q.eq('_id', userId))
      .unique()
    return user
  },
})

export const UpdateUser = mutation({
  args: {
    userId: v.id('user'),
    nome: v.optional(v.string()),
    email: v.optional(v.string()),
    provider: v.optional(v.string()),
    image: v.optional(v.string()),
    image_key: v.optional(v.string()),
    data_nascimento: v.optional(v.number()),
    password: v.optional(v.string()),
  },
  handler: async (
    { db },
    {
      userId,
      nome,
      email,
      provider,
      image,
      data_nascimento,
      image_key,
      password,
    },
  ) => {
    // Buscar o usuario atual
    const usuario = await db.get(userId)
    if (!usuario) {
      throw new Error('Usuario não encontrado')
    }

    // altera os valores
    const updateUser = await db.patch(userId, {
      nome,
      email,
      provider,
      image,
      data_nascimento,
      image_key,
      password,
    })

    return updateUser
  },
})

export const UpdateUserLogin = mutation({
  args: {
    userId: v.id('user'),
    provider: v.optional(v.string()),
    image: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async ({ db }, { userId, provider, image, password }) => {
    // Buscar o usuario atual
    const verificaUsuario = await db.get(userId)
    if (!verificaUsuario) {
      throw new Error('Usuario não encontrado')
    }
    // altera os valores
    await db.patch(userId, {
      provider,
      image,
      password,
    })
    const usuario = await db.get(userId)
    return usuario
  },
})

export const UpdateUserLoginPassword = mutation({
  args: {
    userId: v.id('user'),
    password: v.string(),
  },
  handler: async ({ db }, { userId, password }) => {
    // Buscar o usuario atual
    const verificaUsuario = await db.get(userId)
    if (!verificaUsuario) {
      throw new Error('Usuario não encontrado')
    }
    // altera os valores
    await db.patch(userId, {
      password,
    })
    const usuario = await db.get(userId)
    return usuario
  },
})

export const getAllUserRole = query({
  handler: async ({ db }) => {
    const user = await db.query('user').collect()

    return user
  },
})
export const toggleUserRole = mutation({
  args: {
    userId: v.id('user'),
  },
  handler: async ({ db }, { userId }) => {
    const user = await db.get(userId)
    if (!user) {
      throw new Error('user não encontrado')
    }

    const updateUser = await db.patch(userId, {
      role: user.role === 'admin' ? 'user' : 'admin', // Inverte o valor de isCompleted
    })

    return updateUser // Retorna o todo atualizado
  },
})
