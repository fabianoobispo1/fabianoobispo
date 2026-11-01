'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import {
  Copy,
  Expand,
  LayoutGrid,
  Layers,
  Maximize2,
  Minus,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Unplug,
  X,
} from 'lucide-react'

import { api } from '@/convex/_generated/api'
import { toast } from '@/hooks/use-toast'
import type {
  TerminalConnection,
  TmuxSessionInfo,
} from '@/lib/terminal/connection'
import type { SessionMeta } from '@/lib/terminal/sessions'
import {
  ZONE_RECTS,
  cascadeRects,
  loadLayout,
  nextWindowRect,
  saveLayout,
  tileRects,
  type SnapZone,
  type WindowState,
} from '@/lib/terminal/window-layout'

import { CommandPalette, type PaletteAction } from './command-palette'
import { Dock, type DockItem } from './dock'
import {
  CaptureDialog,
  CreateSessionDialog,
  EditSessionDialog,
  KillSessionDialog,
} from './session-dialogs'
import { TerminalWindow } from './terminal-window'
import { XtermPane, type XtermPaneHandle } from './xterm-pane'

const LIST_REFRESH_MS = 5000
const SAVE_DEBOUNCE_MS = 300

interface TerminalDesktopProps {
  conn: TerminalConnection
  tmuxAvailable: boolean
  connectionKey: string
  meta: Map<string, SessionMeta>
  onDisconnect: () => void
}

const errMsg = (err: unknown) =>
  err instanceof Error ? err.message : undefined

/**
 * Área de trabalho do terminal: janelas (uma por sessão tmux), dock e
 * paleta de comandos. O layout das janelas fica no localStorage, por
 * conexão.
 */
export function TerminalDesktop({
  conn,
  tmuxAvailable,
  connectionKey,
  meta,
  onDisconnect,
}: TerminalDesktopProps) {
  const upsertMeta = useMutation(api.terminalSession.upsert)
  const removeMeta = useMutation(api.terminalSession.remove)

  const desktopRef = useRef<HTMLDivElement>(null)
  const panes = useRef(new Map<string, XtermPaneHandle>())
  const shellCounter = useRef(0)

  const [sessions, setSessions] = useState<TmuxSessionInfo[]>([])
  const [windows, setWindows] = useState<WindowState[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [snap, setSnap] = useState<SnapZone | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState<null | { claude: boolean }>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [killing, setKilling] = useState<string | null>(null)
  const [capturing, setCapturing] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  const labelOf = useCallback(
    (session: string | null, id: string) =>
      session ? meta.get(session)?.apelido || session : `shell ${id.slice(6)}`,
    [meta],
  )

  // ------------------------------------------------------------ sessões
  const refresh = useCallback(async () => {
    if (!tmuxAvailable) return []
    try {
      const list = await conn.listSessions()
      setSessions(list)
      return list
    } catch {
      return null
    }
  }, [conn, tmuxAvailable])

  useEffect(() => {
    if (!tmuxAvailable) return
    const t = setInterval(() => {
      refresh().catch(() => {})
    }, LIST_REFRESH_MS)
    return () => clearInterval(t)
  }, [refresh, tmuxAvailable])

  // ------------------------------------------------------------ janelas
  const topZ = (ws: WindowState[]) => ws.reduce((m, w) => Math.max(m, w.z), 0)

  const focusWindow = useCallback((id: string) => {
    setWindows((ws) => {
      const target = ws.find((w) => w.id === id)
      if (!target) return ws
      const z = topZ(ws)
      if (target.z === z && !target.minimized) return ws
      return ws.map((w) =>
        w.id === id ? { ...w, z: z + 1, minimized: false } : w,
      )
    })
    setActiveId(id)
    // depois do render (a janela pode ter acabado de sair do minimizado)
    requestAnimationFrame(() => panes.current.get(id)?.focus())
  }, [])

  const openWindow = useCallback(
    (session: string | null) => {
      const id = session ?? `shell-${++shellCounter.current}`
      setWindows((ws) => {
        if (ws.some((w) => w.id === id)) return ws
        return [
          ...ws,
          {
            id,
            session,
            rect: nextWindowRect(ws.length),
            maximized: false,
            minimized: false,
            z: topZ(ws) + 1,
          },
        ]
      })
      focusWindow(id)
    },
    [focusWindow],
  )

  const closeWindow = useCallback((id: string) => {
    panes.current.delete(id)
    setWindows((ws) => ws.filter((w) => w.id !== id))
    setActiveId((a) => (a === id ? null : a))
  }, [])

  const patchWindow = useCallback(
    (id: string, patch: Partial<WindowState>) =>
      setWindows((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w))),
    [],
  )

  const minimizeWindow = useCallback((id: string) => {
    setWindows((ws) =>
      ws.map((w) => (w.id === id ? { ...w, minimized: true } : w)),
    )
    setActiveId((a) => (a === id ? null : a))
  }, [])

  /** Clique no dock: abre, restaura, foca ou minimiza (se já ativa). */
  const activate = useCallback(
    (id: string) => {
      const w = windows.find((x) => x.id === id)
      if (!w) return openWindow(id.startsWith('shell-') ? null : id)
      if (w.minimized || activeId !== id) return focusWindow(id)
      minimizeWindow(id)
    },
    [windows, activeId, openWindow, focusWindow, minimizeWindow],
  )

  const arrange = useCallback((mode: 'tile' | 'cascade') => {
    setWindows((ws) => {
      const visible = ws.filter((w) => !w.minimized).sort((a, b) => a.z - b.z)
      const rects =
        mode === 'tile'
          ? tileRects(visible.length)
          : cascadeRects(visible.length)
      const byId = new Map(visible.map((w, i) => [w.id, rects[i]]))
      return ws.map((w) =>
        byId.has(w.id) ? { ...w, rect: byId.get(w.id)!, maximized: false } : w,
      )
    })
  }, [])

  // ------------------------------------------------------- inicialização
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!tmuxAvailable) {
        openWindow(null)
        setInitialized(true)
        return
      }
      let list = (await refresh()) ?? []
      if (cancelled) return
      if (list.length === 0) {
        try {
          await conn.createSession({})
          list = (await refresh()) ?? []
        } catch (err) {
          toast({
            title: 'Não foi possível criar a sessão',
            description: errMsg(err),
            variant: 'destructive',
          })
        }
      }
      if (cancelled) return
      const live = new Set(list.map((s) => s.name))
      const saved = loadLayout(connectionKey).filter(
        (w) => w.session && live.has(w.session),
      )
      if (saved.length) {
        setWindows(saved)
        const top = saved.reduce((a, b) => (b.z > a.z ? b : a))
        if (!top.minimized) setActiveId(top.id)
      } else if (list[0]) {
        openWindow(list[0].name)
      }
      setInitialized(true)
    })().catch(() => setInitialized(true))
    return () => {
      cancelled = true
    }
    // Só na montagem (uma montagem por conexão)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persiste o layout (debounce: arrastar gera várias mudanças)
  useEffect(() => {
    if (!initialized) return
    const t = setTimeout(
      () => saveLayout(connectionKey, windows),
      SAVE_DEBOUNCE_MS,
    )
    return () => clearTimeout(t)
  }, [windows, connectionKey, initialized])

  // --------------------------------------------------------- ações tmux
  const createSession = async (opts: { cwd?: string; claude: boolean }) => {
    try {
      const name = await conn.createSession({
        cwd: opts.cwd,
        claude: opts.claude,
      })
      if (opts.cwd) {
        await upsertMeta({ connectionKey, name, pasta: opts.cwd }).catch(
          () => {},
        )
      }
      await refresh()
      openWindow(name)
    } catch (err) {
      toast({
        title: 'Não foi possível criar a sessão',
        description: errMsg(err),
        variant: 'destructive',
      })
      throw err
    }
  }

  const newSession = (claude: boolean) => {
    if (!tmuxAvailable) {
      openWindow(null)
      return
    }
    setCreateOpen({ claude })
  }

  const killSession = async (name: string) => {
    setKilling(null)
    try {
      await conn.killSession(name)
      closeWindow(name)
      await removeMeta({ connectionKey, name }).catch(() => {})
      await refresh()
    } catch (err) {
      toast({
        title: 'Não foi possível encerrar',
        description: errMsg(err),
        variant: 'destructive',
      })
    }
  }

  const onPaneDetached = (id: string) => (reason: string) => {
    // A sessão acabou no host (exit, kill de outro lugar): some a janela
    if (reason === 'remote_closed') {
      closeWindow(id)
      refresh().catch(() => {})
    }
  }

  // --------------------------------------------------------- listas da UI
  const sessionMap = useMemo(
    () => new Map(sessions.map((s) => [s.name, s])),
    [sessions],
  )

  /** Ordem estável: sessões tmux por número, depois shells avulsos. */
  const dockItems: DockItem[] = useMemo(() => {
    const byId = new Map(windows.map((w) => [w.id, w]))
    const items: DockItem[] = sessions.map((s) => {
      const w = byId.get(s.name)
      return {
        id: s.name,
        session: s.name,
        label: labelOf(s.name, s.name),
        color: meta.get(s.name)?.cor,
        attached: s.attached,
        command: s.command,
        open: Boolean(w),
        minimized: Boolean(w?.minimized),
        active: activeId === s.name,
      }
    })
    for (const w of windows) {
      if (w.session) continue
      items.push({
        id: w.id,
        session: null,
        label: labelOf(null, w.id),
        attached: 0,
        open: true,
        minimized: w.minimized,
        active: activeId === w.id,
      })
    }
    return items
  }, [sessions, windows, meta, activeId, labelOf])

  const activeWin = windows.find((w) => w.id === activeId) ?? null
  const activeSession = activeWin?.session ?? null

  const toggleFullscreen = () => {
    const el = desktopRef.current?.parentElement
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else el.requestFullscreen().catch(() => {})
  }

  const actions: PaletteAction[] = [
    {
      id: 'new',
      label: 'Nova sessão…',
      icon: <Plus className="h-4 w-4" />,
      keywords: ['criar', 'new', 'tmux'],
      run: () => newSession(false),
    },
    ...(tmuxAvailable
      ? [
          {
            id: 'new-claude',
            label: 'Nova sessão com Claude…',
            icon: <Sparkles className="h-4 w-4" />,
            keywords: ['claude', 'agente', 'ai'],
            run: () => newSession(true),
          },
        ]
      : []),
    {
      id: 'tile',
      label: 'Organizar lado a lado',
      icon: <LayoutGrid className="h-4 w-4" />,
      keywords: ['tile', 'grade', 'grid'],
      run: () => arrange('tile'),
    },
    {
      id: 'cascade',
      label: 'Organizar em cascata',
      icon: <Layers className="h-4 w-4" />,
      keywords: ['cascade'],
      run: () => arrange('cascade'),
    },
    ...(activeWin
      ? [
          {
            id: 'max',
            label: activeWin.maximized
              ? 'Restaurar janela'
              : 'Maximizar janela',
            icon: <Maximize2 className="h-4 w-4" />,
            run: () =>
              patchWindow(activeWin.id, { maximized: !activeWin.maximized }),
          },
          {
            id: 'snap-left',
            label: 'Encaixar à esquerda',
            keywords: ['snap', 'metade'],
            run: () =>
              patchWindow(activeWin.id, {
                rect: ZONE_RECTS.left,
                maximized: false,
              }),
          },
          {
            id: 'snap-right',
            label: 'Encaixar à direita',
            keywords: ['snap', 'metade'],
            run: () =>
              patchWindow(activeWin.id, {
                rect: ZONE_RECTS.right,
                maximized: false,
              }),
          },
          {
            id: 'min',
            label: 'Minimizar janela',
            icon: <Minus className="h-4 w-4" />,
            run: () => minimizeWindow(activeWin.id),
          },
          {
            id: 'close',
            label: 'Fechar janela (a sessão continua)',
            icon: <X className="h-4 w-4" />,
            run: () => closeWindow(activeWin.id),
          },
        ]
      : []),
    ...(activeSession
      ? [
          {
            id: 'edit',
            label: 'Apelido, cor e pasta da sessão…',
            icon: <Pencil className="h-4 w-4" />,
            keywords: ['renomear', 'apelido', 'cor'],
            run: () => setEditing(activeSession),
          },
          {
            id: 'capture',
            label: 'Copiar conteúdo da sessão…',
            icon: <Copy className="h-4 w-4" />,
            keywords: ['capture', 'histórico', 'texto'],
            run: () => setCapturing(activeSession),
          },
        ]
      : []),
    {
      id: 'refresh',
      label: 'Atualizar lista de sessões',
      icon: <RefreshCw className="h-4 w-4" />,
      run: () => {
        refresh().catch(() => {})
      },
    },
    {
      id: 'fullscreen',
      label: 'Tela cheia',
      icon: <Expand className="h-4 w-4" />,
      keywords: ['fullscreen'],
      run: toggleFullscreen,
    },
    {
      id: 'disconnect',
      label: 'Desconectar',
      icon: <Unplug className="h-4 w-4" />,
      run: onDisconnect,
    },
  ]

  // ------------------------------------------------------------- atalhos
  // Captura na fase de captura para o xterm não engolir as teclas.
  // NÃO intercepta Ctrl+K nem Ctrl+C (vão para o shell/tmux).
  const shortcutsRef = useRef({ dockItems, activate, focusWindow })
  shortcutsRef.current = { dockItems, activate, focusWindow }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isPalette =
        (e.ctrlKey && e.shiftKey && !e.altKey && e.code === 'KeyK') ||
        (e.metaKey &&
          !e.ctrlKey &&
          !e.shiftKey &&
          !e.altKey &&
          e.key.toLowerCase() === 'k')
      if (isPalette) {
        e.preventDefault()
        e.stopPropagation()
        setPaletteOpen((o) => !o)
        return
      }
      const digit = /^Digit([1-9])$/.exec(e.code)
      if (digit && e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        const item = shortcutsRef.current.dockItems[Number(digit[1]) - 1]
        if (!item) return
        if (item.open) shortcutsRef.current.focusWindow(item.id)
        else shortcutsRef.current.activate(item.id)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // ------------------------------------------------------------- render
  const snapRect = snap ? ZONE_RECTS[snap] : null

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
      <div ref={desktopRef} className="relative min-h-0 flex-1 overflow-hidden">
        {windows.length === 0 && initialized && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-400">
            <p>Nenhuma janela aberta.</p>
            <p className="text-xs text-slate-500">
              Escolha uma sessão no dock ou abra a paleta com Ctrl+Shift+K / ⌘K.
            </p>
          </div>
        )}

        {windows.map((w) => (
          <TerminalWindow
            key={w.id}
            win={w}
            title={labelOf(w.session, w.id)}
            subtitle={
              w.session
                ? [
                    w.session !== labelOf(w.session, w.id) ? w.session : null,
                    sessionMap.get(w.session)?.command,
                  ]
                    .filter(Boolean)
                    .join(' · ') || null
                : 'sem tmux'
            }
            color={w.session ? meta.get(w.session)?.cor : null}
            active={w.id === activeId}
            desktopRef={desktopRef}
            onFocus={() => {
              if (activeId !== w.id) focusWindow(w.id)
            }}
            onChange={(patch) => patchWindow(w.id, patch)}
            onSnapPreview={setSnap}
            onMinimize={() => minimizeWindow(w.id)}
            onClose={() => closeWindow(w.id)}
            onKill={w.session ? () => setKilling(w.session) : undefined}
            onCapture={w.session ? () => setCapturing(w.session) : undefined}
          >
            <XtermPane
              ref={(h) => {
                if (h) panes.current.set(w.id, h)
              }}
              conn={conn}
              session={w.session}
              onDetached={onPaneDetached(w.id)}
            />
          </TerminalWindow>
        ))}

        {snapRect && (
          <div
            className="pointer-events-none absolute rounded-lg border-2 border-primary/70 bg-primary/10 transition-all"
            style={{
              left: `${snapRect.x * 100}%`,
              top: `${snapRect.y * 100}%`,
              width: `${snapRect.w * 100}%`,
              height: `${snapRect.h * 100}%`,
              zIndex: 9999,
            }}
          />
        )}
      </div>

      <Dock
        conn={conn}
        items={dockItems}
        tmuxAvailable={tmuxAvailable}
        onActivate={activate}
        onNew={newSession}
        onTile={() => arrange('tile')}
        onCascade={() => arrange('cascade')}
        onPalette={() => setPaletteOpen(true)}
        onEdit={setEditing}
        onCapture={setCapturing}
        onKill={setKilling}
      />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        sessions={dockItems.map((d) => ({
          id: d.id,
          session: d.session,
          label: d.label,
          color: d.color,
          command: d.command,
          open: d.open,
        }))}
        actions={actions}
        onGoTo={(id) => {
          const item = dockItems.find((d) => d.id === id)
          if (item?.open) focusWindow(id)
          else activate(id)
        }}
        onKill={tmuxAvailable ? setKilling : undefined}
      />

      <CreateSessionDialog
        open={createOpen !== null}
        defaultClaude={createOpen?.claude ?? false}
        onOpenChange={(o) => !o && setCreateOpen(null)}
        onCreate={createSession}
      />
      <EditSessionDialog
        connectionKey={connectionKey}
        name={editing}
        meta={editing ? meta.get(editing) : undefined}
        onClose={() => setEditing(null)}
      />
      <KillSessionDialog
        name={killing}
        label={killing ? labelOf(killing, killing) : undefined}
        onConfirm={(name) => {
          killSession(name).catch(() => {})
        }}
        onCancel={() => setKilling(null)}
      />
      <CaptureDialog
        conn={conn}
        name={capturing}
        onClose={() => setCapturing(null)}
      />
    </div>
  )
}
