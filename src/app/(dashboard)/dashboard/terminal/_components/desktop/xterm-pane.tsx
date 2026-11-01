'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'

import type { TerminalConnection } from '@/lib/terminal/connection'

import '@xterm/xterm/css/xterm.css'

export interface XtermPaneHandle {
  focus: () => void
  /** Cola texto como se o usuário tivesse colado (respeita bracketed paste) */
  paste: (text: string) => void
  /** Envia bytes crus (teclas especiais da barra do celular) */
  sendRaw: (data: string) => void
  /**
   * Rolagem por toque: com o mouse do tmux ligado vira evento de roda (SGR)
   * na célula tocada; sem ele, rola o buffer local do xterm.
   * lines < 0 = para cima (histórico).
   */
  wheel: (lines: number, clientX: number, clientY: number) => void
}

interface XtermPaneProps {
  conn: TerminalConnection
  /** sessão tmux; null = shell comum (host sem tmux) */
  session: string | null
  fontSize?: number
  /** O canal fechou (sessão saiu no host, kill, conexão caiu...) */
  onDetached?: (reason: string) => void
  onFocus?: () => void
  /**
   * Transforma a entrada antes de enviar (ex.: Ctrl "grudado" do celular).
   */
  transformInput?: (data: string) => string
}

const RESIZE_DEBOUNCE_MS = 80

/**
 * Um terminal xterm ligado a um canal do TerminalConnection.
 *
 * Teclado/clipboard:
 * - copiar: selecionar já copia (copy-on-select)
 * - colar: Ctrl+V (o navegador dispara o paste nativo) ou clique direito
 * - Ctrl+C: sempre vai para o host como SIGINT (^C), nunca copia
 */
export const XtermPane = forwardRef<XtermPaneHandle, XtermPaneProps>(
  function XtermPane(
    { conn, session, fontSize = 13, onDetached, onFocus, transformInput },
    ref,
  ) {
    const elRef = useRef<HTMLDivElement>(null)
    const termRef = useRef<Terminal | null>(null)
    const sendRef = useRef<(data: string) => void>(() => {})
    // Callbacks em ref: trocar a função não recria o terminal
    const onDetachedRef = useRef(onDetached)
    const onFocusRef = useRef(onFocus)
    const transformRef = useRef(transformInput)
    onDetachedRef.current = onDetached
    onFocusRef.current = onFocus
    transformRef.current = transformInput

    useImperativeHandle(ref, () => ({
      focus: () => termRef.current?.focus(),
      paste: (text) => termRef.current?.paste(text),
      sendRaw: (data) => sendRef.current(data),
      wheel: (lines, clientX, clientY) => {
        const term = termRef.current
        const el = elRef.current
        if (!term || !el || lines === 0) return
        if (term.modes.mouseTrackingMode === 'none') {
          term.scrollLines(lines)
          return
        }
        const r = el.getBoundingClientRect()
        const clamp = (v: number, max: number) => Math.min(max, Math.max(1, v))
        const col = clamp(
          Math.floor(((clientX - r.left) / r.width) * term.cols) + 1,
          term.cols,
        )
        const row = clamp(
          Math.floor(((clientY - r.top) / r.height) * term.rows) + 1,
          term.rows,
        )
        // SGR 1006: 64 = roda para cima, 65 = para baixo
        const btn = lines < 0 ? 64 : 65
        sendRef.current(`\x1b[<${btn};${col};${row}M`.repeat(Math.abs(lines)))
      },
    }))

    useEffect(() => {
      const el = elRef.current
      if (!el) return

      const term = new Terminal({
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize,
        theme: {
          background: '#0d0d0d',
          foreground: '#d4d4d4',
          cursor: '#aeafad',
          cursorAccent: '#000000',
          selectionBackground: '#264f78',
        },
        cursorBlink: true,
        scrollback: 5000,
      })
      const fit = new FitAddon()
      term.loadAddon(fit)
      term.open(el)
      termRef.current = term
      try {
        fit.fit()
      } catch {
        // container ainda sem tamanho (janela minimizada)
      }

      const channel = conn.openChannel(
        { session, cols: term.cols, rows: term.rows },
        {
          onOutput: (data) => term.write(data),
          onAttached: (info) => {
            if (info.fallback) {
              term.writeln(
                '\x1b[33m⚠️  tmux indisponível no host: shell comum, sem persistência\x1b[0m',
              )
            }
          },
          onDetached: (reason) => {
            term.writeln(
              `\r\n\x1b[33m⚠️  Terminal fechado (${
                reason === 'remote_closed'
                  ? 'a sessão terminou no host'
                  : reason
              })\x1b[0m`,
            )
            onDetachedRef.current?.(reason)
          },
          onError: (message) => {
            term.writeln(`\r\n\x1b[31m❌ ${message}\x1b[0m`)
          },
        },
      )
      sendRef.current = channel.send

      const dataSub = term.onData((data) => {
        channel.send(transformRef.current ? transformRef.current(data) : data)
      })

      // copy-on-select
      const selSub = term.onSelectionChange(() => {
        const text = term.getSelection()
        if (text) navigator.clipboard?.writeText(text).catch(() => {})
      })

      term.attachCustomKeyEventHandler((e) => {
        // Ctrl+V: false = o xterm não manda ^V e o navegador dispara o
        // evento paste nativo, que o xterm trata (com bracketed paste)
        if (
          e.type === 'keydown' &&
          e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey &&
          !e.metaKey &&
          e.key.toLowerCase() === 'v'
        ) {
          return false
        }
        return true
      })

      const onContextMenu = (ev: MouseEvent) => {
        ev.preventDefault()
        navigator.clipboard
          ?.readText()
          .then((text) => {
            if (text) term.paste(text)
          })
          .catch(() => {})
      }
      el.addEventListener('contextmenu', onContextMenu)

      const onFocusIn = () => onFocusRef.current?.()
      el.addEventListener('focusin', onFocusIn)

      // fit() com debounce e só manda resize se a grade mudou de fato
      let timer: ReturnType<typeof setTimeout> | undefined
      let last = { cols: term.cols, rows: term.rows }
      const observer = new ResizeObserver(() => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          if (el.clientWidth === 0 || el.clientHeight === 0) return
          try {
            fit.fit()
          } catch {
            return
          }
          if (term.cols !== last.cols || term.rows !== last.rows) {
            last = { cols: term.cols, rows: term.rows }
            channel.resize(term.cols, term.rows)
          }
        }, RESIZE_DEBOUNCE_MS)
      })
      observer.observe(el)

      return () => {
        clearTimeout(timer)
        observer.disconnect()
        el.removeEventListener('contextmenu', onContextMenu)
        el.removeEventListener('focusin', onFocusIn)
        dataSub.dispose()
        selSub.dispose()
        channel.close()
        sendRef.current = () => {}
        term.dispose()
        termRef.current = null
      }
    }, [conn, session, fontSize])

    // Sem padding neste elemento: o FitAddon calcularia linhas a mais
    return <div ref={elRef} className="h-full w-full bg-[#0d0d0d]" />
  },
)
