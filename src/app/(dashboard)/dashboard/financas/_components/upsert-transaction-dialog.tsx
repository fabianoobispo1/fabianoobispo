'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMutation, useQuery } from 'convex/react'
import { useState } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ScrollArea } from '@/components/ui/scroll-area'

import { MoneyInput } from './money-input'

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  EXPENSE = 'EXPENSE',
  INVESTMENT = 'INVESTMENT',
}
export enum TransactionPaymentMethod {
  CASH = 'CASH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
}

const formSchema = z.object({
  _id: z.string().optional(),
  name: z.string().trim().min(1, {
    message: 'O nome é obrigatório.',
  }),
  amount: z
    .number({
      required_error: 'O valor é obrigatório.',
      invalid_type_error: 'Digite um valor válido.',
    })
    .positive({ message: 'O valor deve ser maior que zero.' }),
  type: z.nativeEnum(TransactionType, {
    required_error: 'O tipo é obrigatório.',
  }),
  category: z.string().min(1, {
    message: 'A categoria é obrigatória.',
  }),
  paymentMethod: z.nativeEnum(TransactionPaymentMethod, {
    required_error: 'O método de pagamento é obrigatório.',
  }),
  date: z.date({
    required_error: 'A data é obrigatória.',
  }),
})

type FormSchema = z.infer<typeof formSchema>

interface UpsertTransactionDialogProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  transactionId?: string
  defaultValues?: FormSchema
  userId?: Id<'user'> | null
}

export const TRANSACTION_PAYMENT_METHOD_OPTIONS = [
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
  { value: 'PIX', label: 'Pix' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'BANK_TRANSFER', label: 'Transferência bancária' },
  { value: 'BANK_SLIP', label: 'Boleto' },
  { value: 'OTHER', label: 'Outro' },
]

export const UpsertTransactionDialog = ({
  isOpen,
  setIsOpen,
  transactionId,
  defaultValues,
  userId,
}: UpsertTransactionDialogProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const categories = useQuery(api.categories.list)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ?? {
      amount: 0,
      category: '',
      date: new Date(),
      name: '',
      paymentMethod: TransactionPaymentMethod.PIX,
      type: TransactionType.EXPENSE,
    },
  })
  const selectedType = form.watch('type')

  // Filtrar categorias pelo tipo selecionado
  const filteredCategories = categories?.filter(
    (cat) => cat.type === selectedType,
  )

  const isUpdate = Boolean(transactionId)

  const registerTransaction = useMutation(api.transaction.create)

  const onSubmit = async (data: FormSchema) => {
    if (!userId) {
      console.error('UserId não encontrado')
      return
    }

    try {
      setIsLoading(true)

      await registerTransaction({
        name: data.name,
        amount: data.amount,
        type: data.type,
        category: data.category,
        paymentMethod: data.paymentMethod,
        date: data.date.getTime(),
        userId,
        created_at: Date.now(),
        updated_at: Date.now(),
      })

      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro ao salvar transação. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          form.reset()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? 'Atualizar' : 'Adicionar'} transação
          </DialogTitle>
          <DialogDescription>Insira as informações abaixo</DialogDescription>
        </DialogHeader>

        <ScrollArea className=" h-[calc(100vh-220px)] pr-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 px-1"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome..." {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <MoneyInput
                        placeholder="Digite o valor..."
                        value={field.value}
                        onValueChange={({ floatValue }) => {
                          field.onChange(floatValue)
                        }}
                        disabled={field.disabled}
                        onBlur={field.onBlur}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Limpa a categoria ao mudar o tipo
                        form.setValue('category', '')
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EXPENSE">
                          <span className="flex items-center gap-2">
                            💸 Despesa
                          </span>
                        </SelectItem>
                        <SelectItem value="DEPOSIT">
                          <span className="flex items-center gap-2">
                            💰 Receita
                          </span>
                        </SelectItem>
                        <SelectItem value="INVESTMENT">
                          <span className="flex items-center gap-2">
                            📈 Investimento
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {!filteredCategories ||
                        filteredCategories.length === 0 ? (
                          <SelectItem value="sem-categoria" disabled>
                            Nenhuma categoria para este tipo
                          </SelectItem>
                        ) : (
                          filteredCategories.map((category) => (
                            <SelectItem
                              key={category._id}
                              value={category.name}
                            >
                              {category.name}
                              {category.description && (
                                <span className="text-xs text-muted-foreground">
                                  {' - '}
                                  {category.description}
                                </span>
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método de pagamento</FormLabel>

                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um método de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRANSACTION_PAYMENT_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>

                    <DatePicker value={field.value} onChange={field.onChange} />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>

                <Button type="submit">
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : isUpdate ? (
                    'Atualizar'
                  ) : (
                    'Adicionar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
