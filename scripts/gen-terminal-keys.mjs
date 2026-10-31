#!/usr/bin/env node
/**
 * Gera o par de chaves X25519 (libsodium sealed box) do Terminal Server.
 *
 *   node scripts/gen-terminal-keys.mjs
 *
 * - NEXT_PUBLIC_TERMINAL_PUBLIC_KEY → Next.js (.env.local e Vercel). É pública:
 *   o navegador usa para selar a senha/chave antes de salvar no Convex.
 * - TERMINAL_PRIVATE_KEY → SOMENTE no .env do Terminal Server na VPS. Quem
 *   tiver esta chave abre todas as credenciais salvas. NÃO commite.
 *
 * Trocar o par invalida as credenciais já salvas (precisam ser redigitadas).
 */
import sodium from 'libsodium-wrappers'

await sodium.ready
const { publicKey, privateKey } = sodium.crypto_box_keypair()
const b64 = (u8) => sodium.to_base64(u8, sodium.base64_variants.ORIGINAL)

console.log('# ---- Next.js (.env.local e Vercel) ----')
console.log(`NEXT_PUBLIC_TERMINAL_PUBLIC_KEY=${b64(publicKey)}`)
console.log('')
console.log('# ---- Terminal Server (/opt/terminal-server/.env na VPS) ----')
console.log(`TERMINAL_PRIVATE_KEY=${b64(privateKey)}`)
