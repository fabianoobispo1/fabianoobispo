import { CircleIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import type { Transaction } from '../../_components/last-transactions'

interface TransactionTypeBadgeProps {
  transaction: Transaction
}

export const TransactionTypeBadge = ({
  transaction,
}: TransactionTypeBadgeProps) => {
  if (transaction.type === 'DEPOSIT') {
    return (
      <Badge className="bg-primary/15 font-bold text-primary hover:bg-primary">
        <CircleIcon className="mr-2 fill-primary" size={10} />
        Depósito
      </Badge>
    )
  }

  if (transaction.type === 'EXPENSE') {
    return (
      <Badge className="font bold bg-danger bg-opacity-10 text-danger">
        <CircleIcon className="mr-2 fill-danger" size={10} />
        Despesa
      </Badge>
    )
  }

  return (
    <Badge className="font bold bg-white bg-opacity-10 text-white">
      <CircleIcon className="mr-2 fill-white" size={10} />
      Investimento
    </Badge>
  )
}
