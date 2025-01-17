import { CircleIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

const TRANSACTION_TYPES = {
  DEPOSIT: {
    label: 'Depósito',
    className: 'bg-primary/15 font-bold text-primary hover:bg-primary',
    iconClassName: 'fill-primary',
  },
  EXPENSE: {
    label: 'Despesa',
    className: 'font-bold bg-danger bg-opacity-10 text-danger',
    iconClassName: 'fill-danger',
  },
  INVESTMENT: {
    label: 'Investimento',
    className: 'font-bold bg-white bg-opacity-10 text-white',
    iconClassName: 'fill-white',
  },
} as const

type TransactionType = keyof typeof TRANSACTION_TYPES

interface TransactionTypeBadgeProps {
  type: TransactionType
}

export const TransactionTypeBadge = ({ type }: TransactionTypeBadgeProps) => {
  const config = TRANSACTION_TYPES[type]

  return (
    <Badge className={config.className}>
      <CircleIcon className={`mr-2 ${config.iconClassName}`} size={10} />
      {config.label}
    </Badge>
  )
}
