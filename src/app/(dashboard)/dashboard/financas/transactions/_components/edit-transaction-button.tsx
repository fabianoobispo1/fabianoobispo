'use client'

import { PencilIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'

import type { Transaction } from '../../_components/last-transactions'
import {
  UpsertTransactionDialog,
  type TransactionPaymentMethod,
  type TransactionType,
} from '../../_components/upsert-transaction-dialog'

interface EditTransactionButtonProps {
  transaction: Transaction
}

export const EditTransactionButton = ({
  transaction,
}: EditTransactionButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button
        onClick={() => setIsDialogOpen(true)}
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
      >
        <PencilIcon />
      </Button>

      <UpsertTransactionDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        transactionId={transaction._id}
        defaultValues={{
          _id: transaction._id,
          name: transaction.name,
          type: transaction.type as TransactionType,
          amount: Number(transaction.amount),
          date: new Date(transaction.date),
          category: transaction.category,
          paymentMethod: transaction.paymentMethod as TransactionPaymentMethod,
        }}
      />
    </>
  )
}
