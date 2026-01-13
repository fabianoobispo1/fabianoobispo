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

    console.log(
      `Starting import of ${args.contacts.length} contacts for user ${args.userId}`,
    )

    // Busca contatos existentes com paginação para evitar limite de 32k
    const existingMap = new Map<string, any>()
    let cursor = null
    let totalExisting = 0

    do {
      const page = await ctx.db
        .query('contacts')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .paginate({ cursor, numItems: 1000 })

      page.page.forEach((c) => existingMap.set(c.number, c._id))
      totalExisting += page.page.length
      cursor = page.isDone ? null : page.continueCursor
    } while (cursor !== null)

    console.log(`Found ${totalExisting} existing contacts (paginated)`)

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

    console.log(
      `Import complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped`,
    )
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

// Versão otimizada para grandes volumes - busca apenas contatos necessários
export const importFromJsonOptimized = mutation({
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

    console.log(`Starting optimized import of ${args.contacts.length} contacts`)

    // Processa cada contato e busca apenas se existe (sem carregar todos)
    for (const contact of args.contacts) {
      try {
        if (!contact.number || !contact.name) {
          skipped++
          continue
        }

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

        // Busca apenas este contato específico (operação muito mais leve)
        const existing = await ctx.db
          .query('contacts')
          .withIndex('by_user_number', (q) =>
            q.eq('userId', args.userId).eq('number', cleanContact.number),
          )
          .first()

        if (existing) {
          await ctx.db.patch(existing._id, {
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

    console.log(
      `Optimized import complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped`,
    )
    return { inserted, updated, skipped }
  },
})

export const deleteByUser = mutation({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    let cursor = null
    let totalDeleted = 0

    do {
      const page = await ctx.db
        .query('contacts')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .paginate({ cursor, numItems: 100 })

      for (const contact of page.page) {
        await ctx.db.delete(contact._id)
        totalDeleted++
      }

      cursor = page.isDone ? null : page.continueCursor
    } while (cursor !== null)

    return { deleted: totalDeleted }
  },
})
