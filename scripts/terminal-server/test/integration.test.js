'use strict'

/**
 * Integração com SSH + tmux de verdade. Só roda com TEST_SSH_PORT definido
 * (veja test/sshd/Dockerfile); senão é pulado.
 */
const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const WebSocket = require('ws')

const { createTerminalServer } = require('../server')
const { loadConfig } = require('../lib/config')
const { signToken } = require('../lib/token')

const PORT = process.env.TEST_SSH_PORT
const skip = !PORT && 'defina TEST_SSH_PORT (sshd de test/sshd)'
const SECRET = 'i'.repeat(40)
const ORIGIN = 'http://localhost:3000'
let server

async function boot(extra = {}) {
  const cfg = loadConfig({
    TERMINAL_TOKEN_SECRET: SECRET,
    ALLOWED_ORIGINS: ORIGIN,
    SSH_HOST: '127.0.0.1',
    SSH_PORT: PORT,
    SSH_USER: 'dev',
    SSH_PASSWORD: 'devpass123',
    ...extra,
  })
  const s = (await createTerminalServer(cfg, { log: () => {} })).server
  await new Promise((r) => s.listen(0, '127.0.0.1', r))
  return s
}

async function client(srv) {
  const ws = new WebSocket(`ws://127.0.0.1:${srv.address().port}`, {
    headers: { origin: ORIGIN },
  })
  const q = []
  ws.on('message', (m) => q.push(JSON.parse(m)))
  await new Promise((r) => ws.on('open', r))
  const wait = async (pred, ms = 10_000) => {
    const end = Date.now() + ms
    while (Date.now() < end) {
      const i = q.findIndex(pred)
      if (i >= 0) return q.splice(i, 1)[0]
      await new Promise((r) => setTimeout(r, 20))
    }
    throw new Error('timeout')
  }
  let id = 0
  const req = (command, args = {}) => {
    const my = ++id
    ws.send(JSON.stringify({ command, id: my, ...args }))
    return wait((m) => m.type === 'result' && m.id === my)
  }
  const send = (o) => ws.send(JSON.stringify(o))
  send({
    command: 'auth',
    token: signToken(
      {
        sub: 'it',
        email: 'it@local',
        jti: crypto.randomBytes(16).toString('hex'),
        exp: Date.now() + 60_000,
      },
      SECRET,
    ),
  })
  await wait((m) => m.type === 'authenticated')
  send({ command: 'start' })
  return { ws, wait, req, send }
}

before(async () => {
  if (!skip) server = await boot()
})
after(() => server?.close())

test(
  'sessões tmux: criar, anexar, persistir, preview, capture, kill',
  { skip },
  async () => {
    let c = await client(server)
    const ready = await c.wait((m) => m.type === 'ready')
    assert.equal(ready.tmux.available, true)
    for (const s of (await c.req('list')).data.sessions)
      await c.req('kill', { name: s.name })

    const created = await c.req('create', { cwd: '/tmp' })
    assert.equal(created.data.name, 'agent-1')
    c.send({
      command: 'attach',
      sid: 'a',
      session: 'agent-1',
      cols: 100,
      rows: 30,
    })
    assert.equal((await c.wait((m) => m.type === 'attached')).mode, 'tmux')
    c.send({ command: 'send', sid: 'a', data: 'echo MARK-$((40+2))\r' })
    await c.wait((m) => m.type === 'output' && m.data.includes('MARK-42'))
    c.ws.close()
    await new Promise((r) => setTimeout(r, 300))

    c = await client(server)
    await c.wait((m) => m.type === 'ready')
    const list = (await c.req('list')).data.sessions
    assert.deepEqual(
      list.map((s) => s.name),
      ['agent-1'],
    )
    const preview = (await c.req('preview', { name: 'agent-1' })).data.lines
    assert.ok(preview.some((l) => l.includes('MARK-42')))
    const text = (await c.req('capture', { name: 'agent-1' })).data.text
    assert.ok(text.includes('MARK-42'))
    assert.equal((await c.req('kill', { name: 'agent-1' })).ok, true)
    assert.equal((await c.req('list')).data.sessions.length, 0)
    c.ws.close()
  },
)

test('host key divergente é recusada', { skip }, async () => {
  const srv = await boot({ SSH_HOST_FINGERPRINT: 'SHA256:' + 'A'.repeat(43) })
  const c = await client(srv)
  const m = await c.wait(
    (x) => x.type === 'host_key_mismatch' || x.type === 'ready',
  )
  assert.equal(m.type, 'host_key_mismatch')
  assert.match(m.seen, /^SHA256:/)
  c.ws.close()
  srv.close()
})
