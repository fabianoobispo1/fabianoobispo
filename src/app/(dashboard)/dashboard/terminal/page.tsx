import { protectByEmail } from '@/middleware/email-protection'

import { TerminalPageClient } from './_components/terminal-page-client'

/**
 * Página protegida: Terminal SSH
 * Apenas acessível pelo email autorizado (padrão: fbc623@gmail.com)
 */
export default async function TerminalPage() {
  await protectByEmail(
    [process.env.TERMINAL_AUTHORIZED_EMAIL || 'fbc623@gmail.com'],
    '/dashboard',
  )

  return <TerminalPageClient />
}
