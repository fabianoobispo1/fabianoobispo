import { protectByEmail } from '@/middleware/email-protection'
import { TerminalClient } from './_components/terminal-client'

/**
 * Página protegida: Terminal SSH
 * Apenas accessible por email autorizado (padrão: fbc623@gmail.com)
 */
export const metadata = {
  title: 'Terminal SSH | Dashboard',
  description: 'Terminal web seguro para acesso SSH ao VPS',
}

export default async function TerminalPage() {
  // Proteção por email - redireciona se não for autorizado
  const authorizedEmail = process.env.TERMINAL_AUTHORIZED_EMAIL || 'fbc623@gmail.com'
  const session = await protectByEmail([authorizedEmail])

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">🖥️ Terminal SSH</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Acesso remoto seguro ao servidor VPS
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>ℹ️ Informação:</strong> Este terminal é protegido por autenticação.
          Apenas o email <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{authorizedEmail}</code> pode acessar.
        </p>
      </div>

      {/* Terminal Component */}
      <div className="flex-1 min-h-0">
        <TerminalClient authorizedEmail={session.user.email!} />
      </div>

      {/* Footer Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
        <p>
          🔐 Todas as conexões são criptografadas e registradas para segurança
        </p>
      </div>
    </div>
  )
}
