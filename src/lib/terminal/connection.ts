/**
 * Cliente do protocolo v3 do Terminal Server (scripts/terminal-server).
 *
 * Um `TerminalConnection` = um WebSocket = uma conexão SSH; vários
 * terminais (canais pty) andam multiplexados por `sid`. Os comandos de
 * controle das sessões tmux (list/create/kill/capture/preview) usam
 * `request()`, que casa a resposta pelo `id`.
 *
 * Não depende de React: a UI (janelas, dock, mobile) usa isto por baixo.
 */

export const PROTOCOL_VERSION = 3

export interface TmuxSessionInfo {
  name: string
  /** ms desde epoch */
  created: number | null
  /** clientes tmux anexados (de qualquer lugar, não só deste navegador) */
  attached: number
  command: string | null
}

export interface ReadyInfo {
  tmux: { available: boolean; version: string | null }
  hostKey: { fingerprint: string | null; pinned: boolean }
}

export interface AttachedInfo {
  sid: string
  session: string | null
  mode: 'tmux' | 'shell'
  /** pediu tmux mas o host não tem: caiu para shell */
  fallback: boolean
}

export interface HostKeyMismatch {
  message: string
  expected: string
  seen: string | null
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'closed'
  | 'error'

export interface TerminalConnectionHandlers {
  onStatus?: (status: ConnectionStatus) => void
  onReady?: (info: ReadyInfo) => void
  onOutput?: (sid: string, data: string) => void
  onAttached?: (info: AttachedInfo) => void
  onDetached?: (sid: string, reason: string) => void
  /** sid presente quando o erro é de um terminal específico */
  onError?: (message: string, sid?: string) => void
  onNotice?: (
    kind: 'config_required' | 'tmux_unavailable' | 'closed',
    message: string,
  ) => void
  onHostKeyMismatch?: (info: HostKeyMismatch) => void
  onClose?: (code: number, reason: string) => void
}

export interface ConnectOptions {
  /** ciphertext da conexão salva; ausente = credencial SSH_* do servidor */
  sealedCredential?: string
  /** fingerprint fixada (TOFU) */
  hostKey?: string
}

/** Eventos de um terminal (canal) específico. */
export interface ChannelHandlers {
  onOutput: (data: string) => void
  onAttached?: (info: AttachedInfo) => void
  onDetached?: (reason: string) => void
  onError?: (message: string) => void
}

type Pending = {
  resolve: (data: unknown) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

const CLOSE_MESSAGES: Record<number, string> = {
  4401: 'Terminal Server recusou a autenticação',
  4403: 'Terminal Server recusou a autenticação',
  4429: 'Muitas conexões abertas no Terminal Server',
}

export class TerminalConnection {
  private ws: WebSocket | null = null
  private nextId = 1
  private pending = new Map<number, Pending>()
  private channelHandlers = new Map<string, ChannelHandlers>()
  private sidCounter = 0
  private _status: ConnectionStatus = 'idle'
  ready: ReadyInfo | null = null

  constructor(private handlers: TerminalConnectionHandlers = {}) {}

  get status() {
    return this._status
  }

  setHandlers(handlers: TerminalConnectionHandlers) {
    this.handlers = handlers
  }

  private setStatus(status: ConnectionStatus) {
    this._status = status
    this.handlers.onStatus?.(status)
  }

  /**
   * Busca o token, abre o WS, autentica e inicia o SSH. Resolve quando o
   * servidor manda `ready`; rejeita em erro antes disso.
   */
  async connect(opts: ConnectOptions = {}): Promise<ReadyInfo> {
    if (this.ws) throw new Error('Já conectado')
    this.setStatus('connecting')

    const tokenRes = await fetch('/api/terminal/token', { cache: 'no-store' })
    const tokenData = (await tokenRes.json().catch(() => ({}))) as {
      token?: string
      wsUrl?: string
      error?: string
    }
    if (!tokenRes.ok || !tokenData.token || !tokenData.wsUrl) {
      this.setStatus('error')
      throw new Error(
        tokenData.error || 'Não foi possível obter token de acesso',
      )
    }

    return await new Promise<ReadyInfo>((resolve, reject) => {
      let settled = false
      const fail = (message: string) => {
        if (settled) return
        settled = true
        this.setStatus('error')
        reject(new Error(message))
      }

      // O token vai na 1ª mensagem (nunca na URL, que acaba em logs)
      const ws = new WebSocket(tokenData.wsUrl!)
      this.ws = ws

      ws.onopen = () => {
        ws.send(JSON.stringify({ command: 'auth', token: tokenData.token }))
      }

      ws.onmessage = (event) => {
        let msg: Record<string, unknown>
        try {
          msg = JSON.parse(event.data as string)
        } catch {
          return
        }
        switch (msg.type) {
          case 'authenticated':
            if (msg.protocol !== PROTOCOL_VERSION) {
              fail(
                'Versão do Terminal Server incompatível: faça o redeploy do container.',
              )
              ws.close()
              return
            }
            ws.send(
              JSON.stringify({
                command: 'start',
                sealedCredential: opts.sealedCredential,
                hostKey: opts.hostKey,
              }),
            )
            return
          case 'ready': {
            const info = {
              tmux: msg.tmux,
              hostKey: msg.hostKey,
            } as ReadyInfo
            this.ready = info
            this.setStatus('ready')
            this.handlers.onReady?.(info)
            if (!settled) {
              settled = true
              resolve(info)
            }
            return
          }
          case 'output':
            this.channelHandlers
              .get(msg.sid as string)
              ?.onOutput(msg.data as string)
            this.handlers.onOutput?.(msg.sid as string, msg.data as string)
            return
          case 'attached':
            this.channelHandlers
              .get(msg.sid as string)
              ?.onAttached?.(msg as unknown as AttachedInfo)
            this.handlers.onAttached?.(msg as unknown as AttachedInfo)
            return
          case 'detached': {
            const ch = this.channelHandlers.get(msg.sid as string)
            this.channelHandlers.delete(msg.sid as string)
            ch?.onDetached?.(msg.reason as string)
            this.handlers.onDetached?.(msg.sid as string, msg.reason as string)
            return
          }
          case 'result': {
            const p = this.pending.get(msg.id as number)
            if (!p) return
            this.pending.delete(msg.id as number)
            clearTimeout(p.timer)
            if (msg.ok) p.resolve(msg.data)
            else p.reject(new Error(String(msg.error ?? 'Erro')))
            return
          }
          case 'host_key_mismatch':
            this.handlers.onHostKeyMismatch?.(msg as unknown as HostKeyMismatch)
            fail(String(msg.message))
            return
          case 'config_required':
          case 'tmux_unavailable':
          case 'closed':
            this.handlers.onNotice?.(msg.type, String(msg.message))
            if (msg.type === 'config_required') fail(String(msg.message))
            return
          case 'error':
            if (msg.sid) {
              this.channelHandlers
                .get(msg.sid as string)
                ?.onError?.(String(msg.message))
            }
            this.handlers.onError?.(
              String(msg.message),
              msg.sid as string | undefined,
            )
            if (!msg.sid) fail(String(msg.message))
        }
      }

      ws.onerror = () => fail('Erro na conexão com o Terminal Server')

      ws.onclose = (event) => {
        this.ws = null
        this.ready = null
        for (const p of this.pending.values()) {
          clearTimeout(p.timer)
          p.reject(new Error('Conexão encerrada'))
        }
        this.pending.clear()
        for (const ch of this.channelHandlers.values()) {
          ch.onDetached?.('connection_closed')
        }
        this.channelHandlers.clear()
        const message = CLOSE_MESSAGES[event.code]
        fail(message ?? 'Conexão encerrada')
        if (this._status !== 'error') this.setStatus('closed')
        this.handlers.onClose?.(event.code, message ?? event.reason)
      }
    })
  }

  private raw(obj: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj))
    }
  }

  /**
   * Abre um terminal e roteia os eventos dele para `handlers`. Devolve o
   * sid e funções já ligadas a ele; `close()` desanexa (a sessão tmux
   * continua no host).
   */
  openChannel(
    opts: { session?: string | null; cols: number; rows: number },
    handlers: ChannelHandlers,
  ) {
    const sid = `c${++this.sidCounter}`
    this.channelHandlers.set(sid, handlers)
    this.attach(sid, {
      session: opts.session ?? undefined,
      cols: opts.cols,
      rows: opts.rows,
    })
    return {
      sid,
      send: (data: string) => this.send(sid, data),
      resize: (cols: number, rows: number) => this.resize(sid, cols, rows),
      close: () => {
        this.channelHandlers.delete(sid)
        this.detach(sid)
      },
    }
  }

  attach(sid: string, opts: { session?: string; cols: number; rows: number }) {
    this.raw({ command: 'attach', sid, ...opts })
  }

  send(sid: string, data: string) {
    this.raw({ command: 'send', sid, data })
  }

  resize(sid: string, cols: number, rows: number) {
    this.raw({ command: 'resize', sid, cols, rows })
  }

  detach(sid: string) {
    this.raw({ command: 'detach', sid })
  }

  request<T>(
    command: 'list' | 'create' | 'kill' | 'capture' | 'preview',
    args: Record<string, unknown> = {},
    timeoutMs = 15_000,
  ): Promise<T> {
    if (this.ws?.readyState !== WebSocket.OPEN || !this.ready) {
      return Promise.reject(new Error('Não conectado'))
    }
    const id = this.nextId++
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error('Tempo esgotado'))
      }, timeoutMs)
      this.pending.set(id, {
        resolve: resolve as (d: unknown) => void,
        reject,
        timer,
      })
      this.raw({ command, id, ...args })
    })
  }

  listSessions() {
    return this.request<{ sessions: TmuxSessionInfo[] }>('list').then(
      (d) => d.sessions,
    )
  }

  createSession(opts: {
    name?: string
    cwd?: string
    claude?: boolean
    cols?: number
    rows?: number
  }) {
    return this.request<{ name: string }>('create', opts).then((d) => d.name)
  }

  killSession(name: string) {
    return this.request<{ name: string }>('kill', { name })
  }

  capture(name: string) {
    return this.request<{ text: string }>('capture', { name }).then(
      (d) => d.text,
    )
  }

  preview(name: string) {
    return this.request<{ lines: string[] }>('preview', { name }).then(
      (d) => d.lines,
    )
  }

  close() {
    this.raw({ command: 'close' })
    this.ws?.close()
  }
}
