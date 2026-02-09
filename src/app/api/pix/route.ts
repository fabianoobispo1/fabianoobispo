// app/api/pix/route.ts
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { NextRequest, NextResponse } from 'next/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await payment.create({
      body: {
        transaction_amount: body.amount,
        description: body.description || 'Pagamento via Pix',
        payment_method_id: 'pix',
        payer: {
          email: body.email,
          first_name: body.name?.split(' ')[0] || '',
          last_name: body.name?.split(' ').slice(1).join(' ') || '',
        },
      },
      requestOptions: {
        idempotencyKey: crypto.randomUUID(),
      },
    })

    // O resultado traz o QR code e o codigo copia-e-cola
    return NextResponse.json({
      id: result.id,
      status: result.status,
      qr_code: result.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64:
        result.point_of_interaction?.transaction_data?.qr_code_base64,
      ticket_url: result.point_of_interaction?.transaction_data?.ticket_url,
    })
  } catch (error: unknown) {
    console.error('Erro ao criar pagamento Pix:', error)
    const message =
      error instanceof Error ? error.message : 'Erro ao processar pagamento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
