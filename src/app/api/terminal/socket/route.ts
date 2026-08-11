/**
 * API Route para WebSocket Terminal SSH
 *
 * Este arquivo será transformado em um WebSocket handler
 * Uso no frontend: new WebSocket('ws://localhost:3000/api/terminal/socket')
 */

import { auth } from '@/auth/auth'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/terminal/socket - Inicia sessão SSH
 *
 * Body esperado:
 * {
 *   "command": "start" | "send" | "resize",
 *   "data": "comando a executar",
 *   "cols": 80,
 *   "rows": 24
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Verifica autenticação
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Verifica email autorizado
    const authorizedEmail = process.env.TERMINAL_AUTHORIZED_EMAIL || 'fbc623@gmail.com'
    if (session.user.email !== authorizedEmail) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { command, data, cols, rows } = body

    // Nota: WebSocket real será implementado via socket.io ou ws library
    // Por enquanto retornamos um placeholder

    if (command === 'start') {
      return NextResponse.json({
        status: 'initialized',
        message: 'Terminal inicializado. Credenciais SSH necessárias.',
        requiresConfig: true,
      })
    }

    if (command === 'send') {
      return NextResponse.json({
        status: 'error',
        message: 'Conexão SSH não configurada. Configure variáveis de ambiente.',
      })
    }

    return NextResponse.json({
      status: 'error',
      message: 'Comando desconhecido',
    })
  } catch (error) {
    console.error('Erro no socket terminal:', error)
    return NextResponse.json(
      { error: 'Erro ao processar comando' },
      { status: 500 }
    )
  }
}
