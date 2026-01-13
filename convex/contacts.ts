import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const importFromJson = mutation({
  args: {
    userId: v.id('user'),
    contacts: v.array(
      v.object({
        number: v.string(),
        name: v.string(),
        lastMessageAt: v.string(),
        lastMessageText: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    let inserted = 0
    let updated = 0

    // Busca todos os contatos existentes do usuário para evitar multiple queries
    const existing = await ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    // Cria um mapa para busca rápida por número
    const existingMap = new Map(
      existing.map((c) => [c.number, c._id]),
    )

    // Processa contatos em batch
    for (const contact of args.contacts) {
      const existingId = existingMap.get(contact.number)

      if (existingId) {
        await ctx.db.patch(existingId, {
          name: contact.name,
          lastMessageAt: contact.lastMessageAt,
          lastMessageText: contact.lastMessageText,
          updatedAt: now,
        })
        updated++
      } else {
        await ctx.db.insert('contacts', {
          number: contact.number,
          name: contact.name,
          lastMessageAt: contact.lastMessageAt,
          lastMessageText: contact.lastMessageText,
          userId: args.userId,
          createdAt: now,
          updatedAt: now,
        })
        inserted++
      }
    }

    return { inserted, updated }
  },
})

export const listByUser = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()
  },
})
