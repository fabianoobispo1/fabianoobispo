'use client'

import { ColumnDef } from '@tanstack/react-table'

import { formatCurrency } from '@/lib/utils'

import { TransactionTypeBadge } from '../_components/transaction-type-badge'
import { DeleteTransactionButton } from '../_components/delete-transaction-button'
import { EditTransactionButton } from '../_components/edit-transaction-button'
import { type Transaction } from '../../_components/last-transactions'
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
} from '../../_components/_constants/transactions'

export const transactionColumns = (
  onListUpdate: () => Promise<void>,
): ColumnDef<Transaction>[] => [
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row: { original: transaction } }) => (
      <TransactionTypeBadge type={transaction.type} />
    ),
  },
  {
    accessorKey: 'category',
    header: 'Categoria',
    cell: ({ row: { original: transaction } }) =>
      TRANSACTION_CATEGORY_LABELS[
        transaction.category as keyof typeof TRANSACTION_CATEGORY_LABELS
      ],
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Método de Pagamento',
    cell: ({ row: { original: transaction } }) =>
      TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod],
  },
  {
    accessorKey: 'date',
    header: 'Data',
    cell: ({ row: { original: transaction } }) =>
      new Date(transaction.date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
    cell: ({ row: { original: transaction } }) =>
      formatCurrency(Number(transaction.amount)),
  },
  {
    accessorKey: 'actions',
    header: 'Ações',
    cell: ({ row: { original: transaction } }) => (
      <div className="space-x-1">
        <EditTransactionButton
          onEdit={onListUpdate}
          transaction={transaction}
        />
        <DeleteTransactionButton
          transactionId={transaction._id}
          onDelete={onListUpdate}
        />
      </div>
    ),
  },
]
