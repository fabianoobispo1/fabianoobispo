import {
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from 'lucide-react'

import type { Id } from '@/convex/_generated/dataModel'

import { SummaryCard } from './summary-card'

interface SummaryCardsProps {
  balance: number
  investmentsTotal: number
  depositsTotal: number
  expensesTotal: number
  userId: Id<'user'> | null
  userCanAddTransaction: boolean
}

export function SummaryCards({
  balance,
  depositsTotal,
  expensesTotal,
  investmentsTotal,
  userCanAddTransaction,
  userId,
}: SummaryCardsProps) {
  return (
    <div className="space-y-6">
      <SummaryCard
        icon={
          <div
            className="flex items-center justify-center rounded-lg 
           p-2.5"
          >
            <WalletIcon size={16} />
          </div>
        }
        title="Saldo"
        amount={balance}
        size="large"
        userCanAddTransaction={userCanAddTransaction}
        userId={userId}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard
          icon={
            <div className="flex items-center justify-center rounded-lg bg-white bg-opacity-10 p-2.5">
              <PiggyBankIcon size={16} />
            </div>
          }
          title="Investido"
          amount={investmentsTotal}
        />

        <SummaryCard
          icon={
            <div className="flex items-center justify-center rounded-lg bg-primary/15 p-2.5">
              <TrendingUpIcon size={16} className="text-primary" />
            </div>
          }
          title="Receita"
          amount={depositsTotal}
        />

        <SummaryCard
          icon={
            <div className="flex items-center justify-center rounded-lg bg-red-500 bg-opacity-10 p-2.5">
              <TrendingDownIcon size={16} className="text-red-500" />
            </div>
          }
          title="Despesas"
          amount={expensesTotal}
        />
      </div>
    </div>
  )
}
