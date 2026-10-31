import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { transactionsSchema } from './schema'
import { getCurrentUser, requireUser } from './authz'

// Campos que o cliente envia: o dono vem da identidade e os timestamps de
// auditoria são gerados aqui
const transactionInput = {
  name: transactionsSchema.name,
  type: transactionsSchema.type,
  amount: transactionsSchema.amount,
  category: transactionsSchema.category,
  paymentMethod: transactionsSchema.paymentMethod,
  date: transactionsSchema.date,
}

interface CategoryTotals {
  [key: string]: number
}

export const getDashboard = query({
  args: { month: v.string() },
  handler: async (ctx, { month }) => {
    const user = await getCurrentUser(ctx)
    if (!user) return null
    const userId = user._id
    const year = new Date().getFullYear() // pega o ano atual
    // Primeiro dia do mês
    const startDate = new Date(year, parseInt(month) - 1, 1).getTime()
    // Último dia do mês (pegando automaticamente o último dia correto)
    const endDate = new Date(year, parseInt(month), 0).getTime()

    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) =>
        q.and(
          q.gte(q.field('date'), startDate),
          q.lt(q.field('date'), endDate),
        ),
      )
      .collect()

    const deposits = transactions.filter((t) => t.type === 'DEPOSIT')
    const investments = transactions.filter((t) => t.type === 'INVESTMENT')
    const expenses = transactions.filter((t) => t.type === 'EXPENSE')

    const depositsTotal = deposits.reduce((sum, t) => sum + t.amount, 0)
    const investmentsTotal = investments.reduce((sum, t) => sum + t.amount, 0)
    const expensesTotal = expenses.reduce((sum, t) => sum + t.amount, 0)

    const balance = depositsTotal - investmentsTotal - expensesTotal
    const transactionsTotal = depositsTotal + investmentsTotal + expensesTotal

    const typesPercentage =
      transactionsTotal === 0
        ? { DEPOSIT: 0, EXPENSE: 0, INVESTMENT: 0 }
        : {
            DEPOSIT: (depositsTotal / transactionsTotal) * 100,
            EXPENSE: (expensesTotal / transactionsTotal) * 100,
            INVESTMENT: (investmentsTotal / transactionsTotal) * 100,
          }

    // Group expenses by category
    const expensesByCategory = expenses.reduce(
      (acc: CategoryTotals, transaction) => {
        const category = transaction.type
        if (!acc[category]) {
          acc[category] = 0
        }
        acc[category] += transaction.amount
        return acc
      },
      {},
    )

    const totalExpensePerCategory = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        totalAmount: amount,
        percentageOfTotal:
          expensesTotal === 0 ? 0 : Math.round((amount / expensesTotal) * 100),
      }))
      .sort((a, b) => b.percentageOfTotal - a.percentageOfTotal)

    const lastTransactions = transactions
      .sort((a, b) => b.date - a.date)
      .slice(0, 15)

    return {
      balance,
      expensesTotal,
      investmentsTotal,
      depositsTotal,
      typesPercentage,
      totalExpensePerCategory,
      lastTransactions,
      expensesByCategory,
    }
  },
})

export const create = mutation({
  args: transactionInput,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    if (!Number.isFinite(args.amount) || args.amount < 0) {
      throw new Error('Valor inválido')
    }
    const now = Date.now()
    return await ctx.db.insert('transactions', {
      ...args,
      userId: user._id,
      created_at: now,
      updated_at: now,
    })
  },
})

export const remove = mutation({
  args: {
    transactionsId: v.id('transactions'),
  },
  handler: async (ctx, { transactionsId }) => {
    const user = await requireUser(ctx)
    const transacao = await ctx.db.get(transactionsId)
    if (!transacao || transacao.userId !== user._id) {
      throw new Error('transacao não encontrado')
    }

    await ctx.db.delete(transactionsId)
    return { success: true, message: 'transacao removido com sucesso' }
  },
})

export const getAllTransactionsByUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []
    const transactions = await ctx.db
      .query('transactions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .collect()

    return transactions
  },
})
