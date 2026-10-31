import { SignJWT, importPKCS8 } from 'jose'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from 'convex/server'

/**
 * Emissão dos JWTs que o Convex aceita (ver convex/auth.config.ts).
 * Uso exclusivo no servidor: depende de CONVEX_AUTH_PRIVATE_KEY.
 */

export const CONVEX_AUDIENCE = 'convex'
export const SERVICE_SUBJECT = 'service:next' // espelha convex/authz.ts
const ALG = 'ES256'

let keyPromise: ReturnType<typeof importPKCS8> | null = null

function getConfig() {
  const pem = process.env.CONVEX_AUTH_PRIVATE_KEY
  const issuer = process.env.CONVEX_AUTH_ISSUER
  const kid = process.env.CONVEX_AUTH_KID
  if (!pem || !issuer || !kid) {
    throw new Error(
      'Auth do Convex não configurada: defina CONVEX_AUTH_PRIVATE_KEY, CONVEX_AUTH_ISSUER e CONVEX_AUTH_KID (veja scripts/gen-convex-auth-keys.mjs)',
    )
  }
  return { pem: pem.replace(/\\n/g, '\n'), issuer, kid }
}

function getKey(pem: string) {
  keyPromise ??= importPKCS8(pem, ALG)
  return keyPromise
}

async function sign(subject: string, ttlSeconds: number) {
  const { pem, issuer, kid } = getConfig()
  return await new SignJWT({})
    .setProtectedHeader({ alg: ALG, kid, typ: 'JWT' })
    .setSubject(subject)
    .setIssuer(issuer)
    .setAudience(CONVEX_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(await getKey(pem))
}

/** Token do usuário (sub = _id em `user`). */
export function signUserToken(userId: string) {
  return sign(userId, 10 * 60)
}

/** Token de serviço: só o servidor Next.js, para login/cadastro. */
export function signServiceToken() {
  return sign(SERVICE_SUBJECT, 60)
}

export async function serviceQuery<Q extends FunctionReference<'query'>>(
  fn: Q,
  args: FunctionArgs<Q>,
): Promise<FunctionReturnType<Q>> {
  return await fetchQuery(fn, args, { token: await signServiceToken() })
}

export async function serviceMutation<M extends FunctionReference<'mutation'>>(
  fn: M,
  args: FunctionArgs<M>,
): Promise<FunctionReturnType<M>> {
  return await fetchMutation(fn, args, { token: await signServiceToken() })
}
