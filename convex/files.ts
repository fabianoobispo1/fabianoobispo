import { v } from 'convex/values'

import { mutation } from './_generated/server'
import { requireAdmin, requireUser } from './authz'

// Storage do Convex (hoje o app usa Uploadthing para imagens; estas funções
// ficam disponíveis, mas sempre exigem sessão)

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

// this mutation is required to generate the url after uploading the file to the storage.
export const getUrl = mutation({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx)
    return await ctx.storage.getUrl(args.storageId)
  },
})

// Arquivos do storage não têm dono registrado; só admin pode remover
export const removeFile = mutation({
  args: {
    storageId: v.id('_storage'),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)
    return await ctx.storage.delete(args.storageId)
  },
})
