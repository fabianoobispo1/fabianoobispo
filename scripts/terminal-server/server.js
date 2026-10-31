#!/usr/bin/env node
'use strict'

/**
 * Terminal Server — ponte entre o WebSocket do navegador e uma sessão SSH
 * real (ssh2). Roda como container na VPS, porque WebSocket de longa
 * duração não cabe em função serverless.
 *
 * Protocolo (JSON por mensagem):
 *   cliente → { command: 'auth', token }           (1ª mensagem, até 5 s)
 *   servidor → { type: 'authenticated' }
 *   cliente → { command: 'start', cols, rows, sealedCredential? }
 *             { command: 'send', data } | { command: 'resize', cols, rows }
 *             { command: 'close' }
 *   servidor → { type: 'ready' | 'output' | 'error' | 'closed' | 'config_required', ... }
 *
 * Segurança:
 * - token HMAC de uso único (jti), 60 s, com sub/e-mail (lib/token.js)
 * - Origin validado contra ALLOWED_ORIGINS (lib/origin.js)
 * - credenciais seladas com a chave pública; só TERMINAL_PRIVATE_KEY abre
 * - limites de tamanho do terminal, de mensagem e de conexões
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
const { log: defaultLog } = require('./lib/log')

const VERSION = '2.0.0'
// Acima disso pausa o stream SSH até o navegador consumir a saída
const HIGH_WATER_MARK = 4 * 1024 * 1024

function clientIp(req, trustProxy) {
  if (trustProxy) {
    const fwd = req.headers['x-forwarded-for']
    if (typeof fwd === 'string' && fwd) return fwd.split(',')[0].trim()
  }
  return req.socket.remoteAddress
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
      res.end(JSON.stringify({ status: 'ok', version: VERSION }))
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
    let stream = null
    let started = false
    let session = null // { target, mode, startedAt }
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

    const endSession = (reason) => {
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
      stream?.end()
      conn?.end()
    }

    const startSsh = (msg) => {
      let creds
      let mode
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
      } else if (config.defaultSsh) {
        creds = config.defaultSsh
        mode = 'default'
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
      const { cols, rows } = clampSize(msg.cols, msg.rows)
      conn = new SshClient()

      conn.on('ready', () => {
        session = { target, mode, startedAt: Date.now() }
        log('session_start', {
          conn: connId,
          sub: identity.sub,
          email: identity.email,
          ip,
          target,
          mode,
        })

        conn.shell({ cols, rows, term: 'xterm-256color' }, (err, str) => {
          if (err) {
            send({ type: 'error', message: err.message })
            endSession('shell_error')
            return
          }
          stream = str
          send({ type: 'ready', message: 'Conexão SSH estabelecida' })

          const onData = (data) => {
            send({ type: 'output', data: data.toString('utf8') })
            if (ws.bufferedAmount > HIGH_WATER_MARK) {
              str.pause()
              const check = setInterval(() => {
                if (closed || ws.bufferedAmount < HIGH_WATER_MARK / 4) {
                  clearInterval(check)
                  if (!closed) str.resume()
                }
              }, 50)
            }
          }
          str.on('data', onData)
          str.stderr.on('data', onData)
          str.on('close', () => {
            send({ type: 'closed', message: 'Sessão SSH encerrada' })
            endSession('remote_closed')
          })
        })
      })

      conn.on('keyboard-interactive', (_n, _i, _l, prompts, finish) => {
        finish(prompts.map(() => creds.password ?? ''))
      })

      conn.on('error', (err) => {
        log('ssh_error', {
          conn: connId,
          sub: identity.sub,
          target,
          code: err.code ?? null,
        })
        send({ type: 'error', message: `Erro SSH: ${err.message}` })
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
      })
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
        send({ type: 'authenticated' })
        return
      }

      // ------------------------------------------------ sessão
      if (msg.command === 'start') {
        if (started) return
        startSsh(msg)
        return
      }
      if (msg.command === 'send' && stream) {
        if (typeof msg.data === 'string') stream.write(msg.data)
        return
      }
      if (msg.command === 'resize' && stream) {
        const { cols, rows } = clampSize(msg.cols, msg.rows)
        stream.setWindow(rows, cols, 0, 0)
        return
      }
      if (msg.command === 'close') {
        endSession('client_close')
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
