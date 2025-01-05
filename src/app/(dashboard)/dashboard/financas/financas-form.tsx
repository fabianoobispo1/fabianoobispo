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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { DatePickerWithDefaults } from '@/components/calendar/with-default'

import type { Id } from '../../../../../convex/_generated/dataModel'
import { api } from '../../../../../convex/_generated/api'

const formSchema = z.object({
  descricao: z.string().min(2, { message: 'Descrição é obrigatória' }),
  valor: z.string(),
  Data_vencimento: z.preprocess(
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
    tipo: string
    categoria: string
    descricao: string
    valor: number
    Data_vencimento: number
    status: string
    forma_pagamento: string
  } | null
  onSuccess?: () => void
  userId?: string
}

export const FinancasForm: React.FC<FinancasFormProps> = ({
  initialData,
  onSuccess,
  userId,
}) => {
  /*  const update = useMutation(api.financeiro.update) */
  const create = useMutation(api.financeiro.create)

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  /*   const { open } = useSidebar() */

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          categoria: initialData.categoria,
          /*         descricao: initialData.descricao,
          valor: String(initialData.valor),
          Data_vencimento: new Date(initialData.Data_vencimento),
          status: initialData.status,
          forma_pagamento: initialData.forma_pagamento, */
        }
      : {
          descricao: '',
          valor: '',
          Data_vencimento: undefined,
          categoria: '',
          status: '',
        },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)

      if (initialData) {
        /*   await update({
          financaId: initialData._id,
          categoria: values.categoria,
          descricao: values.descricao,
          valor: parseFloat(values.valor),
          Data_vencimento: new Date(values.Data_vencimento).getTime(),
          status: values.status,
          forma_pagamento: values.forma_pagamento,
        }) */

        toast({
          title: 'Lançamento atualizado!',
          description: 'Os dados foram alterados com sucesso.',
        })
      } else {
        console.log(values)

        await create({
          userId: userId as Id<'user'>,
          descricao: values.descricao,
          valor: parseFloat(values.valor),
          dataVencimento: new Date(values.Data_vencimento).getTime(),
          categoria: values.categoria,
          status: values.status,
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

  return (
    /*    <div
      className={cn(
        'space-y-8 w-screen pr-4 ',
        open ? 'md:max-w-[calc(100%-18rem)] ' : 'md:max-w-[calc(100%-7rem)] ',
      )}
    > */
    <ScrollArea className="h-[calc(100vh-270px)]  w-full px-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Data_vencimento"
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pago">Pago</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
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
