import { v } from 'convex/values'

import { mutation, query } from './_generated/server'

export const list = query({
  handler: async (ctx) => {
    const categories = await ctx.db.query('categories').collect()
    return categories
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  },
  handler: async (ctx, args) => {
    const category = await ctx.db.insert('categories', {
      name: args.name,
      type: args.type,
      description: args.description,
      active: args.active,
      created_at: args.created_at,
      updated_at: args.updated_at,
    })
    return category
  },
})

export const update = mutation({
  args: {
    categoryId: v.id('categories'),
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    active: v.boolean(),
    updated_at: v.number(),
  },
  handler: async (ctx, args) => {
    const { categoryId, ...updates } = args
    const category = await ctx.db.patch(categoryId, updates)
    return category
  },
})

export const remove = mutation({
  args: {
    categoryId: v.id('categories'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.categoryId)
  },
})
