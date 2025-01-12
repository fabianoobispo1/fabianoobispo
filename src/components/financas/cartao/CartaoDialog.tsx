'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Id } from '@/convex/_generated/dataModel'

import { CartaoForm } from './cartao-form'

interface CartaoData {
  _id: Id<'cartoes'>
  descricao: string
  valor: number
  dataVencimento: number
  dataPagamento?: number
  categoria: string
  status: string
  obs: string
  limite: number
  limiteUtilizado: number
  created_at: number
  updated_at: number
  userId: Id<'user'>
}

interface DialogProps {
  mode: 'create' | 'edit'
  initialData?: CartaoData
  onSuccess?: () => void
  userid?: Id<'user'>
}

export function CartaoDialog({ mode, initialData, onSuccess }: DialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{mode === 'create' ? 'Adicionar' : 'Editar'} Cartão</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo' : 'Editar'} Cartão
          </DialogTitle>
        </DialogHeader>

        <CartaoForm
          initialData={
            initialData && 'limite' in initialData ? null : initialData
          }
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
