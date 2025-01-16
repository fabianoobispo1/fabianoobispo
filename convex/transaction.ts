import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { transactionsSchema } from './schema'

interface CategoryTotals {
  [key: string]: number
}

export const getDashboard = query({
  args: { month: v.string(), userId: v.id('user') },
  handler: async (ctx, { month, userId }) => {
    const year = new Date().getFullYear() // pega o ano atual
    // Primeiro dia do mês
    const startDate = new Date(year, parseInt(month) - 1, 1).getTime()
    // Último dia do mês (pegando automaticamente o último dia correto)
    const endDate = new Date(year, parseInt(month), 0).getTime()

    console.log(startDate, endDate)
    const transactions = await ctx.db
      .query('transactions')
      .filter((q) =>
        q.and(
          q.eq(q.field('userId'), userId),
          q.gte(q.field('date'), startDate),
          q.lt(q.field('date'), endDate),
        ),
      )
      .collect()
    console.log(transactions)
    const deposits = transactions.filter((t) => t.type === 'DEPOSIT')
    const investments = transactions.filter((t) => t.type === 'INVESTMENT')
    const expenses = transactions.filter((t) => t.type === 'EXPENSE')

    const depositsTotal = deposits.reduce((sum, t) => sum + t.amount, 0)
    const investmentsTotal = investments.reduce((sum, t) => sum + t.amount, 0)
    const expensesTotal = expenses.reduce((sum, t) => sum + t.amount, 0)

    const balance = depositsTotal - investmentsTotal - expensesTotal
    const transactionsTotal = depositsTotal + investmentsTotal + expensesTotal

    const typesPercentage = {
      DEPOSIT: Math.round(depositsTotal / transactionsTotal / 100),
      EXPENSE: Math.round(expensesTotal / transactionsTotal / 100),
      INVESTMENT: Math.round(investmentsTotal / transactionsTotal / 100),
    }

    // Group expenses by category
    const expensesByCategory = expenses.reduce(
      (acc: CategoryTotals, transaction) => {
        const category = transaction.category
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
        percentageOfTotal: Math.round(amount / expensesTotal / 100),
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
    }
  },
})

export const create = mutation({
  args: transactionsSchema,
  handler: async ({ db }, args) => {
    const transaction = await db.insert('transactions', args)
    return transaction
  },
})

export const remove = mutation({
  args: {
    transactionsId: v.id('transactions'), // ID do todo a ser removido
  },
  handler: async ({ db }, { transactionsId }) => {
    // Buscar o todo para garantir que ele existe antes de remover
    const transacao = await db.get(transactionsId)
    if (!transacao) {
      throw new Error('transacao não encontrado')
    }

    // Remover o transacao do banco de dados
    await db.delete(transactionsId)

    return { success: true, message: 'transacao removido com sucesso' } // Resposta de confirmação
  },
})

export const getAllTransactionsByUser = query({
  args: { userId: v.id('user') },
  handler: async (ctx, { userId }) => {
    const transactions = await ctx.db
      .query('transactions')
      .filter((q) => q.eq(q.field('userId'), userId))
      .order('desc')
      .collect()

    return transactions
  },
})
