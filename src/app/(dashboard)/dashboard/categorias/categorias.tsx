import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'

import { CategoriasList } from './categorias-list'
import { CategoriaModal } from './categoria-modal'

export const Categorias = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title="Categorias"
          description="Gerencie as categorias de transações"
        />
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-220px)]">
        <CategoriasList />
      </ScrollArea>
      <CategoriaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
