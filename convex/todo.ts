import { v } from 'convex/values'

import { query, mutation } from './_generated/server'
import type { Id } from './_generated/dataModel'
import type { MutationCtx } from './_generated/server'
import { getCurrentUser, requireUser } from './authz'

async function getOwnTodo(ctx: MutationCtx, todoId: Id<'todo'>) {
  const user = await requireUser(ctx)
  const todo = await ctx.db.get(todoId)
  // Mesma mensagem para "não existe" e "é de outro usuário"
  if (!todo || todo.userId !== user._id) throw new Error('Todo não encontrado')
  return todo
}

export const create = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const user = await requireUser(ctx)
    const now = Date.now()
    return await ctx.db.insert('todo', {
      text,
      isCompleted: false,
      created_at: now,
      updated_at: now,
      userId: user._id,
    })
  },
})

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (!user) return []
    return await ctx.db
      .query('todo')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
  },
})

export const toggleTodoCompletion = mutation({
  args: { todoId: v.id('todo') },
  handler: async (ctx, { todoId }) => {
    const todo = await getOwnTodo(ctx, todoId)
    await ctx.db.patch(todoId, {
      isCompleted: !todo.isCompleted,
      updated_at: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { todoId: v.id('todo') },
  handler: async (ctx, { todoId }) => {
    await getOwnTodo(ctx, todoId)
    await ctx.db.delete(todoId)
    return { success: true, message: 'Todo removido com sucesso' }
  },
})
