'use client'

import { useEffect, useRef, useState } from 'react'
import { Copy, Unplug } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { TerminalConnection } from '@/lib/terminal/connection'
import { sessionColorClass } from '@/lib/terminal/sessions'

import { MobileKeyBar, toControl } from './mobile-key-bar'
import { XtermPane, type XtermPaneHandle } from './xterm-pane'

const LONG_PRESS_MS = 550
const MOVE_TOLERANCE_PX = 10
/** Pixels de arraste por linha rolada */
const PX_PER_LINE = 18

/** Altura/offset da área visível (encolhe quando o teclado virtual abre). */
function useVisualViewport() {
  const [vv, setVv] = useState<{ height: number; top: number } | null>(null)
  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const update = () => setVv({ height: v.height, top: v.offsetTop })
    update()
    v.addEventListener('resize', update)
    v.addEventListener('scroll', update)
    return () => {
      v.removeEventListener('resize', update)
      v.removeEventListener('scroll', update)
    }
  }, [])
  return vv
}

interface MobileTerminalProps {
  conn: TerminalConnection
  /** id da sessão ativa (agent-N ou shell-N) */
  activeId: string | null
  session: string | null
  title: string
  color?: string | null
  /** dock compacto (troca de sessão) */
  dock: React.ReactNode
  onDetached: (id: string, reason: string) => void
  onCapture: (session: string) => void
  onDisconnect: () => void
}

/**
 * Celular (< 768px): uma sessão por vez em tela cheia, barra de teclas
 * acima do teclado virtual (via visualViewport), swipe = rolagem do tmux,
 * toque longo = colar.
 */
export function MobileTerminal({
  conn,
  activeId,
  session,
  title,
  color,
  dock,
  onDetached,
  onCapture,
  onDisconnect,
}: MobileTerminalProps) {
  const vv = useVisualViewport()
  const paneRef = useRef<XtermPaneHandle>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const [ctrl, setCtrl] = useState(false)
  const ctrlRef = useRef(false)
  ctrlRef.current = ctrl
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  // Teclado aberto = viewport bem menor que a janela: esconde o dock
  const keyboardOpen =
    vv !== null &&
    typeof window !== 'undefined' &&
    vv.height < window.innerHeight * 0.75

  // Ctrl grudado: aplica na próxima tecla digitada e solta
  const transformInput = (data: string) => {
    if (!ctrlRef.current) return data
    const ctl = toControl(data)
    setCtrl(false)
    return ctl ?? data
  }

  // Swipe → rolagem; toque longo → colar. Captura antes do xterm.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    let startX = 0
    let startY = 0
    let lastY = 0
    let acc = 0
    let scrolling = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      startX = t.clientX
      startY = lastY = t.clientY
      acc = 0
      scrolling = false
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (!scrolling) {
          setPasteText('')
          setPasteOpen(true)
        }
      }, LONG_PRESS_MS)
    }
    const onMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      if (
        !scrolling &&
        Math.hypot(t.clientX - startX, t.clientY - startY) > MOVE_TOLERANCE_PX
      ) {
        scrolling = true
        clearTimeout(timer)
      }
      if (!scrolling) return
      e.preventDefault()
      e.stopPropagation()
      acc += t.clientY - lastY
      lastY = t.clientY
      const lines = Math.trunc(acc / PX_PER_LINE)
      if (lines !== 0) {
        acc -= lines * PX_PER_LINE
        // dedo desce = ver o que está acima (histórico)
        paneRef.current?.wheel(-lines, t.clientX, t.clientY)
      }
    }
    const onEnd = (e: TouchEvent) => {
      clearTimeout(timer)
      // Um arraste não deve virar "toque" (que abriria o teclado)
      if (scrolling) e.preventDefault()
    }

    el.addEventListener('touchstart', onStart, { capture: true, passive: true })
    el.addEventListener('touchmove', onMove, { capture: true, passive: false })
    el.addEventListener('touchend', onEnd, { capture: true, passive: false })
    el.addEventListener('touchcancel', onEnd, { capture: true, passive: false })
    return () => {
      clearTimeout(timer)
      el.removeEventListener('touchstart', onStart, true)
      el.removeEventListener('touchmove', onMove, true)
      el.removeEventListener('touchend', onEnd, true)
      el.removeEventListener('touchcancel', onEnd, true)
    }
  }, [])

  const sendKey = (seq: string) => {
    setCtrl(false)
    paneRef.current?.sendRaw(seq)
  }

  const submitPaste = () => {
    if (pasteText) paneRef.current?.paste(pasteText)
    setPasteOpen(false)
    setPasteText('')
    requestAnimationFrame(() => paneRef.current?.focus())
  }

  return (
    // fixed + altura do visualViewport: o conteúdo (e a barra de teclas)
    // fica sempre acima do teclado virtual
    <div
      className="fixed inset-x-0 z-50 flex flex-col bg-slate-950"
      style={{
        top: vv?.top ?? 0,
        height: vv ? vv.height : '100dvh',
      }}
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-slate-700 bg-slate-900 px-2 text-sm text-slate-200">
        <span
          className={cn('h-2.5 w-2.5 rounded-full', sessionColorClass(color))}
        />
        <span className="truncate font-medium">{title}</span>
        <div className="ml-auto flex items-center gap-1">
          {session && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-slate-200"
              onClick={() => onCapture(session)}
            >
              <Copy className="mr-1 h-4 w-4" /> copiar
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-200"
            aria-label="Desconectar"
            onClick={onDisconnect}
          >
            <Unplug className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={wrapRef} className="min-h-0 flex-1">
        {activeId ? (
          <XtermPane
            key={activeId}
            ref={paneRef}
            conn={conn}
            session={session}
            fontSize={12}
            transformInput={transformInput}
            onDetached={(reason) => onDetached(activeId, reason)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Escolha uma sessão no dock.
          </div>
        )}
      </div>

      <MobileKeyBar
        ctrl={ctrl}
        onCtrlToggle={() => {
          setCtrl((c) => !c)
          paneRef.current?.focus()
        }}
        onKey={sendKey}
        onPaste={() => {
          setPasteText('')
          setPasteOpen(true)
        }}
      />
      {!keyboardOpen && dock}

      {/* Colar: o navegador do celular não deixa ler o clipboard sem um
          gesto de colar nativo, então o texto vem por um textarea */}
      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Colar no terminal</DialogTitle>
            <DialogDescription>
              Toque e segure no campo abaixo e escolha “Colar”.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="h-40 font-mono text-xs"
            autoFocus
          />
          <DialogFooter>
            <Button onClick={submitPaste} disabled={!pasteText}>
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
