import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Category } from '@/types/schema'
import { Badge } from '@/components/ui/badge'

import { CategoriaActions } from './categoria-actions'

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'type',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge
        variant={row.original.type === 'EXPENSE' ? 'destructive' : 'default'}
      >
        {row.original.type === 'EXPENSE' ? 'Despesa' : 'Receita'}
      </Badge>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Descrição',
  },
  {
    accessorKey: 'created_at',
    header: 'Criado em',
    cell: ({ row }) =>
      format(row.original.created_at, 'dd/MM/yyyy', { locale: ptBR }),
  },
  {
    accessorKey: 'active',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.active ? 'default' : 'secondary'}>
        {row.original.active ? 'Ativo' : 'Inativo'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <CategoriaActions data={row.original} />,
  },
]
