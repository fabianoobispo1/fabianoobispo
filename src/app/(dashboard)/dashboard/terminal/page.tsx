import { redirect } from 'next/navigation'

import { protectByEmail } from '@/middleware/email-protection'

import { TerminalPageClient } from './_components/terminal-page-client'

/**
 * Página protegida: Terminal SSH
 * Só o e-mail em TERMINAL_AUTHORIZED_EMAIL acessa. Sem essa variável o
 * terminal fica desabilitado (não existe e-mail padrão no código).
 */
export default async function TerminalPage() {
  const authorizedEmail = process.env.TERMINAL_AUTHORIZED_EMAIL?.trim()
  if (!authorizedEmail) redirect('/dashboard')

  await protectByEmail([authorizedEmail], '/dashboard')

  return <TerminalPageClient />
}
