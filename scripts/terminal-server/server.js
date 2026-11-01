#!/usr/bin/env node
'use strict'

/**
 * Terminal Server — ponte entre o WebSocket do navegador e o host remoto via
 * SSH (ssh2). Roda como container na VPS, porque WebSocket de longa duração
 * não cabe em função serverless.
 *
 * Protocolo v3 (JSON por mensagem). Um WebSocket = uma conexão SSH, com
 * vários terminais (canais pty) multiplexados por `sid`:
 *
 *   cliente → { command: 'auth', token }                (1ª mensagem, até 5 s)
 *   servidor → { type: 'authenticated', protocol: 3 }
 *   cliente → { command: 'start', sealedCredential?, hostKey? }
 *   servidor → { type: 'ready', tmux: { available, version }, hostKey }
 *
 *   terminais:
 *   cliente → { command: 'attach', sid, session?, cols, rows }
 *   servidor → { type: 'attached', sid, session, mode: 'tmux'|'shell', fallback }
 *   cliente → { command: 'send', sid, data } | { command: 'resize', sid, cols, rows }
 *             { command: 'detach', sid }
 *   servidor → { type: 'output', sid, data } | { type: 'detached', sid, reason }
 *
 *   controle das sessões tmux (resposta com o mesmo `id`):
 *   cliente → { command: 'list' | 'create' | 'kill' | 'capture' | 'preview', id, ... }
 *   servidor → { type: 'result', id, ok: true, data } | { type: 'result', id, ok: false, error }
 *
 *   cliente → { command: 'close' }
 *   servidor → { type: 'error' | 'closed' | 'config_required' | 'tmux_unavailable', message }
 *
 * Sessões: `tmux -L webdeck new-session -A -s agent-N` (lib/tmux.js) — o
 * nome só pode ser `agent-<número>`; fechar o canal só desanexa, a sessão
 * continua no host. Sem tmux no host, `attach` cai para um shell comum.
 *
 * Segurança:
 * - token HMAC de uso único (jti), 60 s, com sub/e-mail (lib/token.js)
 * - Origin validado contra ALLOWED_ORIGINS (lib/origin.js)
 * - credenciais seladas com a chave pública; só TERMINAL_PRIVATE_KEY abre
 * - host key do destino fixada (TOFU): o cliente manda a fingerprint salva e
 *   a conexão é recusada se ela mudar (lib/hostkey.js)
 * - nenhuma entrada do cliente vai crua para o shell remoto (lib/tmux.js)
 * - limites de tamanho do terminal, de mensagem, de canais e de conexões
 * - sem TLS em produção não sobe (exceto ALLOW_INSECURE=1 atrás de proxy)
 * - logs de conexão em stdout, sem teclas nem credenciais
 *
 * Guia completo: docs/TERMINAL_VPS_INSTALL.md
 */

const http = require('http')
const https = require('https')
const fs = require('fs')
const crypto = require('crypto')
const { WebSocketServer } = require('ws')
const { Client } = require('ssh2')

const { loadConfig } = require('./lib/config')
const { createTokenVerifier } = require('./lib/token')
const { isOriginAllowed } = require('./lib/origin')
const { clampSize } = require('./lib/limits')
const { createSealedOpener } = require('./lib/sealed')
const { fingerprint, isValidFingerprint } = require('./lib/hostkey')
const {
  isValidSessionName,
  isValidChannelId,
  nextSessionName,
} = require('./lib/session-name')
const tmux = require('./lib/tmux')
const { log: defaultLog } = require('./lib/log')

const VERSION = '3.0.0'
const PROTOCOL = 3
// Acima disso pausa os streams SSH até o navegador consumir a saída
const HIGH_WATER_MARK = 4 * 1024 * 1024
const EXEC_TIMEOUT_MS = 10_000
const EXEC_MAX_BYTES = 2 * 1024 * 1024
const MAX_PENDING_EXECS = 4
const CONTROL_COMMANDS = new Set([
  'list',
  'create',
  'kill',
  'capture',
  'preview',
])

function clientIp(req, trustProxy) {
  if (trustProxy) {
    const fwd = req.headers['x-forwarded-for']
    if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim()
  }
  return req.socket.remoteAddress
}

/** Roda um comando sem pty e devolve { code, stdout, stderr }. */
function runExec(
  conn,
  command,
  { timeoutMs = EXEC_TIMEOUT_MS, maxBytes = EXEC_MAX_BYTES } = {},
) {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err)
      const out = []
      const errOut = []
      let size = 0
      let errSize = 0
      let code = null
      let done = false
      const finish = (error) => {
        if (done) return
        done = true
        clearTimeout(timer)
        if (error) {
          stream.close()
          reject(error)
          return
        }
        resolve({
          code,
          stdout: Buffer.concat(out).toString('utf8'),
          stderr: Buffer.concat(errOut).toString('utf8'),
        })
      }
      const timer = setTimeout(
        () => finish(new Error('tempo esgotado')),
        timeoutMs,
      )
      stream.on('data', (d) => {
        size += d.length
        if (size > maxBytes) return finish(new Error('saída grande demais'))
        out.push(d)
      })
      stream.stderr.on('data', (d) => {
        if (errSize < 64 * 1024) {
          errSize += d.length
          errOut.push(d)
        }
      })
      stream.on('exit', (c) => {
        code = c
      })
      stream.on('close', () => finish(null))
    })
  })
}

/** Mensagem curta e de uma linha a partir do stderr do tmux. */
function tmuxError(result) {
  const msg = result.stderr.trim().split('\n')[0] || `código ${result.code}`
  return msg.slice(0, 200)
}

/**
 * Cria o servidor (sem chamar listen). Exportado para os testes.
 * @param {ReturnType<typeof loadConfig>} config
 */
async function createTerminalServer(config, deps = {}) {
  const log = deps.log ?? defaultLog
  const SshClient = deps.SshClient ?? Client
  const verifier = createTokenVerifier({ secret: config.tokenSecret })
  const sealed = config.privateKey
    ? await createSealedOpener(config.privateKey)
    : null

  const requestHandler = (req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({ status: 'ok', version: VERSION, protocol: PROTOCOL }),
      )
      return
    }
    res.writeHead(404)
    res.end()
  }

  const server = config.tls
    ? https.createServer(
        {
          cert: fs.readFileSync(config.tls.cert),
          key: fs.readFileSync(config.tls.key),
        },
        requestHandler,
      )
    : http.createServer(requestHandler)

  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: config.maxPayload,
  })

  let activeConnections = 0
  /** @type {Map<string, number>} sub -> conexões autenticadas */
  const perUser = new Map()

  server.on('upgrade', (req, socket, head) => {
    const ip = clientIp(req, config.trustProxy)
    const origin = req.headers.origin

    if (!isOriginAllowed(origin, config.allowedOrigins)) {
      log('origin_rejected', { ip, origin: origin ?? null })
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n')
      socket.destroy()
      return
    }
    if (activeConnections >= config.maxConnections) {
      log('connection_rejected', { ip, reason: 'max_connections' })
      socket.write(
        'HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n',
      )
      socket.destroy()
      return
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req, ip)
    })
  })

  wss.on('connection', (ws, req, ip) => {
    activeConnections++
    const connId = crypto.randomBytes(6).toString('hex')
    /** @type {null | { sub: string, email: string }} */
    let identity = null
    let conn = null
    let started = false
    let sshReady = false
    let session = null // { target, mode, startedAt }
    let tmuxInfo = { available: false, version: null }
    /** @type {Map<string, { stream: any, session: string|null, mode: string, openedAt: number }>} */
    const channels = new Map()
    let pendingExecs = 0
    let paused = false
    let closed = false
    let alive = true

    const send = (obj) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj))
    }

    const authTimer = setTimeout(() => {
      if (!identity) {
        log('auth_failed', { conn: connId, ip, reason: 'timeout' })
        ws.close(4401, 'auth timeout')
      }
    }, config.authTimeoutMs)

    ws.on('pong', () => {
      alive = true
    })
    const heartbeat = setInterval(() => {
      if (!alive) return ws.terminate()
      alive = false
      ws.ping()
    }, 30_000)

    // Backpressure: pausa TODOS os canais até o navegador drenar o buffer
    const applyBackpressure = () => {
      if (paused || ws.bufferedAmount <= HIGH_WATER_MARK) return
      paused = true
      for (const ch of channels.values()) ch.stream.pause()
      const check = setInterval(() => {
        if (closed || ws.bufferedAmount < HIGH_WATER_MARK / 4) {
          clearInterval(check)
          paused = false
          if (!closed) for (const ch of channels.values()) ch.stream.resume()
        }
      }, 50)
    }

    const closeChannel = (sid, reason) => {
      const ch = channels.get(sid)
      if (!ch) return
      channels.delete(sid)
      log('channel_close', {
        conn: connId,
        sub: identity?.sub,
        sid,
        session: ch.session,
        mode: ch.mode,
        durationMs: Date.now() - ch.openedAt,
        reason,
      })
      // Fechar o canal manda SIGHUP ao cliente tmux: ele só desanexa
      ch.stream.close()
      send({ type: 'detached', sid, reason })
    }

    const endSession = (reason) => {
      for (const sid of [...channels.keys()]) closeChannel(sid, reason)
      if (session) {
        log('session_end', {
          conn: connId,
          sub: identity?.sub,
          email: identity?.email,
          target: session.target,
          durationMs: Date.now() - session.startedAt,
          reason,
        })
        session = null
      }
      sshReady = false
      conn?.end()
    }

    const startSsh = (msg) => {
      let creds
      let mode
      let expectedHostKey
      if (msg.sealedCredential) {
        if (!sealed) {
          send({
            type: 'config_required',
            message:
              'TERMINAL_PRIVATE_KEY não configurada no Terminal Server: conexões salvas indisponíveis.',
          })
          return
        }
        try {
          creds = sealed.open(msg.sealedCredential, identity.sub)
        } catch (err) {
          log('credential_rejected', {
            conn: connId,
            sub: identity.sub,
            reason: err.message,
          })
          send({
            type: 'error',
            message: `Credencial inválida: ${err.message}`,
          })
          return
        }
        mode = 'saved'
        if (msg.hostKey !== undefined && msg.hostKey !== null) {
          if (!isValidFingerprint(msg.hostKey)) {
            send({ type: 'error', message: 'Fingerprint de host inválida' })
            return
          }
          expectedHostKey = msg.hostKey
        }
      } else if (config.defaultSsh) {
        creds = config.defaultSsh
        mode = 'default'
        expectedHostKey = config.defaultSsh.hostFingerprint
      } else {
        send({
          type: 'config_required',
          message:
            'Credenciais SSH ausentes. Salve uma conexão na aba "Conexões" ou configure SSH_* no .env do Terminal Server.',
        })
        return
      }

      if (
        config.allowedSshHosts.length &&
        !config.allowedSshHosts.includes(creds.host.toLowerCase())
      ) {
        log('host_rejected', {
          conn: connId,
          sub: identity.sub,
          host: creds.host,
        })
        send({ type: 'error', message: 'Host não permitido neste servidor' })
        return
      }

      started = true
      const target = `${creds.username}@${creds.host}:${creds.port}`
      let seenHostKey = null
      let hostKeyMismatch = false
      conn = new SshClient()

      conn.on('ready', async () => {
        session = { target, mode, startedAt: Date.now() }
        log('session_start', {
          conn: connId,
          sub: identity.sub,
          email: identity.email,
          ip,
          target,
          mode,
          hostKeyPinned: Boolean(expectedHostKey),
        })

        try {
          const res = await runExec(conn, tmux.checkCommand())
          const version = res.stdout.trim()
          tmuxInfo =
            res.code === 0 && version
              ? { available: true, version: version.slice(0, 40) }
              : { available: false, version: null }
        } catch {
          tmuxInfo = { available: false, version: null }
        }
        if (closed) return
        sshReady = true
        send({
          type: 'ready',
          message: 'Conexão SSH estabelecida',
          tmux: tmuxInfo,
          hostKey: {
            fingerprint: seenHostKey,
            pinned: Boolean(expectedHostKey),
          },
        })
        if (!tmuxInfo.available) {
          send({
            type: 'tmux_unavailable',
            message:
              'tmux não está instalado no host: os terminais abrem um shell comum e as sessões não persistem.',
          })
        }
      })

      conn.on('keyboard-interactive', (_n, _i, _l, prompts, finish) => {
        finish(prompts.map(() => creds.password ?? ''))
      })

      conn.on('error', (err) => {
        if (hostKeyMismatch) {
          log('host_key_mismatch', {
            conn: connId,
            sub: identity.sub,
            target,
            expected: expectedHostKey,
            seen: seenHostKey,
          })
          send({
            type: 'host_key_mismatch',
            message:
              'A host key do servidor mudou desde a última conexão. Pode ser reinstalação do servidor ou um ataque man-in-the-middle.',
            expected: expectedHostKey,
            seen: seenHostKey,
          })
          return
        }
        log('ssh_error', {
          conn: connId,
          sub: identity.sub,
          target,
          code: err.code ?? null,
        })
        send({ type: 'error', message: `Erro SSH: ${err.message}` })
      })

      conn.on('close', () => {
        if (!closed && session) {
          send({ type: 'closed', message: 'Conexão SSH encerrada' })
        }
        endSession('ssh_closed')
      })

      conn.connect({
        host: creds.host,
        port: creds.port,
        username: creds.username,
        password: creds.authMethod === 'password' ? creds.password : undefined,
        privateKey:
          creds.authMethod === 'privateKey' ? creds.privateKey : undefined,
        passphrase: creds.passphrase,
        readyTimeout: 10_000,
        tryKeyboard: creds.authMethod === 'password',
        // Sem hostHash o ssh2 entrega o blob cru da chave
        hostVerifier: (key) => {
          seenHostKey = fingerprint(key)
          if (expectedHostKey && expectedHostKey !== seenHostKey) {
            hostKeyMismatch = true
            return false
          }
          return true
        },
      })
    }

    const attach = (msg) => {
      const sid = msg.sid
      if (!isValidChannelId(sid)) {
        return send({ type: 'error', message: 'sid inválido' })
      }
      if (channels.has(sid)) {
        return send({ type: 'error', sid, message: 'Canal já aberto' })
      }
      if (channels.size >= config.maxChannels) {
        return send({
          type: 'error',
          sid,
          message: `Limite de ${config.maxChannels} terminais por conexão`,
        })
      }
      const wanted = msg.session ?? null
      if (wanted !== null && !isValidSessionName(wanted)) {
        return send({ type: 'error', sid, message: 'Nome de sessão inválido' })
      }

      const useTmux = Boolean(wanted) && tmuxInfo.available
      const mode = useTmux ? 'tmux' : 'shell'
      const { cols, rows } = clampSize(msg.cols, msg.rows)
      const pty = { cols, rows, term: 'xterm-256color' }
      // Reserva o sid já, para dois attach seguidos não abrirem 2 canais
      channels.set(sid, {
        stream: { close() {}, pause() {}, resume() {} },
        session: null,
        mode,
        openedAt: Date.now(),
        pending: true,
      })

      const onOpen = (err, stream) => {
        const reserved = channels.get(sid)
        if (err || !reserved || closed) {
          channels.delete(sid)
          if (stream) stream.close()
          if (err) send({ type: 'error', sid, message: err.message })
          return
        }
        channels.set(sid, {
          stream,
          session: useTmux ? wanted : null,
          mode,
          openedAt: Date.now(),
        })
        if (paused) stream.pause()
        log('channel_open', {
          conn: connId,
          sub: identity.sub,
          sid,
          session: useTmux ? wanted : null,
          mode,
        })
        send({
          type: 'attached',
          sid,
          session: useTmux ? wanted : null,
          mode,
          fallback: Boolean(wanted) && !useTmux,
        })

        const onData = (data) => {
          send({ type: 'output', sid, data: data.toString('utf8') })
          applyBackpressure()
        }
        stream.on('data', onData)
        stream.stderr?.on('data', onData)
        stream.on('close', () => {
          if (channels.get(sid)?.stream === stream) {
            closeChannel(sid, 'remote_closed')
          }
        })
      }

      if (useTmux) conn.exec(tmux.attachCommand(wanted), { pty }, onOpen)
      else conn.shell(pty, onOpen)
    }

    const control = async (msg) => {
      const id = msg.id
      const reply = (ok, payload) =>
        send(
          ok
            ? { type: 'result', id, ok: true, data: payload }
            : { type: 'result', id, ok: false, error: payload },
        )
      if (!tmuxInfo.available) return reply(false, 'tmux indisponível no host')
      if (pendingExecs >= MAX_PENDING_EXECS) {
        return reply(false, 'Muitos comandos em andamento')
      }

      const name = msg.name
      if (msg.command !== 'list' && msg.command !== 'create') {
        if (!isValidSessionName(name)) {
          return reply(false, 'Nome de sessão inválido')
        }
      }
      if (msg.command === 'create') {
        if (name !== undefined && name !== null && !isValidSessionName(name)) {
          return reply(false, 'Nome de sessão inválido')
        }
        if (msg.cwd !== undefined && msg.cwd !== null && msg.cwd !== '') {
          if (!tmux.isValidCwd(msg.cwd)) return reply(false, 'Pasta inválida')
        }
      }

      pendingExecs++
      try {
        if (msg.command === 'list') {
          const res = await runExec(conn, tmux.listCommand())
          return reply(true, { sessions: tmux.parseList(res.stdout) })
        }
        if (msg.command === 'create') {
          let target = name
          if (!target) {
            const res = await runExec(conn, tmux.listCommand())
            target = nextSessionName(
              tmux.parseList(res.stdout).map((s) => s.name),
            )
          }
          const { cols, rows } = clampSize(msg.cols, msg.rows)
          const res = await runExec(
            conn,
            tmux.createCommand(target, {
              cwd: msg.cwd || undefined,
              claude: msg.claude === true,
              cols,
              rows,
            }),
          )
          if (res.code !== 0) return reply(false, tmuxError(res))
          log('tmux_create', {
            conn: connId,
            sub: identity.sub,
            session: target,
            claude: msg.claude === true,
          })
          return reply(true, { name: target })
        }
        if (msg.command === 'kill') {
          const res = await runExec(conn, tmux.killCommand(name))
          if (res.code !== 0) return reply(false, tmuxError(res))
          log('tmux_kill', { conn: connId, sub: identity.sub, session: name })
          return reply(true, { name })
        }
        if (msg.command === 'capture') {
          const res = await runExec(conn, tmux.captureCommand(name))
          if (res.code !== 0) return reply(false, tmuxError(res))
          return reply(true, { name, text: res.stdout.replace(/\s+$/, '') })
        }
        if (msg.command === 'preview') {
          const res = await runExec(conn, tmux.previewCommand(name))
          if (res.code !== 0) return reply(false, tmuxError(res))
          return reply(true, { name, lines: tmux.parsePreview(res.stdout) })
        }
      } catch (err) {
        return reply(false, err.message)
      } finally {
        pendingExecs--
      }
    }

    ws.on('message', (raw, isBinary) => {
      if (isBinary) return ws.close(1003, 'binary not supported')
      let msg
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        return
      }
      if (!msg || typeof msg !== 'object') return

      // ------------------------------------------------ autenticação
      if (!identity) {
        if (msg.command !== 'auth') {
          log('auth_failed', { conn: connId, ip, reason: 'no_auth_message' })
          return ws.close(4401, 'unauthorized')
        }
        const result = verifier.verify(msg.token)
        if (!result.ok) {
          log('auth_failed', { conn: connId, ip, reason: result.reason })
          return ws.close(4401, 'unauthorized')
        }
        const email = result.claims.email.trim().toLowerCase()
        if (config.authorizedEmail && email !== config.authorizedEmail) {
          log('auth_failed', { conn: connId, ip, reason: 'email_not_allowed' })
          return ws.close(4403, 'forbidden')
        }
        const count = perUser.get(result.claims.sub) ?? 0
        if (count >= config.maxConnectionsPerUser) {
          log('connection_rejected', {
            conn: connId,
            sub: result.claims.sub,
            reason: 'max_connections_per_user',
          })
          return ws.close(4429, 'too many connections')
        }
        perUser.set(result.claims.sub, count + 1)
        identity = { sub: result.claims.sub, email }
        clearTimeout(authTimer)
        log('authenticated', { conn: connId, sub: identity.sub, email, ip })
        send({ type: 'authenticated', protocol: PROTOCOL })
        return
      }

      // ------------------------------------------------ conexão SSH
      if (msg.command === 'start') {
        if (started) return
        startSsh(msg)
        return
      }
      if (msg.command === 'close') {
        endSession('client_close')
        return
      }
      if (!sshReady) {
        if (CONTROL_COMMANDS.has(msg.command)) {
          send({
            type: 'result',
            id: msg.id,
            ok: false,
            error: 'SSH não conectado',
          })
        }
        return
      }

      // ------------------------------------------------ terminais
      if (msg.command === 'attach') return attach(msg)
      if (msg.command === 'send') {
        const ch = channels.get(msg.sid)
        if (ch && !ch.pending && typeof msg.data === 'string') {
          ch.stream.write(msg.data)
        }
        return
      }
      if (msg.command === 'resize') {
        const ch = channels.get(msg.sid)
        if (ch && !ch.pending) {
          const { cols, rows } = clampSize(msg.cols, msg.rows)
          ch.stream.setWindow(rows, cols, 0, 0)
        }
        return
      }
      if (msg.command === 'detach') {
        closeChannel(msg.sid, 'client_detach')
        return
      }

      // ------------------------------------------------ controle tmux
      if (CONTROL_COMMANDS.has(msg.command)) {
        const id = msg.id
        if (
          !((typeof id === 'string' && id.length <= 36) || Number.isInteger(id))
        ) {
          return
        }
        control(msg)
      }
    })

    ws.on('close', () => {
      closed = true
      clearTimeout(authTimer)
      clearInterval(heartbeat)
      activeConnections--
      if (identity) {
        const n = (perUser.get(identity.sub) ?? 1) - 1
        if (n <= 0) perUser.delete(identity.sub)
        else perUser.set(identity.sub, n)
      }
      endSession('ws_closed')
    })
  })

  return { server, wss, verifier }
}

async function main() {
  let config
  try {
    config = loadConfig()
  } catch (err) {
    console.error(`❌ ${err.message}`)
    process.exit(1)
  }

  const { server, wss } = await createTerminalServer(config)

  if (!config.privateKey) {
    defaultLog('warning', {
      message:
        'TERMINAL_PRIVATE_KEY ausente: só o modo SSH_* (credencial do .env) funciona',
    })
  }

  server.listen(config.port, config.host, () => {
    defaultLog('listening', {
      version: VERSION,
      protocol: PROTOCOL,
      port: config.port,
      host: config.host,
      tls: Boolean(config.tls),
      origins: [...config.allowedOrigins],
    })
  })

  const shutdown = (signal) => {
    defaultLog('shutdown', { signal })
    for (const ws of wss.clients) ws.close(1001, 'server shutdown')
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(0), 3000).unref()
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

if (require.main === module) {
  require('dotenv').config()
  main()
}

module.exports = { createTerminalServer }
