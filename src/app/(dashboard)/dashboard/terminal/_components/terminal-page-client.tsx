'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from 'convex/react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { SSHConnection } from '@/types/terminal'

import { ConnectionManager } from './connection-manager'
import { TerminalClient } from './terminal-client'

export function TerminalPageClient() {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ''
  const [selectedConnection, setSelectedConnection] =
    useState<SSHConnection | null>(null)

  const connections = useQuery(
    api.sshConnection.getConnectionsByUser,
    userId ? { userId: userId as Id<'user'> } : 'skip',
  )

  // Pré-seleciona a conexão padrão (ou a única existente) pra evitar
  // clicar em "Conectar" sem nenhuma conexão escolhida na aba "Terminal"
  useEffect(() => {
    if (selectedConnection || !connections || connections.length === 0) return

    const preferred = connections.find((c) => c.isDefault) ?? connections[0]
    setSelectedConnection(preferred as unknown as SSHConnection)
  }, [connections, selectedConnection])

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
          <strong>ℹ️ Novo:</strong> Você pode salvar múltiplas conexões SSH e
          conectar em qualquer host! Suas credenciais são armazenadas com
          segurança no banco de dados.
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
            authorizedEmail={session?.user?.email ?? undefined}
            userId={userId || undefined}
            connection={selectedConnection}
          />
        </TabsContent>

        {/* Aba Gerenciador de Conexões */}
        <TabsContent
          value="connections"
          className="flex-1 min-h-0 overflow-y-auto"
        >
          <ConnectionManager
            userId={userId}
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
