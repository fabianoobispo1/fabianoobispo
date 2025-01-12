'use client'

import { useQuery } from 'convex/react'
import { useSession } from 'next-auth/react'

import { api } from '@/convex/_generated/api'
import { DataTable } from '@/components/ui/data-table'
import type { Id } from '@/convex/_generated/dataModel'

import { CartaoDialog } from './CartaoDialog'
import { columns } from './columns'

export function CartoesList() {
  const { data: session } = useSession()
  const dashboardData = useQuery(api.dashboard.getDashboardData, {
    userId: session?.user?.id as Id<'user'>,
  })

  if (!dashboardData) {
    return <></>
  }

  const handleUpdate = () => {
    // O Convex atualiza automaticamente os dados
    // Você pode adicionar lógica extra aqui se necessário
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Lançamentos Financeiros</h2>
        <CartaoDialog mode="create" onSuccess={handleUpdate} />
      </div>
      <DataTable
        columns={columns}
        data={dashboardData.cartoes}
        searchKey="descricao"
      />
    </div>
  )
}
