'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { Plus } from 'lucide-react'

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
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const formSchema = z.object({
  name: z.string().trim().min(1, { message: 'O nome é obrigatório.' }),
  capacityKwp: z
    .number({
      required_error: 'A potência é obrigatória.',
      invalid_type_error: 'Digite um valor válido.',
    })
    .positive({ message: 'A potência deve ser maior que zero.' }),
  location: z.string().trim().optional(),
})

type FormSchema = z.infer<typeof formSchema>

interface AddPlantDialogProps {
  userId?: Id<'user'> | null
}

export const AddPlantDialog = ({ userId }: AddPlantDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', capacityKwp: 0, location: '' },
  })

  const createPlant = useMutation(api.solar.createPlant)

  const onSubmit = async (data: FormSchema) => {
    if (!userId) {
      console.error('UserId não encontrado')
      return
    }

    try {
      setIsLoading(true)

      await createPlant({
        name: data.name,
        capacityKwp: data.capacityKwp,
        location: data.location || undefined,
        userId,
      })

      setIsOpen(false)
      form.reset()
    } catch (error) {
      console.error('Erro ao cadastrar usina:', error)
      alert('Erro ao cadastrar usina. Tente novamente.')
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
          <Plus className="mr-2 h-4 w-4" />
          Nova usina
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cadastrar usina</DialogTitle>
          <DialogDescription>Insira as informações abaixo</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 px-1"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Usina Casa, Usina Cliente X"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacityKwp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potência instalada (kWp)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 5.5"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localização (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Telhado, Solo, Cidade" {...field} />
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
                {isLoading ? <LoadingSpinner /> : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
