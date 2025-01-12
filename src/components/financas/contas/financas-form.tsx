'use client'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { useMutation } from 'convex/react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { DatePickerWithDefaults } from '@/components/calendar/with-default'
import type { Id } from '@/convex/_generated/dataModel'
import { api } from '@/convex/_generated/api'

const formSchema = z.object({
  descricao: z.string().min(2, { message: 'Descrição é obrigatória' }),
  valor: z.string(),
  data_vencimento: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.date({
      required_error: 'A data do lançamento precisa ser preenchida.',
    }),
  ),
  categoria: z.string(),
  status: z.string(),
})

interface FinancasFormProps {
  initialData?: {
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
  } | null
  onSuccess?: () => void
  userId?: Id<'user'>
}

export const FinancasForm: React.FC<FinancasFormProps> = ({
  initialData,
  onSuccess,
  userId,
}) => {
  const update = useMutation(api.financeiro.update)
  const create = useMutation(api.financeiro.create)

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  /*   const { open } = useSidebar() */

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          categoria: initialData.categoria,
          valor: initialData.valor.toString(),
          data_vencimento: initialData.dataVencimento
            ? new Date(initialData.dataVencimento)
            : undefined,
          status: initialData.status,
          descricao: initialData.descricao,
        }
      : {
          descricao: '',
          valor: '',
          data_vencimento: undefined,
          categoria: '',
          status: '',
        },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)

      const cleanValue = values.valor.replace(/[R$\s.]/g, '').replace(',', '.')
      const numberValue = parseFloat(cleanValue)

      if (initialData) {
        console.log(initialData)
        console.log(values)
        /*   await update({
          financaId: initialData._id,
          categoria: values.categoria,
          descricao: values.descricao,
          valor: parseFloat(values.valor),
          data_vencimento: new Date(values.data_vencimento).getTime(),
          status: values.status,
          forma_pagamento: values.forma_pagamento,
        }) */
        await update({
          financaId: initialData._id,
          descricao: values.descricao,
          valor: numberValue,
          dataVencimento: new Date(values.data_vencimento).getTime(),
          categoria: values.categoria,
          status: values.status,
          updated_at: new Date().getTime(),
          dataPagamento: initialData.dataPagamento,
        })

        toast({
          title: 'Lançamento atualizado!',
          description: 'Os dados foram alterados com sucesso.',
        })
      } else {
        console.log(values)

        await create({
          userId: userId as Id<'user'>,
          descricao: values.descricao,
          valor: numberValue,
          dataVencimento: new Date(values.data_vencimento).getTime(),
          categoria: values.categoria,
          status: 'PENDENTE',
          created_at: new Date().getTime(),
          updated_at: new Date().getTime(),
        })
        toast({
          title: 'Lançamento registrado!',
          description: 'Os dados foram salvos com sucesso.',
        })
      }

      form.reset()
      onSuccess?.()
    } catch (error) {
      console.log(error)
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao processar o lançamento.',
      })
    } finally {
      setLoading(false)
    }
  }

  const currencyMask = (value: string) => {
    const cleanValue = value.replace(/\D/g, '')
    const numberValue = Number(cleanValue) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(numberValue)
  }
  return (
    /*    <div
      className={cn(
        'space-y-8 w-screen pr-4 ',
        open ? 'md:max-w-[calc(100%-18rem)] ' : 'md:max-w-[calc(100%-7rem)] ',
      )}
    > */
    <ScrollArea className="h-[calc(100vh-270px)]  w-full px-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-2">
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input placeholder="Descrição do lançamento" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input
                    placeholder="R$ 0,00"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      field.onChange(value)
                    }}
                    value={field.value ? currencyMask(field.value) : ''}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_vencimento"
            render={({ field }) => (
              <DatePickerWithDefaults
                label="Data do Vencimento"
                date={field.value || undefined}
                setDate={(date) => field.onChange(date || null)}
              />
            )}
          />

          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cateegoria</FormLabel>
                <FormControl>
                  <Input placeholder="Categoria" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading}>
            {initialData ? 'Salvar Alterações' : 'Adicionar Lançamento'}
          </Button>
        </form>
      </Form>
    </ScrollArea>
    /*  </div> */
  )
}
