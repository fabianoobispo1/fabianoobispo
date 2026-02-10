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

// Schema para Templates de Mensagens WhatsApp
export const whatsAppTemplateSchema = {
  name: v.string(), // Nome do template
  category: v.string(), // 'MARKETING', 'TRANSACIONAL', 'OTP', 'NOTIFICACAO'
  content: v.string(), // Conteúdo da mensagem
  variables: v.array(
    v.object({
      name: v.string(), // Ex: {{1}}, {{2}}
      placeholder: v.string(), // Ex: "nome", "email"
      type: v.union(
        v.literal('text'),
        v.literal('number'),
        v.literal('date'),
        v.literal('url'),
      ),
      required: v.boolean(),
    }),
  ),
  status: v.union(
    v.literal('draft'),
    v.literal('approved'),
    v.literal('rejected'),
  ),
  metaApprovalId: v.optional(v.string()), // ID da aprovação Meta
  rejectionReason: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  userId: v.id('user'),
}

// Schema para Campanhas de Envio
export const campaignSchema = {
  name: v.string(),
  description: v.optional(v.string()),
  templateId: v.id('whatsAppTemplate'),
  status: v.union(
    v.literal('draft'),
    v.literal('scheduled'),
    v.literal('sending'),
    v.literal('sent'),
    v.literal('paused'),
    v.literal('cancelled'),
  ),
  recipientList: v.array(
    v.object({
      phone: v.string(), // Número WhatsApp com código de país
      variables: v.array(v.string()), // Valores para cada placeholder
    }),
  ),
  scheduledFor: v.optional(v.number()), // Timestamp para agendamento
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  totalRecipients: v.number(),
  sentCount: v.number(),
  failedCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  userId: v.id('user'),
}

// Schema para Rastreamento de Mensagens
export const messageTrackingSchema = {
  campaignId: v.id('campaign'),
  userId: v.id('user'),
  phoneNumber: v.string(),
  messageContent: v.string(),
  status: v.union(
    v.literal('pending'),
    v.literal('sent'),
    v.literal('delivered'),
    v.literal('read'),
    v.literal('failed'),
  ),
  metaMessageId: v.optional(v.string()),
  failureReason: v.optional(v.string()),
  sentAt: v.optional(v.number()),
  deliveredAt: v.optional(v.number()),
  readAt: v.optional(v.number()),
  retryCount: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
}

// Schema para Logs de Atividades
export const activityLogSchema = {
  userId: v.id('user'),
  action: v.string(), // 'template_created', 'campaign_started', 'message_sent', etc.
  resourceType: v.string(), // 'template', 'campaign', 'message'
  resourceId: v.optional(v.string()),
  details: v.optional(v.string()),
  timestamp: v.number(),
}

// Schema para Contatos (importados)
export const contactsSchema = {
  number: v.string(),
  name: v.string(),
  lastMessageAt: v.string(), // ISO date string
  lastMessageText: v.string(),
  userId: v.id('user'),
  createdAt: v.number(),
  updatedAt: v.number(),
}

// Schema para Pagamentos
export const paymentSchema = {
  userId: v.id('user'),
  mercadoPagoId: v.string(), // ID do pagamento no Mercado Pago
  type: v.union(
    v.literal('pix'),
    v.literal('credit_card'),
    v.literal('debit_card'),
  ),
  status: v.union(
    v.literal('pending'),
    v.literal('approved'),
    v.literal('rejected'),
    v.literal('cancelled'),
    v.literal('refunded'),
  ),
  amount: v.number(),
  description: v.string(),
  payerEmail: v.string(),
  payerName: v.optional(v.string()),
  // Dados do cartão (últimos 4 dígitos, bandeira)
  cardLastFourDigits: v.optional(v.string()),
  cardBrand: v.optional(v.string()),
  // Relacionamento com assinatura (se for pagamento recorrente)
  subscriptionId: v.optional(v.id('subscriptions')),
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  approvedAt: v.optional(v.number()),
}

// Schema para Assinaturas/Planos
export const subscriptionPlanSchema = {
  name: v.string(), // Ex: "Plano Premium Mensal"
  description: v.string(),
  amount: v.number(), // Valor em reais
  frequency: v.union(
    v.literal('monthly'),
    v.literal('quarterly'),
    v.literal('semiannual'),
    v.literal('annual'),
  ),
  frequencyDays: v.number(), // 30, 90, 180, 365
  active: v.boolean(),
  features: v.array(v.string()), // Lista de features do plano
  createdAt: v.number(),
  updatedAt: v.number(),
}

// Schema para Assinaturas de Usuários
export const subscriptionSchema = {
  userId: v.id('user'),
  planId: v.id('subscriptionPlans'),
  mercadoPagoPreapprovalId: v.optional(v.string()), // ID da pre-approval no MP
  status: v.union(
    v.literal('active'),
    v.literal('paused'),
    v.literal('cancelled'),
    v.literal('expired'),
    v.literal('pending'),
  ),
  // Informações de pagamento
  cardToken: v.optional(v.string()), // Token do cartão para recorrência
  cardLastFourDigits: v.optional(v.string()),
  cardBrand: v.optional(v.string()),
  // Datas importantes
  startDate: v.number(), // Início da assinatura
  nextBillingDate: v.number(), // Próxima cobrança
  endDate: v.optional(v.number()), // Fim da assinatura (se cancelada)
  // Contadores
  billingCycle: v.number(), // Número de cobranças realizadas
  failedPayments: v.number(), // Cobranças falhadas consecutivas
  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
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
  whatsAppTemplate: defineTable(whatsAppTemplateSchema)
    .index('by_user', ['userId'])
    .index('by_status', ['status']),
  campaign: defineTable(campaignSchema)
    .index('by_user', ['userId'])
    .index('by_status', ['status'])
    .index('by_template', ['templateId']),
  messageTracking: defineTable(messageTrackingSchema)
    .index('by_campaign', ['campaignId'])
    .index('by_user', ['userId'])
    .index('by_phone', ['phoneNumber'])
    .index('by_status', ['status']),
  activityLog: defineTable(activityLogSchema)
    .index('by_user', ['userId'])
    .index('by_action', ['action']),
  contacts: defineTable(contactsSchema)
    .index('by_user', ['userId'])
    .index('by_user_number', ['userId', 'number']),
  payments: defineTable(paymentSchema)
    .index('by_user', ['userId'])
    .index('by_mercadopago_id', ['mercadoPagoId'])
    .index('by_status', ['status'])
    .index('by_subscription', ['subscriptionId']),
  subscriptionPlans: defineTable(subscriptionPlanSchema).index('by_active', [
    'active',
  ]),
  subscriptions: defineTable(subscriptionSchema)
    .index('by_user', ['userId'])
    .index('by_plan', ['planId'])
    .index('by_status', ['status'])
    .index('by_next_billing', ['nextBillingDate']),
})
