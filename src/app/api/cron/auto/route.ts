import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar token de autenticação (para segurança)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CRON_SECRET

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Cron secret não configurado' },
        { status: 500 },
      )
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // TODO: Implementar lógica de auto-cancelamento aqui
    return NextResponse.json({ message: 'Cron job executado com sucesso' })
  } catch (error) {
    console.error('Erro no cron job de auto-cancelamento:', error)

    return NextResponse.json(
      {
        error: 'Erro ao executar auto-cancelamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}
