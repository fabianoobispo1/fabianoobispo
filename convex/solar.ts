import { v } from 'convex/values'

import { mutation, query, MutationCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'

// Perda de eficiência por acúmulo de sujeira: linear por dia sem limpeza,
// limitada a um teto (placas muito sujas não continuam perdendo pra sempre
// no mesmo ritmo, a perda real tende a estabilizar).
export const EFFICIENCY_LOSS_PER_DAY_PERCENT = 0.3
export const EFFICIENCY_MAX_LOSS_PERCENT = 30

export function computeEfficiency(
  lastCleaningDate: number | null,
  now: number = Date.now(),
): { efficiencyPercent: number; daysSinceCleaning: number | null } {
  if (lastCleaningDate === null) {
    return { efficiencyPercent: 100, daysSinceCleaning: null }
  }

  const daysSinceCleaning = Math.max(
    0,
    Math.floor((now - lastCleaningDate) / (24 * 60 * 60 * 1000)),
  )
  const loss = Math.min(
    EFFICIENCY_MAX_LOSS_PERCENT,
    daysSinceCleaning * EFFICIENCY_LOSS_PER_DAY_PERCENT,
  )

  return { efficiencyPercent: 100 - loss, daysSinceCleaning }
}

async function assertPlantOwner(
  ctx: MutationCtx,
  plantId: Id<'solarPlant'>,
  userId: Id<'user'>,
) {
  const plant = await ctx.db.get(plantId)
  if (!plant) throw new Error('Usina não encontrada')
  if (plant.userId !== userId) throw new Error('Acesso negado')

  return plant
}

// ==================== SOLAR PLANT ====================

export const createPlant = mutation({
  args: {
    name: v.string(),
    capacityKwp: v.number(),
    location: v.optional(v.string()),
    userId: v.id('user'),
  },
  handler: async (ctx, args) => {
    const plantId = await ctx.db.insert('solarPlant', {
      name: args.name,
      capacityKwp: args.capacityKwp,
      location: args.location,
      userId: args.userId,
      created_at: Date.now(),
      updated_at: Date.now(),
    })
    return plantId
  },
})

export const updatePlant = mutation({
  args: {
    plantId: v.id('solarPlant'),
    name: v.optional(v.string()),
    capacityKwp: v.optional(v.number()),
    location: v.optional(v.string()),
    userId: v.id('user'),
  },
  handler: async (ctx, args) => {
    await assertPlantOwner(ctx, args.plantId, args.userId)
    const { plantId, userId, ...updates } = args
    await ctx.db.patch(plantId, { ...updates, updated_at: Date.now() })
  },
})

export const deletePlant = mutation({
  args: { plantId: v.id('solarPlant'), userId: v.id('user') },
  handler: async (ctx, args) => {
    await assertPlantOwner(ctx, args.plantId, args.userId)

    const cleanings = await ctx.db
      .query('solarCleaning')
      .withIndex('by_plant', (q) => q.eq('plantId', args.plantId))
      .collect()
    for (const cleaning of cleanings) {
      await ctx.db.delete(cleaning._id)
    }

    const generations = await ctx.db
      .query('solarGeneration')
      .withIndex('by_plant', (q) => q.eq('plantId', args.plantId))
      .collect()
    for (const generation of generations) {
      await ctx.db.delete(generation._id)
    }

    await ctx.db.delete(args.plantId)
  },
})

// Lista as usinas do usuário já com status calculado (eficiência atual,
// dias sem limpeza e total gerado) pra alimentar o dashboard direto.
export const getDashboardByUser = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    const plants = await ctx.db
      .query('solarPlant')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    const now = Date.now()

    return await Promise.all(
      plants.map(async (plant) => {
        const lastCleaning = await ctx.db
          .query('solarCleaning')
          .withIndex('by_plant_date', (q) => q.eq('plantId', plant._id))
          .order('desc')
          .first()

        const generations = await ctx.db
          .query('solarGeneration')
          .withIndex('by_plant', (q) => q.eq('plantId', plant._id))
          .collect()
        const totalKwhGenerated = generations.reduce(
          (sum, g) => sum + g.kwhGenerated,
          0,
        )

        const { efficiencyPercent, daysSinceCleaning } = computeEfficiency(
          lastCleaning?.date ?? null,
          now,
        )

        return {
          ...plant,
          lastCleaningDate: lastCleaning?.date ?? null,
          daysSinceCleaning,
          efficiencyPercent,
          totalKwhGenerated,
        }
      }),
    )
  },
})

export const getPlantById = query({
  args: { plantId: v.id('solarPlant') },
  handler: async (ctx, args) => {
    const plant = await ctx.db.get(args.plantId)
    if (!plant) return null

    const lastCleaning = await ctx.db
      .query('solarCleaning')
      .withIndex('by_plant_date', (q) => q.eq('plantId', args.plantId))
      .order('desc')
      .first()

    const { efficiencyPercent, daysSinceCleaning } = computeEfficiency(
      lastCleaning?.date ?? null,
    )

    return {
      ...plant,
      lastCleaningDate: lastCleaning?.date ?? null,
      daysSinceCleaning,
      efficiencyPercent,
    }
  },
})

// ==================== CLEANING ====================

export const registerCleaning = mutation({
  args: {
    plantId: v.id('solarPlant'),
    date: v.number(),
    note: v.optional(v.string()),
    userId: v.id('user'),
  },
  handler: async (ctx, args) => {
    await assertPlantOwner(ctx, args.plantId, args.userId)

    return await ctx.db.insert('solarCleaning', {
      plantId: args.plantId,
      date: args.date,
      note: args.note,
      created_at: Date.now(),
    })
  },
})

export const listCleaningsByPlant = query({
  args: { plantId: v.id('solarPlant') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('solarCleaning')
      .withIndex('by_plant_date', (q) => q.eq('plantId', args.plantId))
      .order('desc')
      .collect()
  },
})

// ==================== GENERATION ====================

export const registerGeneration = mutation({
  args: {
    plantId: v.id('solarPlant'),
    date: v.number(),
    kwhGenerated: v.number(),
    userId: v.id('user'),
  },
  handler: async (ctx, args) => {
    await assertPlantOwner(ctx, args.plantId, args.userId)

    return await ctx.db.insert('solarGeneration', {
      plantId: args.plantId,
      date: args.date,
      kwhGenerated: args.kwhGenerated,
      created_at: Date.now(),
    })
  },
})

export const listGenerationsByPlant = query({
  args: { plantId: v.id('solarPlant') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('solarGeneration')
      .withIndex('by_plant_date', (q) => q.eq('plantId', args.plantId))
      .order('desc')
      .collect()
  },
})
