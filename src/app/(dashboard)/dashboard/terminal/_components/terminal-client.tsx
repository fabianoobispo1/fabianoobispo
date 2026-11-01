'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useConvex, useConvexAuth, useMutation, useQuery } from 'convex/react'
import { Loader2, AlertCircle, ShieldAlert, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { toast } from '@/hooks/use-toast'
import {
  TerminalConnection,
  type ConnectionStatus,
  type HostKeyMismatch,
  type TmuxSessionInfo,
} from '@/lib/terminal/connection'
import { connectionKeyOf, type SessionMeta } from '@/lib/terminal/sessions'
import type { SSHConnection } from '@/types/terminal'

import { SessionPanel } from './session-panel'

import '@xterm/xterm/css/xterm.css'

interface TerminalClientProps {
  authorizedEmail?: string
  connection?: SSHConnection | null
}

const LIST_REFRESH_MS = 5000

export function TerminalClient({
  authorizedEmail,
  connection,
}: TerminalClientProps) {
  const convex = useConvex()
  const { isAuthenticated } = useConvexAuth()
  const updateLastUsed = useMutation(api.sshConnection.updateLastUsed)
  const pinHostKey = useMutation(api.sshConnection.pinHostKey)
  const resetHostKey = useMutation(api.sshConnection.resetHostKey)
  const upsertMeta = useMutation(api.terminalSession.upsert)
  const removeMeta = useMutation(api.terminalSession.remove)

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

  const terminalRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const connRef = useRef<TerminalConnection | null>(null)
  // Canal pty atual; cada troca de sessão usa um sid novo para ignorar
  // saída atrasada do canal anterior
  const sidRef = useRef<string | null>(null)
  const sidCounter = useRef(0)

  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [tmuxAvailable, setTmuxAvailable] = useState<boolean | null>(null)
  const [sessions, setSessions] = useState<TmuxSessionInfo[]>([])
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [mismatch, setMismatch] = useState<HostKeyMismatch | null>(null)

  const isConnected = status === 'ready'
  const isConnecting = status === 'connecting'

  const writeLine = (text: string) => termRef.current?.writeln(text)

  // ------------------------------------------------------------- xterm
  useEffect(() => {
    if (!terminalRef.current) return
    const term = new Terminal({
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 13,
      theme: {
        background: '#0d0d0d',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        cursorAccent: '#000000',
      },
      cursorBlink: true,
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(terminalRef.current)
    fit.fit()
    termRef.current = term
    fitRef.current = fit

    term.writeln('🔐 Terminal SSH Seguro')
    term.writeln('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    term.writeln('⏳ Aguardando conexão SSH...')

    term.onData((data) => {
      if (sidRef.current) connRef.current?.send(sidRef.current, data)
    })

    // Debounce: arrastar a borda da janela dispara dezenas de eventos
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new ResizeObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        fit.fit()
        if (sidRef.current) {
          connRef.current?.resize(sidRef.current, term.cols, term.rows)
        }
      }, 100)
    })
    observer.observe(terminalRef.current)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      connRef.current?.close()
      connRef.current = null
      term.dispose()
    }
  }, [])

  // ------------------------------------------------------------- sessões
  const refreshSessions = useCallback(async () => {
    const conn = connRef.current
    if (!conn?.ready?.tmux.available) return []
    try {
      const list = await conn.listSessions()
      setSessions(list)
      return list
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    if (!isConnected || !tmuxAvailable) return
    const t = setInterval(refreshSessions, LIST_REFRESH_MS)
    return () => clearInterval(t)
  }, [isConnected, tmuxAvailable, refreshSessions])

  const attachTo = useCallback((session: string | null) => {
    const conn = connRef.current
    const term = termRef.current
    if (!conn || !term) return
    if (sidRef.current) conn.detach(sidRef.current)
    const sid = `t${++sidCounter.current}`
    sidRef.current = sid
    term.reset()
    fitRef.current?.fit()
    conn.attach(sid, {
      session: session ?? undefined,
      cols: term.cols,
      rows: term.rows,
    })
    setActiveSession(session)
    term.focus()
  }, [])

  // ------------------------------------------------------------- conexão
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

    const conn = new TerminalConnection({
      onStatus: setStatus,
      onOutput: (sid, data) => {
        if (sid === sidRef.current) termRef.current?.write(data)
      },
      onAttached: (info) => {
        if (info.sid !== sidRef.current) return
        if (info.fallback) {
          writeLine('\x1b[33m⚠️  tmux indisponível: shell comum\x1b[0m')
        }
      },
      onDetached: (sid, reason) => {
        if (sid !== sidRef.current) return
        sidRef.current = null
        setActiveSession(null)
        writeLine(
          `\r\n\x1b[33m⚠️  Terminal fechado (${
            reason === 'remote_closed' ? 'sessão encerrada no host' : reason
          })\x1b[0m`,
        )
        refreshSessions().catch(() => {})
      },
      onError: (message, sid) => {
        if (sid && sid !== sidRef.current) return
        setError(message)
      },
      onNotice: (kind, message) => {
        if (kind === 'tmux_unavailable') setNotice(message)
        else writeLine(`\x1b[33m⚠️  ${message}\x1b[0m`)
      },
      onHostKeyMismatch: setMismatch,
      onClose: (_code, reason) => {
        connRef.current = null
        sidRef.current = null
        setActiveSession(null)
        setSessions([])
        setTmuxAvailable(null)
        if (reason) setError((e) => e ?? reason)
        writeLine('\r\n\x1b[33m⚠️  Desconectado do servidor\x1b[0m')
      },
    })
    connRef.current = conn

    try {
      const ready = await conn.connect({
        sealedCredential,
        hostKey: connection?.hostKeyFingerprint,
      })
      setTmuxAvailable(ready.tmux.available)

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

      if (!ready.tmux.available) {
        attachTo(null)
        return
      }
      const list = await refreshSessions()
      if (list.length === 0) {
        const name = await conn.createSession({
          cols: termRef.current?.cols,
          rows: termRef.current?.rows,
        })
        await refreshSessions()
        attachTo(name)
      } else {
        attachTo(list[0].name)
      }
    } catch (err) {
      connRef.current?.close()
      connRef.current = null
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  const disconnect = () => {
    connRef.current?.close()
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

  const createSession = async (opts: { cwd?: string; claude: boolean }) => {
    const conn = connRef.current
    if (!conn) return
    setBusy(true)
    try {
      const name = await conn.createSession({
        ...opts,
        cols: termRef.current?.cols,
        rows: termRef.current?.rows,
      })
      if (opts.cwd) {
        await upsertMeta({ connectionKey, name, pasta: opts.cwd }).catch(
          () => {},
        )
      }
      await refreshSessions()
      attachTo(name)
    } catch (err) {
      toast({
        title: 'Não foi possível criar a sessão',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const killSession = async (name: string) => {
    const conn = connRef.current
    if (!conn) return
    setBusy(true)
    try {
      await conn.killSession(name)
      await removeMeta({ connectionKey, name }).catch(() => {})
      const list = await refreshSessions()
      if (name === activeSession) {
        if (list.length) attachTo(list[0].name)
        else termRef.current?.reset()
      }
    } catch (err) {
      toast({
        title: 'Não foi possível encerrar',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    } finally {
      setBusy(false)
    }
  }

  const statusText = isConnected
    ? `Conectado${connection ? ` — ${connection.name}` : ''}`
    : isConnecting
      ? 'Conectando...'
      : 'Desconectado'
  const idleHint = connection
    ? `Pronto para conectar em ${connection.username}@${connection.host}`
    : 'Selecione uma conexão salva na aba "Conexões" (ou configure SSH_* no Terminal Server).'

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Barra de Controle */}
      <div className="flex flex-col gap-3 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected
                  ? 'bg-green-500'
                  : isConnecting
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
            />
            <span className="font-medium text-sm">{statusText}</span>
            {authorizedEmail && (
              <span className="hidden sm:inline text-xs text-muted-foreground">
                · {authorizedEmail}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {!isConnected ? (
              <Button onClick={connect} disabled={isConnecting} size="sm">
                {isConnecting && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Conectar
              </Button>
            ) : (
              <Button onClick={disconnect} size="sm" variant="destructive">
                Desconectar
              </Button>
            )}
          </div>
        </div>

        {isConnected && tmuxAvailable && (
          <SessionPanel
            connectionKey={connectionKey}
            sessions={sessions}
            meta={meta}
            activeSession={activeSession}
            busy={busy}
            onAttach={attachTo}
            onCreate={createSession}
            onKill={killSession}
          />
        )}
      </div>

      {mismatch && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Host key diferente da registrada</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{mismatch.message}</p>
            <p className="font-mono text-xs break-all">
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

      {error && !mismatch && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {notice && (
        <Alert>
          <TriangleAlert className="h-4 w-4" />
          <AlertDescription>
            {notice} Instale com <code>apt install tmux</code> (ou o gerenciador
            de pacotes do host).
          </AlertDescription>
        </Alert>
      )}

      {!isConnected && !error && !mismatch && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{idleHint}</AlertDescription>
        </Alert>
      )}

      {/*
        Altura fixa em viewport units: o layout do dashboard não limita a
        altura de <main>, e o FitAddon cresce sem controle se o tamanho do
        container depender do próprio conteúdo. Sem padding aqui (o
        FitAddon calcularia linhas a mais).
      */}
      <div
        ref={terminalRef}
        className="bg-black rounded-lg overflow-hidden border border-slate-700 shadow-lg"
        style={{
          height: 'min(65vh, 700px)',
          minHeight: '400px',
        }}
      />
    </div>
  )
}
