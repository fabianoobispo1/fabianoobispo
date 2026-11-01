'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useConvex, useConvexAuth, useMutation, useQuery } from 'convex/react'
import {
  AlertCircle,
  Loader2,
  ShieldAlert,
  TerminalSquare,
  TriangleAlert,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { toast } from '@/hooks/use-toast'
import {
  TerminalConnection,
  type ConnectionStatus,
  type HostKeyMismatch,
} from '@/lib/terminal/connection'
import { connectionKeyOf, type SessionMeta } from '@/lib/terminal/sessions'
import type { SSHConnection } from '@/types/terminal'

import { TerminalDesktop } from './desktop/terminal-desktop'

interface TerminalClientProps {
  authorizedEmail?: string
  connection?: SSHConnection | null
}

/**
 * Conexão com o Terminal Server (token, credencial selada, host key) e,
 * conectado, a área de trabalho com as janelas.
 */
export function TerminalClient({
  authorizedEmail,
  connection,
}: TerminalClientProps) {
  const convex = useConvex()
  const { isAuthenticated } = useConvexAuth()
  const updateLastUsed = useMutation(api.sshConnection.updateLastUsed)
  const pinHostKey = useMutation(api.sshConnection.pinHostKey)
  const resetHostKey = useMutation(api.sshConnection.resetHostKey)

  const connectionKey = connectionKeyOf(connection)
  const metaRows = useQuery(
    api.terminalSession.listByConnection,
    isAuthenticated ? { connectionKey } : 'skip',
  )
  const meta = useMemo(
    () =>
      new Map<string, SessionMeta>((metaRows ?? []).map((m) => [m.name, m])),
    [metaRows],
  )

  const connRef = useRef<TerminalConnection | null>(null)
  const [conn, setConn] = useState<TerminalConnection | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [tmuxAvailable, setTmuxAvailable] = useState(false)
  const [mismatch, setMismatch] = useState<HostKeyMismatch | null>(null)

  const isConnected = status === 'ready' && conn !== null
  const isConnecting = status === 'connecting'

  // Fecha ao sair da página
  useEffect(() => () => connRef.current?.close(), [])

  // Trocar de conexão salva com uma aberta: desconecta a anterior
  useEffect(() => {
    connRef.current?.close()
  }, [connectionKey])

  const connect = async () => {
    if (connRef.current) return
    setError(null)
    setNotice(null)
    setMismatch(null)

    let sealedCredential: string | undefined
    if (connection) {
      const sealed = await convex.query(api.sshConnection.getSealedCredential, {
        connectionId: connection._id as Id<'sshConnection'>,
      })
      if (!sealed) {
        setError(
          'Esta conexão não tem credencial salva: edite-a e digite a senha/chave novamente.',
        )
        return
      }
      sealedCredential = sealed
    }

    const c = new TerminalConnection({
      onStatus: setStatus,
      onError: (message, sid) => {
        if (!sid) setError(message)
      },
      onNotice: (kind, message) => {
        if (kind === 'tmux_unavailable') setNotice(message)
        if (kind === 'closed') setError((e) => e ?? message)
      },
      onHostKeyMismatch: setMismatch,
      onClose: (_code, reason) => {
        connRef.current = null
        setConn(null)
        if (reason) setError((e) => e ?? reason)
      },
    })
    connRef.current = c

    try {
      const ready = await c.connect({
        sealedCredential,
        hostKey: connection?.hostKeyFingerprint,
      })
      setTmuxAvailable(ready.tmux.available)
      setConn(c)

      // TOFU: 1ª conexão grava a fingerprint; as próximas exigem a mesma
      const fp = ready.hostKey.fingerprint
      if (connection && fp && !ready.hostKey.pinned) {
        pinHostKey({
          connectionId: connection._id as Id<'sshConnection'>,
          fingerprint: fp,
        })
          .then(() =>
            toast({
              title: 'Host key registrada',
              description: `${fp} — as próximas conexões exigem esta chave.`,
            }),
          )
          .catch(() => {})
      }
      if (connection) {
        updateLastUsed({
          connectionId: connection._id as Id<'sshConnection'>,
        }).catch(() => {})
      }
    } catch (err) {
      c.close()
      connRef.current = null
      setConn(null)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const disconnect = () => {
    connRef.current?.close()
    connRef.current = null
    setConn(null)
  }

  const trustNewHostKey = async () => {
    if (!connection) return
    await resetHostKey({ connectionId: connection._id as Id<'sshConnection'> })
    setMismatch(null)
    setError(null)
    toast({
      title: 'Host key esquecida',
      description: 'Conecte de novo para registrar a nova chave.',
    })
  }

  const target = connection
    ? `${connection.username}@${connection.host}`
    : 'credencial do Terminal Server'

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Barra de status */}
      <div className="flex items-center justify-between gap-2 rounded-lg border bg-slate-100 px-3 py-2 dark:bg-slate-900">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              isConnected
                ? 'bg-green-500'
                : isConnecting
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
            }`}
          />
          <span className="truncate text-sm font-medium">
            {isConnected
              ? `Conectado — ${connection?.name ?? target}`
              : isConnecting
                ? 'Conectando...'
                : 'Desconectado'}
          </span>
          {authorizedEmail && (
            <span className="hidden truncate text-xs text-muted-foreground md:inline">
              · {authorizedEmail}
            </span>
          )}
          {isConnected && (
            <span className="hidden text-xs text-muted-foreground lg:inline">
              · Ctrl+Shift+K / ⌘K para comandos
            </span>
          )}
        </div>
        {isConnected ? (
          <Button onClick={disconnect} size="sm" variant="destructive">
            Desconectar
          </Button>
        ) : (
          <Button onClick={connect} disabled={isConnecting} size="sm">
            {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Conectar
          </Button>
        )}
      </div>

      {mismatch && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Host key diferente da registrada</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{mismatch.message}</p>
            <p className="break-all font-mono text-xs">
              registrada: {mismatch.expected}
              <br />
              recebida: {mismatch.seen ?? '—'}
            </p>
            <p className="text-xs">
              Só confie na nova chave se você reinstalou o servidor ou trocou as
              host keys. Confira com{' '}
              <code>ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub</code> no
              host.
            </p>
            {connection && (
              <Button size="sm" variant="outline" onClick={trustNewHostKey}>
                Confiar na nova chave
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {error && !mismatch && !isConnected && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {notice && isConnected && (
        <Alert>
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>
            {notice} Instale com <code>apt install tmux</code> (ou o gerenciador
            de pacotes do host).
          </AlertDescription>
        </Alert>
      )}

      {/*
        Altura fixa pela viewport: o layout do dashboard não limita <main>,
        e o FitAddon do xterm cresce sem controle se o container depender
        do próprio conteúdo.
      */}
      <div className="h-[calc(100dvh-13rem)] min-h-[420px]">
        {isConnected && conn ? (
          <TerminalDesktop
            key={connectionKey}
            conn={conn}
            tmuxAvailable={tmuxAvailable}
            connectionKey={connectionKey}
            meta={meta}
            onDisconnect={disconnect}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-700 bg-slate-950 text-slate-400">
            <TerminalSquare className="h-10 w-10" />
            <p className="px-4 text-center text-sm">
              {connection
                ? `Pronto para conectar em ${target}`
                : 'Selecione uma conexão salva na aba "Conexões" (ou configure SSH_* no Terminal Server).'}
            </p>
            <Button onClick={connect} disabled={isConnecting} size="sm">
              {isConnecting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Conectar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
