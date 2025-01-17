'use client'
import { ReactNode } from 'react'

import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Id } from '@/convex/_generated/dataModel'

import { AddTransactionButton } from './add-transaction-button'

interface SummaryCardProps {
  icon: ReactNode
  title: string
  amount: number
  size?: 'small' | 'large'
  userCanAddTransaction?: boolean
  userId?: Id<'user'> | null
}

export const SummaryCard = ({
  icon,
  title,
  amount,
  size = 'small',
  userCanAddTransaction = false,
  userId,
}: SummaryCardProps) => {
  return (
    <Card className={`${size === 'large' ? '' : ''}`}>
      <CardHeader className="flex-row items-center gap-2">
        {icon}

        <p
          className={`leading-none ${
            size === 'small' ? 'text-muted-foreground' : ' opacity-70'
          } `}
        >
          {title}
        </p>
      </CardHeader>

      <CardContent className="flex justify-between">
        <p
          className={`font-bold ${size === 'small' ? 'text-2xl' : 'text-4xl'} `}
        >
          {formatCurrency(amount)}
        </p>

        {size === 'large' && (
          <AddTransactionButton
            userCanAddTransaction={userCanAddTransaction}
            userId={userId ?? userId}
          />
        )}
      </CardContent>
    </Card>
  )
}
