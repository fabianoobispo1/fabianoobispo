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
import type { Financeiro } from '@/types'

import { FinancasForm } from './financas-form'

interface DialogProps {
  mode: 'create' | 'edit'
  initialData?: Financeiro
  onSuccess?: () => void
  userid?: Id<'user'>
}

export function FinancasDialog({
  mode,
  initialData,
  onSuccess,
  userid,
}: DialogProps) {
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
          userId={userid}
        />
      </DialogContent>
    </Dialog>
  )
}
