'use client'

import { useState } from 'react'

import { api } from '@/../convex/_generated/api'
import { Id } from '@/../convex/_generated/dataModel'
import { useQuery } from 'convex/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { CardPaymentForm } from './CardPaymentForm'

interface SubscriptionManagerProps {
  userId: Id<'user'>
}

export function SubscriptionManager({ userId }: SubscriptionManagerProps) {
  const [selectedPlan, setSelectedPlan] = useState<Record<
    string,
    unknown
  > | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  const plans = useQuery(api.subscriptions.getActivePlans)
  const userSubscription = useQuery(api.subscriptions.getActiveSubscription, {
    userId,
  })

  const handleCancelSubscription = async () => {
    if (!userSubscription) return

    if (
      !confirm(
        'Tem certeza que deseja cancelar sua assinatura? O acesso permanecerá até o fim do período já pago.',
      )
    ) {
      return
    }

    try {
      await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: userSubscription._id,
          mercadoPagoPreapprovalId: userSubscription.mercadoPagoPreapprovalId,
        }),
      })

      alert('Assinatura cancelada com sucesso!')
    } catch {
      alert('Erro ao cancelar assinatura')
    }
  }

  const handleSubscribe = async (plan: Record<string, unknown>) => {
    setSelectedPlan(plan)
    setShowPayment(true)
  }

  const handlePaymentSuccess = async (paymentData: Record<string, unknown>) => {
    // Criar assinatura no backend
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan._id,
          userId,
          amount: selectedPlan.amount,
          frequency: selectedPlan.frequency,
          planName: selectedPlan.name,
          cardToken: paymentData.cardToken,
          cardLastFourDigits: paymentData.card_last_four_digits,
          cardBrand: paymentData.payment_method_id,
          email: paymentData.email,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      alert('Assinatura criada com sucesso!')
      setShowPayment(false)
      setSelectedPlan(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido'
      alert('Erro ao criar assinatura: ' + message)
    }
  }

  const frequencyLabels: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    annual: 'Anual',
  }

  // Se usuário já tem assinatura ativa
  if (userSubscription?.status === 'active') {
    return (
      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Assinatura Ativa</CardTitle>
              <Badge className="bg-green-600">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Plano</p>
              <p className="font-semibold">{userSubscription.plan?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="font-semibold">
                R$ {userSubscription.plan?.amount.toFixed(2)} /{' '}
                {frequencyLabels[userSubscription.plan?.frequency || 'monthly']}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próxima cobrança</p>
              <p className="font-semibold">
                {new Date(userSubscription.nextBillingDate).toLocaleDateString(
                  'pt-BR',
                )}
              </p>
            </div>
            {userSubscription.cardLastFourDigits && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Método de pagamento
                </p>
                <p className="font-semibold">
                  •••• {userSubscription.cardLastFourDigits}
                </p>
              </div>
            )}
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              className="w-full"
            >
              Cancelar Assinatura
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mostrar formulário de pagamento
  if (showPayment && selectedPlan) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => {
            setShowPayment(false)
            setSelectedPlan(null)
          }}
        >
          ← Voltar para planos
        </Button>
        <CardPaymentForm
          amount={selectedPlan.amount}
          description={`Assinatura ${selectedPlan.name}`}
          userId={userId}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    )
  }

  // Mostrar planos disponíveis
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Escolha seu Plano</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <Card key={plan._id} className="relative">
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">
                  R$ {plan.amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  por {frequencyLabels[plan.frequency]}
                </p>
              </div>

              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-600">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full" onClick={() => handleSubscribe(plan)}>
                Assinar Agora
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
