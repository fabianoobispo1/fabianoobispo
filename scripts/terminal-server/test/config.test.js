'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')

const { loadConfig } = require('../lib/config')

const base = {
  TERMINAL_TOKEN_SECRET: 'q'.repeat(40),
  ALLOWED_ORIGINS: 'https://fabianoobispo.com.br',
}

test('config mínima válida', () => {
  const c = loadConfig(base)
  assert.equal(c.maxChannels, 8)
  assert.equal(c.defaultSsh, null)
})

test('recusa segredo curto e origins vazias', () => {
  assert.throws(
    () => loadConfig({ ...base, TERMINAL_TOKEN_SECRET: 'curto' }),
    /TERMINAL_TOKEN_SECRET/,
  )
  assert.throws(
    () => loadConfig({ ...base, ALLOWED_ORIGINS: '' }),
    /ALLOWED_ORIGINS/,
  )
})

test('produção sem TLS só sobe com ALLOW_INSECURE=1', () => {
  assert.throws(() => loadConfig({ ...base, NODE_ENV: 'production' }), /TLS/)
  assert.doesNotThrow(() =>
    loadConfig({ ...base, NODE_ENV: 'production', ALLOW_INSECURE: '1' }),
  )
})

test('SSH_HOST_FINGERPRINT precisa do formato SHA256:', () => {
  const ssh = { SSH_HOST: 'h', SSH_USER: 'u', SSH_PASSWORD: 'p' }
  assert.throws(
    () => loadConfig({ ...base, ...ssh, SSH_HOST_FINGERPRINT: 'md5:aa' }),
    /SSH_HOST_FINGERPRINT/,
  )
  const c = loadConfig({
    ...base,
    ...ssh,
    SSH_HOST_FINGERPRINT: 'SHA256:' + 'A'.repeat(43),
  })
  assert.equal(c.defaultSsh.hostFingerprint, 'SHA256:' + 'A'.repeat(43))
})
