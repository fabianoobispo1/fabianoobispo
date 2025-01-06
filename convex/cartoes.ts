import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { cartoesSchema } from './schema'

export const create = mutation({
  args: cartoesSchema,
  handler: async ({ db }, args) => {
    const cartao = await db.insert('cartoes', args)
    return cartao
  },
})

export const getcartaoByUser = query({
  args: {
    userId: v.id('user'),
  },
  handler: async ({ db }, { userId }) => {
    const cartaos = await db
      .query('cartoes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect()
    return cartaos
  },
})

export const marcarComoPago = mutation({
  args: {
    cartaoId: v.id('cartoes'),
  },
  handler: async ({ db }, { cartaoId }) => {
    const cartao = await db.patch(cartaoId, {
      status: 'PAGO',
      dataPagamento: Date.now(),
      updated_at: Date.now(),
    })
    return cartao
  },
})

export const getByMonth = query({
  args: {
    userId: v.id('user'),
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const cartoes = await ctx.db
      .query('cartoes')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), args.userId),
          q.gte(q.field('dataVencimento'), args.startDate),
          q.lte(q.field('dataVencimento'), args.endDate),
        ),
      )
      .collect()

    return cartoes
  },
})

export const remove = mutation({
  args: {
    cartoesId: v.id('cartoes'), // ID do cartoes a ser removido
  },
  handler: async ({ db }, { cartoesId }) => {
    // Buscar o cartoes para garantir que ele existe antes de remover
    const cartoes = await db.get(cartoesId)
    if (!cartoes) {
      throw new Error('cartoes não encontrado')
    }

    // Remover o cartoes do banco de dados
    await db.delete(cartoesId)

    return { success: true, message: 'cartoes removido com sucesso' } // Resposta de confirmação
  },
})

export const update = mutation({
  args: {
    cartaoId: v.id('cartoes'),
    descricao: v.string(),
    valor: v.number(),
    dataVencimento: v.number(),
    categoria: v.string(),
    status: v.string(),
    updated_at: v.number(),
    dataPagamento: v.optional(v.number()),
    obs: v.string(),
    limite: v.number(),
    limiteUtilizado: v.number(),
  },
  handler: async (
    { db },
    {
      cartaoId,
      descricao,
      valor,
      dataVencimento,
      categoria,
      status,
      updated_at,
      dataPagamento,
      obs,
      limite,
      limiteUtilizado,
    },
  ) => {
    const financa = await db.get(cartaoId)

    if (!financa) {
      throw new Error('Lançamento não encontrado')
    }

    const updatedFinanca = await db.patch(cartaoId, {
      descricao,
      valor,
      dataVencimento,
      categoria,
      status,
      updated_at,
      dataPagamento,
      obs,
      limite,
      limiteUtilizado,
    })

    return updatedFinanca
  },
})
