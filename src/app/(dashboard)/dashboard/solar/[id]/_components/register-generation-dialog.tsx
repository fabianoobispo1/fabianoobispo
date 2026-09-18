'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { Zap } from 'lucide-react'

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

const formSchema = z.object({
  date: z.date({ required_error: 'A data é obrigatória.' }),
  kwhGenerated: z
    .number({
      required_error: 'A geração é obrigatória.',
      invalid_type_error: 'Digite um valor válido.',
    })
    .nonnegative({ message: 'O valor não pode ser negativo.' }),
})

type FormSchema = z.infer<typeof formSchema>

interface RegisterGenerationDialogProps {
  plantId: Id<'solarPlant'>
  userId?: Id<'user'> | null
}

export const RegisterGenerationDialog = ({
  plantId,
  userId,
}: RegisterGenerationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: new Date(), kwhGenerated: 0 },
  })

  const registerGeneration = useMutation(api.solar.registerGeneration)

  const onSubmit = async (data: FormSchema) => {
    if (!userId) {
      console.error('UserId não encontrado')
      return
    }

    try {
      setIsLoading(true)

      await registerGeneration({
        plantId,
        date: data.date.getTime(),
        kwhGenerated: data.kwhGenerated,
        userId,
      })

      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error('Erro ao registrar geração:', error)
      alert('Erro ao registrar geração. Tente novamente.')
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
        <Button>
          <Zap className="mr-2 h-4 w-4" />
          Registrar geração
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar geração de energia</DialogTitle>
          <DialogDescription>Insira as informações abaixo</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-1"
          >
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <DatePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kwhGenerated"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Energia gerada (kWh)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 24.5"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
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
              <Button type="submit">
                {isLoading ? <LoadingSpinner /> : 'Registrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
