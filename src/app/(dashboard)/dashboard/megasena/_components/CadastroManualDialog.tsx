'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMutation } from 'convex/react'
import { PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { api } from '@/convex/_generated/api'
import { showErrorToast } from '@/lib/handle-error'

const formSchema = z.object({
  concurso: z.coerce
    .number()
    .int()
    .positive({ message: 'Informe o número do concurso.' }),
  data: z.date({ required_error: 'A data é obrigatória.' }),
  dezenas: z
    .string()
    .min(1, { message: 'Informe as 6 dezenas separadas por vírgula.' }),
})

type FormSchema = z.infer<typeof formSchema>

function parseDezenas(value: string): number[] | null {
  const numeros = value
    .split(/[,\s]+/)
    .filter(Boolean)
    .map(Number)

  if (numeros.length !== 6) return null
  if (numeros.some((n) => !Number.isInteger(n) || n < 1 || n > 60)) return null
  if (new Set(numeros).size !== 6) return null

  return numeros.sort((a, b) => a - b)
}

export const CadastroManualDialog = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const criarResultado = useMutation(api.megaSena.create)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { concurso: 0, data: new Date(), dezenas: '' },
  })

  const onSubmit = async (data: FormSchema) => {
    const dezenas = parseDezenas(data.dezenas)
    if (!dezenas) {
      form.setError('dezenas', {
        message:
          'Informe exatamente 6 dezenas únicas entre 1 e 60, separadas por vírgula.',
      })
      return
    }

    try {
      setIsLoading(true)
      await criarResultado({
        concurso: data.concurso,
        data: data.data.getTime(),
        dezenas,
        ganhadores6: 0,
        rateio6: 0,
        ganhadores5: 0,
        rateio5: 0,
        ganhadores4: 0,
        rateio4: 0,
        acumulado6: 0,
        created_at: Date.now(),
      })
      toast.success('Concurso cadastrado com sucesso')
      setIsOpen(false)
      form.reset()
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) form.reset()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Cadastrar manualmente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar concurso manualmente</DialogTitle>
          <DialogDescription>
            Use apenas se a atualização automática falhar. Os valores de
            premiação ficam zerados nesse cadastro.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-1"
          >
            <FormField
              control={form.control}
              name="concurso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do concurso</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 3031" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data do sorteio</FormLabel>
                  <DatePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dezenas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dezenas sorteadas</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 4, 5, 30, 33, 41, 52" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <LoadingSpinner /> : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
