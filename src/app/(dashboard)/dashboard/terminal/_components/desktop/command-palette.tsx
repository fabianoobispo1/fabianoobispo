'use client'

import type { ReactNode } from 'react'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { sessionColorClass } from '@/lib/terminal/sessions'

export interface PaletteSession {
  id: string
  session: string | null
  label: string
  color?: string | null
  command?: string | null
  open: boolean
}

export interface PaletteAction {
  id: string
  label: string
  icon?: ReactNode
  shortcut?: string
  keywords?: string[]
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sessions: PaletteSession[]
  actions: PaletteAction[]
  onGoTo: (id: string) => void
  onKill?: (session: string) => void
}

/**
 * Paleta (Ctrl+Shift+K / ⌘K). O cmdk já faz a busca fuzzy sobre o texto do
 * item + `keywords` (nome tmux, apelido, comando atual).
 */
export function CommandPalette({
  open,
  onOpenChange,
  sessions,
  actions,
  onGoTo,
  onKill,
}: CommandPaletteProps) {
  const run = (fn: () => void) => {
    onOpenChange(false)
    // Deixa o dialog fechar (e devolver o foco) antes da ação
    setTimeout(fn, 0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Comandos do terminal</DialogTitle>
        <DialogDescription className="sr-only">
          Busque sessões e ações
        </DialogDescription>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
          <CommandInput placeholder="Sessão ou ação…" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>Nada encontrado.</CommandEmpty>

            {sessions.length > 0 && (
              <CommandGroup heading="Sessões">
                {sessions.map((s, i) => (
                  <CommandItem
                    key={s.id}
                    value={`goto:${s.id}`}
                    keywords={[s.label, s.session ?? '', s.command ?? '']}
                    onSelect={() => run(() => onGoTo(s.id))}
                  >
                    <span
                      className={cn(
                        'mr-2 h-2.5 w-2.5 rounded-full',
                        sessionColorClass(s.color),
                      )}
                    />
                    <span className="font-medium">{s.label}</span>
                    {s.session && s.session !== s.label && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {s.session}
                      </span>
                    )}
                    {s.command && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        · {s.command}
                      </span>
                    )}
                    {!s.open && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (fechada)
                      </span>
                    )}
                    {i < 9 && (
                      <CommandShortcut>Ctrl+Shift+{i + 1}</CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />
            <CommandGroup heading="Ações">
              {actions.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`action:${a.id}`}
                  keywords={[a.label, ...(a.keywords ?? [])]}
                  onSelect={() => run(a.run)}
                >
                  {a.icon && <span className="mr-2">{a.icon}</span>}
                  {a.label}
                  {a.shortcut && (
                    <CommandShortcut>{a.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            {onKill && sessions.some((s) => s.session) && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Encerrar sessão">
                  {sessions
                    .filter((s) => s.session)
                    .map((s) => (
                      <CommandItem
                        key={`kill-${s.id}`}
                        value={`kill:${s.id}`}
                        keywords={['encerrar', 'kill', s.label, s.session!]}
                        onSelect={() => run(() => onKill(s.session!))}
                        className="text-destructive aria-selected:text-destructive"
                      >
                        Encerrar {s.label}…
                      </CommandItem>
                    ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
