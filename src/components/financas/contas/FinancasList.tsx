'use client'

import { useQuery } from 'convex/react'
import { useSession } from 'next-auth/react'

import { api } from '@/convex/_generated/api'
import { DataTable } from '@/components/ui/data-table'
import type { Id } from '@/convex/_generated/dataModel'

import { FinancasDialog } from './FinancasDialog'
import { columns } from './columns'

export function FinancasList() {
  const { data: session } = useSession()

  const dashboardData = useQuery(api.dashboard.getDashboardData, {
    userId: session?.user?.id as Id<'user'>,
  })

  if (!dashboardData) {
    return <></>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold"></h2>
        <FinancasDialog
          mode="create"
          userid={session?.user?.id as Id<'user'>}
        />
      </div>
      <DataTable
        columns={columns}
        data={dashboardData.financeiro}
        searchKey="descricao"
      />
    </div>
  )
}
