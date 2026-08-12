import { redirect } from 'next/navigation'

import { auth } from '@/auth/auth'

/**
 * Middleware para proteger rotas por email específico
 * Uso: await protectByEmail(['email@example.com'], '/fallback-route')
 */
export async function protectByEmail(
  allowedEmails: string[],
  fallbackRoute: string = '/dashboard',
) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/entrar')
  }

  if (!allowedEmails.includes(session.user.email)) {
    redirect(fallbackRoute)
  }

  return session
}
