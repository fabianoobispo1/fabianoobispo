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

    // Configurações do WhatsApp
    const NUMERO_DESTINO =
      process.env.WHATSAPP_NUMERO_DESTINO || '5532991678449@c.us' // Configure no .env
    const mensagem = `🤖 *Cron Job - Auto *

Executado em: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

Status: ✅ Cron job rodando normalmente
Próxima execução: Em 1 hora

_Mensagem automática do sistema_`

    // Enviar mensagem pelo WhatsApp
    try {
      const whatsappResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/whatsapp/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId: NUMERO_DESTINO,
            contentType: 'string',
            content: mensagem,
          }),
        },
      )

      const whatsappData = await whatsappResponse.json()

      if (!whatsappResponse.ok) {
        console.error('Erro ao enviar mensagem WhatsApp:', whatsappData)
        return NextResponse.json(
          {
            message: 'Cron job executado, mas falha ao enviar WhatsApp',
            whatsappError: whatsappData,
          },
          { status: 207 }, // Multi-Status
        )
      }

      console.log('✅ Mensagem WhatsApp enviada com sucesso:', whatsappData)

      return NextResponse.json({
        message: 'Cron job executado com sucesso',
        whatsapp: 'Mensagem enviada',
        timestamp: new Date().toISOString(),
      })
    } catch (whatsappError) {
      console.error('Erro ao chamar API do WhatsApp:', whatsappError)
      return NextResponse.json(
        {
          message: 'Cron job executado, mas erro ao conectar com WhatsApp',
          whatsappError:
            whatsappError instanceof Error
              ? whatsappError.message
              : 'Erro desconhecido',
        },
        { status: 207 },
      )
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
