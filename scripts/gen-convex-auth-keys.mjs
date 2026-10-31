#!/usr/bin/env node
/**
 * Gera o par de chaves ES256 usado para autenticar o Convex com JWTs emitidos
 * pelo Next.js (ver convex/auth.config.ts e src/lib/server/convex-auth.ts).
 *
 *   node scripts/gen-convex-auth-keys.mjs [issuer]
 *
 * Imprime as variáveis prontas para copiar. NÃO commite a saída.
 * - Next.js (.env.local / Vercel): CONVEX_AUTH_PRIVATE_KEY, CONVEX_AUTH_KID,
 *   CONVEX_AUTH_ISSUER
 * - Convex (npx convex env set [--prod]): CONVEX_AUTH_JWKS, CONVEX_AUTH_ISSUER
 */
import { generateKeyPairSync, randomBytes } from 'node:crypto'

const issuer = process.argv[2] || 'https://fabianoobispo.com.br'
const kid = randomBytes(8).toString('hex')

const { privateKey, publicKey } = generateKeyPairSync('ec', {
  namedCurve: 'P-256',
})

const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
const jwk = {
  ...publicKey.export({ format: 'jwk' }),
  kid,
  alg: 'ES256',
  use: 'sig',
}
const jwks = JSON.stringify({ keys: [jwk] })
const dataUri = `data:text/plain;charset=utf-8;base64,${Buffer.from(jwks).toString('base64')}`

console.log('# ---- Next.js (.env.local e Vercel) ----')
console.log(`CONVEX_AUTH_ISSUER=${issuer}`)
console.log(`CONVEX_AUTH_KID=${kid}`)
console.log(`CONVEX_AUTH_PRIVATE_KEY="${pem.trim().replace(/\n/g, '\\n')}"`)
console.log('')
console.log('# ---- Convex (dev: npx convex env set / prod: + --prod) ----')
console.log(`npx convex env set CONVEX_AUTH_ISSUER '${issuer}'`)
console.log(`npx convex env set CONVEX_AUTH_JWKS '${dataUri}'`)
