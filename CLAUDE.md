# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- `src/app/(dashboard)/` — Protected routes behind auth, sidebar layout
- `src/app/(public_routes)/` — Public pages (login, dontpad editor, tools, games)
- `src/app/api/` — API routes (NextAuth, Uploadthing webhooks, WhatsApp)

### Convex Backend

Convex is **not a REST API**. All backend logic lives in `convex/*.ts` files, not `src/app/api/`.

```typescript
// convex/example.ts
import { v } from 'convex/values'
import { query, mutation } from './_generated/server'

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('tableName')
      .withIndex('by_user', (q) => q.eq('userId', args.userId as Id<'user'>))
      .collect()
  },
})
```

Using Convex in components (requires `'use client'`):

```tsx
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/../convex/_generated/api'  // note the path alias

const data = useQuery(api.transaction.getDashboard, { month: '01', userId })
const create = useMutation(api.transaction.create)
await create({ name: 'Test', amount: 100 })
```

Use `fetchQuery`/`fetchMutation` from `convex/nextjs` inside `useEffect` or event callbacks instead of `useQuery`/`useMutation`.

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

Users have `role: 'admin' | 'user'` stored in Convex — check `session.user.role` for authorization.

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
2. Provider order in root layout: `ConvexClientProvider` → `AuthProvider`
3. Path alias: `@/` maps to `src/`; Convex API import is `@/../convex/_generated/api`
4. Cast userId strings to `Id<'user'>` when used as Convex table IDs
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

**File uploads**: `@uploadthing/react` + `@xixixao/uploadstuff` for Convex storage integration. Functions in `convex/files.ts`.

**Exports**: `jspdf`/`jspdf-autotable` for PDF, `xlsx` for spreadsheets.

**Debug**: Convex backend logs appear in the `npx convex dev` terminal. Dashboard at `https://dashboard.convex.dev`.
