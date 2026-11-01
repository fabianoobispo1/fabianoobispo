'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { Pencil, Plus, Sparkles, Trash2, Loader2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/convex/_generated/api'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { TmuxSessionInfo } from '@/lib/terminal/connection'
import {
  SESSION_COLORS,
  sessionColorClass,
  type SessionMeta,
} from '@/lib/terminal/sessions'

const CWD_RE = /^(~|~\/[A-Za-z0-9 ._/-]{0,255}|\/[A-Za-z0-9 ._/-]{0,255})$/

interface SessionPanelProps {
  connectionKey: string
  sessions: TmuxSessionInfo[]
  meta: Map<string, SessionMeta>
  activeSession: string | null
  busy: boolean
  onAttach: (name: string) => void
  onCreate: (opts: { cwd?: string; claude: boolean }) => Promise<void>
  onKill: (name: string) => Promise<void>
}

/** Lista das sessões tmux (agent-N) do host + ações. */
export function SessionPanel({
  connectionKey,
  sessions,
  meta,
  activeSession,
  busy,
  onAttach,
  onCreate,
  onKill,
}: SessionPanelProps) {
  const upsertMeta = useMutation(api.terminalSession.upsert)
  const [createOpen, setCreateOpen] = useState(false)
  const [cwd, setCwd] = useState('')
  const [claude, setClaude] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [apelido, setApelido] = useState('')
  const [cor, setCor] = useState<string | null>(null)
  const [pasta, setPasta] = useState('')
  const [killTarget, setKillTarget] = useState<string | null>(null)

  const openEdit = (name: string) => {
    const m = meta.get(name)
    setApelido(m?.apelido ?? '')
    setCor(m?.cor ?? null)
    setPasta(m?.pasta ?? '')
    setEditing(name)
  }

  const saveEdit = async () => {
    if (!editing) return
    if (pasta && !CWD_RE.test(pasta)) {
      toast({ title: 'Pasta inválida', variant: 'destructive' })
      return
    }
    try {
      await upsertMeta({
        connectionKey,
        name: editing,
        apelido: apelido.trim() || null,
        cor,
        pasta: pasta || null,
      })
      setEditing(null)
    } catch (err) {
      toast({
        title: 'Não foi possível salvar',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      })
    }
  }

  const submitCreate = async () => {
    if (cwd && !CWD_RE.test(cwd)) {
      toast({
        title: 'Pasta inválida',
        description: 'Use ~, ~/caminho ou /caminho',
        variant: 'destructive',
      })
      return
    }
    await onCreate({ cwd: cwd || undefined, claude })
    setCreateOpen(false)
    setCwd('')
    setClaude(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {sessions.length === 0 && (
          <span className="text-sm text-muted-foreground">
            Nenhuma sessão no host.
          </span>
        )}
        {sessions.map((s) => {
          const m = meta.get(s.name)
          const active = s.name === activeSession
          return (
            <div
              key={s.name}
              className={cn(
                'group flex items-center gap-1 rounded-md border pl-2 pr-1 py-1 text-sm',
                active && 'border-primary bg-primary/5',
              )}
            >
              <button
                type="button"
                className="flex items-center gap-2"
                onClick={() => onAttach(s.name)}
                disabled={busy || active}
                title={`${s.name}${s.command ? ` · ${s.command}` : ''}`}
              >
                <span
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    sessionColorClass(m?.cor),
                  )}
                />
                <span className="font-medium">{m?.apelido || s.name}</span>
                {s.command && (
                  <span className="text-xs text-muted-foreground">
                    {s.command}
                  </span>
                )}
                {s.attached > 0 && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-green-500"
                    title={`${s.attached} cliente(s) anexado(s)`}
                  />
                )}
              </button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => openEdit(s.name)}
                aria-label={`Editar ${s.name}`}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive"
                onClick={() => setKillTarget(s.name)}
                aria-label={`Encerrar ${s.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )
        })}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCreateOpen(true)}
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1 h-4 w-4" />
          )}
          Nova sessão
        </Button>
      </div>

      {/* Nova sessão */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova sessão tmux</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="new-cwd">Pasta (opcional)</Label>
              <Input
                id="new-cwd"
                placeholder="~/projetos/app"
                value={cwd}
                onChange={(e) => setCwd(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={claude}
                onCheckedChange={(v) => setClaude(v === true)}
              />
              <Sparkles className="h-4 w-4" /> Iniciar o Claude Code na sessão
            </label>
          </div>
          <DialogFooter>
            <Button onClick={submitCreate} disabled={busy}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Metadados */}
      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sessão {editing}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="meta-apelido">Apelido</Label>
              <Input
                id="meta-apelido"
                maxLength={40}
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {SESSION_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    onClick={() => setCor(cor === c ? null : c)}
                    className={cn(
                      'h-6 w-6 rounded-full ring-offset-2 ring-offset-background',
                      sessionColorClass(c),
                      cor === c && 'ring-2 ring-foreground',
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="meta-pasta">Pasta</Label>
              <Input
                id="meta-pasta"
                placeholder="~/projetos/app"
                value={pasta}
                onChange={(e) => setPasta(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de kill */}
      <AlertDialog
        open={killTarget !== null}
        onOpenChange={(o) => !o && setKillTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar {killTarget}?</AlertDialogTitle>
            <AlertDialogDescription>
              A sessão tmux e tudo que roda nela serão finalizados no host. Isso
              não pode ser desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (killTarget) onKill(killTarget).catch(() => {})
                setKillTarget(null)
              }}
            >
              Encerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
