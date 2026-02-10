// app/api/card-payment/route.ts
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { NextRequest, NextResponse } from 'next/server'

import { api } from '@/../convex/_generated/api'
import { fetchMutation } from 'convex/nextjs'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validações básicas
    if (!body.token || !body.amount || !body.email) {
      return NextResponse.json(
        { error: 'Token, valor e email são obrigatórios' },
        { status: 400 },
      )
    }

    // Criar pagamento com cartão
    const result = await payment.create({
      body: {
        transaction_amount: body.amount,
        description: body.description || 'Pagamento com cartão',
        payment_method_id: body.paymentMethodId, // 'visa', 'master', 'elo', etc.
        token: body.token, // Token do cartão gerado no frontend
        installments: body.installments || 1, // Parcelas
        payer: {
          email: body.email,
          first_name: body.name?.split(' ')[0] || '',
          last_name: body.name?.split(' ').slice(1).join(' ') || '',
          identification: body.cpf
            ? {
                type: 'CPF',
                number: body.cpf.replace(/\D/g, ''),
              }
            : undefined,
        },
      },
      requestOptions: {
        idempotencyKey: crypto.randomUUID(),
      },
    })

    // Salvar no Convex
    if (body.userId) {
      await fetchMutation(api.payments.createPayment, {
        userId: body.userId,
        mercadoPagoId: String(result.id),
        type:
          body.paymentMethodId === 'debit_card' ? 'debit_card' : 'credit_card',
        status: result.status as 'pending' | 'approved' | 'rejected',
        amount: body.amount,
        description: body.description || 'Pagamento com cartão',
        payerEmail: body.email,
        payerName: body.name,
        cardLastFourDigits: result.card?.last_four_digits,
        cardBrand: result.card?.first_six_digits, // Bandeira
        subscriptionId: body.subscriptionId,
      })
    }

    return NextResponse.json({
      id: result.id,
      status: result.status,
      status_detail: result.status_detail,
      payment_method_id: result.payment_method_id,
      card_last_four_digits: result.card?.last_four_digits,
      installments: result.installments,
      transaction_amount: result.transaction_amount,
    })
  } catch (error: unknown) {
    console.error('Erro ao processar pagamento com cartão:', error)
    const message =
      error instanceof Error ? error.message : 'Erro ao processar pagamento'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
