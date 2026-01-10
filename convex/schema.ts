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

export const transactionsSchema = {
  name: v.string(),
  type: v.union(
    v.literal('DEPOSIT'),
    v.literal('EXPENSE'),
    v.literal('INVESTMENT'),
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
    v.literal('OTHER'),
  ),
  date: v.number(), // Store as timestamp
  created_at: v.number(), // Store as timestamp
  updated_at: v.number(), // Store as timestamp
  userId: v.id('user'),
}

export const categorySchema = {
  name: v.string(),
  type: v.string(), // DEPOSIT, EXPENSE, INVESTMENT
  description: v.optional(v.string()),
  created_at: v.number(),
  updated_at: v.number(),
  active: v.boolean(),
}

export const dontPadSchema = {
  page_name: v.string(),
  page_content: v.string(),
  ads: v.boolean(),
  created_at: v.number(),
  updated_at: v.number(),
}

export const workoutPlanSchema = {
  name: v.string(),
  description: v.optional(v.string()),
  active: v.boolean(),
  created_at: v.number(),
  updated_at: v.number(),
  userId: v.id('user'),
}

export const workoutDaySchema = {
  planId: v.id('workoutPlan'),
  title: v.string(),
  focus: v.string(),
  dayOfWeek: v.string(), // 'seg', 'ter', 'qua', etc.
  order: v.number(),
  created_at: v.number(),
  updated_at: v.number(),
}

// Catálogo global de exercícios (compartilhado entre usuários)
export const exerciseCatalogSchema = {
  name: v.string(),
  description: v.string(),
  muscleGroup: v.string(), // 'peito', 'costas', 'pernas', 'ombros', 'braços', 'core'
  equipment: v.optional(v.string()), // 'barra', 'halteres', 'máquina', 'peso corporal'
  videoUrl: v.optional(v.string()),
  defaultSets: v.optional(v.string()),
  defaultReps: v.optional(v.string()),
  created_at: v.number(),
  updated_at: v.number(),
}

// Instância do exercício no treino do usuário
export const exerciseSchema = {
  dayId: v.id('workoutDay'),
  catalogId: v.optional(v.id('exerciseCatalog')), // Referência ao catálogo (opcional para exercícios customizados)
  name: v.string(), // Nome pode ser sobrescrito
  sets: v.string(),
  reps: v.string(),
  note: v.string(),
  carga: v.optional(v.string()), // Carga utilizada (ex: "20kg", "15kg")
  videoUrl: v.optional(v.string()), // URL do vídeo (pode sobrescrever do catálogo)
  order: v.number(),
  created_at: v.number(),
  updated_at: v.number(),
}

// Definição do Schema completo
export default defineSchema({
  user: defineTable(userSchema)
    .index('by_email', ['email'])
    .index('by_username', ['nome']),
  recuperaSenha: defineTable(recuperaSenhaSchema).index('by_email', ['email']),
  todo: defineTable(todoSchema).index('by_user', ['userId']),
  transactions: defineTable(transactionsSchema)
    .index('by_user', ['userId'])
    .index('by_date', ['date'])
    .index('by_category', ['category']),
  categories: defineTable(categorySchema)
    .index('by_name', ['name'])
    .index('by_type', ['type']),
  dontPad: defineTable(dontPadSchema).index('by_page_name', ['page_name']),
  workoutPlan: defineTable(workoutPlanSchema).index('by_user', ['userId']),
  workoutDay: defineTable(workoutDaySchema).index('by_plan', ['planId']),
  exerciseCatalog: defineTable(exerciseCatalogSchema)
    .index('by_name', ['name'])
    .index('by_muscle_group', ['muscleGroup']),
  exercise: defineTable(exerciseSchema)
    .index('by_day', ['dayId'])
    .index('by_catalog', ['catalogId']),
})
