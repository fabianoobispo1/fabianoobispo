import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation } from 'convex/react'

import { Modal } from '@/components/ui/modal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { showErrorToast } from '@/lib/handle-error'
import type { Category } from '@/types'
import { TRANSACTION_TYPE_LABELS } from '@/types'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.string().min(1, 'Tipo é obrigatório'),
  description: z.string().optional(),
  active: z.boolean().default(true),
})

interface CategoriaModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Category
}

export const CategoriaModal = ({
  isOpen,
  onClose,
  initialData,
}: CategoriaModalProps) => {
  const create = useMutation(api.categories.create)
  const update = useMutation(api.categories.update)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      type: '',
      description: '',
      active: true,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (initialData) {
        await update({
          categoryId: initialData._id,
          ...values,
          updated_at: Date.now(),
        })
        form.reset()
      } else {
        await create({
          ...values,
          created_at: Date.now(),
          updated_at: Date.now(),
        })
      }
      form.reset()
      onClose()
    } catch (error) {
      showErrorToast(error)
    }
  }

  return (
    <Modal
      title={initialData ? 'Editar Categoria' : 'Nova Categoria'}
      description={
        initialData
          ? 'Edite os dados da categoria'
          : 'Adicione uma nova categoria'
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TRANSACTION_TYPE_LABELS).map(
                      ([type, label]) => (
                        <SelectItem key={type} value={type}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>Ativo</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{initialData ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Form>
    </Modal>
  )
}
