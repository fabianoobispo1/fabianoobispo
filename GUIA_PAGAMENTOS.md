# Guia Completo de Pagamentos - Mercado Pago

## 📋 Índice

1. [Tipos de Pagamento Disponíveis](#tipos-de-pagamento)
2. [Configuração Inicial](#configuração-inicial)
3. [Pagamento Pix](#pagamento-pix)
4. [Pagamento com Cartão](#pagamento-com-cartão)
5. [Assinaturas Recorrentes](#assinaturas-recorrentes)
6. [Webhooks](#webhooks)
7. [Estrutura de Dados Convex](#estrutura-de-dados-convex)

---

## 🎯 Tipos de Pagamento Disponíveis

### 1. **PIX** (Pagamento Instantâneo)

- Pagamento único via QR Code
- Confirmação instantânea
- Sem parcelas

### 2. **Cartão de Crédito/Débito**

- Pagamento único ou parcelado
- Aprovação em segundos
- Suporta todas as bandeiras

### 3. **Assinaturas Recorrentes**

- Cobranças automáticas (mensal, trimestral, semestral, anual)
- Gerenciamento de ciclos de pagamento
- Cancelamento a qualquer momento

---

## ⚙️ Configuração Inicial

### 1. Variáveis de Ambiente

Adicione no `.env.local`:

```bash
# Mercado Pago - Produção
MERCADOPAGO_ACCESS_TOKEN=seu_access_token_aqui

# Mercado Pago - Public Key (para frontend)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=sua_public_key_aqui

# URL da aplicação (para webhooks)
NEXT_PUBLIC_APP_URL=https://seudominio.com
```

### 2. Instalar SDK no Frontend

Adicione no `layout.tsx` ou na página que vai usar pagamentos com cartão:

```tsx
<Script src="https://sdk.mercadopago.com/js/v2" strategy="beforeInteractive" />
```

### 3. Configurar Webhook no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/developers/panel
2. Vá em "Webhooks" → "Configurar webhooks"
3. URL de notificação: `https://seudominio.com/api/webhook/mercadopago`
4. Eventos: Selecione "Pagamentos" e "Assinaturas"

---

## 💳 Pagamento Pix

### Uso Básico

```tsx
import { PixPayment } from '@/components/PixPayment'

export default function PaginaPagamento() {
  return <PixPayment amount={100} description="Produto X" />
}
```

### Fluxo

1. Usuário clica em "Pagar com Pix"
2. Sistema gera QR Code + código copia-e-cola
3. Usuário paga no app do banco
4. Webhook recebe confirmação
5. Status atualizado no Convex

---

## 💳 Pagamento com Cartão

### Uso Básico

```tsx
'use client'
import { CardPaymentForm } from '@/components/CardPaymentForm'
import { useSession } from 'next-auth/react'

export default function PaginaCartao() {
  const { data: session } = useSession()

  return (
    <CardPaymentForm
      amount={199.9}
      description="Produto Premium"
      userId={session?.user?.id}
      onSuccess={(data) => {
        console.log('Pagamento aprovado!', data)
        // Redirecionar ou liberar acesso
      }}
      onError={(error) => {
        console.error('Erro:', error)
      }}
    />
  )
}
```

### Recursos do Formulário

- ✅ Validação de campos
- ✅ Máscaras automáticas (CPF, cartão, validade)
- ✅ Parcelamento em até 12x
- ✅ Tokenização segura do cartão
- ✅ Integração Convex automática

### Métodos de Pagamento Suportados

- Visa
- Mastercard
- Elo
- American Express
- Hipercard
- Débito (todas as bandeiras)

---

## 🔄 Assinaturas Recorrentes

### 1. Criar Planos (Admin)

Use o Convex Dashboard ou crie via mutation:

```tsx
import { useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'

const createPlan = useMutation(api.subscriptions.createPlan)

await createPlan({
  name: 'Plano Premium Mensal',
  description: 'Acesso total à plataforma',
  amount: 49.9,
  frequency: 'monthly',
  frequencyDays: 30,
  features: ['Acesso ilimitado', 'Suporte prioritário', 'Sem anúncios'],
})
```

### 2. Usar Componente de Assinaturas

```tsx
'use client'
import { SubscriptionManager } from '@/components/SubscriptionManager'
import { useSession } from 'next-auth/react'

export default function PaginaAssinaturas() {
  const { data: session } = useSession()

  if (!session?.user?.id) return <div>Faça login</div>

  return <SubscriptionManager userId={session.user.id} />
}
```

### Funcionalidades do Gerenciador

- ✅ Exibir planos disponíveis
- ✅ Processar primeiro pagamento
- ✅ Criar assinatura no Mercado Pago
- ✅ Exibir status da assinatura ativa
- ✅ Cancelar assinatura

### 3. Cobranças Automáticas

O Mercado Pago faz cobranças automáticas. Configure um cron job para processar:

```typescript
// app/api/cron/billing/route.ts
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { api } from '@/../convex/_generated/api'

export async function GET() {
  const dueSubscriptions = await fetchQuery(
    api.subscriptions.getSubscriptionsDueForBilling,
  )

  for (const sub of dueSubscriptions) {
    // Processar pagamento recorrente
    const payment = await processRecurringPayment(sub)

    await fetchMutation(api.subscriptions.recordBillingPayment, {
      subscriptionId: sub._id,
      success: payment.status === 'approved',
    })
  }

  return new Response('OK')
}
```

Configure no Vercel Cron:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/billing",
      "schedule": "0 0 * * *" // Todo dia à meia-noite
    }
  ]
}
```

---

## 🎣 Webhooks

### Eventos Processados

O webhook em `/api/webhook/mercadopago` processa:

1. **payment.created** - Pagamento criado
2. **payment.updated** - Status atualizado (aprovado, rejeitado, etc.)
3. **preapproval.created** - Assinatura criada
4. **preapproval.updated** - Assinatura atualizada/cancelada

### Ações Automáticas

- ✅ Atualiza status no Convex
- ✅ Registra falhas de pagamento
- ✅ Pausa assinaturas após 3 falhas
- ✅ Avança ciclo de cobrança

---

## 🗄️ Estrutura de Dados Convex

### Tabela: `payments`

```typescript
{
  _id: Id<"payments">,
  userId: Id<"user">,
  mercadoPagoId: "123456789",
  type: "pix" | "credit_card" | "debit_card",
  status: "pending" | "approved" | "rejected" | "cancelled" | "refunded",
  amount: 199.90,
  description: "Produto X",
  payerEmail: "cliente@email.com",
  payerName: "João Silva",
  cardLastFourDigits: "1234",
  cardBrand: "visa",
  subscriptionId: Id<"subscription">, // (opcional)
  createdAt: 1234567890,
  updatedAt: 1234567890,
  approvedAt: 1234567890
}
```

### Tabela: `subscriptionPlans`

```typescript
{
  _id: Id<"subscriptionPlans">,
  name: "Plano Premium",
  description: "Acesso total",
  amount: 49.90,
  frequency: "monthly" | "quarterly" | "semiannual" | "annual",
  frequencyDays: 30,
  active: true,
  features: ["Feature 1", "Feature 2"],
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

### Tabela: `subscriptions`

```typescript
{
  _id: Id<"subscription">,
  userId: Id<"user">,
  planId: Id<"subscriptionPlan">,
  mercadoPagoPreapprovalId: "abc123",
  status: "active" | "paused" | "cancelled" | "expired" | "pending",
  cardToken: "token_xyz",
  cardLastFourDigits: "1234",
  cardBrand: "visa",
  startDate: 1234567890,
  nextBillingDate: 1234567890,
  endDate: 1234567890, // (opcional)
  billingCycle: 5, // 5ª cobrança
  failedPayments: 0,
  createdAt: 1234567890,
  updatedAt: 1234567890
}
```

---

## 🔍 Queries Úteis

### Buscar pagamentos do usuário

```tsx
const payments = useQuery(api.payments.getPaymentsByUser, {
  userId: session.user.id,
})
```

### Buscar assinatura ativa

```tsx
const subscription = useQuery(api.subscriptions.getActiveSubscription, {
  userId: session.user.id,
})
```

### Listar planos disponíveis

```tsx
const plans = useQuery(api.subscriptions.getActivePlans)
```

---

## 🛡️ Segurança

### ✅ Boas Práticas Implementadas

1. **Tokenização de Cartões**: Nunca armazenamos dados completos do cartão
2. **Idempotência**: Evita duplicação de pagamentos
3. **Webhook Validation**: Sempre valida origem das notificações
4. **HTTPS Obrigatório**: Produção exige SSL
5. **Dados Sensíveis**: Access tokens apenas no backend

### ❌ O que NUNCA fazer

- ❌ Enviar dados de cartão sem tokenizar
- ❌ Expor Access Token no frontend
- ❌ Processar pagamentos sem validação
- ❌ Ignorrar status "pending"

---

## 🧪 Teste em Desenvolvimento

### Cartões de Teste

```
Aprovado:
5031 4332 1540 6351 | CVV: 123 | Validade: 11/25

Rejeitado (fundos insuficientes):
5031 4332 1540 6352 | CVV: 123 | Validade: 11/25
```

Mais cartões: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/testing

---

## 📊 Monitoramento

### Dashboard Mercado Pago

- Acessar: https://www.mercadopago.com.br/activities
- Ver todos os pagamentos em tempo real
- Webhooks enviados e status
- Estornos e disputas

### Convex Dashboard

- Ver todos os pagamentos salvos
- Assinaturas ativas
- Histórico de cobranças

---

## 🚀 Deploy Checklist

- [ ] Configurar variáveis de ambiente de produção
- [ ] Configurar URL do webhook no Mercado Pago
- [ ] Testar pagamentos em ambiente de homologação
- [ ] Configurar domínio com HTTPS
- [ ] Ativar conta Mercado Pago para produção
- [ ] Configurar cron job para cobranças recorrentes
- [ ] Testar fluxo completo de assinatura

---

## 📞 Suporte

- **Mercado Pago**: https://www.mercadopago.com.br/developers/pt/support
- **Documentação API**: https://www.mercadopago.com.br/developers/pt/docs
- **Status dos serviços**: https://status.mercadopago.com/
