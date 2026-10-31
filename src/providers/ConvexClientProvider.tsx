'use client'
import { ReactNode, useCallback, useMemo, useRef } from 'react'
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react'
import { useSession } from 'next-auth/react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * Ponte NextAuth → Convex: com sessão ativa, busca em /api/convex/token um
 * JWT de curta duração que o Convex valida (convex/auth.config.ts).
 * Precisa ficar DENTRO do SessionProvider (AuthProvider).
 */
function useAuthFromNextAuth() {
  const { status, data } = useSession()
  const userId = data?.user?.id
  // Cache simples para não pedir um token novo a cada chamada
  const cache = useRef<{ token: string; exp: number; userId?: string } | null>(
    null,
  )

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      const cached = cache.current
      if (
        !forceRefreshToken &&
        cached &&
        cached.userId === userId &&
        cached.exp - Date.now() > 60_000
      ) {
        return cached.token
      }
      try {
        const res = await fetch('/api/convex/token', { cache: 'no-store' })
        if (!res.ok) return null
        const { token } = (await res.json()) as { token: string }
        const payload = JSON.parse(
          atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')),
        ) as { exp: number }
        cache.current = { token, exp: payload.exp * 1000, userId }
        return token
      } catch {
        return null
      }
    },
    [userId],
  )

  return useMemo(
    () => ({
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated' && Boolean(userId),
      fetchAccessToken,
    }),
    [status, userId, fetchAccessToken],
  )
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode
}) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useAuthFromNextAuth}>
      {children}
    </ConvexProviderWithAuth>
  )
}
