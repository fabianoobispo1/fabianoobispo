'use client'

import { Id } from '@/../convex/_generated/dataModel'

import { useSession } from 'next-auth/react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CardPaymentForm } from '@/components/CardPaymentForm'
import { PixPayment } from '@/components/PixPayment'
import { SubscriptionManager } from '@/components/SubscriptionManager'

export default function PaginaTestes() {
  const { data: session } = useSession()

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Faça login para testar os pagamentos</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Central de Pagamentos</h1>
        <p className="text-muted-foreground">
          Teste os diferentes métodos de pagamento
        </p>
      </div>

      <Tabs defaultValue="pix" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pix">PIX</TabsTrigger>
          <TabsTrigger value="cartao">Cartão</TabsTrigger>
          <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="pix" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagamento via PIX</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pagamento instantâneo com QR Code
              </p>
            </CardHeader>
            <CardContent>
              <PixPayment amount={50} description="Teste de pagamento PIX" />
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">💡 Como testar PIX:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Clique em &quot;Pagar com Pix&quot;</li>
                <li>Sistema gerará QR Code</li>
                <li>
                  Em <strong>ambiente de teste</strong>, o pagamento é aprovado
                  automaticamente após alguns segundos
                </li>
                <li>
                  Em <strong>produção</strong>, use o app do banco para pagar
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cartao" className="space-y-4">
          <CardPaymentForm
            amount={99.9}
            description="Teste de pagamento com cartão"
            userId={session.user.id}
            onSuccess={(data) => {
              console.log('Pagamento aprovado:', data)
              alert('✅ Pagamento aprovado com sucesso!')
            }}
            onError={(error) => {
              console.error('Erro no pagamento:', error)
            }}
          />

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">🧪 Cartões de Teste:</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded border">
                  <p className="font-semibold text-green-600">
                    ✅ Aprovado automaticamente:
                  </p>
                  <p className="font-mono">5031 4332 1540 6351</p>
                  <p>CVV: 123 | Validade: 11/25</p>
                </div>
                <div className="bg-white p-3 rounded border">
                  <p className="font-semibold text-red-600">
                    ❌ Rejeitado (sem fundos):
                  </p>
                  <p className="font-mono">5031 4332 1540 6352</p>
                  <p>CVV: 123 | Validade: 11/25</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use qualquer CPF válido e email real
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assinaturas" className="space-y-4">
          <SubscriptionManager userId={session.user.id as Id<'user'>} />

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">🔄 Sobre Assinaturas:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Primeiro pagamento é processado imediatamente</li>
                <li>Cobranças futuras são automáticas (configurar cron job)</li>
                <li>Após 3 falhas consecutivas, assinatura é pausada</li>
                <li>Cancelamento mantém acesso até o fim do período pago</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Instruções de Setup */}
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle>📝 Setup Necessário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold">1. Adicione o SDK do Mercado Pago</p>
            <p className="text-muted-foreground">
              No <code>layout.tsx</code> ou nesta página:
            </p>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {`<Script 
  src="https://sdk.mercadopago.com/js/v2" 
  strategy="beforeInteractive" 
/>`}
            </pre>
          </div>

          <div>
            <p className="font-semibold">2. Configure variáveis de ambiente</p>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {`MERCADOPAGO_ACCESS_TOKEN=seu_token
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=sua_public_key`}
            </pre>
          </div>

          <div>
            <p className="font-semibold">3. Configure o webhook</p>
            <p className="text-muted-foreground">
              URL:{' '}
              <code className="bg-gray-100 px-1 rounded">
                https://seudominio.com/api/webhook/mercadopago
              </code>
            </p>
          </div>

          <div>
            <p className="font-semibold">4. Crie planos de assinatura</p>
            <p className="text-muted-foreground">
              Use o Convex Dashboard ou a mutation{' '}
              <code className="bg-gray-100 px-1 rounded">
                api.subscriptions.createPlan
              </code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
