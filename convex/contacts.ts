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

    // Cria arrays para operações em lote
    const numbersToCheck = args.contacts.map((c) => c.number)

    // Busca apenas os contatos que existem neste lote
    const existing = await ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => {
        // Filtra apenas números que estão no lote atual
        return q.or(
          ...numbersToCheck
            .slice(0, 100)
            .map((num) => q.eq(q.field('number'), num)),
        )
      })
      .collect()

    // Cria um mapa para busca rápida por número
    const existingMap = new Map(existing.map((c) => [c.number, c._id]))

    // Processa contatos em batch com Promise.all para paralelização
    const batchSize = 50
    for (let i = 0; i < args.contacts.length; i += batchSize) {
      const batch = args.contacts.slice(i, i + batchSize)

      await Promise.all(
        batch.map(async (contact) => {
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
        }),
      )
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
