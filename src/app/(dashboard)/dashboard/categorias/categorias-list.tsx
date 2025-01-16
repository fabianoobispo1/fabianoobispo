import { useQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import { DataTable } from '@/components/ui/data-table'

import { columns } from './columns'

export const CategoriasList = () => {
  const categorias = useQuery(api.categories.list)

  return <DataTable columns={columns} data={categorias || []} />
}
