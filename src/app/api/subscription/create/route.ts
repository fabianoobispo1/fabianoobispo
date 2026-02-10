// app/api/subscription/create/route.ts
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import { NextRequest, NextResponse } from 'next/server'

import { api } from '@/../convex/_generated/api'
import { fetchMutation } from 'convex/nextjs'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const preApproval = new PreApproval(client)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validações
    if (!body.planId || !body.userId || !body.cardToken || !body.email) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Calcular datas baseado na frequência
    const frequencyMap: Record<string, number> = {
      monthly: 1,
      quarterly: 3,
      semiannual: 6,
      annual: 12,
    }

    const months = frequencyMap[body.frequency] || 1

    // Criar assinatura no Mercado Pago
    const result = await preApproval.create({
      body: {
        reason: body.planName || 'Assinatura',
        auto_recurring: {
          frequency: months,
          frequency_type: 'months',
          transaction_amount: body.amount,
          currency_id: 'BRL',
        },
        back_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/assinaturas`,
        payer_email: body.email,
        card_token_id: body.cardToken,
        status: 'authorized',
      },
    })

    // Salvar no Convex
    const subscriptionId = await fetchMutation(
      api.subscriptions.createSubscription,
      {
        userId: body.userId,
        planId: body.planId,
        mercadoPagoPreapprovalId: result.id,
        cardToken: body.cardToken,
        cardLastFourDigits: body.cardLastFourDigits,
        cardBrand: body.cardBrand,
        startDate: Date.now(),
      },
    )

    // Processar primeiro pagamento
    const firstPaymentResponse = await fetch(
      `${request.nextUrl.origin}/api/card-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: body.cardToken,
          amount: body.amount,
          description: `${body.planName} - 1º pagamento`,
          email: body.email,
          name: body.name,
          cpf: body.cpf,
          paymentMethodId: 'credit_card',
          installments: 1,
          userId: body.userId,
          subscriptionId,
        }),
      },
    )

    const firstPayment = await firstPaymentResponse.json()

    if (firstPayment.status === 'approved') {
      // Ativar assinatura
      await fetchMutation(api.subscriptions.updateSubscriptionStatus, {
        subscriptionId,
        status: 'active',
      })

      await fetchMutation(api.subscriptions.recordBillingPayment, {
        subscriptionId,
        success: true,
      })
    }

    return NextResponse.json({
      subscriptionId,
      mercadoPagoId: result.id,
      status: result.status,
      firstPayment,
    })
  } catch (error: unknown) {
    console.error('Erro ao criar assinatura:', error)
    const message =
      error instanceof Error ? error.message : 'Erro ao criar assinatura'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
