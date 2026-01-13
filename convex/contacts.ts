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

    for (const contact of args.contacts) {
      const existing = await ctx.db
        .query('contacts')
        .withIndex('by_user_number', (q) =>
          q.eq('userId', args.userId).eq('number', contact.number),
        )
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, {
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
