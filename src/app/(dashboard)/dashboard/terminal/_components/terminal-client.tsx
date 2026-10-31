'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { useConvex, useMutation } from 'convex/react'
import { Loader2, AlertCircle } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { SSHConnection } from '@/types/terminal'

import '@xterm/xterm/css/xterm.css'

interface TerminalClientProps {
  authorizedEmail?: string
  connection?: SSHConnection | null
}

export function TerminalClient({
  authorizedEmail,
  connection,
}: TerminalClientProps) {
  const convex = useConvex()
  const updateLastUsed = useMutation(api.sshConnection.updateLastUsed)
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Mensagem vinda do servidor (config_required); null = usa o texto
  // derivado da conexão selecionada logo abaixo
  const [serverStatus, setServerStatus] = useState<string | null>(null)
  const configStatus =
    serverStatus ??
    (connection
      ? `Pronto para conectar em ${connection.username}@${connection.host}`
      : 'Selecione uma conexão salva na aba "Conexões" (ou configure SSH_* no Terminal Server).')

  /**
   * Inicializa o terminal xterm
   */
  const initializeTerminal = () => {
    if (!terminalRef.current) return

    // Descarta uma instância anterior (ex: ao reconectar) antes de criar
    // outra no mesmo container, senão os dois terminais ficam sobrepostos
    terminalInstanceRef.current?.dispose()

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

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    fitAddonRef.current = fitAddon

    term.open(terminalRef.current)
    fitAddon.fit()
    terminalInstanceRef.current = term

    term.writeln('🔐 Terminal SSH Seguro')
    term.writeln('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    // authorizedEmail vem da sessão (next-auth), que carrega de forma
    // assíncrona — no primeiro mount ela costuma ainda não ter chegado.
    // O efeito abaixo escreve essa linha depois, quando disponível.
    if (authorizedEmail) {
      term.writeln(`Usuário autenticado: ${authorizedEmail}`)
    }
    term.writeln('')
    term.writeln('⏳ Aguardando conexão SSH...')

    return term
  }

  /**
   * Conecta ao Terminal Server do VPS (WebSocket) e inicia a sessão SSH
   */
  const connectToWebSocket = async () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setError(null)
    setServerStatus(null)

    try {
      // 1. Conexão salva: busca só o ciphertext (selado com a chave pública
      //    do Terminal Server). O navegador não consegue lê-lo; ele é
      //    repassado como está e só o servidor na VPS o abre.
      //    Sem conexão selecionada, o servidor usa SSH_* do próprio .env.
      let sealedCredential: string | undefined
      if (connection) {
        const sealed = await convex.query(
          api.sshConnection.getSealedCredential,
          { connectionId: connection._id as Id<'sshConnection'> },
        )
        if (!sealed) {
          throw new Error(
            'Esta conexão não tem credencial salva: edite-a e digite a senha/chave novamente.',
          )
        }
        sealedCredential = sealed
      }

      // 2. Pede ao backend um token de curta duração para abrir o WebSocket
      //    diretamente com o Terminal Server no VPS
      const tokenRes = await fetch('/api/terminal/token')
      const tokenData = await tokenRes.json()

      if (!tokenRes.ok) {
        throw new Error(
          tokenData.error || 'Não foi possível obter token de acesso',
        )
      }

      // O token vai na 1ª mensagem (nunca na URL, que acaba em logs de
      // proxy); o servidor fecha a conexão se ele não chegar em 5 s
      const ws = new WebSocket(tokenData.wsUrl)

      ws.onopen = () => {
        ws.send(JSON.stringify({ command: 'auth', token: tokenData.token }))
      }

      const startSession = () => {
        setIsConnected(true)
        setIsConnecting(false)

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.clear()
          terminalInstanceRef.current.writeln('✅ Conectado ao servidor!')
          terminalInstanceRef.current.writeln('')
        }

        fitAddonRef.current?.fit()

        ws.send(
          JSON.stringify({
            command: 'start',
            cols: terminalInstanceRef.current?.cols ?? 120,
            rows: terminalInstanceRef.current?.rows ?? 30,
            sealedCredential,
          }),
        )

        if (connection) {
          updateLastUsed({
            connectionId: connection._id as Id<'sshConnection'>,
          }).catch(() => {
            // Não é crítico se essa atualização falhar
          })
        }
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'authenticated') {
          startSession()
        } else if (data.type === 'output') {
          terminalInstanceRef.current?.write(data.data)
        } else if (data.type === 'error') {
          setError(data.message)
          terminalInstanceRef.current?.write(
            `\x1b[31m❌ Erro: ${data.message}\x1b[0m\n`,
          )
        } else if (data.type === 'config_required') {
          setServerStatus(data.message)
          terminalInstanceRef.current?.write(
            `\x1b[33m⚠️  ${data.message}\x1b[0m\n`,
          )
        } else if (data.type === 'closed') {
          terminalInstanceRef.current?.write(
            `\x1b[33m⚠️  ${data.message}\x1b[0m\n`,
          )
          setIsConnected(false)
        }
      }

      ws.onerror = () => {
        setError('Erro ao conectar ao servidor SSH')
        setIsConnecting(false)
        setIsConnected(false)

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.write(
            '\x1b[31m❌ Erro na conexão WebSocket\x1b[0m\n',
          )
        }
      }

      ws.onclose = (event) => {
        setIsConnected(false)
        setIsConnecting(false)
        if (event.code === 4401 || event.code === 4403) {
          setError('Terminal Server recusou a autenticação')
        } else if (event.code === 4429) {
          setError('Muitas conexões abertas no Terminal Server')
        }

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.write(
            '\x1b[33m⚠️  Desconectado do servidor\x1b[0m\n',
          )
        }
      }

      wsRef.current = ws
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      setIsConnecting(false)
      terminalInstanceRef.current?.write(`\x1b[31m❌ ${message}\x1b[0m\n`)
    }
  }

  /**
   * Envia comando ao terminal
   */
  const sendCommand = (data: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    wsRef.current.send(
      JSON.stringify({
        command: 'send',
        data,
      }),
    )
  }

  /**
   * Inicializa terminal no mount
   */
  useEffect(() => {
    const term = initializeTerminal()

    // Listener para entrada do usuário
    term?.onData((data: string) => {
      sendCommand(data)
    })

    // Reajusta o grid do terminal quando o container muda de tamanho
    // (redimensionar janela, colapsar sidebar, etc.) e avisa o servidor
    // para o pty do SSH acompanhar
    const resizeObserver = new ResizeObserver(() => {
      fitAddonRef.current?.fit()

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            command: 'resize',
            cols: terminalInstanceRef.current?.cols,
            rows: terminalInstanceRef.current?.rows,
          }),
        )
      }
    })

    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current)
    }

    return () => {
      resizeObserver.disconnect()
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * A sessão (e o e-mail do usuário) carrega de forma assíncrona; escreve
   * a linha de boas-vindas assim que ela chegar, se ainda não conectou
   */
  useEffect(() => {
    if (authorizedEmail && !isConnected) {
      terminalInstanceRef.current?.writeln(
        `Usuário autenticado: ${authorizedEmail}`,
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorizedEmail])

  /**
   * Limpa a tela
   */
  const clearTerminal = () => {
    terminalInstanceRef.current?.clear()
  }

  /**
   * Desconecta do servidor
   */
  const disconnect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command: 'close' }))
      wsRef.current.close()
    }
    setIsConnected(false)
    clearTerminal()
    initializeTerminal()
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Barra de Controle */}
      <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-4 rounded-lg border">
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
          <span className="font-medium text-sm">
            {isConnected
              ? `✅ Conectado${connection ? ` — ${connection.name}` : ''}`
              : isConnecting
                ? '⏳ Conectando...'
                : '❌ Desconectado'}
          </span>
        </div>

        <div className="flex gap-2">
          {!isConnected && (
            <Button
              onClick={connectToWebSocket}
              disabled={isConnecting}
              size="sm"
              variant="default"
            >
              {isConnecting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Conectar
            </Button>
          )}

          {isConnected && (
            <>
              <Button onClick={clearTerminal} size="sm" variant="outline">
                Limpar
              </Button>
              <Button onClick={disconnect} size="sm" variant="destructive">
                Desconectar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isConnected && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{configStatus}</AlertDescription>
        </Alert>
      )}

      {/* Terminal */}
      {/*
        Altura fixa (não `flex-1`/`h-full`): o layout do dashboard
        (`(dashboard)/layout.tsx`) não limita a altura de `<main>`, então
        qualquer wrapper "flex-1" acaba se ajustando ao conteúdo em vez
        de à viewport. O FitAddon do xterm lê o tamanho real do container
        pra decidir quantas linhas/colunas desenhar — se esse tamanho for
        instável (dependente do próprio conteúdo), ele cresce sem
        controle. Uma altura em viewport units resolve isso de forma
        previsível sem mexer no layout compartilhado por outras páginas.
      */}
      {/*
        Sem padding aqui: o FitAddon lê o padding do elemento que o
        xterm cria (filho direto deste, sempre 0) para calcular quantas
        linhas cabem — um padding neste container faz ele calcular
        linhas a mais do que o espaço visível de fato, cortando a
        última linha. Se quiser respiro visual, ponha padding num
        wrapper por fora deste div, nunca nele.
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
