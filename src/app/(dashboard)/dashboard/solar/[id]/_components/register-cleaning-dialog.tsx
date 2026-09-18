'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { Droplets } from 'lucide-react'

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
  note: z.string().trim().optional(),
})

type FormSchema = z.infer<typeof formSchema>

interface RegisterCleaningDialogProps {
  plantId: Id<'solarPlant'>
  userId?: Id<'user'> | null
}

export const RegisterCleaningDialog = ({
  plantId,
  userId,
}: RegisterCleaningDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: new Date(), note: '' },
  })

  const registerCleaning = useMutation(api.solar.registerCleaning)

  const onSubmit = async (data: FormSchema) => {
    if (!userId) {
      console.error('UserId não encontrado')
      return
    }

    try {
      setIsLoading(true)

      await registerCleaning({
        plantId,
        date: data.date.getTime(),
        note: data.note || undefined,
        userId,
      })

      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error('Erro ao registrar limpeza:', error)
      alert('Erro ao registrar limpeza. Tente novamente.')
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
          <Droplets className="mr-2 h-4 w-4" />
          Registrar limpeza
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar limpeza</DialogTitle>
          <DialogDescription>
            A eficiência é recalculada a partir da data mais recente de limpeza.
          </DialogDescription>
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
                  <FormLabel>Data da limpeza</FormLabel>
                  <DatePicker value={field.value} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: limpeza completa com água"
                      {...field}
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
