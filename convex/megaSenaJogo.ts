import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

export const salvar = mutation({
  args: { userId: v.id('user'), dezenas: v.array(v.number()) },
  handler: async ({ db }, { userId, dezenas }) => {
    return await db.insert('megaSenaJogoGerado', {
      userId,
      dezenas,
      createdAt: Date.now(),
    })
  },
})

export const listarPorUsuario = query({
  args: { userId: v.id('user') },
  handler: async ({ db }, { userId }) => {
    return await db
      .query('megaSenaJogoGerado')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc')
      .collect()
  },
})

export const remover = mutation({
  args: { jogoId: v.id('megaSenaJogoGerado') },
  handler: async ({ db }, { jogoId }) => {
    const jogo = await db.get(jogoId)
    if (!jogo) throw new Error('Jogo não encontrado')
    await db.delete(jogoId)
    return { success: true }
  },
})
