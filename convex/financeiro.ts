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

export const update = mutation({
  args: {
    financaId: v.id('financeiro'),
    descricao: v.string(),
    valor: v.number(),
    dataVencimento: v.number(),
    categoria: v.string(),
    status: v.string(),
    updated_at: v.number(),
    dataPagamento: v.optional(v.number()),
  },
  handler: async (
    { db },
    {
      financaId,
      descricao,
      valor,
      dataVencimento,
      categoria,
      status,
      updated_at,
      dataPagamento,
    },
  ) => {
    const financa = await db.get(financaId)

    if (!financa) {
      throw new Error('Lançamento não encontrado')
    }

    const updatedFinanca = await db.patch(financaId, {
      descricao,
      valor,
      dataVencimento,
      categoria,
      status,
      updated_at,
      dataPagamento,
    })

    return updatedFinanca
  },
})

export const list = query({
  args: {
    userId: v.id('user'),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    categoria: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query('financeiro')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')

    const financialData = await query.collect()
    return financialData
  },
})
