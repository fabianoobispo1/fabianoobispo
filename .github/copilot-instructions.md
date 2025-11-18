# Instruções Copilot - Aplicação Pessoal Fabiano Bispo

## Visão Geral da Arquitetura

Esta é uma aplicação full-stack **Next.js 15 + Convex + NextAuth** para gerenciamento de finanças pessoais e ferramentas de produtividade. A aplicação usa **Convex** como banco de dados backend em tempo real (não REST/GraphQL tradicional) com schemas TypeScript-first.

### Componentes Principais da Stack
- **Framework**: Next.js 15 (App Router com RSC)
- **Backend/Banco de Dados**: Convex (BaaS em tempo real com funções TypeScript)
- **Autenticação**: NextAuth v5 (beta) com providers credentials, Google e GitHub
- **UI**: Shadcn/ui (primitivos Radix) + Tailwind CSS
- **Formulários**: React Hook Form + validação Zod
- **Estado**: Queries/mutations Convex (camada de dados reativa)

### Estrutura do Projeto
```
src/
  app/
    (dashboard)/         # Rotas protegidas com layout sidebar
    (public_routes)/     # Páginas públicas (entrar, dontpad, reset)
    api/                 # Rotas API (auth, uploadthing, whatsapp)
  components/
    ui/                  # Componentes Shadcn
    financas/            # Componentes do módulo financeiro
    forms/               # Formulários de autenticação
  auth/                  # Configuração NextAuth
  lib/                   # Utilitários (cn, formatCurrency, etc.)
  providers/             # Providers client (Convex, Auth)
convex/
  schema.ts              # Schema do banco de dados Convex
  *.ts                   # Funções backend (queries/mutations)
```

## Padrões Backend Convex

### Conceito Crítico: Convex NÃO é uma API REST
- Funções backend ficam no diretório `convex/`, NÃO em `src/app/api/`
- Use `useQuery(api.module.functionName, args)` para leituras
- Use `useMutation(api.module.functionName)` para escritas
- Todas as funções são TypeScript com validação runtime via `v` (convex/values)

### Escrevendo Funções Convex
```typescript
// convex/financeiro.ts
import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('financeiro')
      .withIndex('by_user', (q) => q.eq('userId', args.userId as Id<'user'>))
      .collect()
  },
})

export const create = mutation({
  args: { descricao: v.string(), valor: v.number(), userId: v.id('user') },
  handler: async (ctx, args) => {
    return await ctx.db.insert('financeiro', { ...args, created_at: Date.now() })
  },
})
```

### Usando Convex em Componentes
```tsx
'use client' // Hooks Convex exigem client components
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'

const data = useQuery(api.financeiro.getByUser, { userId: user.id })
const create = useMutation(api.financeiro.create)

// Mutations retornam promises
await create({ descricao: 'test', valor: 100, userId: user.id })
```

### Padrão de Indexação do Schema
Todas as tabelas Convex usam `.index()` para queries eficientes. Veja `convex/schema.ts` para índices disponíveis:
- Queries de usuário: `by_email`, `by_username`
- Dados com escopo: `by_user` (índice userId para dados multi-tenant)
- Temporal: `by_date` (transações)

## Fluxo de Autenticação

### Configuração NextAuth v5
- **Config**: `src/auth/auth.config.ts` e `src/auth/auth.ts`
- **Sessão**: Baseada em JWT com expiração de 1 hora
- **Providers**: Credentials (senha bcrypt), Google OAuth, GitHub OAuth
- **Integração**: Providers OAuth criam/atualizam usuários no Convex automaticamente no sign-in

### Padrões de Auth
```typescript
// Server components (RSC)
import { auth } from '@/auth/auth'
const session = await auth()
if (!session?.user) redirect('/')

// Client components
import { useSession } from 'next-auth/react'
const { data: session } = useSession()

// Layouts protegidos (veja src/app/(dashboard)/layout.tsx)
// Auto-redireciona usuários não autenticados para '/'
```

### Roles de Usuário
Usuários têm `role: 'admin' | 'user'` armazenado no Convex. Verifique `session.user.role` para autorização.

## Estilização & Componentes

### Padrão Tailwind + CVA
Todos os componentes Shadcn usam `class-variance-authority` para variantes:
```typescript
const buttonVariants = cva('base-classes', {
  variants: { variant: { default: '...', destructive: '...' } },
  defaultVariants: { variant: 'default' }
})
```

### Sistema de Temas
- Usa `next-themes` com modos system/dark/light
- Variáveis CSS em `globals.css` para cores (baseado em HSL)
- Toggle de tema via `ThemeProvider` no layout raiz

### Funções Utilitárias
Veja `src/lib/utils.ts` para:
- `cn()`: Mesclador de classes Tailwind
- `formatCurrency()`: Formatador de moeda BRL
- `formatCPF()`, `formatPhone()`: Máscaras de formato brasileiro
- `moedaMask()`: Máscara de input de moeda em tempo real

## Fluxo de Desenvolvimento

### Executando a Aplicação
```bash
npm run dev          # Servidor dev Next.js (localhost:3000)
npx convex dev       # Sincronização do backend Convex (rodar em paralelo)
```
**IMPORTANTE**: Deve rodar AMBOS os comandos em terminais separados para funcionalidade completa.

### Adicionando Componentes Shadcn
```bash
npx shadcn@latest add [nome-do-componente]
```
Componentes são instalados em `src/components/ui/` com alias `@/components/ui`

### Formatação de Código
- **Prettier**: Aspas simples, sem ponto e vírgula (veja `prettier.config.js`)
- **ESLint**: Config Rocketseat + regras Next.js
- Execute: `npm run format` antes de commitar

## Padrões Específicos dos Módulos

### Dashboard Financeiro (`src/components/financas/`)
- Usa `api.dashboard.getDashboardData` para buscar `financeiro` + `cartoes`
- Tipos de status: `"PAGO" | "PENDENTE" | "ATRASADO"`
- Datas armazenadas como timestamps Unix (number)
- Métodos de pagamento: `CREDIT_CARD`, `PIX`, `CASH`, etc. (veja `convex/schema.ts`)

### DontPad - Editor de Texto Colaborativo (`src/app/(public_routes)/dontpad/`)
- Sistema de editor de texto simples inspirado no DontPad.com
- **Funcionalidades**:
  - Acesso público via URL: `/dontpad/[nome-da-pagina]`
  - Auto-save automático após 1.8s de inatividade
  - Cria páginas dinamicamente se não existirem
  - Administração de páginas em `/dashboard/admin/administracao-dontpad`
- **Convex Functions**: `convex/dontPad.ts`
  - `getByPageName`: Busca página por nome
  - `update`: Cria ou atualiza página (upsert)
  - `listAll`: Lista todas as páginas (admin)
  - `remove`: Remove página (admin)
- **Componente Principal**: `dontpad-text.tsx` usa `useQuery` + `useMutation` para sincronização em tempo real

### Padrão de Formulários
Todos os formulários usam React Hook Form + Zod:
```tsx
const formSchema = z.object({ email: z.string().email() })
type FormValues = z.infer<typeof formSchema>

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { email: '' }
})
```

### Upload de Arquivos
Usa `@uploadthing/react` e `@xixixao/uploadstuff` (integração Convex). Veja `convex/files.ts` para funções de armazenamento.

## Armadilhas Comuns

1. **Client Components Convex**: Todos `useQuery`/`useMutation` requerem diretiva `'use client'`
2. **Ordem dos Providers**: Deve envolver com `ConvexClientProvider` → `AuthProvider` (veja layout raiz)
3. **Aliases de Caminho**: Use `@/` para `src/`, imports como `@/components/ui/button`
4. **Tipos Convex**: Converta strings userId para `Id<'user'>` quando necessário: `userId as Id<'user'>`
5. **Manipulação de Datas**: Armazene datas como timestamps (`Date.now()`), não objetos Date
6. **Domínios de Imagem**: Adicione domínios de imagem remota em `next.config.ts` remotePatterns

## Variáveis de Ambiente
```bash
NEXT_PUBLIC_CONVEX_URL=https://[deployment].convex.cloud
CONVEX_DEPLOYMENT=dev:[deployment-name]
# Segredos de auth em .env.local (não commitado)
GITHUB_ID, GITHUB_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET, NEXTAUTH_URL
```

## Testes & Debug
- Confira dashboard Convex: `https://dashboard.convex.dev`
- Logs do backend aparecem no terminal rodando `npx convex dev`
- Debug NextAuth: Configure `debug: true` no auth config
