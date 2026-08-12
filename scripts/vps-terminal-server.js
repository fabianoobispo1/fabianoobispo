#!/usr/bin/env node

/**
 * VPS Terminal Server - Faz a ponte entre o WebSocket do navegador e uma
 * sessão SSH real (via ssh2). Roda como processo/container separado no
 * VPS, porque WebSocket de longa duração não funciona em funções
 * serverless (Vercel).
 *
 * Instale as dependências:
 * npm install ws ssh2 dotenv
 *
 * Rode com:
 * TERMINAL_TOKEN_SECRET=seu-secret PORT=3002 node vps-terminal-server.js
 *
 * Ou use scripts/deploy-terminal-docker.sh (recomendado).
 *
 * Para servir wss:// diretamente (sem Nginx na frente), defina TLS_CERT
 * e TLS_KEY apontando para um certificado (pode ser autoassinado para
 * testes — veja docs/TERMINAL_VPS_INSTALL.md).
 *
 * Veja docs/TERMINAL_VPS_INSTALL.md para o guia completo.
 */

const http = require('http')
const https = require('https')
const fs = require('fs')
const crypto = require('crypto')
const { WebSocketServer } = require('ws')
const { Client } = require('ssh2')
const dotenv = require('dotenv')

dotenv.config()

const PORT = process.env.PORT || 3002
const TOKEN_SECRET = process.env.TERMINAL_TOKEN_SECRET
const TLS_CERT = process.env.TLS_CERT
const TLS_KEY = process.env.TLS_KEY

if (!TOKEN_SECRET) {
  console.error('❌ TERMINAL_TOKEN_SECRET não configurado no .env')
  process.exit(1)
}

// Credenciais SSH de fallback, usadas quando o cliente não seleciona
// nenhuma conexão salva (compatibilidade com o modo de conexão única)
const DEFAULT_SSH = {
  host: process.env.SSH_HOST,
  port: parseInt(process.env.SSH_PORT || '22', 10),
  username: process.env.SSH_USER,
  authMethod: process.env.SSH_PRIVATE_KEY ? 'privateKey' : 'password',
  password: process.env.SSH_PASSWORD,
  privateKey: process.env.SSH_PRIVATE_KEY,
  privateKeyPassphrase: process.env.SSH_PRIVATE_KEY_PASSPHRASE,
}

/**
 * Valida o token de curta duração emitido por /api/terminal/token.
 * Formato: "<expiresAtMs>.<hmacSha256Hex>"
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false

  const [expiresAtStr, signature] = token.split('.')
  const expiresAt = Number(expiresAtStr)
  if (!expiresAt || !signature) return false
  if (Date.now() > expiresAt) return false

  const expected = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(expiresAtStr)
    .digest('hex')

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

const requestHandler = (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', version: '1.0.0' }))
    return
  }
  res.writeHead(404)
  res.end()
}

const useTls = Boolean(TLS_CERT && TLS_KEY)
const server = useTls
  ? https.createServer(
      { cert: fs.readFileSync(TLS_CERT), key: fs.readFileSync(TLS_KEY) },
      requestHandler,
    )
  : http.createServer(requestHandler)

const wss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const token = url.searchParams.get('token')

  if (!verifyToken(token)) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
    socket.destroy()
    return
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws)
  })
})

wss.on('connection', (ws) => {
  /** @type {import('ssh2').Client | null} */
  let conn = null
  /** @type {import('ssh2').ClientChannel | null} */
  let stream = null

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }

    if (msg.command === 'start') {
      const creds =
        msg.credentials && msg.credentials.host ? msg.credentials : DEFAULT_SSH

      if (
        !creds.host ||
        !creds.username ||
        (!creds.password && !creds.privateKey)
      ) {
        ws.send(
          JSON.stringify({
            type: 'config_required',
            message:
              'Credenciais SSH ausentes. Salve uma conexão na aba "Conexões" ou configure SSH_* no .env do servidor.',
          }),
        )
        return
      }

      conn = new Client()

      conn.on('ready', () => {
        conn.shell({ cols: msg.cols || 120, rows: msg.rows || 30 }, (err, str) => {
          if (err) {
            ws.send(JSON.stringify({ type: 'error', message: err.message }))
            return
          }

          stream = str
          ws.send(
            JSON.stringify({ type: 'ready', message: 'Conexão SSH estabelecida' }),
          )

          stream.on('data', (data) => {
            ws.send(JSON.stringify({ type: 'output', data: data.toString('utf8') }))
          })
          stream.stderr.on('data', (data) => {
            ws.send(JSON.stringify({ type: 'output', data: data.toString('utf8') }))
          })
          stream.on('close', () => {
            ws.send(JSON.stringify({ type: 'closed', message: 'Sessão SSH encerrada' }))
            conn?.end()
          })
        })
      })

      conn.on('error', (err) => {
        ws.send(JSON.stringify({ type: 'error', message: `Erro SSH: ${err.message}` }))
      })

      conn.connect({
        host: creds.host,
        port: creds.port || 22,
        username: creds.username,
        password: creds.authMethod !== 'privateKey' ? creds.password : undefined,
        privateKey: creds.authMethod === 'privateKey' ? creds.privateKey : undefined,
        passphrase: creds.privateKeyPassphrase || undefined,
        readyTimeout: 10000,
        tryKeyboard: true,
      })
      return
    }

    if (msg.command === 'send' && stream) {
      stream.write(msg.data)
      return
    }

    if (msg.command === 'resize' && stream) {
      stream.setWindow(msg.rows || 30, msg.cols || 120, 0, 0)
      return
    }

    if (msg.command === 'close') {
      stream?.end()
      conn?.end()
    }
  })

  ws.on('close', () => {
    stream?.end()
    conn?.end()
  })
})

// 0.0.0.0: dentro do container Docker o isolamento é feito pelo `-p` do
// `docker run` (só publica na porta que você mandar); bind em 127.0.0.1
// aqui dentro faria a porta publicada não responder a ninguém de fora.
server.listen(PORT, '0.0.0.0', () => {
  console.log(
    `Terminal Server (${useTls ? 'https/wss' : 'http/ws'}) rodando na porta ${PORT}`,
  )
})

process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando...')
  process.exit(0)
})
