import { v } from 'convex/values'

import { query, mutation } from './_generated/server'
import { dontPadSchema } from './schema'
import { requireAdmin } from './authz'

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

// Sinaliza que alguém está digitando nessa página agora. Chamado com
// throttle no cliente; não mexe em page_content nem em updated_at.
export const ping = mutation({
  args: {
    page_name: v.string(),
    client_id: v.string(),
  },
  handler: async ({ db }, { page_name, client_id }) => {
    const existing = await db
      .query('dontPad')
      .withIndex('by_page_name', (q) => q.eq('page_name', page_name))
      .unique()

    if (existing) {
      await db.patch(existing._id, {
        editing_client_id: client_id,
        editing_at: Date.now(),
      })
    } else {
      await db.insert('dontPad', {
        page_name,
        page_content: '',
        ads: true,
        created_at: Date.now(),
        updated_at: Date.now(),
        editing_client_id: client_id,
        editing_at: Date.now(),
      })
    }
  },
})

export const listAll = query({
  args: { userId: v.id('user') },
  handler: async ({ db }, { userId }) => {
    await requireAdmin(db, userId)
    const dontPads = await db.query('dontPad').collect()
    return dontPads
  },
})

export const remove = mutation({
  args: { _id: v.id('dontPad'), userId: v.id('user') },
  handler: async ({ db }, args) => {
    await requireAdmin(db, args.userId)
    await db.delete(args._id)
  },
})
