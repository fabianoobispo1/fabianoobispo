import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { Id } from './_generated/dataModel'

// Queries

export const getTemplatesByUser = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('whatsAppTemplate')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()
  },
})

export const getTemplateById = query({
  args: { templateId: v.id('whatsAppTemplate'), userId: v.id('user') },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId)
    if (!template || template.userId !== args.userId) {
      throw new Error('Acesso negado')
    }
    return template
  },
})

export const getCampaignsByUser = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('campaign')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()
  },
})

export const getCampaignById = query({
  args: { campaignId: v.id('campaign'), userId: v.id('user') },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId)
    if (!campaign || campaign.userId !== args.userId) {
      throw new Error('Acesso negado')
    }
    return campaign
  },
})

export const getMessagesByCampaign = query({
  args: { campaignId: v.id('campaign'), userId: v.id('user') },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId)
    if (!campaign || campaign.userId !== args.userId) {
      throw new Error('Acesso negado')
    }
    return await ctx.db
      .query('messageTracking')
      .withIndex('by_campaign', (q) => q.eq('campaignId', args.campaignId))
      .collect()
  },
})

export const getCampaignStats = query({
  args: { campaignId: v.id('campaign'), userId: v.id('user') },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId)
    if (!campaign) return null
    if (campaign.userId !== args.userId) {
      throw new Error('Acesso negado')
    }

    const messages = await ctx.db
      .query('messageTracking')
      .withIndex('by_campaign', (q) => q.eq('campaignId', args.campaignId))
      .collect()

    const statusCounts = {
      total: messages.length,
      pending: messages.filter((m) => m.status === 'pending').length,
      sent: messages.filter((m) => m.status === 'sent').length,
      delivered: messages.filter((m) => m.status === 'delivered').length,
      read: messages.filter((m) => m.status === 'read').length,
      failed: messages.filter((m) => m.status === 'failed').length,
    }

    return statusCounts
  },
})

export const getActivityLog = query({
  args: { userId: v.id('user'), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const logs = await ctx.db
      .query('activityLog')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(args.limit || 50)

    return logs
  },
})

// Mutations

export const createTemplate = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    content: v.string(),
    variables: v.array(
      v.object({
        name: v.string(),
        placeholder: v.string(),
        type: v.union(
          v.literal('text'),
          v.literal('number'),
          v.literal('date'),
          v.literal('url'),
        ),
        required: v.boolean(),
      }),
    ),
    userId: v.id('user'),
  },
  handler: async (ctx, args) => {
    const templateId = await ctx.db.insert('whatsAppTemplate', {
      name: args.name,
      category: args.category,
      content: args.content,
      variables: args.variables,
      status: 'draft',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: args.userId,
    })

    // Log da atividade
    await ctx.db.insert('activityLog', {
      userId: args.userId,
      action: 'template_created',
      resourceType: 'template',
      resourceId: templateId.toString(),
      details: `Template "${args.name}" criado`,
      timestamp: Date.now(),
    })

    return templateId
  },
})

export const updateTemplate = mutation({
  args: {
    templateId: v.id('whatsAppTemplate'),
    userId: v.id('user'),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    content: v.optional(v.string()),
    variables: v.optional(
      v.array(
        v.object({
          name: v.string(),
          placeholder: v.string(),
          type: v.union(
            v.literal('text'),
            v.literal('number'),
            v.literal('date'),
            v.literal('url'),
          ),
          required: v.boolean(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId)
    if (!template) throw new Error('Template not found')
    if (template.userId !== args.userId) throw new Error('Acesso negado')

    const updateData: any = {
      updatedAt: Date.now(),
    }

    if (args.name !== undefined) updateData.name = args.name
    if (args.category !== undefined) updateData.category = args.category
    if (args.content !== undefined) updateData.content = args.content
    if (args.variables !== undefined) updateData.variables = args.variables

    await ctx.db.patch(args.templateId, updateData)

    // Log da atividade
    await ctx.db.insert('activityLog', {
      userId: args.userId,
      action: 'template_updated',
      resourceType: 'template',
      resourceId: args.templateId.toString(),
      details: `Template "${template.name}" atualizado`,
      timestamp: Date.now(),
    })
  },
})

export const deleteTemplate = mutation({
  args: { templateId: v.id('whatsAppTemplate'), userId: v.id('user') },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId)
    if (!template) throw new Error('Template not found')
    if (template.userId !== args.userId) throw new Error('Acesso negado')

    await ctx.db.delete(args.templateId)

    // Log da atividade
    await ctx.db.insert('activityLog', {
      userId: args.userId,
      action: 'template_deleted',
      resourceType: 'template',
      resourceId: args.templateId.toString(),
      details: `Template "${template.name}" deletado`,
      timestamp: Date.now(),
    })
  },
})

export const createCampaign = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    templateId: v.id('whatsAppTemplate'),
    recipientList: v.array(
      v.object({
        phone: v.string(),
        variables: v.array(v.string()),
      }),
    ),
    scheduledFor: v.optional(v.number()),
    userId: v.id('user'),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId)
    if (!template) throw new Error('Template not found')

    const campaignId = await ctx.db.insert('campaign', {
      name: args.name,
      description: args.description,
      templateId: args.templateId,
      status: args.scheduledFor ? 'scheduled' : 'draft',
      recipientList: args.recipientList,
      scheduledFor: args.scheduledFor,
      totalRecipients: args.recipientList.length,
      sentCount: 0,
      failedCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: args.userId,
    })

    // Criar registros de rastreamento para cada recipient
    for (const recipient of args.recipientList) {
      const messageContent = interpolateTemplate(
        template.content,
        recipient.variables,
      )

      await ctx.db.insert('messageTracking', {
        campaignId,
        userId: args.userId,
        phoneNumber: recipient.phone,
        messageContent,
        status: 'pending',
        retryCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }

    // Log da atividade
    await ctx.db.insert('activityLog', {
      userId: args.userId,
      action: 'campaign_created',
      resourceType: 'campaign',
      resourceId: campaignId.toString(),
      details: `Campanha "${args.name}" criada com ${args.recipientList.length} destinatários`,
      timestamp: Date.now(),
    })

    return campaignId
  },
})

export const updateCampaignStatus = mutation({
  args: {
    campaignId: v.id('campaign'),
    userId: v.id('user'),
    status: v.union(
      v.literal('draft'),
      v.literal('scheduled'),
      v.literal('sending'),
      v.literal('sent'),
      v.literal('paused'),
      v.literal('cancelled'),
    ),
  },
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId)
    if (!campaign) throw new Error('Campaign not found')
    if (campaign.userId !== args.userId) throw new Error('Acesso negado')

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    }

    if (args.status === 'sending') {
      updateData.startedAt = Date.now()
    } else if (
      args.status === 'sent' ||
      args.status === 'cancelled' ||
      args.status === 'paused'
    ) {
      updateData.completedAt = Date.now()
    }

    await ctx.db.patch(args.campaignId, updateData)

    // Log da atividade
    await ctx.db.insert('activityLog', {
      userId: args.userId,
      action: 'campaign_status_updated',
      resourceType: 'campaign',
      resourceId: args.campaignId.toString(),
      details: `Status da campanha "${campaign.name}" atualizado para ${args.status}`,
      timestamp: Date.now(),
    })
  },
})

export const updateMessageStatus = mutation({
  args: {
    messageId: v.id('messageTracking'),
    userId: v.id('user'),
    status: v.union(
      v.literal('pending'),
      v.literal('sent'),
      v.literal('delivered'),
      v.literal('read'),
      v.literal('failed'),
    ),
    metaMessageId: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error('Message not found')
    if (message.userId !== args.userId) throw new Error('Acesso negado')

    const updateData: any = {
      status: args.status,
      updatedAt: Date.now(),
    }

    if (args.metaMessageId) updateData.metaMessageId = args.metaMessageId
    if (args.failureReason) updateData.failureReason = args.failureReason

    if (args.status === 'sent') {
      updateData.sentAt = Date.now()
    } else if (args.status === 'delivered') {
      updateData.deliveredAt = Date.now()
    } else if (args.status === 'read') {
      updateData.readAt = Date.now()
    }

    await ctx.db.patch(args.messageId, updateData)

    // Atualizar contadores da campanha
    const campaign = await ctx.db.get(message.campaignId)
    if (campaign && campaign.userId === args.userId) {
      if (args.status === 'sent') {
        await ctx.db.patch(message.campaignId, {
          sentCount: campaign.sentCount + 1,
          updatedAt: Date.now(),
        })
      } else if (args.status === 'failed') {
        await ctx.db.patch(message.campaignId, {
          failedCount: campaign.failedCount + 1,
          updatedAt: Date.now(),
        })
      }
    }
  },
})

// Funções auxiliares

function interpolateTemplate(template: string, variables: string[]): string {
  let result = template
  variables.forEach((variable, index) => {
    result = result.replace(`{{${index + 1}}}`, variable)
  })
  return result
}
