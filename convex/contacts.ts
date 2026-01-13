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
    let skipped = 0

    // Limita processamento para debug
    console.log(`Starting import of ${args.contacts.length} contacts for user ${args.userId}`)

    // Busca todos os contatos existentes do usuário uma única vez
    const existing = await ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    console.log(`Found ${existing.length} existing contacts`)

    // Cria um mapa para busca rápida por número
    const existingMap = new Map(existing.map((c) => [c.number, c._id]))

    // Processa cada contato sequencialmente para evitar race conditions
    for (const contact of args.contacts) {
      try {
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
      } catch (innerError) {
        console.error(`Error processing contact ${contact.number}:`, innerError)
        skipped++
      }
    }

    console.log(`Import complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped`)
    return { inserted, updated, skipped }
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
