'use client'

import { TrashIcon } from 'lucide-react'
import { toast } from 'sonner'
import { fetchMutation } from 'convex/nextjs'
import { useSession } from 'next-auth/react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'

interface DeleteTransactionButtonProps {
  transactionId: string
}

export const DeleteTransactionButton = ({
  transactionId,
}: DeleteTransactionButtonProps) => {
  const { data: session } = useSession()

  const handleConfirmDeleteClick = async () => {
    if (!session?.user?.id) return
    try {
      await fetchMutation(api.transaction.remove, {
        transactionsId: transactionId as Id<'transactions'>,
        userId: session.user.id as Id<'user'>,
      })
      toast.success('Transação deletada com sucesso!')
    } catch (error) {
      console.error(error)
      toast.error('Ocorreu um erro ao deletar a transação.')
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <TrashIcon />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Você deseja realmente deletar essa transação?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmDeleteClick}>
            Continuar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
