// app/api/webhook/mercadopago/route.ts
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

    // Mercado Pago envia diferentes tipos de notificacao
    if (body.type === 'payment' || body.action === 'payment.updated') {
      const paymentId = body.data?.id || body.data_id

      if (!paymentId) {
        return NextResponse.json({ received: true })
      }

      // Busca detalhes do pagamento
      const paymentInfo = await payment.get({ id: paymentId })

      // Atualizar status no Convex
      try {
        await fetchMutation(api.payments.updatePaymentStatus, {
          mercadoPagoId: String(paymentId),
          status: paymentInfo.status as
            | 'pending'
            | 'approved'
            | 'rejected'
            | 'cancelled'
            | 'refunded',
        })
      } catch (error) {
        console.error('Erro ao atualizar pagamento no Convex:', error)
      }

      if (paymentInfo.status === 'approved') {
        // Pagamento aprovado!
        console.log(
          `Pagamento ${paymentId} aprovado!`,
          `Valor: R$${paymentInfo.transaction_amount}`,
        )

        // Se for pagamento de assinatura, atualizar ciclo
        // Você pode identificar através de metadata ou external_reference
        if (paymentInfo.metadata?.subscription_id) {
          try {
            await fetchMutation(api.subscriptions.recordBillingPayment, {
              subscriptionId: paymentInfo.metadata.subscription_id,
              success: true,
            })
          } catch (error) {
            console.error('Erro ao atualizar assinatura:', error)
          }
        }
      } else if (
        paymentInfo.status === 'rejected' &&
        paymentInfo.metadata?.subscription_id
      ) {
        // Pagamento de assinatura rejeitado
        try {
          await fetchMutation(api.subscriptions.recordBillingPayment, {
            subscriptionId: paymentInfo.metadata.subscription_id,
            success: false,
          })
        } catch (error) {
          console.error('Erro ao registrar falha na assinatura:', error)
        }
      }
    }

    // Processar notificações de pre-approval (assinaturas)
    if (body.type === 'preapproval' || body.action?.includes('preapproval')) {
      console.log('Notificação de assinatura recebida:', body)
      // Aqui você pode adicionar lógica adicional para assinaturas
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('Erro no webhook:', error)
    // Sempre retorne 200 para o Mercado Pago nao reenviar
    return NextResponse.json({ received: true })
  }
}
