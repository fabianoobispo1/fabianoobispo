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
import { TransactionTypeBadge } from '../transactions/_components/transaction-type-badge'

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
      message: 'O valor é obrigatório.',
    })
    .positive(),
  type: z.nativeEnum(TransactionType, {
    required_error: 'O tipo é obrigatório.',
  }),
  category: z.string({
    required_error: 'A categoria é obrigatória.',
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
  onTransactionAdd?: () => Promise<void>
}

export const TRANSACTION_PAYMENT_METHOD_OPTIONS = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartão de crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de débito' },
  { value: 'PIX', label: 'Pix' },
]

export const UpsertTransactionDialog = ({
  isOpen,
  setIsOpen,
  transactionId,
  defaultValues,
  userId,
  onTransactionAdd,
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
      paymentMethod: TransactionPaymentMethod.CASH,
      type: TransactionType.EXPENSE,
    },
  })
  const selectedType = form.watch('type')

  const isUpdate = Boolean(transactionId)

  const registerTransaction = useMutation(api.transaction.create)

  const onSubmit = async (data: FormSchema) => {
    if (!userId) {
      return
    }
    setIsLoading(true)
    if (isUpdate) {
      /*       try {
        console.log('OnSubmit', transactionId)
        console.log(data)

        await onTransactionAdd?.()
        setIsOpen(false)
        form.reset()
      } catch (error) {
        console.error(error)
      } */
    } else {
      try {
        console.log('OnSubmit', transactionId)
        console.log(data)
        await registerTransaction({
          ...data,
          amount: data.amount,
          date: data.date.getTime(),
          userId,
          created_at: Date.now(),
          updated_at: Date.now(),
        })
        await onTransactionAdd?.()
        setIsOpen(false)
        form.reset()
      } catch (error) {
        console.error(error)
      }
    }
    setIsLoading(false)
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Encontra a categoria selecionada
                        const selectedCategory = categories?.find(
                          (category) => category.name === value,
                        )
                        // Atualiza o tipo baseado na categoria
                        if (selectedCategory) {
                          form.setValue(
                            'type',
                            selectedCategory.type as TransactionType,
                          )
                        }
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category._id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <TransactionTypeBadge type={selectedType} />

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
