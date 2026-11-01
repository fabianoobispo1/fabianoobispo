'use client'

import { useRef, type ReactNode, type PointerEvent } from 'react'
import { Copy, Maximize2, Minimize2, Minus, Power, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  ZONE_RECTS,
  clampRect,
  snapZoneAt,
  type Rect,
  type SnapZone,
  type WindowState,
} from '@/lib/terminal/window-layout'
import { sessionColorClass } from '@/lib/terminal/sessions'

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const HANDLES: { dir: ResizeDir; className: string }[] = [
  { dir: 'n', className: 'top-0 left-2 right-2 h-1.5 cursor-ns-resize' },
  { dir: 's', className: 'bottom-0 left-2 right-2 h-1.5 cursor-ns-resize' },
  { dir: 'e', className: 'right-0 top-2 bottom-2 w-1.5 cursor-ew-resize' },
  { dir: 'w', className: 'left-0 top-2 bottom-2 w-1.5 cursor-ew-resize' },
  { dir: 'ne', className: 'top-0 right-0 h-3 w-3 cursor-nesw-resize' },
  { dir: 'nw', className: 'top-0 left-0 h-3 w-3 cursor-nwse-resize' },
  { dir: 'se', className: 'bottom-0 right-0 h-3 w-3 cursor-nwse-resize' },
  { dir: 'sw', className: 'bottom-0 left-0 h-3 w-3 cursor-nesw-resize' },
]

interface TerminalWindowProps {
  win: WindowState
  title: string
  subtitle?: string | null
  color?: string | null
  active: boolean
  desktopRef: React.RefObject<HTMLDivElement | null>
  onFocus: () => void
  onChange: (patch: Partial<Pick<WindowState, 'rect' | 'maximized'>>) => void
  onSnapPreview: (zone: SnapZone | null) => void
  onMinimize: () => void
  onClose: () => void
  onKill?: () => void
  onCapture?: () => void
  children: ReactNode
}

const toStyle = (r: Rect) => ({
  left: `${r.x * 100}%`,
  top: `${r.y * 100}%`,
  width: `${r.w * 100}%`,
  height: `${r.h * 100}%`,
})

/**
 * Moldura de janela: arrastar pela barra de título (com snap nas bordas e
 * cantos), redimensionar pelas bordas, duplo clique maximiza.
 *
 * Durante o arraste o estilo é mexido direto no DOM (sem re-render a cada
 * pixel); o estado só é gravado no pointerup.
 */
export function TerminalWindow({
  win,
  title,
  subtitle,
  color,
  active,
  desktopRef,
  onFocus,
  onChange,
  onSnapPreview,
  onMinimize,
  onClose,
  onKill,
  onCapture,
  children,
}: TerminalWindowProps) {
  const frameRef = useRef<HTMLDivElement>(null)

  const bounds = () => desktopRef.current?.getBoundingClientRect() ?? null

  const applyRect = (r: Rect) => {
    const el = frameRef.current
    if (!el) return
    Object.assign(el.style, toStyle(r))
  }

  // ------------------------------------------------------------ arrastar
  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('button')) return
    const b = bounds()
    if (!b) return
    e.preventDefault()
    onFocus()

    let start = win.rect
    // Arrastar uma janela maximizada "solta" ela sob o ponteiro
    if (win.maximized) {
      const px = (e.clientX - b.left) / b.width
      start = clampRect(
        { ...win.rect, x: px - win.rect.w / 2, y: 0 },
        b.width,
        b.height,
      )
      onChange({ maximized: false, rect: start })
    }
    const startX = e.clientX
    const startY = e.clientY
    let current = start
    let zone: SnapZone | null = null
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)

    const move = (ev: globalThis.PointerEvent) => {
      const dx = (ev.clientX - startX) / b.width
      const dy = (ev.clientY - startY) / b.height
      current = clampRect(
        { ...start, x: start.x + dx, y: start.y + dy },
        b.width,
        b.height,
      )
      applyRect(current)
      const next = snapZoneAt(
        ev.clientX - b.left,
        ev.clientY - b.top,
        b.width,
        b.height,
      )
      if (next !== zone) {
        zone = next
        onSnapPreview(zone)
      }
    }
    const up = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
      onSnapPreview(null)
      if (zone === 'maximize') {
        // Guarda o retângulo de antes para "restaurar" voltar a ele
        applyRect(start)
        onChange({ rect: start, maximized: true })
      } else if (zone) {
        onChange({ rect: ZONE_RECTS[zone], maximized: false })
      } else {
        onChange({ rect: current })
      }
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
  }

  // --------------------------------------------------------- redimensionar
  const startResize = (dir: ResizeDir) => (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || win.maximized) return
    const b = bounds()
    if (!b) return
    e.preventDefault()
    e.stopPropagation()
    onFocus()
    const start = win.rect
    const startX = e.clientX
    const startY = e.clientY
    let current = start
    const target = e.currentTarget
    target.setPointerCapture(e.pointerId)

    const move = (ev: globalThis.PointerEvent) => {
      const dx = (ev.clientX - startX) / b.width
      const dy = (ev.clientY - startY) / b.height
      let { x, y, w, h } = start
      if (dir.includes('e')) w = start.w + dx
      if (dir.includes('s')) h = start.h + dy
      if (dir.includes('w')) {
        w = start.w - dx
        x = start.x + dx
      }
      if (dir.includes('n')) {
        h = start.h - dy
        y = start.y + dy
      }
      // Ao bater no mínimo, a borda oposta não pode andar
      const clamped = clampRect({ x, y, w, h }, b.width, b.height)
      if (dir.includes('w')) clamped.x = start.x + start.w - clamped.w
      if (dir.includes('n')) clamped.y = start.y + start.h - clamped.h
      current = clampRect(clamped, b.width, b.height)
      applyRect(current)
    }
    const up = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
      onChange({ rect: current })
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
  }

  const style = win.maximized
    ? { left: 0, top: 0, width: '100%', height: '100%' }
    : toStyle(win.rect)

  return (
    <div
      ref={frameRef}
      role="dialog"
      aria-label={title}
      className={cn(
        'absolute flex flex-col overflow-hidden rounded-lg border bg-[#0d0d0d] shadow-xl',
        active ? 'border-primary/70 shadow-2xl' : 'border-slate-700',
        win.minimized && 'hidden',
        win.maximized && 'rounded-none',
      )}
      style={{ ...style, zIndex: win.z }}
      onPointerDownCapture={onFocus}
    >
      {/* Barra de título */}
      <div
        className={cn(
          'flex h-8 shrink-0 select-none items-center gap-2 px-2 text-xs touch-none',
          active
            ? 'bg-slate-800 text-slate-100'
            : 'bg-slate-900 text-slate-400',
        )}
        onPointerDown={startDrag}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          onChange({ maximized: !win.maximized })
        }}
      >
        <span
          className={cn(
            'h-2.5 w-2.5 shrink-0 rounded-full',
            sessionColorClass(color),
          )}
        />
        <span className="truncate font-medium">{title}</span>
        {subtitle && (
          <span className="truncate text-slate-500">· {subtitle}</span>
        )}
        <div className="ml-auto flex items-center">
          {onCapture && (
            <WinButton label="Copiar conteúdo" onClick={onCapture}>
              <Copy className="h-3.5 w-3.5" />
            </WinButton>
          )}
          {onKill && (
            <WinButton label="Encerrar sessão" onClick={onKill} danger>
              <Power className="h-3.5 w-3.5" />
            </WinButton>
          )}
          <WinButton label="Minimizar" onClick={onMinimize}>
            <Minus className="h-3.5 w-3.5" />
          </WinButton>
          <WinButton
            label={win.maximized ? 'Restaurar' : 'Maximizar'}
            onClick={() => onChange({ maximized: !win.maximized })}
          >
            {win.maximized ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </WinButton>
          <WinButton
            label="Fechar janela (a sessão continua)"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
          </WinButton>
        </div>
      </div>

      <div className="min-h-0 flex-1">{children}</div>

      {!win.maximized &&
        HANDLES.map((h) => (
          <div
            key={h.dir}
            className={cn('absolute z-10 touch-none', h.className)}
            onPointerDown={startResize(h.dir)}
          />
        ))}
    </div>
  )
}

function WinButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'rounded p-1 hover:bg-slate-700',
        danger && 'hover:bg-red-900/60 hover:text-red-300',
      )}
    >
      {children}
    </button>
  )
}
