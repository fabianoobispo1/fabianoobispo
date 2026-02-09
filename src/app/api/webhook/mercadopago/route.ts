// app/api/webhook/mercadopago/route.ts
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { NextRequest, NextResponse } from 'next/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Mercado Pago envia diferentes tipos de notificacao
    if (body.type === 'payment' || body.action === 'payment.updated') {
      const paymentId = body.data?.id || body.data_id

      if (!paymentId) {
        return NextResponse.json({ received: true })
      }

      // Busca detalhes do pagamento
      const paymentInfo = await payment.get({ id: paymentId })

      if (paymentInfo.status === 'approved') {
        // Pagamento aprovado! Aqui voce:
        // 1. Atualiza o status no banco de dados
        // 2. Libera acesso ao produto
        // 3. Envia email de confirmacao
        console.log(
          `Pagamento ${paymentId} aprovado!`,
          `Valor: R$${paymentInfo.transaction_amount}`,
        )

        // await db.orders.update({
        //   where: { paymentId: String(paymentId) },
        //   data: { status: "paid" },
        // });
      }
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('Erro no webhook:', error)
    // Sempre retorne 200 para o Mercado Pago nao reenviar
    return NextResponse.json({ received: true })
  }
}
