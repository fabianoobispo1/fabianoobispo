'use-client'
import { useCallback, useEffect, useState } from 'react'
import { PenBoxIcon, Trash } from 'lucide-react'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { useSession } from 'next-auth/react'

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { Id } from '../../../../../convex/_generated/dataModel'
import { api } from '../../../../../convex/_generated/api'
import { FinancasForm } from './financas-form'

interface Financeiro {
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

export const FinancasList = () => {
  const [loading, setLoading] = useState<boolean>(false)
  const [financeiro, setFinanceiro] = useState<Financeiro[]>([])

  const { open } = useSidebar()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [selectedItem, setSelectedItem] = useState<Financeiro | null>(null)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const { data: session } = useSession()

  const fetchFinanceiroByMonth = useCallback(
    async (date: Date) => {
      if (!session?.user?.id) return

      setLoading(true)
      try {
        const startOfMonth = new Date(
          date.getFullYear(),
          date.getMonth(),
          1,
        ).getTime()
        const endOfMonth = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0,
        ).getTime()

        const financeiro = await fetchQuery(api.financeiro.getByMonth, {
          userId: session.user.id as Id<'user'>,
          startDate: startOfMonth,
          endDate: endOfMonth,
        })

        setFinanceiro(financeiro)
      } catch (error) {
        console.error('Erro ao buscar dados financeiros:', error)
      } finally {
        setLoading(false)
      }
    },
    [session],
  )

  useEffect(() => {
    if (session?.user?.id) {
      fetchFinanceiroByMonth(selectedMonth)
    }
  }, [session, fetchFinanceiroByMonth, selectedMonth])

  // Add month navigation controls
  const handlePrevMonth = () => {
    const prevMonth = new Date(
      selectedMonth.setMonth(selectedMonth.getMonth() - 1),
    )
    setSelectedMonth(prevMonth)
    fetchFinanceiroByMonth(prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = new Date(
      selectedMonth.setMonth(selectedMonth.getMonth() + 1),
    )
    setSelectedMonth(nextMonth)
    fetchFinanceiroByMonth(nextMonth)
  }

  const removeLancamento = async (id: Id<'financeiro'>) => {
    setLoading(true)
    await fetchMutation(api.financeiro.remove, {
      financeiroId: id,
    })
    fetchFinanceiroByMonth(selectedMonth)
    setLoading(false)
  }
  return (
    <div
      className={cn(
        'space-y-4 w-screen pr-4 ',
        open ? 'md:max-w-[calc(100%-18rem)] ' : 'md:max-w-[calc(100%-7rem)] ',
      )}
    >
      <Button onClick={() => setIsAddModalOpen(true)}>Adicionar conta</Button>

      <div className="w-full overflow-auto">
        <div className="w-full pr-4">
          {/* Largura mínima para garantir que todas as colunas fiquem visíveis */}
          <ScrollArea className="h-[calc(80vh-220px)] w-full  rounded-md border pr-2">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="text-center">Descrição</TableHead>
                  <TableHead className="text-center">Valor</TableHead>
                  <TableHead className="text-center">Vencimento</TableHead>
                  <TableHead className="text-center">Pagamento</TableHead>
                  <TableHead className="text-center">Categoria</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Opções</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      <Spinner />
                    </TableCell>
                  </TableRow>
                ) : (
                  financeiro.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>R$ {item.valor.toFixed(2)}</TableCell>
                      <TableCell>
                        {new Date(item.dataVencimento).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {item.dataPagamento
                          ? new Date(item.dataPagamento).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>{item.categoria}</TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button
                            onClick={() => {
                              setSelectedItem(item)
                              console.log(selectedItem)
                              setIsModalOpen(true)
                            }}
                          >
                            <PenBoxIcon className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={() => removeLancamento(item._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4 pr-4">
        <div className="flex-1 text-sm text-muted-foreground">
          <p>
            {selectedMonth.toLocaleString('pt-BR', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            Mês Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            Próximo Mês
          </Button>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[900px] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Editar Atleta</DialogTitle>
          </DialogHeader>
          {/*  <AtletasForm
            initialData={selectedAtleta}
            onSuccess={() => {
              setIsModalOpen(false)
              fetchAtletasPaginated(offset, limit)
            }}
          /> */}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-[900px] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Adicionar nova conta</DialogTitle>
          </DialogHeader>
          <FinancasForm
            userId={session?.user?.id}
            onSuccess={() => {
              setIsAddModalOpen(false)
              fetchFinanceiroByMonth(selectedMonth)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
