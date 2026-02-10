'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CardPaymentFormProps {
  amount: number
  description: string
  userId?: string
  onSuccess?: (paymentData: Record<string, unknown>) => void
  onError?: (error: string) => void
}

export function CardPaymentForm({
  amount,
  description,
  userId,
  onSuccess,
  onError,
}: CardPaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expirationDate: '',
    securityCode: '',
    cpf: '',
    email: '',
    installments: 1,
  })

  // Função para criar token do cartão (você precisará do SDK do Mercado Pago no frontend)
  async function createCardToken() {
    // IMPORTANTE: No frontend você precisa carregar o SDK do Mercado Pago
    // <script src="https://sdk.mercadopago.com/js/v2"></script>

    // @ts-expect-error - Mercado Pago SDK loaded externally
    if (typeof window.MercadoPago === 'undefined') {
      throw new Error(
        'SDK do Mercado Pago não carregado. Adicione o script no HTML.',
      )
    }

    // @ts-expect-error - Mercado Pago SDK loaded externally
    const mp = new window.MercadoPago(
      process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
    )
    const cardToken = await mp.fields.createCardToken({
      cardNumber: formData.cardNumber.replace(/\s/g, ''),
      cardholderName: formData.cardholderName,
      cardExpirationMonth: formData.expirationDate.split('/')[0],
      cardExpirationYear: formData.expirationDate.split('/')[1],
      securityCode: formData.securityCode,
      identificationType: 'CPF',
      identificationNumber: formData.cpf.replace(/\D/g, ''),
    })

    return cardToken
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Criar token do cartão
      const cardTokenData = await createCardToken()

      // Processar pagamento
      const response = await fetch('/api/card-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: cardTokenData.id,
          amount,
          description,
          email: formData.email,
          name: formData.cardholderName,
          cpf: formData.cpf,
          paymentMethodId: cardTokenData.payment_method_id,
          installments: formData.installments,
          userId,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.status === 'approved') {
        setSuccess(true)
        onSuccess?.(data)
      } else if (data.status === 'rejected') {
        throw new Error(
          `Pagamento rejeitado: ${data.status_detail || 'Verifique os dados do cartão'}`,
        )
      } else {
        setError(
          `Pagamento pendente. Status: ${data.status}. Aguarde a confirmação.`,
        )
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erro ao processar pagamento'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              ✅ Pagamento aprovado com sucesso!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento com Cartão</CardTitle>
        <p className="text-sm text-muted-foreground">
          Valor: R$ {amount.toFixed(2)}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Número do Cartão</Label>
            <Input
              id="cardNumber"
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              value={formData.cardNumber}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, '')
                  .replace(/(\d{4})/g, '$1 ')
                  .trim()
                setFormData({ ...formData, cardNumber: value })
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor="cardholderName">Nome no Cartão</Label>
            <Input
              id="cardholderName"
              placeholder="NOME COMPLETO"
              value={formData.cardholderName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cardholderName: e.target.value.toUpperCase(),
                })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expirationDate">Validade</Label>
              <Input
                id="expirationDate"
                placeholder="MM/AA"
                maxLength={5}
                value={formData.expirationDate}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\D/g, '')
                    .replace(/(\d{2})(\d)/, '$1/$2')
                  setFormData({ ...formData, expirationDate: value })
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="securityCode">CVV</Label>
              <Input
                id="securityCode"
                type="password"
                placeholder="123"
                maxLength={4}
                value={formData.securityCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    securityCode: e.target.value.replace(/\D/g, ''),
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="cpf">CPF do Titular</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              maxLength={14}
              value={formData.cpf}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, '')
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d)/, '$1.$2')
                  .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                setFormData({ ...formData, cpf: value })
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="installments">Parcelas</Label>
            <select
              id="installments"
              className="w-full border rounded-md p-2"
              value={formData.installments}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  installments: parseInt(e.target.value),
                })
              }
            >
              <option value={1}>1x de R$ {amount.toFixed(2)}</option>
              <option value={2}>2x de R$ {(amount / 2).toFixed(2)}</option>
              <option value={3}>3x de R$ {(amount / 3).toFixed(2)}</option>
              <option value={6}>6x de R$ {(amount / 6).toFixed(2)}</option>
              <option value={12}>12x de R$ {(amount / 12).toFixed(2)}</option>
            </select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)}`}
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-4">
            🔒 Pagamento seguro processado pelo Mercado Pago
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
