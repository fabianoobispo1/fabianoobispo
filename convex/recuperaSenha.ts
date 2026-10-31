import { v } from 'convex/values'

import { internalMutation, internalQuery } from './_generated/server'
import { recuperaSenhaSchema } from './schema'

/**
 * Recuperação de senha — DESATIVADA.
 *
 * O fluxo antigo rodava no navegador: qualquer um podia criar um token válido
 * para qualquer e-mail e trocar a senha de qualquer conta. Além disso o envio
 * de e-mail (/api/send) não existe. Até existir um envio de e-mail real, as
 * funções ficam internas (acessíveis só via `npx convex run`) e a página
 * /reset mostra "indisponível".
 *
 * Para reativar: crie uma rota no servidor que gere o token (aleatório, não o
 * _id), envie o e-mail e troque a senha numa mutation de serviço que valide
 * token + expiração atomicamente.
 */

export const create = internalMutation({
  args: recuperaSenhaSchema,
  handler: async ({ db }, args) => {
    return await db.insert('recuperaSenha', args)
  },
})

export const getByEmail = internalQuery({
  args: { email: v.string() },
  handler: async ({ db }, { email }) => {
    return await db
      .query('recuperaSenha')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique()
  },
})

export const invalidaRecuperarSenha = internalMutation({
  args: { _id: v.id('recuperaSenha') },
  handler: async ({ db }, { _id }) => {
    await db.patch(_id, { valid_at: Date.now() })
  },
})
