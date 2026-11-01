'use client'

import { useRef, useState } from 'react'
import {
  ChevronUp,
  Command as CommandIcon,
  Copy,
  LayoutGrid,
  Layers,
  Pencil,
  Plus,
  Power,
  Sparkles,
} from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { TerminalConnection } from '@/lib/terminal/connection'
import { sessionColorClass } from '@/lib/terminal/sessions'

export interface DockItem {
  id: string
  session: string | null
  label: string
  color?: string | null
  /** clientes tmux anexados (inclui este navegador) */
  attached: number
  command?: string | null
  open: boolean
  minimized: boolean
  active: boolean
}

interface DockProps {
  conn: TerminalConnection
  items: DockItem[]
  tmuxAvailable: boolean
  /** layout compacto (celular): chips maiores, sem tile/cascata */
  compact?: boolean
  onActivate: (id: string) => void
  onNew: (claude: boolean) => void
  onTile?: () => void
  onCascade?: () => void
  onPalette?: () => void
  onEdit: (session: string) => void
  onCapture: (session: string) => void
  onKill: (session: string) => void
}

const PREVIEW_TTL_MS = 2000

/** Barra de tarefas: um chip por sessão (aberta ou não) + ações. */
export function Dock({
  conn,
  items,
  tmuxAvailable,
  compact,
  onActivate,
  onNew,
  onTile,
  onCascade,
  onPalette,
  onEdit,
  onCapture,
  onKill,
}: DockProps) {
  return (
    <TooltipProvider delayDuration={350}>
      <div
        className={cn(
          'flex shrink-0 items-center gap-1 border-t border-slate-700 bg-slate-900/95 px-2 text-slate-200',
          compact ? 'h-12 overflow-x-auto' : 'h-11',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {items.map((item, i) => (
            <DockChip
              key={item.id}
              conn={conn}
              item={item}
              index={i}
              compact={compact}
              onActivate={onActivate}
              onEdit={onEdit}
              onCapture={onCapture}
              onKill={onKill}
            />
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 border-l border-slate-700 pl-1">
          <DockButton label="Nova sessão" onClick={() => onNew(false)}>
            <Plus className="h-4 w-4" />
          </DockButton>
          {tmuxAvailable && (
            <DockButton
              label="Nova sessão com Claude"
              onClick={() => onNew(true)}
            >
              <Sparkles className="h-4 w-4" />
            </DockButton>
          )}
          {onTile && (
            <DockButton label="Lado a lado" onClick={onTile}>
              <LayoutGrid className="h-4 w-4" />
            </DockButton>
          )}
          {onCascade && (
            <DockButton label="Cascata" onClick={onCascade}>
              <Layers className="h-4 w-4" />
            </DockButton>
          )}
          {onPalette && (
            <DockButton
              label="Comandos (Ctrl+Shift+K / ⌘K)"
              onClick={onPalette}
            >
              <CommandIcon className="h-4 w-4" />
            </DockButton>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

function DockChip({
  conn,
  item,
  index,
  compact,
  onActivate,
  onEdit,
  onCapture,
  onKill,
}: {
  conn: TerminalConnection
  item: DockItem
  index: number
  compact?: boolean
  onActivate: (id: string) => void
  onEdit: (session: string) => void
  onCapture: (session: string) => void
  onKill: (session: string) => void
}) {
  const [preview, setPreview] = useState<string[] | null>(null)
  const fetchedAt = useRef(0)

  const loadPreview = (open: boolean) => {
    if (!open || !item.session) return
    if (Date.now() - fetchedAt.current < PREVIEW_TTL_MS) return
    fetchedAt.current = Date.now()
    conn
      .preview(item.session)
      .then(setPreview)
      .catch(() => setPreview(null))
  }

  const shortcut = index < 9 ? `Ctrl+Shift+${index + 1}` : null

  return (
    <div
      className={cn(
        'group flex shrink-0 items-center rounded-md border border-transparent',
        item.active && 'border-slate-500 bg-slate-800',
        !item.active && 'hover:bg-slate-800/70',
      )}
    >
      <Tooltip onOpenChange={loadPreview}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => onActivate(item.id)}
            className={cn(
              'relative flex items-center gap-2 px-2 text-xs',
              compact ? 'h-10' : 'h-8',
              !item.open && 'text-slate-400',
              item.minimized && 'opacity-60',
            )}
          >
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                sessionColorClass(item.color),
              )}
            />
            <span className="max-w-[10rem] truncate font-medium">
              {item.label}
            </span>
            {item.attached > 0 && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-green-500"
                aria-label={`${item.attached} cliente(s) anexado(s)`}
              />
            )}
            {item.open && (
              <span className="absolute inset-x-2 bottom-0 h-0.5 rounded bg-primary/80" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[32rem] border border-slate-700 bg-slate-950 p-2 text-slate-200"
        >
          <div className="mb-1 flex items-center gap-2 text-xs">
            <span className="font-semibold">{item.label}</span>
            {item.session && item.session !== item.label && (
              <span className="text-slate-500">{item.session}</span>
            )}
            {item.command && (
              <span className="text-slate-400">· {item.command}</span>
            )}
            {shortcut && (
              <span className="ml-auto text-slate-500">{shortcut}</span>
            )}
          </div>
          {item.session ? (
            <pre className="max-h-40 overflow-hidden whitespace-pre font-mono text-[11px] leading-tight text-slate-300">
              {preview?.length ? preview.join('\n') : '…'}
            </pre>
          ) : (
            <p className="text-xs text-slate-400">Shell sem tmux</p>
          )}
        </TooltipContent>
      </Tooltip>

      {item.session && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Opções de ${item.label}`}
              className={cn(
                'rounded px-0.5 text-slate-500 hover:text-slate-200',
                compact
                  ? 'h-10'
                  : 'h-8 opacity-0 group-hover:opacity-100 focus:opacity-100',
              )}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start">
            <DropdownMenuItem onSelect={() => onEdit(item.session!)}>
              <Pencil className="mr-2 h-4 w-4" /> Apelido, cor e pasta
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCapture(item.session!)}>
              <Copy className="mr-2 h-4 w-4" /> Copiar conteúdo
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => onKill(item.session!)}
            >
              <Power className="mr-2 h-4 w-4" /> Encerrar sessão…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function DockButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="rounded p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}
