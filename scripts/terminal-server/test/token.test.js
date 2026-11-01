'use strict'

const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')

const { createTokenVerifier, signToken } = require('../lib/token')

const SECRET = 's'.repeat(40)
const NOW = 1_800_000_000_000
const jti = () => crypto.randomBytes(16).toString('hex')
const claims = (over = {}) => ({
  sub: 'user1',
  email: 'a@b.c',
  jti: jti(),
  exp: NOW + 60_000,
  ...over,
})
const verifier = () => createTokenVerifier({ secret: SECRET, now: () => NOW })

test('aceita token válido e devolve as claims', () => {
  const c = claims()
  const r = verifier().verify(signToken(c, SECRET))
  assert.equal(r.ok, true)
  assert.deepEqual(r.claims, c)
})

test('recusa token expirado', () => {
  const r = verifier().verify(signToken(claims({ exp: NOW - 1 }), SECRET))
  assert.deepEqual(r, { ok: false, reason: 'expired' })
})

test('recusa exp exatamente agora', () => {
  const r = verifier().verify(signToken(claims({ exp: NOW }), SECRET))
  assert.equal(r.reason, 'expired')
})

test('recusa validade longa demais (token "eterno")', () => {
  const r = verifier().verify(
    signToken(claims({ exp: NOW + 24 * 3600_000 }), SECRET),
  )
  assert.equal(r.reason, 'ttl_too_long')
})

test('recusa assinatura com outro segredo', () => {
  const r = verifier().verify(signToken(claims(), 'x'.repeat(40)))
  assert.equal(r.reason, 'bad_signature')
})

test('recusa payload adulterado mantendo a assinatura', () => {
  const token = signToken(claims(), SECRET)
  const [, sig] = token.split('.')
  const forged = Buffer.from(JSON.stringify(claims({ sub: 'admin' }))).toString(
    'base64url',
  )
  assert.equal(verifier().verify(`${forged}.${sig}`).reason, 'bad_signature')
})

test('recusa reuso do jti (replay)', () => {
  const v = verifier()
  const token = signToken(claims(), SECRET)
  assert.equal(v.verify(token).ok, true)
  assert.deepEqual(v.verify(token), { ok: false, reason: 'replay' })
})

test('jti usado é esquecido depois de expirar', () => {
  let now = NOW
  const v = createTokenVerifier({ secret: SECRET, now: () => now })
  v.verify(signToken(claims({ exp: NOW + 1000 }), SECRET))
  assert.equal(v._usedCount(), 1)
  now = NOW + 2000
  v.verify(signToken(claims({ exp: now + 1000 }), SECRET))
  assert.equal(v._usedCount(), 1) // o antigo saiu, o novo entrou
})

test('recusa claims faltando ou jti fora do formato', () => {
  const v = verifier()
  for (const bad of [
    claims({ sub: '' }),
    claims({ email: undefined }),
    claims({ jti: 'curto' }),
    claims({ jti: 'Z'.repeat(32) }),
    claims({ exp: String(NOW + 1000) }),
  ]) {
    assert.equal(v.verify(signToken(bad, SECRET)).reason, 'bad_claims')
  }
})

test('recusa formatos inválidos', () => {
  const v = verifier()
  for (const bad of [
    undefined,
    123,
    '',
    'sem-ponto',
    'a.b.c',
    `abc.${'0'.repeat(63)}`,
    `abc.${'g'.repeat(64)}`,
    'x'.repeat(3000),
  ]) {
    assert.equal(v.verify(bad).reason, 'malformed', String(bad).slice(0, 20))
  }
})

test('exige segredo de pelo menos 32 caracteres', () => {
  assert.throws(() => createTokenVerifier({ secret: 'curto' }))
  assert.throws(() => createTokenVerifier({ secret: undefined }))
})
