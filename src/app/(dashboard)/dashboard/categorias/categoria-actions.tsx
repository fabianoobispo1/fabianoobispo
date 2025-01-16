import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { useMutation } from 'convex/react'
import { toast } from 'sonner'

import { Category } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { showErrorToast } from '@/lib/handle-error'
import { AlertModal } from '@/components/ui/alert-modal'

import { CategoriaModal } from './categoria-modal'

interface CategoriaActionsProps {
  data: Category
}

export const CategoriaActions = ({ data }: CategoriaActionsProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const remove = useMutation(api.categories.remove)

  const onDelete = async () => {
    try {
      setLoading(true)
      await remove({ categoryId: data._id })
      toast.success('Categoria excluída com sucesso')
      setIsDeleteModalOpen(false)
    } catch (error) {
      showErrorToast(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteModalOpen(true)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CategoriaModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={data}
      />

      <AlertModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={onDelete}
        loading={loading}
      />
    </>
  )
}
