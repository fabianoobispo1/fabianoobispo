import { v } from 'convex/values'

import { query, mutation, internalMutation } from './_generated/server'
import { dontPadSchema } from './schema'
import { requireAdmin } from './authz'

// DontPad é público e anônimo por design; os limites evitam que alguém use
// as páginas como armazenamento arbitrário (o doc do Convex aceita até 1 MiB)
const MAX_PAGE_NAME = 200
const MAX_PAGE_CONTENT = 200_000

function validatePage(page_name: string, page_content?: string) {
  if (!page_name || page_name.length > MAX_PAGE_NAME) {
    throw new Error('Nome de página inválido')
  }
  if (page_content !== undefined && page_content.length > MAX_PAGE_CONTENT) {
    throw new Error('Conteúdo muito grande (máx. 200 mil caracteres)')
  }
}

// Não usada pelo app (o `update` já faz upsert); só via `npx convex run`
export const create = internalMutation({
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
    validatePage(args.page_name, args.page_content)
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
    validatePage(page_name)
    if (client_id.length > 100) throw new Error('client_id inválido')
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
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx)
    const dontPads = await ctx.db.query('dontPad').collect()
    return dontPads
  },
})

export const remove = mutation({
  args: { _id: v.id('dontPad') },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    await ctx.db.delete(args._id)
  },
})
