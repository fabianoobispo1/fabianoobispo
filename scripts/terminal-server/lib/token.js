'use strict'

/**
 * Token de curta duração emitido por /api/terminal/token (Next.js) e
 * validado aqui. Formato: `<payloadBase64url>.<hmacSha256Hex>`, com
 * payload JSON { sub, email, jti, exp }.
 *
 * - assinatura HMAC-SHA256 com TERMINAL_TOKEN_SECRET (comparação constante)
 * - `exp` em ms; tokens com validade maior que maxTtlMs são recusados
 * - `jti` de uso único: os já usados ficam em memória até expirarem
 *
 * Manter em sincronia com src/app/api/terminal/token/route.ts.
 */

const crypto = require('crypto')

const DEFAULT_MAX_TTL_MS = 120_000

function hmac(secret, data) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex')
}

/** Usado pelos testes (o Next.js tem a própria implementação). */
function signToken(claims, secret) {
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${payload}.${hmac(secret, payload)}`
}

function createTokenVerifier({
  secret,
  now = Date.now,
  maxTtlMs = DEFAULT_MAX_TTL_MS,
}) {
  if (!secret || secret.length < 32) {
    throw new Error('TERMINAL_TOKEN_SECRET ausente ou curto (mín. 32 chars)')
  }
  /** @type {Map<string, number>} jti -> exp */
  const used = new Map()

  function purge(t) {
    for (const [jti, exp] of used) if (exp < t) used.delete(jti)
  }

  /**
   * @returns {{ ok: true, claims: { sub: string, email: string, jti: string, exp: number } }
   *         | { ok: false, reason: string }}
   */
  function verify(token) {
    if (typeof token !== 'string' || token.length > 2048) {
      return { ok: false, reason: 'malformed' }
    }
    const parts = token.split('.')
    if (parts.length !== 2) return { ok: false, reason: 'malformed' }
    const [payload, signature] = parts
    if (!/^[0-9a-f]{64}$/.test(signature)) {
      return { ok: false, reason: 'malformed' }
    }

    const expected = Buffer.from(hmac(secret, payload), 'hex')
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), expected)) {
      return { ok: false, reason: 'bad_signature' }
    }

    let claims
    try {
      claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    } catch {
      return { ok: false, reason: 'malformed' }
    }
    const { sub, email, jti, exp } = claims ?? {}
    if (
      typeof sub !== 'string' ||
      !sub ||
      typeof email !== 'string' ||
      !email ||
      typeof jti !== 'string' ||
      !/^[0-9a-f]{32,64}$/.test(jti) ||
      typeof exp !== 'number'
    ) {
      return { ok: false, reason: 'bad_claims' }
    }

    const t = now()
    if (exp <= t) return { ok: false, reason: 'expired' }
    if (exp - t > maxTtlMs) return { ok: false, reason: 'ttl_too_long' }

    purge(t)
    if (used.has(jti)) return { ok: false, reason: 'replay' }
    used.set(jti, exp)

    return { ok: true, claims: { sub, email, jti, exp } }
  }

  return { verify, _usedCount: () => used.size }
}

module.exports = { createTokenVerifier, signToken, DEFAULT_MAX_TTL_MS }
