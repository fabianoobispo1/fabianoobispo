import { NextRequest, NextResponse } from 'next/server'


// Esta rota deve ser chamada periodicamente (ex: a cada hora) por um cron job
// Para configurar um cron job no Vercel, use Vercel Cron Jobs
// https://vercel.com/docs/cron-jobs

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
