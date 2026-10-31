import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { getCurrentUser, requireUser } from './authz'

export const salvar = mutation({
  args: { dezenas: v.array(v.number()) },
  handler: async (ctx, { dezenas }) => {
    const user = await requireUser(ctx)
    if (
      dezenas.length < 6 ||
      dezenas.length > 20 ||
      dezenas.some((d) => !Number.isInteger(d) || d < 1 || d > 60)
    ) {
      throw new Error('Dezenas inválidas')
    }
    return await ctx.db.insert('megaSenaJogoGerado', {
      userId: user._id,
      dezenas,
      createdAt: Date.now(),
    })
  },
})

export const listarPorUsuario = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []
    return await ctx.db
      .query('megaSenaJogoGerado')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .collect()
  },
})

export const remover = mutation({
  args: { jogoId: v.id('megaSenaJogoGerado') },
  handler: async (ctx, { jogoId }) => {
    const user = await requireUser(ctx)
    const jogo = await ctx.db.get(jogoId)
    if (!jogo || jogo.userId !== user._id)
      throw new Error('Jogo não encontrado')
    await ctx.db.delete(jogoId)
    return { success: true }
  },
})
