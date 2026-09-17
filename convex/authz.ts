import type { Id } from './_generated/dataModel'
import type { DatabaseReader } from './_generated/server'

export async function requireAdmin(db: DatabaseReader, userId: Id<'user'>) {
  const user = await db.get(userId)
  if (!user || user.role !== 'admin') {
    throw new Error(
      'Acesso negado: apenas administradores podem realizar esta ação',
    )
  }
  return user
}
