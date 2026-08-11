'use client'

import { useState } from 'react'
import { protectByEmail } from '@/middleware/email-protection'
import { TerminalClient } from './_components/terminal-client'
import { ConnectionManager } from './_components/connection-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SSHConnection } from '@/types/terminal'

/**
 * Página protegida: Terminal SSH
 * Apenas accessible por email autorizado (padrão: fbc623@gmail.com)
 */

export default function TerminalPage() {
  const [selectedConnection, setSelectedConnection] = useState<SSHConnection | null>(null)

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">🖥️ Terminal SSH</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Acesso remoto seguro ao servidor VPS com múltiplas conexões salvas
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>ℹ️ Novo:</strong> Você pode salvar múltiplas conexões SSH e conectar em qualquer host!
          Suas credenciais são armazenadas com segurança no banco de dados.
        </p>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="terminal" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="terminal">Terminal</TabsTrigger>
          <TabsTrigger value="connections">Conexões</TabsTrigger>
        </TabsList>

        {/* Aba Terminal */}
        <TabsContent value="terminal" className="flex-1 min-h-0">
          <TerminalClient
            connection={selectedConnection}
          />
        </TabsContent>

        {/* Aba Gerenciador de Conexões */}
        <TabsContent value="connections" className="flex-1 min-h-0 overflow-y-auto">
          <ConnectionManager
            userId={''} // Será preenchido pelo cliente
            onConnectionSelect={setSelectedConnection}
            selectedConnectionId={selectedConnection?._id}
          />
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
        <p>
          🔐 Todas as conexões são criptografadas e registradas para segurança
        </p>
      </div>
    </div>
  )
}
