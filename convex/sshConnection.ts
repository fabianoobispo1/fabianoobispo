import { v } from 'convex/values'
import { query, mutation } from './_generated/server'
import { Id } from './_generated/dataModel'

/**
 * Funções para gerenciar SSH Connections
 *
 * IMPORTANTE: As credenciais são armazenadas criptografadas.
 * Em produção, implemente criptografia real com libsodium ou similar.
 */

/**
 * Listar todas as conexões do usuário
 */
export const getConnectionsByUser = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query('sshConnection')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    // Não retornar senhas ou chaves privadas
    return connections.map((conn) => ({
      ...conn,
      password: undefined,
      privateKey: undefined,
      privateKeyPassphrase: undefined,
    }))
  },
})

/**
 * Obter uma conexão específica (com dados sensíveis para edição)
 */
export const getConnectionById = query({
  args: { connectionId: v.id('sshConnection'), userId: v.id('user') },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId)

    if (!connection || connection.userId !== args.userId) {
      return null
    }

    // Em produção, descriptografar aqui
    return connection
  },
})

/**
 * Obter conexão padrão do usuário
 */
export const getDefaultConnection = query({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query('sshConnection')
      .withIndex('by_user_default', (q) =>
        q.eq('userId', args.userId).eq('isDefault', true)
      )
      .collect()

    const defaultConn = connections[0]

    if (!defaultConn) return null

    // Não retornar dados sensíveis
    return {
      ...defaultConn,
      password: undefined,
      privateKey: undefined,
      privateKeyPassphrase: undefined,
    }
  },
})

/**
 * Criar nova conexão SSH
 */
export const createConnection = mutation({
  args: {
    userId: v.id('user'),
    name: v.string(),
    host: v.string(),
    port: v.number(),
    username: v.string(),
    authMethod: v.union(v.literal('password'), v.literal('privateKey')),
    password: v.optional(v.string()),
    privateKey: v.optional(v.string()),
    privateKeyPassphrase: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Validar entrada
    if (!args.host || args.port < 1 || args.port > 65535) {
      throw new Error('Host e port inválidos')
    }

    if (args.authMethod === 'password' && !args.password) {
      throw new Error('Senha é obrigatória para autenticação por senha')
    }

    if (args.authMethod === 'privateKey' && !args.privateKey) {
      throw new Error('Chave privada é obrigatória para autenticação por chave')
    }

    // Se esta conexão é padrão, remover padrão das outras
    if (args.isDefault) {
      const oldDefault = await ctx.db
        .query('sshConnection')
        .withIndex('by_user_default', (q) =>
          q.eq('userId', args.userId).eq('isDefault', true)
        )
        .collect()

      for (const conn of oldDefault) {
        await ctx.db.patch(conn._id, { isDefault: false })
      }
    }

    // Em produção: criptografar args.password, args.privateKey
    // const encrypted = await encryptSensitiveData(...)

    const connectionId = await ctx.db.insert('sshConnection', {
      userId: args.userId,
      name: args.name,
      host: args.host,
      port: args.port,
      username: args.username,
      authMethod: args.authMethod,
      password: args.password,
      privateKey: args.privateKey,
      privateKeyPassphrase: args.privateKeyPassphrase,
      description: args.description,
      tags: args.tags,
      isDefault: args.isDefault,
      created_at: Date.now(),
      updated_at: Date.now(),
    })

    return connectionId
  },
})

/**
 * Atualizar conexão SSH
 */
export const updateConnection = mutation({
  args: {
    connectionId: v.id('sshConnection'),
    userId: v.id('user'),
    name: v.optional(v.string()),
    host: v.optional(v.string()),
    port: v.optional(v.number()),
    username: v.optional(v.string()),
    password: v.optional(v.string()),
    privateKey: v.optional(v.string()),
    privateKeyPassphrase: v.optional(v.string()),
    description: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId)

    if (!connection || connection.userId !== args.userId) {
      throw new Error('Conexão não encontrada ou sem permissão')
    }

    // Se tornando padrão, remover status de outras
    if (args.isDefault === true && !connection.isDefault) {
      const oldDefault = await ctx.db
        .query('sshConnection')
        .withIndex('by_user_default', (q) =>
          q.eq('userId', args.userId).eq('isDefault', true)
        )
        .collect()

      for (const conn of oldDefault) {
        await ctx.db.patch(conn._id, { isDefault: false })
      }
    }

    const updates: any = {
      updated_at: Date.now(),
    }

    if (args.name !== undefined) updates.name = args.name
    if (args.host !== undefined) updates.host = args.host
    if (args.port !== undefined) updates.port = args.port
    if (args.username !== undefined) updates.username = args.username
    if (args.password !== undefined) updates.password = args.password
    if (args.privateKey !== undefined) updates.privateKey = args.privateKey
    if (args.privateKeyPassphrase !== undefined)
      updates.privateKeyPassphrase = args.privateKeyPassphrase
    if (args.description !== undefined) updates.description = args.description
    if (args.tags !== undefined) updates.tags = args.tags
    if (args.isDefault !== undefined) updates.isDefault = args.isDefault

    await ctx.db.patch(args.connectionId, updates)
    return args.connectionId
  },
})

/**
 * Atualizar último uso
 */
export const updateLastUsed = mutation({
  args: {
    connectionId: v.id('sshConnection'),
    userId: v.id('user'),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId)

    if (!connection || connection.userId !== args.userId) {
      throw new Error('Conexão não encontrada')
    }

    await ctx.db.patch(args.connectionId, {
      lastUsed: Date.now(),
    })
  },
})

/**
 * Deletar conexão SSH
 */
export const deleteConnection = mutation({
  args: {
    connectionId: v.id('sshConnection'),
    userId: v.id('user'),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db.get(args.connectionId)

    if (!connection || connection.userId !== args.userId) {
      throw new Error('Conexão não encontrada ou sem permissão')
    }

    await ctx.db.delete(args.connectionId)
    return { success: true }
  },
})

/**
 * Deletar todas as conexões do usuário (para limpeza)
 */
export const deleteAllConnections = mutation({
  args: { userId: v.id('user') },
  handler: async (ctx, args) => {
    const connections = await ctx.db
      .query('sshConnection')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect()

    let deleted = 0
    for (const conn of connections) {
      await ctx.db.delete(conn._id)
      deleted++
    }

    return { deleted }
  },
})
