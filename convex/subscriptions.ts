import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// ========== PLANOS DE ASSINATURA ==========

// Criar plano
export const createPlan = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    amount: v.number(),
    frequency: v.union(
      v.literal('monthly'),
      v.literal('quarterly'),
      v.literal('semiannual'),
      v.literal('annual'),
    ),
    frequencyDays: v.number(),
    features: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert('subscriptionPlans', {
      ...args,
      active: true,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Listar planos ativos
export const getActivePlans = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('subscriptionPlans')
      .withIndex('by_active', (q) => q.eq('active', true))
      .collect()
  },
})

// Listar todos os planos (admin)
export const getAllPlans = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('subscriptionPlans').collect()
  },
})

// ========== ASSINATURAS DE USUÁRIOS ==========

// Criar assinatura
export const createSubscription = mutation({
  args: {
    userId: v.id('user'),
    planId: v.id('subscriptionPlans'),
    mercadoPagoPreapprovalId: v.optional(v.string()),
    cardToken: v.optional(v.string()),
    cardLastFourDigits: v.optional(v.string()),
    cardBrand: v.optional(v.string()),
    startDate: v.number(),
  },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId)
    if (!plan) {
      throw new Error('Plano não encontrado')
    }

    const now = Date.now()
    const nextBillingDate = args.startDate + plan.frequencyDays * 86400000 // dias em ms

    return await ctx.db.insert('subscriptions', {
      userId: args.userId,
      planId: args.planId,
      mercadoPagoPreapprovalId: args.mercadoPagoPreapprovalId,
      cardToken: args.cardToken,
      cardLastFourDigits: args.cardLastFourDigits,
      cardBrand: args.cardBrand,
      status: 'pending',
      startDate: args.startDate,
      nextBillingDate,
      billingCycle: 0,
      failedPayments: 0,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Atualizar status da assinatura
export const updateSubscriptionStatus = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    status: v.union(
      v.literal('active'),
      v.literal('paused'),
      v.literal('cancelled'),
      v.literal('expired'),
      v.literal('pending'),
    ),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)
    if (!subscription) {
      throw new Error('Assinatura não encontrada')
    }

    await ctx.db.patch(args.subscriptionId, {
      status: args.status,
      updatedAt: Date.now(),
      endDate: args.status === 'cancelled' ? Date.now() : undefined,
    })

    return args.subscriptionId
  },
})

// Registrar pagamento de assinatura
export const recordBillingPayment = mutation({
  args: {
    subscriptionId: v.id('subscriptions'),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId)
    if (!subscription) {
      throw new Error('Assinatura não encontrada')
    }

    const plan = await ctx.db.get(subscription.planId)
    if (!plan) {
      throw new Error('Plano não encontrado')
    }

    if (args.success) {
      // Pagamento bem-sucedido: resetar falhas e avançar ciclo
      const nextBillingDate =
        subscription.nextBillingDate + plan.frequencyDays * 86400000

      await ctx.db.patch(args.subscriptionId, {
        billingCycle: subscription.billingCycle + 1,
        failedPayments: 0,
        nextBillingDate,
        status: 'active',
        updatedAt: Date.now(),
      })
    } else {
      // Pagamento falhou: incrementar contador
      const failedPayments = subscription.failedPayments + 1
      const newStatus = failedPayments >= 3 ? 'paused' : subscription.status

      await ctx.db.patch(args.subscriptionId, {
        failedPayments,
        status: newStatus,
        updatedAt: Date.now(),
      })
    }

    return args.subscriptionId
  },
})

// Buscar assinaturas do usuário
export const getSubscriptionsByUser = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    // Enriquecer com dados do plano
    return await Promise.all(
      subscriptions.map(async (sub) => {
        const plan = await ctx.db.get(sub.planId)
        return { ...sub, plan }
      }),
    )
  },
})

// Buscar assinatura ativa do usuário
export const getActiveSubscription = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query('subscriptions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .first()

    if (!subscription) return null

    const plan = await ctx.db.get(subscription.planId)
    return { ...subscription, plan }
  },
})

// Listar assinaturas para cobrança (próxima data <= hoje)
export const getSubscriptionsDueForBilling = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()
    return await ctx.db
      .query('subscriptions')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .filter((q) => q.lte(q.field('nextBillingDate'), now))
      .collect()
  },
})

// Cancelar assinatura
export const cancelSubscription = mutation({
  args: { subscriptionId: v.id('subscriptions') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.subscriptionId, {
      status: 'cancelled',
      endDate: Date.now(),
      updatedAt: Date.now(),
    })
    return args.subscriptionId
  },
})
