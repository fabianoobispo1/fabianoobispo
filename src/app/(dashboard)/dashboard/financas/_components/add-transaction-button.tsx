'use client'

import { ArrowDownUpIcon } from 'lucide-react'
import { useState } from 'react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import type { Id } from '@/convex/_generated/dataModel'

import { UpsertTransactionDialog } from './upsert-transaction-dialog'

interface AddTransactionButtonProps {
  userCanAddTransaction: boolean
  userId?: Id<'user'> | null
}

export const AddTransactionButton = ({
  userCanAddTransaction,
  userId,
}: AddTransactionButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsDialogOpen(true)}
              disabled={!userCanAddTransaction}
              className="rounded-full font-bold"
            >
              Adicionar transação
              <ArrowDownUpIcon />
            </Button>
          </TooltipTrigger>

          <TooltipContent>
            {!userCanAddTransaction &&
              'Você atingiu o limite de transações. Atualize seu plano para criar transações ilimitadas'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <UpsertTransactionDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        userId={userId ?? userId}
      />
    </>
  )
}
