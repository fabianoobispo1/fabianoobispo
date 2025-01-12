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

import { FinancasForm } from './financas-form'

interface FinanceiroData {
  _id: Id<'financeiro'>
  descricao: string
  valor: number
  dataVencimento: number
  dataPagamento?: number
  categoria: string
  status: string
  created_at: number
  updated_at: number
  userId: Id<'user'>
}

interface DialogProps {
  mode: 'create' | 'edit'
  initialData?: FinanceiroData
  onSuccess?: () => void
}

export function FinancasDialog({ mode, initialData, onSuccess }: DialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>{mode === 'create' ? 'Adicionar' : 'Editar'} Lançamento</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Novo' : 'Editar'} Lançamento
          </DialogTitle>
        </DialogHeader>

        <FinancasForm
          initialData={
            initialData && 'limite' in initialData ? null : initialData
          }
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
