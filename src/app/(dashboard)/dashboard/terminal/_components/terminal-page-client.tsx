'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useConvexAuth, useQuery } from 'convex/react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/convex/_generated/api'
import type { SSHConnection } from '@/types/terminal'

import { ConnectionManager } from './connection-manager'
import { TerminalClient } from './terminal-client'

export function TerminalPageClient() {
  const { data: session } = useSession()
  const { isAuthenticated } = useConvexAuth()
  const [selectedConnection, setSelectedConnection] =
    useState<SSHConnection | null>(null)

  const connections = useQuery(
    api.sshConnection.getConnectionsByUser,
    isAuthenticated ? {} : 'skip',
  )

  // Pré-seleciona a conexão padrão (ou a única existente) pra evitar
  // clicar em "Conectar" sem nenhuma conexão escolhida na aba "Terminal"
  useEffect(() => {
    if (selectedConnection || !connections || connections.length === 0) return

    const preferred = connections.find((c) => c.isDefault) ?? connections[0]
    setSelectedConnection(preferred as unknown as SSHConnection)
  }, [connections, selectedConnection])

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">Terminal</h1>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Sessões tmux persistentes · credenciais seladas para o Terminal Server
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
            connection={selectedConnection}
          />
        </TabsContent>

        {/* Aba Gerenciador de Conexões */}
        <TabsContent
          value="connections"
          className="flex-1 min-h-0 overflow-y-auto"
        >
          <ConnectionManager
            onConnectionSelect={setSelectedConnection}
            selectedConnectionId={selectedConnection?._id}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
