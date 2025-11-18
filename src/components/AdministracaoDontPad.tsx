'use client'
import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'

import { useQuery, useMutation } from 'convex/react'
import { Trash } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { Spinner } from './ui/spinner'

export function AdministracaoDontPad() {
  const { toast } = useToast()
  const dontPads = useQuery(api.dontPad.listAll)
  const removePage = useMutation(api.dontPad.remove)

  const handleRemove = async (id: Id<'dontPad'>) => {
    try {
      await removePage({ _id: id })
      toast({
        title: 'Sucesso',
        description: 'Página removida com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao remover página:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao remover a página. Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-8">
      <ScrollArea className="h-[calc(80vh-220px)] w-full overflow-x-auto rounded-md border">
        {dontPads === undefined ? (
          <div className="flex items-center justify-center h-full py-10">
            <Spinner />
          </div>
        ) : (
          <Table className="relative">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Nome da Página</TableHead>
                <TableHead className="text-center">
                  Conteúdo (Preview)
                </TableHead>
                <TableHead className="text-center">Criado em</TableHead>
                <TableHead className="text-center">Atualizado em</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {dontPads && dontPads.length > 0 ? (
                dontPads.map((dontPad) => (
                  <TableRow key={dontPad._id}>
                    <TableCell className="text-center">
                      {dontPad.page_name}
                    </TableCell>
                    <TableCell className="text-center max-w-[300px] truncate">
                      {dontPad.page_content.substring(0, 100)}
                      {dontPad.page_content.length > 100 ? '...' : ''}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(dontPad.created_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(dontPad.updated_at)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="destructive"
                        onClick={() => handleRemove(dontPad._id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    Nenhuma página encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
