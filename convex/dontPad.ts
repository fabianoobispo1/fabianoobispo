import { v } from 'convex/values'

import { query, mutation } from './_generated/server'
import { dontPadSchema } from './schema'

export const create = mutation({
  args: dontPadSchema,
  handler: async ({ db }, args) => {
    const dontPad = await db.insert('dontPad', args)
    return dontPad
  },
})

export const getByPageName = query({
  args: { page_name: v.string() },
  handler: async ({ db }, { page_name }) => {
    const dontPad = await db
      .query('dontPad')
      .withIndex('by_page_name', (q) => q.eq('page_name', page_name))
      .unique()
    return dontPad
  },
})

export const update = mutation({
  args: {
    page_name: v.string(),
    page_content: v.string(),
  },
  handler: async ({ db }, args) => {
    const existing = await db
      .query('dontPad')
      .withIndex('by_page_name', (q) => q.eq('page_name', args.page_name))
      .unique()

    if (existing) {
      // Atualiza página existente
      await db.patch(existing._id, {
        page_content: args.page_content,
        updated_at: Date.now(),
      })
      return existing._id
    } else {
      // Cria nova página
      const newPage = await db.insert('dontPad', {
        page_name: args.page_name,
        page_content: args.page_content,
        ads: true,
        created_at: Date.now(),
        updated_at: Date.now(),
      })
      return newPage
    }
  },
})

export const listAll = query({
  args: {},
  handler: async ({ db }) => {
    const dontPads = await db.query('dontPad').collect()
    return dontPads
  },
})

export const remove = mutation({
  args: { _id: v.id('dontPad') },
  handler: async ({ db }, args) => {
    await db.delete(args._id)
  },
})
