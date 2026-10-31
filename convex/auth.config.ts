import type { AuthConfig } from 'convex/server'

/**
 * Autenticação do Convex com JWT emitido pelo próprio Next.js.
 *
 * - O Next.js (rota /api/convex/token) assina um JWT ES256 com a chave
 *   privada CONVEX_AUTH_PRIVATE_KEY, depois de validar a sessão do NextAuth.
 * - O Convex valida a assinatura com a chave pública, fornecida inline como
 *   JWKS em data URI (CONVEX_AUTH_JWKS) — assim o Convex cloud não precisa
 *   alcançar o Next.js (que em dev roda em localhost).
 *
 * Gere o par com `node scripts/gen-convex-auth-keys.mjs` e configure:
 *   Convex  (npx convex env set):  CONVEX_AUTH_ISSUER, CONVEX_AUTH_JWKS
 *   Next.js (.env.local / Vercel): CONVEX_AUTH_ISSUER, CONVEX_AUTH_PRIVATE_KEY,
 *                                  CONVEX_AUTH_KID
 */
export default {
  providers: [
    {
      type: 'customJwt',
      applicationID: 'convex',
      issuer: process.env.CONVEX_AUTH_ISSUER!,
      jwks: process.env.CONVEX_AUTH_JWKS!,
      algorithm: 'ES256',
    },
  ],
} satisfies AuthConfig
