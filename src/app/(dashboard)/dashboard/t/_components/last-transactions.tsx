import Image from 'next/image'
import Link from 'next/link'

import { ScrollArea } from '@/components/ui/scroll-area'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Id } from '@/convex/_generated/dataModel'

import { TRANSACTION_PAYMENT_METHOD_ICONS } from './_constants/transactions'

export interface Transaction {
  _id: Id<'transactions'>
  name: string
  type: 'DEPOSIT' | 'EXPENSE' | 'INVESTMENT'
  amount: number
  category: string
  paymentMethod:
    | 'CREDIT_CARD'
    | 'DEBIT_CARD'
    | 'BANK_TRANSFER'
    | 'BANK_SLIP'
    | 'CASH'
    | 'PIX'
    | 'OTHER'
  date: number
  created_at: number
  updated_at: number
  userId: Id<'user'>
}

interface LastTransactionsProps {
  lastTransactions?: Transaction[]
}

export const LastTransactions = ({
  lastTransactions,
}: LastTransactionsProps) => {
  const getAmountColor = (transaction: Transaction) => {
    if (transaction.type === 'EXPENSE') {
      return 'text-red-500'
    }
    if (transaction.type === 'DEPOSIT') {
      return 'text-primary'
    }
    return 'text-white'
  }

  const getAmountPrefix = (transaction: Transaction) => {
    return transaction.type === 'DEPOSIT' ? '+' : '-'
  }

  return (
    <ScrollArea className="rounded-md border">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-bold text-white">
          Últimas Transações
        </CardTitle>

        <Button variant="outline" className="rounded-full font-bold" asChild>
          <Link href="/transactions">Ver mais</Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {lastTransactions?.map((transaction) => (
          <div
            key={transaction._id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white bg-opacity-5 p-2.5">
                <Image
                  src={'/' + TRANSACTION_PAYMENT_METHOD_ICONS.PIX}
                  alt="Pix"
                  height={20}
                  width={20}
                />
              </div>

              <div>
                <p className="text-sm font-bold">{transaction.name}</p>
                <p className="text-sm text-muted-foreground opacity-70">
                  {new Date(transaction.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <p className={`text-sm font-bold ${getAmountColor(transaction)}`}>
              {getAmountPrefix(transaction)}
              {formatCurrency(Number(transaction.amount))}
            </p>
          </div>
        ))}
      </CardContent>
    </ScrollArea>
  )
}
