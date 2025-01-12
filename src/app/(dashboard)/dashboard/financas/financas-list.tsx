'use-client'
import { useCallback, useEffect, useState } from 'react'
import { PenBoxIcon, Trash } from 'lucide-react'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { useSession } from 'next-auth/react'
import { useMutation } from 'convex/react'

import { useToast } from '@/hooks/use-toast'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DatePickerWithDefaults } from '@/components/calendar/with-default'

import type { Id } from '../../../../../convex/_generated/dataModel'
import { api } from '../../../../../convex/_generated/api'
import { CartaoForm } from '../../../../components/financas/cartao/cartao-form'

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

interface Cartoes {
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

export const FinancasList = () => {
  const { data: session } = useSession()
  const { toast } = useToast()

  const [loading, setLoading] = useState<boolean>(false)

  const [financeiro, setFinanceiro] = useState<Financeiro[]>([])
  const [selectedItem, setSelectedItem] = useState<Financeiro | null>(null)

  const [cartoes, setCartoes] = useState<Cartoes[]>([])
  const [selectedCartaoItem, setSelectedcartaoItem] = useState<Cartoes | null>(
    null,
  )
  const totais = cartoes.reduce(
    (acc, item) => ({
      valor: acc.valor + item.valor,
      limiteUtilizado: acc.limiteUtilizado + item.limiteUtilizado,
      limiteDisponivel:
        acc.limiteDisponivel + (item.limite - item.limiteUtilizado),
      limiteTotal: acc.limiteTotal + item.limite,
    }),
    {
      valor: 0,
      limiteUtilizado: 0,
      limiteDisponivel: 0,
      limiteTotal: 0,
    },
  )

  const { open } = useSidebar()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const [isAddModalCrataoOpen, setIsAddModalCrataoOpen] = useState(false)
  const [isEditModalCrataoOpen, setIsEditModalCrataoOpen] = useState(false)

  const [selectedMonth, setSelectedMonth] = useState(new Date())

  const [paymentDate, setPaymentDate] = useState('')

  const update = useMutation(api.financeiro.update)
  const updateCartao = useMutation(api.cartoes.update)

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

        const cartao = await fetchQuery(api.cartoes.getByMonth, {
          userId: session.user.id as Id<'user'>,
          startDate: startOfMonth,
          endDate: endOfMonth,
        })
        setCartoes(cartao)
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

  const removeCartao = async (id: Id<'cartoes'>) => {
    setLoading(true)
    await fetchMutation(api.cartoes.remove, {
      cartoesId: id,
    })
    fetchFinanceiroByMonth(selectedMonth)
    setLoading(false)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (selectedItem) {
        await update({
          financaId: selectedItem._id,
          dataPagamento: new Date(paymentDate).getTime(),
          status: 'Pago',
          updated_at: new Date().getTime(),
          // Keep other existing fields unchanged
          descricao: selectedItem.descricao,
          valor: selectedItem.valor,
          dataVencimento: selectedItem.dataVencimento,
          categoria: selectedItem.categoria,
        })

        setIsPaymentModalOpen(false)
        fetchFinanceiroByMonth(selectedMonth)
      }

      if (selectedCartaoItem) {
        await updateCartao({
          cartaoId: selectedCartaoItem._id,
          dataPagamento: new Date(paymentDate).getTime(),
          status: 'Pago',
          updated_at: new Date().getTime(),
          // Keep other existing fields unchanged
          descricao: selectedCartaoItem.descricao,
          valor: selectedCartaoItem.valor,
          dataVencimento: selectedCartaoItem.dataVencimento,
          categoria: selectedCartaoItem.categoria,
          limite: selectedCartaoItem.limite,
          limiteUtilizado: selectedCartaoItem.limiteUtilizado,
          obs: selectedCartaoItem.obs,
        })

        setIsPaymentModalOpen(false)
        fetchFinanceiroByMonth(selectedMonth)
      }
      toast({
        title: 'Pagamento registrado com sucesso!',
      })
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error)
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar pagamento',
      })
    } finally {
      setLoading(false)
    }
  }
  return (
    <div
      className={cn(
        'space-y-4 w-screen pr-4 ',
        open ? 'md:max-w-[calc(100%-18rem)] ' : 'md:max-w-[calc(100%-7rem)] ',
      )}
    >
      <div className="flex items-center justify-between space-x-2 py-4 pr-4">
        <Button variant="outline" size="sm" onClick={handlePrevMonth}>
          Mês Anterior
        </Button>

        <div className=" text-sm text-muted-foreground">
          <p>
            {selectedMonth.toLocaleString('pt-BR', {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleNextMonth}>
          Próximo Mês
        </Button>
      </div>
      <Button onClick={() => setIsAddModalOpen(true)}>Adicionar conta</Button>
      <div className="w-full overflow-auto">
        <div className="w-full pr-4">
          {/* Largura mínima para garantir que todas as colunas fiquem visíveis */}
          <ScrollArea className=" w-full  rounded-md border pr-2">
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
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.valor / 100)}
                      </TableCell>
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
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between  gap-1">
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
                          <div className="flex justify-center gap-1">
                            <Button
                              className="w-full"
                              variant="default"
                              disabled={item.status === 'Pago'}
                              onClick={() => {
                                setSelectedItem(item)
                                setIsPaymentModalOpen(true) // New state to control payment modal
                              }}
                            >
                              Fazer Pagamento
                            </Button>
                            {/* Existing edit and delete buttons */}
                          </div>
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
      <Button onClick={() => setIsAddModalCrataoOpen(true)}>
        Adicionar cartão
      </Button>
      <div className="w-full overflow-auto">
        <div className="w-full pr-4">
          {/* Largura mínima para garantir que todas as colunas fiquem visíveis */}
          <ScrollArea className=" w-full  rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Cartão</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>

                  <TableHead>Limite usado</TableHead>
                  <TableHead>Limite disponivel</TableHead>
                  <TableHead>Limite</TableHead>
                  <TableHead>Obs</TableHead>
                  <TableHead className="text-right pr-2">Opções</TableHead>
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
                  cartoes.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.descricao}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.valor / 100)}
                      </TableCell>
                      <TableCell>
                        {new Date(item.dataVencimento).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {item.dataPagamento
                          ? new Date(item.dataPagamento).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>{item.status}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.limiteUtilizado / 100)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format((item.limite - item.limiteUtilizado) / 100)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(item.limite / 100)}
                      </TableCell>
                      <TableCell>{item.obs}</TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-end  gap-1">
                            <Button
                              onClick={() => {
                                setSelectedcartaoItem(item)
                                console.log(selectedCartaoItem)
                                setIsEditModalCrataoOpen(true)
                              }}
                            >
                              <PenBoxIcon className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="destructive"
                              onClick={() => removeCartao(item._id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex justify-center gap-1">
                            <Button
                              className="w-full"
                              variant="default"
                              disabled={item.status === 'Pago'}
                              onClick={() => {
                                setSelectedcartaoItem(item)
                                setIsPaymentModalOpen(true) // New state to control payment modal
                              }}
                            >
                              Fazer Pagamento
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Totalizador Cartões:</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totais.valor / 100)}
                  </TableCell>
                  <TableCell colSpan={3}></TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totais.limiteUtilizado / 100)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totais.limiteDisponivel / 100)}
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(totais.limiteTotal / 100)}
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-[900px] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Editar conta</DialogTitle>
          </DialogHeader>
          {/*  <FinancasForm
            initialData={selectedItem}
            onSuccess={() => {
              setIsModalOpen(false)
              fetchFinanceiroByMonth(selectedMonth)
            }}
          /> */}
        </DialogContent>
      </Dialog>
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-[900px] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Adicionar nova conta</DialogTitle>
          </DialogHeader>
          {/*    <FinancasForm
            userId={session?.user?.id}
            onSuccess={() => {
              setIsAddModalOpen(false)
              fetchFinanceiroByMonth(selectedMonth)
            }}
          /> */}
        </DialogContent>
      </Dialog>
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <DatePickerWithDefaults
                  label="Data do Pagamento"
                  date={paymentDate ? new Date(paymentDate) : new Date()}
                  setDate={(date) =>
                    setPaymentDate(date ? date.toISOString() : '')
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Confirmar Pagamento</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* modal de adicionar cartão */}
      <Dialog
        open={isAddModalCrataoOpen}
        onOpenChange={setIsAddModalCrataoOpen}
      >
        <DialogContent className="max-w-[900px] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Adicionar novo Cartão</DialogTitle>
          </DialogHeader>
          <CartaoForm
            userId={session?.user?.id}
            onSuccess={() => {
              setIsAddModalCrataoOpen(false)
              fetchFinanceiroByMonth(selectedMonth)
            }}
          />
        </DialogContent>
      </Dialog>
      {/* modal de editar cartão */}
      <Dialog
        open={isEditModalCrataoOpen}
        onOpenChange={setIsEditModalCrataoOpen}
      >
        <DialogContent className="max-w-[900px] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Editar cartão</DialogTitle>
          </DialogHeader>
          <CartaoForm
            initialData={selectedCartaoItem}
            onSuccess={() => {
              setIsEditModalCrataoOpen(false)
              fetchFinanceiroByMonth(selectedMonth)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
