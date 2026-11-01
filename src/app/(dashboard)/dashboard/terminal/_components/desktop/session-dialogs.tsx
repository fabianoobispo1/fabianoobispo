'use client'

import { useEffect, useState } from 'react'
import { useMutation } from 'convex/react'
import { Loader2, Sparkles } from 'lucide-react'

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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { TerminalConnection } from '@/lib/terminal/connection'
import {
  SESSION_COLORS,
  sessionColorClass,
  type SessionMeta,
} from '@/lib/terminal/sessions'

// Mesma regra do Terminal Server e do Convex
export const CWD_RE =
  /^(~|~\/[A-Za-z0-9 ._/-]{0,255}|\/[A-Za-z0-9 ._/-]{0,255})$/

const errMsg = (err: unknown) =>
  err instanceof Error ? err.message : undefined

// ------------------------------------------------------------ nova sessão

export function CreateSessionDialog({
  open,
  defaultClaude,
  onOpenChange,
  onCreate,
}: {
  open: boolean
  defaultClaude: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (opts: { cwd?: string; claude: boolean }) => Promise<void>
}) {
  const [cwd, setCwd] = useState('')
  const [claude, setClaude] = useState(defaultClaude)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setCwd('')
      setClaude(defaultClaude)
    }
  }, [open, defaultClaude])

  const submit = async () => {
    if (cwd && !CWD_RE.test(cwd)) {
      toast({
        title: 'Pasta inválida',
        description: 'Use ~, ~/caminho ou /caminho (sem aspas, $ ou `)',
        variant: 'destructive',
      })
      return
    }
    setBusy(true)
    try {
      await onCreate({ cwd: cwd || undefined, claude })
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova sessão</DialogTitle>
          <DialogDescription>
            Cria uma sessão tmux persistente (agent-N) no host.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            submit().catch(() => {})
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="new-cwd">Pasta (opcional)</Label>
            <Input
              id="new-cwd"
              placeholder="~/projetos/app"
              value={cwd}
              autoFocus
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
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------- metadados

export function EditSessionDialog({
  connectionKey,
  name,
  meta,
  onClose,
}: {
  connectionKey: string
  name: string | null
  meta?: SessionMeta
  onClose: () => void
}) {
  const upsert = useMutation(api.terminalSession.upsert)
  const [apelido, setApelido] = useState('')
  const [cor, setCor] = useState<string | null>(null)
  const [pasta, setPasta] = useState('')

  useEffect(() => {
    if (!name) return
    setApelido(meta?.apelido ?? '')
    setCor(meta?.cor ?? null)
    setPasta(meta?.pasta ?? '')
  }, [name, meta])

  const save = async () => {
    if (!name) return
    if (pasta && !CWD_RE.test(pasta)) {
      toast({ title: 'Pasta inválida', variant: 'destructive' })
      return
    }
    try {
      await upsert({
        connectionKey,
        name,
        apelido: apelido.trim() || null,
        cor,
        pasta: pasta || null,
      })
      onClose()
    } catch (err) {
      toast({
        title: 'Não foi possível salvar',
        description: errMsg(err),
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog open={name !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessão {name}</DialogTitle>
          <DialogDescription>
            Apelido, cor e pasta ficam salvos na sua conta (não no host).
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            save().catch(() => {})
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="meta-apelido">Apelido</Label>
            <Input
              id="meta-apelido"
              maxLength={40}
              value={apelido}
              autoFocus
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
                  aria-pressed={cor === c}
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
          <DialogFooter>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ------------------------------------------------------------------ kill

export function KillSessionDialog({
  name,
  label,
  onConfirm,
  onCancel,
}: {
  name: string | null
  label?: string
  onConfirm: (name: string) => void
  onCancel: () => void
}) {
  return (
    <AlertDialog open={name !== null} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar {label ?? name}?</AlertDialogTitle>
          <AlertDialogDescription>
            A sessão tmux <code>{name}</code> e tudo que roda nela serão
            finalizados no host. Isso não pode ser desfeito. (Para só tirar da
            tela, feche a janela: a sessão continua rodando.)
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => name && onConfirm(name)}
          >
            Encerrar sessão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// --------------------------------------------------------------- capture

/** Texto da sessão (capture-pane, até 5000 linhas) para copiar à vontade. */
export function CaptureDialog({
  conn,
  name,
  onClose,
}: {
  conn: TerminalConnection
  name: string | null
  onClose: () => void
}) {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    if (!name) return
    setText(null)
    let cancelled = false
    conn
      .capture(name)
      .then((t) => !cancelled && setText(t))
      .catch((err) => !cancelled && setText(`Erro: ${errMsg(err) ?? ''}`))
    return () => {
      cancelled = true
    }
  }, [conn, name])

  const copyAll = () => {
    if (!text) return
    navigator.clipboard
      .writeText(text)
      .then(() => toast({ title: 'Copiado' }))
      .catch(() =>
        toast({
          title: 'Não foi possível copiar',
          description: 'Selecione o texto e copie manualmente.',
          variant: 'destructive',
        }),
      )
  }

  return (
    <Dialog open={name !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Conteúdo de {name}</DialogTitle>
          <DialogDescription>
            Histórico da sessão como texto puro.
          </DialogDescription>
        </DialogHeader>
        {text === null ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Textarea
            readOnly
            value={text}
            className="h-[60vh] font-mono text-xs"
            onFocus={(e) => {
              // Rola para o fim (o mais recente) ao abrir
              e.currentTarget.scrollTop = e.currentTarget.scrollHeight
            }}
          />
        )}
        <DialogFooter>
          <Button onClick={copyAll} disabled={!text}>
            Copiar tudo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
