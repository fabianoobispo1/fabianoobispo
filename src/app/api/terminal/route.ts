import { auth } from '@/auth/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/terminal - Verifica autenticação e retorna status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Verifica se usuário está autenticado
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verifica se é o email autorizado
    const authorizedEmail = process.env.TERMINAL_AUTHORIZED_EMAIL || 'fbc623@gmail.com'
    if (session.user.email !== authorizedEmail) {
      return NextResponse.json(
        { error: 'Email não autorizado para acessar terminal' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      status: 'ok',
      user: session.user.email,
      authorized: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao verificar autenticação' },
      { status: 500 }
    )
  }
}
