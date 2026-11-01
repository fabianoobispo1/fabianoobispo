'use strict'

/**
 * Testes do servidor sem SSH real: upgrade (Origin), autenticação pela 1ª
 * mensagem e validação do `start`/`attach`.
 */
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { EventEmitter } = require('node:events')
const WebSocket = require('ws')

const { createTerminalServer } = require('../server')
const { loadConfig } = require('../lib/config')
const { signToken } = require('../lib/token')

const SECRET = 'k'.repeat(40)
const ORIGIN = 'https://fabianoobispo.com.br'
const logs = []
let server
let url

/** Cliente SSH falso: "conecta", informa que tmux existe e grava os comandos. */
const execs = []
class FakeSsh extends EventEmitter {
  connect(cfg) {
    this.cfg = cfg
    setImmediate(() => {
      cfg.hostVerifier?.(Buffer.from('host-key'))
      this.emit('ready')
    })
  }
  exec(command, opts, cb) {
    if (typeof opts === 'function') cb = opts
    execs.push(command)
    const stream = new EventEmitter()
    stream.stderr = new EventEmitter()
    stream.close = () => stream.emit('close')
    stream.write = () => {}
    stream.setWindow = () => {}
    stream.pause = () => {}
    stream.resume = () => {}
    cb(null, stream)
    setImmediate(() => {
      if (command.includes('tmux -V'))
        stream.emit('data', Buffer.from('tmux 3.4\n'))
      if (!opts?.pty) {
        stream.emit('exit', 0)
        stream.emit('close')
      }
    })
  }
  shell(opts, cb) {
    this.exec('<shell>', { pty: opts }, cb)
  }
  end() {}
}

before(async () => {
  const config = loadConfig({
    TERMINAL_TOKEN_SECRET: SECRET,
    ALLOWED_ORIGINS: ORIGIN,
    TERMINAL_AUTHORIZED_EMAIL: 'Dono@Site.com',
    MAX_CONNECTIONS_PER_USER: '2',
    SSH_HOST: '10.0.0.1',
    SSH_USER: 'dev',
    SSH_PASSWORD: 'x',
  })
  ;({ server } = await createTerminalServer(config, {
    log: (event, data) => logs.push({ event, ...data }),
    SshClient: FakeSsh,
  }))
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  url = `ws://127.0.0.1:${server.address().port}`
})

after(() => server.close())

const token = (over = {}) =>
  signToken(
    {
      sub: 'u1',
      email: 'dono@site.com',
      jti: crypto.randomBytes(16).toString('hex'),
      exp: Date.now() + 60_000,
      ...over,
    },
    over.secret ?? SECRET,
  )

/** Abre o WS; resolve com o status HTTP se o upgrade for recusado. */
function open(headers = { origin: ORIGIN }) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url, { headers })
    const messages = []
    ws.on('message', (m) => messages.push(JSON.parse(m)))
    ws.on('open', () => resolve({ ws, messages }))
    ws.on('unexpected-response', (_req, res) =>
      resolve({ status: res.statusCode }),
    )
    ws.on('error', () => {})
  })
}

const closed = (ws) => new Promise((r) => ws.on('close', (code) => r(code)))
const waitFor = async (messages, pred, ms = 2000) => {
  const end = Date.now() + ms
  while (Date.now() < end) {
    const m = messages.find(pred)
    if (m) return m
    await new Promise((r) => setTimeout(r, 10))
  }
  throw new Error('mensagem não chegou')
}

async function authed(t = token()) {
  const c = await open()
  c.ws.send(JSON.stringify({ command: 'auth', token: t }))
  await waitFor(c.messages, (m) => m.type === 'authenticated')
  return c
}

test('Origin fora da lista recebe 403 no upgrade', async () => {
  assert.equal((await open({ origin: 'https://evil.com' })).status, 403)
  assert.equal((await open({})).status, 403) // sem Origin
  assert.ok(logs.some((l) => l.event === 'origin_rejected'))
})

test('Origin permitida abre o WebSocket', async () => {
  const c = await open()
  assert.ok(c.ws)
  c.ws.close()
})

test('1ª mensagem que não é auth fecha com 4401', async () => {
  const { ws } = await open()
  ws.send(JSON.stringify({ command: 'start' }))
  assert.equal(await closed(ws), 4401)
})

test('token com assinatura errada fecha com 4401', async () => {
  const { ws } = await open()
  ws.send(
    JSON.stringify({
      command: 'auth',
      token: token({ secret: 'z'.repeat(40) }),
    }),
  )
  assert.equal(await closed(ws), 4401)
})

test('token expirado fecha com 4401', async () => {
  const { ws } = await open()
  ws.send(
    JSON.stringify({ command: 'auth', token: token({ exp: Date.now() - 1 }) }),
  )
  assert.equal(await closed(ws), 4401)
})

test('reuso do mesmo token (jti) fecha com 4401', async () => {
  const t = token()
  const first = await authed(t)
  const { ws } = await open()
  ws.send(JSON.stringify({ command: 'auth', token: t }))
  assert.equal(await closed(ws), 4401)
  assert.ok(
    logs.some((l) => l.event === 'auth_failed' && l.reason === 'replay'),
  )
  first.ws.close()
})

test('e-mail diferente do autorizado fecha com 4403', async () => {
  const { ws } = await open()
  ws.send(
    JSON.stringify({
      command: 'auth',
      token: token({ email: 'outro@site.com' }),
    }),
  )
  assert.equal(await closed(ws), 4403)
})

test('limite de conexões por usuário fecha com 4429', async () => {
  const a = await authed(token({ sub: 'limite' }))
  const b = await authed(token({ sub: 'limite' }))
  const { ws } = await open()
  ws.send(JSON.stringify({ command: 'auth', token: token({ sub: 'limite' }) }))
  assert.equal(await closed(ws), 4429)
  a.ws.close()
  b.ws.close()
})

test('start: fingerprint de host malformada é recusada', async () => {
  const c = await authed()
  // credencial do .env não aceita hostKey do cliente; testa o formato via
  // conexão salva sem TERMINAL_PRIVATE_KEY → config_required
  c.ws.send(
    JSON.stringify({ command: 'start', sealedCredential: 'x'.repeat(80) }),
  )
  const m = await waitFor(c.messages, (m) => m.type === 'config_required')
  assert.match(m.message, /TERMINAL_PRIVATE_KEY/)
  c.ws.close()
})

test('attach e controle validam o nome da sessão antes de rodar algo', async () => {
  const c = await authed()
  c.ws.send(JSON.stringify({ command: 'start' }))
  const ready = await waitFor(c.messages, (m) => m.type === 'ready')
  assert.equal(ready.tmux.available, true)
  assert.match(ready.hostKey.fingerprint, /^SHA256:/)

  const before = execs.length
  c.ws.send(
    JSON.stringify({
      command: 'attach',
      sid: 'w1',
      session: 'agent-1;id',
      cols: 80,
      rows: 24,
    }),
  )
  await waitFor(
    c.messages,
    (m) => m.type === 'error' && /sessão inválido/.test(m.message),
  )
  c.ws.send(JSON.stringify({ command: 'kill', id: 1, name: '$(reboot)' }))
  await waitFor(c.messages, (m) => m.type === 'result' && m.id === 1 && !m.ok)
  c.ws.send(JSON.stringify({ command: 'create', id: 2, cwd: "/tmp'; id; '" }))
  await waitFor(
    c.messages,
    (m) => m.type === 'result' && m.id === 2 && /Pasta/.test(m.error),
  )
  assert.equal(execs.length, before, 'nenhum comando chegou ao host')

  c.ws.send(
    JSON.stringify({
      command: 'attach',
      sid: 'w1',
      session: 'agent-1',
      cols: 80,
      rows: 24,
    }),
  )
  const att = await waitFor(c.messages, (m) => m.type === 'attached')
  assert.equal(att.mode, 'tmux')
  assert.match(
    execs.at(-1),
    /^exec tmux -L webdeck new-session -A -s 'agent-1'/,
  )
  c.ws.close()
})
