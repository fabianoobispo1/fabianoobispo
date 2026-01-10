import { CircleIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

const TRANSACTION_TYPE_STYLES: Record<
  'DEPOSIT' | 'EXPENSE' | 'INVESTMENT',
  {
    label: string
    className: string
    iconClassName: string
  }
> = {
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
}

interface TransactionTypeBadgeProps {
  type: 'DEPOSIT' | 'EXPENSE' | 'INVESTMENT'
}

export const TransactionTypeBadge = ({ type }: TransactionTypeBadgeProps) => {
  const config = TRANSACTION_TYPE_STYLES[type]

  return (
    <Badge className={config.className}>
      <CircleIcon className={`mr-2 ${config.iconClassName}`} size={10} />
      {config.label}
    </Badge>
  )
}
