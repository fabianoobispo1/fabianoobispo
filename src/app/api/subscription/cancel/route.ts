// app/api/subscription/cancel/route.ts
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

    if (!body.subscriptionId) {
      return NextResponse.json(
        { error: 'ID da assinatura é obrigatório' },
        { status: 400 },
      )
    }

    // Cancelar no Convex
    await fetchMutation(api.subscriptions.cancelSubscription, {
      subscriptionId: body.subscriptionId,
    })

    // Se tiver ID do Mercado Pago, cancelar lá também
    if (body.mercadoPagoPreapprovalId) {
      try {
        await preApproval.update({
          id: body.mercadoPagoPreapprovalId,
          body: {
            status: 'cancelled',
          },
        })
      } catch (error) {
        console.error('Erro ao cancelar no Mercado Pago:', error)
        // Continua mesmo se falhar no MP
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Erro ao cancelar assinatura:', error)
    const message =
      error instanceof Error ? error.message : 'Erro ao cancelar assinatura'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
