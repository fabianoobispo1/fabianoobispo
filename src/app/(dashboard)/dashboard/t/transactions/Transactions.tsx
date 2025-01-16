'use client'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuery } from 'convex/nextjs'

import { DataTable } from '@/components/ui/data-table'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

import { AddTransactionButton } from '../_components/add-transaction-button'
import { transactionColumns } from './_columns'
import type { Transaction } from '../_components/last-transactions'

export function TransactionsPage() {
  const { data: session } = useSession()

  const [transactions, setTransactions] = useState<Transaction[]>([])

  const loadDashboard = useCallback(async () => {
    if (session) {
      fetchQuery(api.transaction.getAllTransactionsByUser, {
        userId: session.user.id as Id<'user'>,
      }).then((result) => {
        console.log(result)
        setTransactions(result as Transaction[])
      })
    }
  }, [session])

  useEffect(() => {
    if (session) {
      loadDashboard()
    }
  }, [loadDashboard, session])

  return (
    <>
      {/* <Navbar /> */}
      <div className="flex flex-col space-y-6 overflow-hidden p-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Transações</h1>

          <AddTransactionButton userCanAddTransaction={true} />
        </div>

        <ScrollArea className="h-full">
          <DataTable
            searchKey="name"
            columns={transactionColumns}
            data={JSON.parse(JSON.stringify(transactions))}
          />
        </ScrollArea>
      </div>
    </>
  )
}
