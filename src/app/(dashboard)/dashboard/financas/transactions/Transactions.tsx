'use client'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from 'convex/react'

import { DataTable } from '@/components/ui/data-table'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Button } from '@/components/ui/button'

import { AddTransactionButton } from '../_components/add-transaction-button'
import { transactionColumns } from './_columns'

export function TransactionsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userId = session?.user?.id as Id<'user'>

  // useQuery atualiza automaticamente quando há mudanças
  const transactions = useQuery(
    api.transaction.getAllTransactionsByUser,
    userId ? { userId } : 'skip',
  )

  return (
    <>
      {/* <Navbar /> */}
      <div className="flex flex-col space-y-6 overflow-hidden p-6">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push('/dashboard/financas')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Transações</h1>
          </div>

          <AddTransactionButton userId={userId} userCanAddTransaction={true} />
        </div>

        <ScrollArea className="h-full">
          <DataTable
            searchKey="name"
            columns={transactionColumns()}
            data={transactions ? JSON.parse(JSON.stringify(transactions)) : []}
          />
        </ScrollArea>
      </div>
    </>
  )
}
