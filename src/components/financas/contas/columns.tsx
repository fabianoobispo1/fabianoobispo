import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import type { Id } from '@/convex/_generated/dataModel'

import { FinancasDialog } from './FinancasDialog'

// Função auxiliar para formatação de moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Definição do tipo para os dados
type Financeiro = {
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

export const columns: ColumnDef<Financeiro>[] = [
  {
    accessorKey: 'descricao',
    header: 'Descrição',
  },
  {
    accessorKey: 'valor',
    header: 'Valor',
    cell: ({ row }) => formatCurrency(row.original.valor),
  },
  {
    accessorKey: 'dataVencimento',
    header: 'Vencimento',
    cell: ({ row }) => format(row.original.dataVencimento, 'dd/MM/yyyy'),
  },
  {
    accessorKey: 'categoria',
    header: 'Categoria',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <div
        className={`
        ${row.original.status === 'PENDENTE' ? 'text-yellow-500' : ''}
        ${row.original.status === 'PAGO' ? 'text-green-500' : ''}
        ${row.original.status === 'ATRASADO' ? 'text-red-500' : ''}
      `}
      >
        {row.original.status}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <FinancasDialog mode="edit" initialData={row.original} />
    ),
  },
]
