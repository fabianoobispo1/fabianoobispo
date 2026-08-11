'use client'

import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

interface TerminalClientProps {
  authorizedEmail: string
}

export function TerminalClient({ authorizedEmail }: TerminalClientProps) {
  const terminalRef = useRef<HTMLDivElement>(null)
  const terminalInstanceRef = useRef<Terminal | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configStatus, setConfigStatus] = useState<string>('Aguardando configuração SSH...')

  /**
   * Inicializa o terminal xterm
   */
  const initializeTerminal = () => {
    if (!terminalRef.current) return

    const term = new Terminal({
      cols: 120,
      rows: 30,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 12,
      theme: {
        background: '#0d0d0d',
        foreground: '#d4d4d4',
        cursor: '#aeafad',
        cursorAccent: '#000000',
      },
      cursorBlinkInterval: 800,
    })

    term.open(terminalRef.current)
    terminalInstanceRef.current = term

    term.writeln('🔐 Terminal SSH Seguro')
    term.writeln('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    term.writeln(`Usuário autenticado: ${authorizedEmail}`)
    term.writeln('')
    term.writeln('⏳ Aguardando conexão SSH...')
    term.writeln('')
    term.writeln('ℹ️  Configure as credenciais SSH no arquivo .env.local')
    term.writeln('   e reinicie a aplicação para conectar.')

    return term
  }

  /**
   * Conecta ao WebSocket
   */
  const connectToWebSocket = () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setError(null)

    try {
      // Determina protocolo (ws/wss)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/terminal/socket`

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('✅ WebSocket conectado')
        setIsConnected(true)
        setIsConnecting(false)

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.clear()
          terminalInstanceRef.current.writeln('✅ Conectado ao servidor!')
          terminalInstanceRef.current.writeln('')
        }

        // Envia comando de inicialização
        ws.send(
          JSON.stringify({
            command: 'start',
            cols: 120,
            rows: 30,
          })
        )
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === 'output') {
          terminalInstanceRef.current?.write(data.data)
        } else if (data.type === 'error') {
          setError(data.message)
          terminalInstanceRef.current?.write(
            `\x1b[31m❌ Erro: ${data.message}\x1b[0m\n`
          )
        } else if (data.type === 'config_required') {
          setConfigStatus(data.message)
          terminalInstanceRef.current?.write(
            `\x1b[33m⚠️  ${data.message}\x1b[0m\n`
          )
        }
      }

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setError('Erro ao conectar ao servidor SSH')
        setIsConnecting(false)
        setIsConnected(false)

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.write(
            '\x1b[31m❌ Erro na conexão WebSocket\x1b[0m\n'
          )
        }
      }

      ws.onclose = () => {
        console.log('⚠️  WebSocket desconectado')
        setIsConnected(false)
        setIsConnecting(false)

        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.write(
            '\x1b[33m⚠️  Desconectado do servidor\x1b[0m\n'
          )
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Erro ao conectar:', err)
      setError('Erro ao estabelecer conexão')
      setIsConnecting(false)
    }
  }

  /**
   * Envia comando ao terminal
   */
  const sendCommand = (data: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Não conectado ao servidor')
      return
    }

    wsRef.current.send(
      JSON.stringify({
        command: 'send',
        data,
      })
    )
  }

  /**
   * Inicializa terminal no mount
   */
  useEffect(() => {
    const term = initializeTerminal()

    // Listener para entrada do usuário
    term?.onData((data) => {
      sendCommand(data)
    })

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [])

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
              ? '✅ Conectado'
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
              {isConnecting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
      <div
        ref={terminalRef}
        className="flex-1 bg-black rounded-lg overflow-hidden border border-slate-700 shadow-lg"
        style={{
          minHeight: '500px',
        }}
      />
    </div>
  )
}
