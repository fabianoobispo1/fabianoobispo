import { v } from 'convex/values'
import { defineSchema, defineTable } from 'convex/server'

// Schema para usuários
export const userSchema = {
  nome: v.string(),
  email: v.string(),
  provider: v.string(),
  role: v.union(v.literal('admin'), v.literal('user')),
  image: v.optional(v.string()),
  image_key: v.optional(v.string()),
  password: v.string(),
  data_nascimento: v.optional(v.number()),
  cpf: v.optional(v.string()),
}

export const recuperaSenhaSchema = {
  email: v.string(),
  created_at: v.number(),
  valid_at: v.number(),
}

// Schema para todos
export const todoSchema = {
  text: v.string(),
  isCompleted: v.boolean(),
  created_at: v.number(),
  updated_at: v.number(),
  userId: v.id('user'),
}
export const financeiroSchema = {
  descricao: v.string(),
  valor: v.number(),
  dataVencimento: v.number(), // timestamp
  dataPagamento: v.optional(v.number()), // opcional, para quando for pago
  categoria: v.string(),
  status: v.string(), // "PAGO", "PENDENTE", "ATRASADO"
  created_at: v.number(),
  updated_at: v.number(),
  userId: v.id('user'),
}

export const cartoesSchema = {
  descricao: v.string(),
  valor: v.number(),
  dataVencimento: v.number(), // timestamp
  dataPagamento: v.optional(v.number()), // opcional, para quando for pago
  categoria: v.string(),
  status: v.string(), // "PAGO", "PENDENTE", "ATRASADO"
  obs: v.string(),
  limite: v.number(),
  limiteUtilizado: v.number(),
  created_at: v.number(),
  updated_at: v.number(),
  userId: v.id('user'),
}




const transactionSchema = {
  name: v.string(),
  type: v.union(
    v.literal('DEPOSIT'),
    v.literal('EXPENSE'),
    v.literal('INVESTMENT')
  ),
  amount: v.number(), // Convex uses number instead of Decimal
  category: v.string(),
  paymentMethod: v.union(
    v.literal('CREDIT_CARD'),
    v.literal('DEBIT_CARD'),
    v.literal('BANK_TRANSFER'),
    v.literal('BANK_SLIP'),
    v.literal('CASH'),
    v.literal('PIX'),
    v.literal('OTHER')
  ),
  date: v.number(), // Store as timestamp
  created_at: v.number(), // Store as timestamp
  updated_at: v.number(), // Store as timestamp
  userId: v.string()
}

const categorySchema = {
  name: v.string(),
  type: v.string(), // DEPOSIT, EXPENSE, INVESTMENT
  description: v.optional(v.string()),
  created_at: v.number(),
  updated_at: v.number(),
  active: v.boolean()
}




// Definição do Schema completo
export default defineSchema({
  user: defineTable(userSchema)
    .index('by_email', ['email'])
    .index('by_username', ['nome']),
  recuperaSenha: defineTable(recuperaSenhaSchema).index('by_email', ['email']),
  financeiro: defineTable(financeiroSchema).index('by_user', ['userId']),
  cartoes: defineTable(cartoesSchema).index('by_user', ['userId']), //
  todo: defineTable(todoSchema).index('by_user', ['userId']),
  transactions: defineTable(transactionSchema)
  .index('by_user', ['userId'])
  .index('by_date', ['date']),  
categories: defineTable(categorySchema)
  .index('by_name', ['name'])
  .index('by_type', ['type']),  

})
