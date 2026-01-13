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
    try {
      const now = Date.now()
      let inserted = 0
      let updated = 0
      let skipped = 0

      // Busca todos os contatos existentes do usuário uma única vez
      const existing = await ctx.db
        .query('contacts')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .collect()

      // Cria um mapa para busca rápida por número
      const existingMap = new Map(existing.map((c) => [c.number, c._id]))

      // Processa cada contato sequencialmente para evitar race conditions
      for (const contact of args.contacts) {
        // Valida dados obrigatórios
        if (!contact.number || !contact.name) {
          skipped++
          continue
        }

        // Garante que todos os campos são strings
        const cleanContact = {
          number: String(contact.number).trim(),
          name: String(contact.name).trim(),
          lastMessageAt: contact.lastMessageAt
            ? String(contact.lastMessageAt)
            : '',
          lastMessageText: contact.lastMessageText
            ? String(contact.lastMessageText)
            : '',
        }

        const existingId = existingMap.get(cleanContact.number)

        if (existingId) {
          await ctx.db.patch(existingId, {
            name: cleanContact.name,
            lastMessageAt: cleanContact.lastMessageAt,
            lastMessageText: cleanContact.lastMessageText,
            updatedAt: now,
          })
          updated++
        } else {
          await ctx.db.insert('contacts', {
            number: cleanContact.number,
            name: cleanContact.name,
            lastMessageAt: cleanContact.lastMessageAt,
            lastMessageText: cleanContact.lastMessageText,
            userId: args.userId,
            createdAt: now,
            updatedAt: now,
          })
          inserted++
        }
      }

      return { inserted, updated, skipped }
    } catch (error) {
      console.error('Error importing contacts:', error)
      throw new Error(
        `Erro ao importar contatos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      )
    }
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
