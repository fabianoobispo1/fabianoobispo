'use client'

import { FinancasList } from '@/components/financas/contas/FinancasList'
import { CartoesList } from '@/components/financas/cartao/CartoesList'
import { FinancialDashboard } from '@/components/financas/FinancialDashboard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FinancasPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Gerenciar Finanças</h1>
      <ScrollArea className="h-[calc(100vh-150px)]  w-full px-6 ">
        <FinancialDashboard />

        <Tabs defaultValue="lancamentos" className="pt-6">
          <TabsList>
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="cartoes">Cartões</TabsTrigger>
          </TabsList>

          <TabsContent value="lancamentos">
            <FinancasList />
          </TabsContent>

          <TabsContent value="cartoes">
            <CartoesList />
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  )
}
