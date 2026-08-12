import { NextResponse } from 'next/server'

import crypto from 'crypto'

import { auth } from '@/auth/auth'

/**
 * GET /api/terminal/token
 *
 * Emite um token de curta duração (60s) usado pelo navegador para abrir o
 * WebSocket diretamente com o Terminal Server rodando no VPS. O token é um
 * HMAC assinado com TERMINAL_TOKEN_SECRET — o mesmo segredo precisa estar
 * configurado no .env do vps-terminal-server.js (veja
 * docs/TERMINAL_VPS_INSTALL.md). Isso evita expor esse segredo no bundle do
 * cliente.
 */
export async function GET() {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const authorizedEmail =
    process.env.TERMINAL_AUTHORIZED_EMAIL || 'fbc623@gmail.com'
  if (session.user.email !== authorizedEmail) {
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
  const signature = crypto
    .createHmac('sha256', secret)
    .update(String(expiresAt))
    .digest('hex')

  return NextResponse.json({
    token: `${expiresAt}.${signature}`,
    expiresAt,
    wsUrl,
  })
}
