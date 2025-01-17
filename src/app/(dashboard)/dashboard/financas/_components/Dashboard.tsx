'use client'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { fetchQuery } from 'convex/nextjs'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Spinner } from '@/components/ui/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'

import { TimeSelect } from './time-select'
import { SummaryCards } from './summary-cards'
import { LastTransactions, type Transaction } from './last-transactions'
import { TransactionsPieChart } from './transactions-pie-chart'

export interface Dashboard {
  balance: number
  investmentsTotal: number
  depositsTotal: number
  expensesTotal: number
  lastTransactions: Transaction[]
  typesPercentage: {
    DEPOSIT: number
    EXPENSE: number
    INVESTMENT: number
  }
}

export function DashboardT() {
  const { data: session } = useSession()
  const [userId, setUserId] = useState<Id<'user'> | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [selectedTime, setSelectedTime] = useState(
    (new Date().getMonth() + 1).toString().padStart(2, '0'),
  )

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    if (session) {
      setUserId(session.user.id as Id<'user'>)
      fetchQuery(api.transaction.getDashboard, {
        month: selectedTime,
        userId: session.user.id as Id<'user'>,
      }).then((result) => {
        setDashboard(result as Dashboard)
        console.log(result)
      })
    }
    setLoading(false)
  }, [session, selectedTime])

  useEffect(() => {
    if (session) {
      loadDashboard()
    }
  }, [loadDashboard, session])

  return (
    <ScrollArea className="   h-[calc(100vh-180px)] pr-2 ">
      <div className="flex flex-col items-end  w-full  sm:space-y-0 pr-2 pb-2">
        {/*   <h1 className="text-xl font-bold md:text-2xl">Dashboard</h1> */}
        <div className="flex items-center gap-3">
          <TimeSelect value={selectedTime} onChange={setSelectedTime} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 overflow-hidden lg:grid-cols-1 pr-2">
        <div className="space-y-6 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          ) : dashboard ? (
            <SummaryCards
              balance={dashboard.balance}
              investmentsTotal={dashboard.investmentsTotal}
              depositsTotal={dashboard.depositsTotal}
              expensesTotal={dashboard.expensesTotal}
              userId={userId}
              userCanAddTransaction={true}
            />
          ) : null}

          <div className="w-full">
            <LastTransactions lastTransactions={dashboard?.lastTransactions} />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {dashboard && (
              <TransactionsPieChart
                typesPercentage={dashboard.typesPercentage}
                investmentsTotal={dashboard.investmentsTotal}
                depositsTotal={dashboard.depositsTotal}
                expensesTotal={dashboard.expensesTotal}
              />
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
