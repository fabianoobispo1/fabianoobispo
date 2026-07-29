import { v } from 'convex/values'
import { query, mutation, action, internalMutation, internalQuery } from './_generated/server'
import { Id } from './_generated/dataModel'
import { internal } from './_generated/api'

const VPS_API_URL = process.env.VPS_API_URL || 'http://localhost:3001'
const VPS_API_KEY = process.env.VPS_API_KEY || 'your-secret-key'

export const createLab = action({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Valida limite de labs por usuário (max 3)
    const userLabs = await ctx.runQuery(internal.lab.getUserLabsCount, {
      userId: args.userId,
    })

    if (userLabs >= 3) {
      throw new Error('Você atingiu o limite de 3 labs simultâneos')
    }

    // Cria lab no VPS
    const response = await fetch(`${VPS_API_URL}/api/lab/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: args.userId,
        name: `lab-${Date.now()}`,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Falha ao criar lab: ${error}`)
    }

    const vmData = await response.json()

    // Salva no Convex
    const labId = await ctx.runMutation(internal.lab.insertLab, {
      userId: args.userId as Id<'user'>,
      name: vmData.name,
      containerId: vmData.id,
      status: 'running',
      ip: vmData.ip,
      port: vmData.port,
    })

    return vmData
  },
})

export const getUserLabs = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('lab')
      .withIndex('by_user', (q) => q.eq('userId', args.userId as Id<'user'>))
      .order('desc')
      .collect()
  },
})

export const deleteLab = action({
  args: { labId: v.id('lab'), userId: v.string() },
  handler: async (ctx, args) => {
    // Valida que o lab pertence ao usuário
    const lab = await ctx.runQuery(internal.lab.getLabById, { labId: args.labId })

    if (!lab || lab.userId !== (args.userId as Id<'user'>)) {
      throw new Error('Acesso negado')
    }

    // Deleta no VPS
    const response = await fetch(`${VPS_API_URL}/api/lab/${lab.containerId}/delete`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${VPS_API_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Falha ao deletar lab: ${error}`)
    }

    // Deleta do Convex
    await ctx.runMutation(internal.lab.deleteLabInternal, { labId: args.labId })
  },
})

export const updateLastActivity = action({
  args: { labId: v.id('lab') },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.lab.updateLastActivityInternal, {
      labId: args.labId,
    })
  },
})

// Cron job para auto-cleanup (rodar diariamente)
export const cleanupInactiveLabs = action({
  handler: async (ctx) => {
    const TWO_HOURS = 2 * 60 * 60 * 1000
    const now = Date.now()

    const allLabs = await ctx.runQuery(internal.lab.getAllLabs)

    for (const lab of allLabs) {
      if (now - lab.lastActivity > TWO_HOURS) {
        try {
          // Deleta no VPS
          await fetch(`${VPS_API_URL}/api/lab/${lab.containerId}/delete`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${VPS_API_KEY}`,
            },
          })

          // Deleta do Convex
          await ctx.runMutation(internal.lab.deleteLabInternal, { labId: lab._id })
        } catch (err) {
          console.error(`Erro ao cleanup lab ${lab._id}:`, err)
        }
      }
    }
  },
})

// Funções internas (não exportadas)
export const insertLab = internalMutation({
  args: {
    userId: v.id('user'),
    name: v.string(),
    containerId: v.string(),
    status: v.union(
      v.literal('creating'),
      v.literal('running'),
      v.literal('stopped'),
      v.literal('error'),
    ),
    ip: v.string(),
    port: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('lab', {
      userId: args.userId,
      name: args.name,
      containerId: args.containerId,
      status: args.status,
      ip: args.ip,
      port: args.port,
      lastActivity: Date.now(),
      created_at: Date.now(),
    })
  },
})

export const deleteLabInternal = internalMutation({
  args: { labId: v.id('lab') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.labId)
  },
})

export const updateLastActivityInternal = internalMutation({
  args: { labId: v.id('lab') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.labId, { lastActivity: Date.now() })
  },
})

export const getLabById = internalQuery({
  args: { labId: v.id('lab') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.labId)
  },
})

export const getUserLabsCount = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const labs = await ctx.db
      .query('lab')
      .withIndex('by_user', (q) => q.eq('userId', args.userId as Id<'user'>))
      .collect()
    return labs.length
  },
})

export const getAllLabs = internalQuery({
  handler: async (ctx) => {
    return await ctx.db.query('lab').collect()
  },
})
