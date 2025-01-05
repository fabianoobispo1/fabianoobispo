import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { financeiroSchema } from './schema'

export const create = mutation({
  args: financeiroSchema,
  handler: async ({ db }, args) => {
    const gasto = await db.insert('financeiro', args)
    return gasto
  },
})

export const getGastosByUser = query({
  args: {
    userId: v.id('user'),
  },
  handler: async ({ db }, { userId }) => {
    const gastos = await db
      .query('financeiro')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    return gastos
  },
})

export const marcarComoPago = mutation({
  args: {
    gastoId: v.id('financeiro'),
  },
  handler: async ({ db }, { gastoId }) => {
    const gasto = await db.patch(gastoId, {
      status: 'PAGO',
      dataPagamento: Date.now(),
      updated_at: Date.now(),
    })
    return gasto
  },
})

export const getByMonth = query({
  args: {
    userId: v.id('user'),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const financeiro = await ctx.db
      .query('financeiro')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.gte(q.field('dataVencimento'), args.startDate),
          q.lte(q.field('dataVencimento'), args.endDate),
        ),
      )
      .collect()

    return financeiro
  },
})

export const remove = mutation({
  args: {
    financeiroId: v.id('financeiro'), // ID do financeiro a ser removido
  },
  handler: async ({ db }, { financeiroId }) => {
    // Buscar o financeiro para garantir que ele existe antes de remover
    const financeiro = await db.get(financeiroId)
    if (!financeiro) {
      throw new Error('financeiro não encontrado')
    }

    // Remover o financeiro do banco de dados
    await db.delete(financeiroId)

    return { success: true, message: 'financeiro removido com sucesso' } // Resposta de confirmação
  },
})
