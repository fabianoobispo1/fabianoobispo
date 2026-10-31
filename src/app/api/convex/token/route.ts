import { NextResponse } from 'next/server'

import { auth } from '@/auth/auth'
import { signUserToken } from '@/lib/server/convex-auth'

/**
 * GET /api/convex/token
 *
 * Troca a sessão do NextAuth por um JWT de 10 min aceito pelo Convex
 * (ConvexProviderWithAuth chama esta rota e renova antes de expirar).
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Não autenticado' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const token = await signUserToken(session.user.id)
  return NextResponse.json(
    { token },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
