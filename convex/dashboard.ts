import { v } from 'convex/values'

import { query } from './_generated/server'
import type { Id } from './_generated/dataModel'

export const getDashboardData = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Buscar dados financeiros
    const financeiro = await ctx.db
      .query('financeiro')
      .withIndex('by_user', (q) => q.eq('userId', args.userId as Id<'user'>))
      .collect()

    // Buscar dados dos cartões
    const cartoes = await ctx.db
      .query('cartoes')
      .withIndex('by_user', (q) => q.eq('userId', args.userId as Id<'user'>))
      .collect()

    return {
      financeiro,
      cartoes,
    }
  },
})
