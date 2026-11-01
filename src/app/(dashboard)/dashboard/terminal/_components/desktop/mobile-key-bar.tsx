'use client'

import type { ReactNode } from 'react'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ClipboardPaste,
} from 'lucide-react'

import { cn } from '@/lib/utils'

/** Sequências enviadas ao host (o tmux entende as do modo normal). */
export const KEYS = {
  esc: '\x1b',
  tab: '\t',
  shiftTab: '\x1b[Z',
  up: '\x1b[A',
  down: '\x1b[B',
  right: '\x1b[C',
  left: '\x1b[D',
  ctrlC: '\x03',
  ctrlD: '\x04',
} as const

/**
 * Ctrl "grudado": a próxima tecla vira o caractere de controle
 * (a → ^A, [ → ESC, espaço → NUL...). Retorna null se não houver um.
 */
export function toControl(data: string): string | null {
  if (data.length !== 1) return null
  const c = data.toUpperCase().charCodeAt(0)
  if (c >= 64 && c <= 95) return String.fromCharCode(c - 64) // @A-Z[\]^_
  if (data === ' ') return '\x00'
  if (data === '?') return '\x7f'
  return null
}

interface MobileKeyBarProps {
  ctrl: boolean
  onCtrlToggle: () => void
  onKey: (seq: string) => void
  onPaste: () => void
}

/**
 * Barra de teclas acima do teclado virtual. Os botões não roubam o foco
 * (preventDefault no pointerdown): o teclado continua aberto.
 */
export function MobileKeyBar({
  ctrl,
  onCtrlToggle,
  onKey,
  onPaste,
}: MobileKeyBarProps) {
  return (
    <div
      className="flex h-11 shrink-0 items-stretch gap-1 overflow-x-auto [scrollbar-width:none] border-t border-slate-700 bg-slate-900 px-1 py-1 text-slate-200"
      role="toolbar"
      aria-label="Teclas especiais"
    >
      <Key label="esc" onPress={() => onKey(KEYS.esc)}>
        esc
      </Key>
      <Key label="tab" onPress={() => onKey(KEYS.tab)}>
        tab
      </Key>
      <Key label="shift+tab" onPress={() => onKey(KEYS.shiftTab)}>
        ⇧tab
      </Key>
      <Key label="ctrl (próxima tecla)" active={ctrl} onPress={onCtrlToggle}>
        ctrl
      </Key>
      <Key label="seta esquerda" onPress={() => onKey(KEYS.left)}>
        <ArrowLeft className="h-4 w-4" />
      </Key>
      <Key label="seta para cima" onPress={() => onKey(KEYS.up)}>
        <ArrowUp className="h-4 w-4" />
      </Key>
      <Key label="seta para baixo" onPress={() => onKey(KEYS.down)}>
        <ArrowDown className="h-4 w-4" />
      </Key>
      <Key label="seta direita" onPress={() => onKey(KEYS.right)}>
        <ArrowRight className="h-4 w-4" />
      </Key>
      <Key label="ctrl+c" onPress={() => onKey(KEYS.ctrlC)}>
        ^C
      </Key>
      <Key label="ctrl+d" onPress={() => onKey(KEYS.ctrlD)}>
        ^D
      </Key>
      <Key label="colar" onPress={onPaste}>
        <ClipboardPaste className="h-4 w-4" />
      </Key>
    </div>
  )
}

function Key({
  label,
  active,
  onPress,
  children,
}: {
  label: string
  active?: boolean
  onPress: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      // Mantém o foco no xterm (senão o teclado virtual fecha)
      onPointerDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={cn(
        'flex min-w-[2.6rem] shrink-0 items-center justify-center rounded-md bg-slate-800 px-2 font-mono text-xs active:bg-slate-600',
        active && 'bg-primary text-primary-foreground',
      )}
    >
      {children}
    </button>
  )
}
