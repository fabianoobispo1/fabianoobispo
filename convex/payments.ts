import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// Criar pagamento
export const createPayment = mutation({
  args: {
    userId: v.id('user'),
    mercadoPagoId: v.string(),
    type: v.union(
      v.literal('pix'),
      v.literal('credit_card'),
      v.literal('debit_card'),
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('cancelled'),
      v.literal('refunded'),
    ),
    amount: v.number(),
    description: v.string(),
    payerEmail: v.string(),
    payerName: v.optional(v.string()),
    cardLastFourDigits: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    subscriptionId: v.optional(v.id('subscriptions')),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('payments', {
      ...args,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Atualizar status do pagamento
export const updatePaymentStatus = mutation({
  args: {
    mercadoPagoId: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('cancelled'),
      v.literal('refunded'),
    ),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query('payments')
      .withIndex('by_mercadopago_id', (q) =>
        q.eq('mercadoPagoId', args.mercadoPagoId),
      )
      .first()

    if (!payment) {
      throw new Error('Pagamento não encontrado')
    }

    await ctx.db.patch(payment._id, {
      status: args.status,
      updatedAt: Date.now(),
      approvedAt: args.status === 'approved' ? Date.now() : undefined,
    })

    return payment._id
  },
})

// Listar pagamentos do usuário
export const getPaymentsByUser = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payments')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()
  },
})

// Buscar pagamento por ID do Mercado Pago
export const getPaymentByMercadoPagoId = query({
  args: { mercadoPagoId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('payments')
      .withIndex('by_mercadopago_id', (q) =>
        q.eq('mercadoPagoId', args.mercadoPagoId),
      )
      .first()
  },
})
