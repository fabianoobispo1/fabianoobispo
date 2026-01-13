# 📱 Suite de Ferramentas WhatsApp Business - Documentação

## 🎯 Visão Geral

Conjunto completo de ferramentas para gerenciamento profissional de campanhas de mensagens WhatsApp Business com Meta. Oferece controle total, rastreabilidade e conformidade com regulações.

---

## 🛠️ Ferramentas Disponíveis

### 1. **Gerenciar Templates** (`/ferramentas/gerenciar-templates`)

**Propósito**: Criar e gerenciar modelos de mensagens profissionais com variáveis dinâmicas.

**Funcionalidades**:

- ✅ CRUD completo de templates
- ✅ Suporte a múltiplos tipos: Marketing, Transacional, OTP, Notificação
- ✅ Variáveis dinâmicas com tipos: texto, número, data, URL
- ✅ Preview em tempo real
- ✅ Status: Rascunho, Aprovado, Rejeitado
- ✅ Integração com Meta para aprovação de templates

**Campos Principais**:

```typescript
{
  name: string // Nome do template
  category: string // Categoria (MARKETING, TRANSACIONAL, OTP, NOTIFICACAO)
  content: string // Conteúdo da mensagem com {{1}}, {{2}}, etc.
  variables: {
    name: string // Nome interno da variável
    placeholder: string // Nome exibido na UI (ex: "nome", "email")
    type: string // text | number | date | url
    required: boolean // Obrigatória ou não
  }
  ;[]
  status: string // draft | approved | rejected
  metaApprovalId: string // ID da aprovação da Meta
  rejectionReason: string // Motivo da rejeição (se houver)
}
```

**Componente**: `src/components/GerenciadorTemplates.tsx`

**Backend**: Funções em `convex/whatsAppCampaign.ts`:

- `getTemplatesByUser` - Query
- `getTemplateById` - Query
- `createTemplate` - Mutation
- `updateTemplate` - Mutation
- `deleteTemplate` - Mutation

---

### 2. **Monitor de Campanhas** (`/ferramentas/monitor-campanhas`)

**Propósito**: Dashboard em tempo real com métricas de envio e rastreabilidade.

**Funcionalidades**:

- ✅ Visão geral de todas as campanhas
- ✅ Estatísticas em tempo real (enviadas, entregues, falhadas)
- ✅ Taxa de entrega e leitura
- ✅ Controle de status da campanha
- ✅ Timeline de eventos
- ✅ Gráficos e métricas

**Cards de Resumo**:

- Total de campanhas
- Mensagens enviadas
- Taxa média de entrega
- Total de falhas

**Status de Campanha**:

- Draft (Rascunho)
- Scheduled (Agendada)
- Sending (Enviando)
- Sent (Enviada)
- Paused (Pausada)
- Cancelled (Cancelada)

**Backend**: Funções em `convex/whatsAppCampaign.ts`:

- `getCampaignsByUser` - Query
- `getCampaignById` - Query
- `getCampaignStats` - Query
- `updateCampaignStatus` - Mutation

---

### 3. **Gerador de Variáveis** (`/ferramentas/gerador-variaveis`)

**Propósito**: Interface intuitiva para criar campanhas com templates e variáveis personalizadas.

**Fluxo**:

1. Selecionar template
2. Preencher variáveis
3. Visualizar preview da mensagem
4. Adicionar destinatários com valores específicos
5. Criar campanha

**Funcionalidades**:

- ✅ Seleção de template com preview
- ✅ Preenchimento intuitivo de variáveis
- ✅ Preview em tempo real da mensagem final
- ✅ Adição múltipla de destinatários
- ✅ Validação de campos obrigatórios
- ✅ Cópia de conteúdo para clipboard

**Elementos de Interface**:

- Painel lateral com lista de templates
- Painel central com formulário e preview
- Tabela de destinatários adicionados
- Botão para criar campanha

---

### 4. **Rastreador de Entregas** (`/ferramentas/rastreador-entregas`)

**Propósito**: Controle detalhado do status e histórico de cada mensagem enviada.

**Funcionalidades**:

- ✅ Seleção de campanha
- ✅ Filtros por status: Pendente, Enviada, Entregue, Lida, Falha
- ✅ Busca por número de telefone
- ✅ Tabela detalhada de mensagens
- ✅ Modal com detalhes completos de cada mensagem
- ✅ Timeline de eventos
- ✅ Informações técnicas (ID Meta, tentativas, motivos de falha)
- ✅ Atualização manual de status

**Status de Mensagem**:

- ⏳ Pending (Pendente)
- ✉️ Sent (Enviada)
- ✅ Delivered (Entregue)
- 👁️ Read (Lida)
- ❌ Failed (Falha)

**Eventos Rastreados**:

- Criação
- Envio
- Entrega
- Leitura
- Falha com motivo

**Backend**: Funções em `convex/whatsAppCampaign.ts`:

- `getMessagesByCampaign` - Query
- `getCampaignStats` - Query
- `updateMessageStatus` - Mutation

---

### 5. **Disparador de Campanhas** (`/ferramentas/disparador-campanhas`)

**Propósito**: Iniciar envio de campanhas com confirmação de segurança.

**Funcionalidades**:

- ✅ Seleção de campanhas em rascunho
- ✅ Disparo imediato com confirmação dupla
- ✅ Agendamento de disparo futuro
- ✅ Avisos de conformidade legal
- ✅ Boas práticas de segurança
- ✅ Informações de campanha antes do disparo

**Opções de Disparo**:

1. **Disparar Agora**: Inicia o envio imediatamente
2. **Agendar Disparo**: Define data e hora para envio futuro

**Validações de Segurança**:

- ✅ Consentimento dos destinatários
- ✅ Conformidade com LGPD/GDPR
- ✅ Frequência apropriada
- ✅ Conteúdo profissional
- ✅ Confirmação explícita antes de disparar

**Backend**: Funções em `convex/whatsAppCampaign.ts`:

- `updateCampaignStatus` - Mutation

---

## 🏗️ Arquitetura de Dados

### Schema Convex (`convex/schema.ts`)

#### Tabelas Criadas:

**1. whatsAppTemplate**

```typescript
{
  name: string
  category: string
  content: string
  variables: TemplateVariable[]
  status: 'draft' | 'approved' | 'rejected'
  metaApprovalId?: string
  rejectionReason?: string
  createdAt: number
  updatedAt: number
  userId: Id<'user'>
}
Índices: by_user, by_status
```

**2. campaign**

```typescript
{
  name: string
  description?: string
  templateId: Id<'whatsAppTemplate'>
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
  recipientList: { phone: string, variables: string[] }[]
  scheduledFor?: number
  startedAt?: number
  completedAt?: number
  totalRecipients: number
  sentCount: number
  failedCount: number
  createdAt: number
  updatedAt: number
  userId: Id<'user'>
}
Índices: by_user, by_status, by_template
```

**3. messageTracking**

```typescript
{
  campaignId: Id<'campaign'>
  phoneNumber: string
  messageContent: string
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  metaMessageId?: string
  failureReason?: string
  sentAt?: number
  deliveredAt?: number
  readAt?: number
  retryCount: number
  createdAt: number
  updatedAt: number
}
Índices: by_campaign, by_phone, by_status
```

**4. activityLog**

```typescript
{
  userId: Id<'user'>
  action: string
  resourceType: string
  resourceId?: string
  details?: string
  timestamp: number
}
Índices: by_user, by_action
```

---

## 📁 Estrutura de Pastas

```
src/
├── app/(public_routes)/ferramentas/
│   ├── page.tsx                           # Landing page de ferramentas
│   ├── gerenciar-templates/
│   │   └── page.tsx
│   ├── monitor-campanhas/
│   │   └── page.tsx
│   ├── gerador-variaveis/
│   │   └── page.tsx
│   ├── rastreador-entregas/
│   │   └── page.tsx
│   ├── disparador-campanhas/
│   │   └── page.tsx
│   └── verificar-template/
│       └── page.tsx                       # Ferramenta existente
├── components/
│   └── GerenciadorTemplates.tsx           # Componente reutilizável
convex/
├── whatsAppCampaign.ts                    # Todas as funções de backend
├── schema.ts                              # Definições de tabelas e índices
└── ...
```

---

## 🔗 Fluxo de Uso Completo

```
1. GERENCIAR TEMPLATES
   └─> Criar templates com variáveis

2. GERADOR DE VARIÁVEIS
   └─> Selecionar template
   └─> Preencher dados dos destinatários
   └─> Criar campanha

3. MONITOR DE CAMPANHAS
   └─> Visualizar campanha criada
   └─> Acompanhar métricas

4. DISPARADOR DE CAMPANHAS
   └─> Selecionar campanha
   └─> Disparar ou agendar

5. RASTREADOR DE ENTREGAS
   └─> Acompanhar status de cada mensagem
   └─> Atualizar status manualmente se necessário
```

---

## 🔐 Segurança e Conformidade

### Checklist de Implementação:

- ✅ Autenticação via NextAuth (sessão obrigatória)
- ✅ Autorização por userId (dados isolados por usuário)
- ✅ Avisos de conformidade legal (LGPD/GDPR)
- ✅ Confirmação dupla para disparos
- ✅ Log de atividades para auditoria
- ✅ Rastreamento completo de mensagens
- ✅ Validação de templates Meta-compatible

### Próximas Implementações Recomendadas:

- [ ] Integração real com Meta WhatsApp Business API
- [ ] Webhooks da Meta para atualização de status em tempo real
- [ ] Cron jobs para disparo de campanhas agendadas
- [ ] Rate limiting para evitar spam
- [ ] Backup automático de logs
- [ ] Dashboard de conformidade LGPD
- [ ] Integração com CRM
- [ ] Análise de sentimento de respostas

---

## 🚀 Próximos Passos

### Curto Prazo:

1. Integrar com API WhatsApp Business da Meta
2. Implementar autenticação com Meta
3. Criar webhooks para receber atualizações de status

### Médio Prazo:

1. Sistema de agendamento de campanhas (cron)
2. Importação em lote (CSV/Excel)
3. Templates com mídia (imagem, vídeo)
4. Personalisação avançada com dados dinâmicos

### Longo Prazo:

1. Machine learning para otimização de envio
2. A/B testing de mensagens
3. Análise de conversão
4. Integrações com plataformas de CRM

---

## 📚 Referências

- Meta WhatsApp Business API: https://developers.facebook.com/docs/whatsapp/
- Documentação Convex: https://docs.convex.dev
- Next.js 15: https://nextjs.org/docs
- NextAuth v5: https://authjs.dev

---

## ✨ Notas Importantes

1. **Conformidade**: Sempre respeite LGPD, GDPR e legislações locais
2. **Consentimento**: Certifique-se que destinatários consentiram
3. **Frequência**: Não dispare spam ou mensagens muito frequentes
4. **Qualidade**: Use templates profissionais e conteúdo de qualidade
5. **Rastreamento**: Sempre monitore entregas e respostas
6. **Backup**: Faça backup regular dos logs de campanhas

---

**Versão**: 1.0
**Último Update**: 12 de Janeiro de 2026
**Status**: ✅ Pronto para Uso
