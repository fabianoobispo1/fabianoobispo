# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- last verified: 2026-05-29 -->

## Commands

```bash
npm run dev          # Next.js dev server (localhost:3000, experimental HTTPS)
npx convex dev       # Convex backend sync — must run in a separate terminal
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier (run before committing)
npx shadcn@latest add [component]  # Add a Shadcn/ui component to src/components/ui/
```

**Both `npm run dev` and `npx convex dev` must run simultaneously** for full functionality.

## Architecture

Full-stack Next.js 15 (App Router) + Convex + NextAuth v5 personal portfolio and management app.

### Route Groups

- `src/app/(dashboard)/` — Protected routes behind auth, sidebar layout (financas, fichaexercicios, lista, perfil, admin)
- `src/app/(public_routes)/` — Public pages (login, dontpad editor, qrcode/barcode tools, games)
- `src/app/api/` — API routes (NextAuth, Uploadthing webhooks, NFC-e parser, seed)
- `src/app/page.tsx` — Portfolio publico com identidade visual `<fb/>` (JetBrains Mono + Space Grotesk, paleta floresta/esmeralda)

### Convex Backend

Convex is **not a REST API**. All backend logic lives in `convex/*.ts` files, not `src/app/api/`.

```typescript
// convex/example.ts
import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx) // convex/authz.ts
    if (!user) return []
    return await ctx.db
      .query('tableName')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
  },
})
```

Using Convex in components (requires `'use client'`):

```tsx
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api' // note the path alias

const { isAuthenticated } = useConvexAuth()
const data = useQuery(api.transaction.getDashboard, isAuthenticated ? { month: '01' } : 'skip')
const create = useMutation(api.transaction.create) // dono = identidade, sem userId
```

Inside `useEffect` or event callbacks, use `const convex = useConvex()` and `convex.query(...)` / `convex.mutation(...)` (authenticated). `fetchQuery`/`fetchMutation` from `convex/nextjs` are server-side only and need `{ token }`.

**⚠️ Convex has two separate deployments — `npx convex dev` does NOT reach production.** The project `fabianoobispo-com-br` has a dev deployment (`abundant-ant-397`, what `npx convex dev` / `npx convex dev --once` push to) and a distinct production deployment (`intent-cow-40`, what the live site's `NEXT_PUBLIC_CONVEX_URL` on Vercel points to). Schema/function changes only reach the dev deployment until you run **`npx convex deploy`**. Env vars (`npx convex env set KEY value`) also default to dev — add `--prod` to set them on production. This bit the project once already: a whole feature (Mega-Sena BI) shipped to Vercel and looked fine in `next build`, but the live page threw `Application error` because the Convex functions/schema/data simply didn't exist on the production deployment. Before considering a Convex-backed feature "done" and telling the user it's live, run `npx convex deploy` (and any needed `npx convex env set ... --prod`), then verify against the actual production URL — not just `npx convex dev`.

### Authentication

- Config: `src/auth/auth.config.ts` and `src/auth/auth.ts`
- JWT sessions with 1-hour expiry; providers: Credentials (bcrypt), Google OAuth, GitHub OAuth
- OAuth sign-in automatically creates/updates users in Convex

```typescript
// Server components
import { auth } from '@/auth/auth'
const session = await auth()

// Client components
import { useSession } from 'next-auth/react'
const { data: session } = useSession()
```

Users have `role: 'admin' | 'user'` stored in Convex — check `session.user.role` for UI gating only; the real authorization is in Convex.

**Convex auth (NextAuth → Convex JWT):** `/api/convex/token` signs an ES256 JWT (`sub` = user `_id`) with `CONVEX_AUTH_PRIVATE_KEY`; Convex validates it via `convex/auth.config.ts` (inline JWKS in `CONVEX_AUTH_JWKS`). Generate keys with `node scripts/gen-convex-auth-keys.mjs`. Rules:
- Never accept "who is calling" (`userId`) as a function arg. Use `requireUser(ctx)` / `getCurrentUser(ctx)` / `requireAdmin(ctx)` / `requireTerminalUser(ctx)` from `convex/authz.ts` (actions: `requireUserAction` / `requireAdminAction`). Role is read from the DB, not from claims.
- Never return `user.password` to clients (`toSafeUser`). Functions only scripts/crons use are `internal*` (run with `npx convex run`).
- Server-only flows without a session (credentials login, OAuth sign-in, register, password change) use the service token: `serviceQuery`/`serviceMutation` from `src/lib/server/convex-auth.ts`, and the Convex side checks `requireService(ctx)`.
- In client components use `useQuery`/`useMutation`/`useConvex()` (they carry the token) — **not** `fetchQuery`/`fetchMutation` from `convex/nextjs`, which run without auth. Gate per-user queries with `useConvexAuth().isAuthenticated ? args : 'skip'`.

### Forms Pattern

All forms use React Hook Form + Zod:

```tsx
const formSchema = z.object({ email: z.string().email() })
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { email: '' },
})
```

### Styling

- Tailwind CSS with CSS variable-based HSL color tokens in `globals.css`
- Shadcn/ui (Radix primitives) + `class-variance-authority` for component variants
- `next-themes` for system/dark/light mode via `ThemeProvider` in root layout
- `cn()` from `src/lib/utils.ts` for merging Tailwind classes

### Key Utilities (`src/lib/utils.ts`)

- `cn()` — Tailwind class merger
- `formatCurrency()` — BRL currency formatter
- `formatCPF()`, `formatPhone()` — Brazilian format masks
- `moedaMask()` — Real-time currency input mask

## Common Pitfalls

1. All `useQuery`/`useMutation` hooks require `'use client'` directive
2. Provider order in root layout: `AuthProvider` (SessionProvider) → `ConvexClientProvider` (it reads the NextAuth session to fetch the Convex token)
3. Path alias: `@/` maps to `src/`; Convex API import is `@/../convex/_generated/api`
4. Never pass the caller's `userId` to Convex; the identity comes from the auth token
5. Store dates as Unix timestamps (`Date.now()`), not Date objects
6. Add external image domains to `next.config.ts` `remotePatterns`

## Environment Variables

```bash
NEXT_PUBLIC_CONVEX_URL=https://[deployment].convex.cloud
CONVEX_DEPLOYMENT=dev:[deployment-name]
GITHUB_ID, GITHUB_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET, NEXTAUTH_URL
```

## Scope

This is a **personal portfolio + company management tool** for FABIANOOBISPO DESENVOLVIMENTO E CONSULTORIA (CNPJ: 66.797.389/0001-56). It is NOT a SaaS product. Features that could become products (WhatsApp Business Tools, payment processing, subscriptions) have been removed to a separate repository.

## Module Notes

**Financial dashboard** (`/dashboard/financas`): transaction types are `DEPOSIT`, `EXPENSE`, `INVESTMENT`; payment methods include `CREDIT_CARD`, `DEBIT_CARD`, `PIX`, `CASH`, `BANK_TRANSFER`. Dates stored as Unix timestamps.

**DontPad** (`/dontpad/[page]`): public collaborative text editor with 1.8s auto-save debounce, dynamic page creation, admin panel at `/dashboard/admin/administracao-dontpad`. Convex functions in `convex/dontPad.ts`.

**Ficha de treino** (`/dashboard/fichaexercicios`): workout tracking com catalogo de exercicios. Convex functions em `convex/workout.ts` e `convex/exerciseCatalog.ts`. Setup em `FICHA_TREINO_SETUP.md`.

**Lista de tarefas** (`/dashboard/lista`): todo list pessoal. Convex functions em `convex/todo.ts`.

**NFC-e** (`/api/nfce`): parser de nota fiscal de consumidor (extrai produtos/valores) usado para importar despesas no modulo financeiro.

**File uploads**: `@uploadthing/react` + `@xixixao/uploadstuff` for Convex storage integration. Functions in `convex/files.ts`.

**Terminal web** (`/dashboard/terminal`): SSH via a separate Terminal Server container on the VPS (`scripts/terminal-server/`, protocol v3, `npm test` there). Saved credentials are sealed in the browser with `NEXT_PUBLIC_TERMINAL_PUBLIC_KEY` and only the container opens them; sessions are persistent tmux (`tmux -L webdeck`, names `agent-N` only — never interpolate client input into remote commands). Site and container must be deployed together when the protocol changes. Docs: `TERMINAL_QUICK_START.md`, `TERMINAL_SSH_SETUP.md` (security model), `TERMINAL_MULTIPLE_CONNECTIONS.md`, `docs/TERMINAL_VPS_INSTALL.md`.

**Exports**: `jspdf`/`jspdf-autotable` for PDF, `xlsx` for spreadsheets.

**Debug**: Convex backend logs appear in the `npx convex dev` terminal. Dashboard at `https://dashboard.convex.dev`.

## Documentacao

- `ROADMAP.md` — correcoes pendentes e features planejadas
- Docs historicos na raiz: `pagamentos.md` e `RESUMO_WHATSAPP_TOOLS.md` descrevem modulos **ja removidos** do codebase (movidos para repo separado) — nao usar como referencia. `handoff/` contem o pacote da identidade visual `<fb/>`, **ja integrada** (commit `c46fb17`).
