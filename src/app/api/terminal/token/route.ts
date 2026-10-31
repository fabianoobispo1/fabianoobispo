import { NextResponse } from 'next/server'

import crypto from 'crypto'

import { auth } from '@/auth/auth'

/**
 * GET /api/terminal/token
 *
 * Emite um token de uso único e curta duração (60 s) para o navegador
 * abrir o WebSocket com o Terminal Server na VPS. O navegador o envia na
 * PRIMEIRA mensagem do WS (nunca na URL).
 *
 * Formato: `<base64url(JSON{ sub, email, jti, exp })>.<hmacSha256Hex>`,
 * assinado com TERMINAL_TOKEN_SECRET (o mesmo do .env do Terminal Server).
 * O servidor recusa `jti` repetido. Manter em sincronia com
 * scripts/terminal-server/lib/token.js.
 */
export async function GET() {
  const session = await auth()

  if (!session?.user?.email || !session.user.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // Sem TERMINAL_AUTHORIZED_EMAIL o terminal fica desabilitado
  const authorizedEmail = process.env.TERMINAL_AUTHORIZED_EMAIL?.trim()
  if (!authorizedEmail) {
    return NextResponse.json(
      { error: 'Terminal desabilitado' },
      { status: 503 },
    )
  }
  if (
    session.user.email.trim().toLowerCase() !== authorizedEmail.toLowerCase()
  ) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const secret = process.env.TERMINAL_TOKEN_SECRET
  const wsUrl = process.env.TERMINAL_VPS_WS_URL

  if (!secret || !wsUrl) {
    return NextResponse.json(
      {
        error:
          'Terminal Server não configurado. Defina TERMINAL_TOKEN_SECRET e TERMINAL_VPS_WS_URL.',
      },
      { status: 503 },
    )
  }

  const expiresAt = Date.now() + 60_000
  const payload = Buffer.from(
    JSON.stringify({
      sub: session.user.id,
      email: session.user.email,
      jti: crypto.randomBytes(16).toString('hex'),
      exp: expiresAt,
    }),
  ).toString('base64url')
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return NextResponse.json(
    { token: `${payload}.${signature}`, expiresAt, wsUrl },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
