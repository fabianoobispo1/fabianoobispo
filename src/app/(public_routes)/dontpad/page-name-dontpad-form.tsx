'use client'
import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  name_page: z.string(),
})

type PageNameFormValues = z.infer<typeof formSchema>

export default function PageNameDontpad() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)

  const form = useForm<PageNameFormValues>({
    resolver: zodResolver(formSchema),
  })

  const onSubmit = async (data: PageNameFormValues) => {
    setLoading(true)
    console.log(data)

    router.push(`/dontpad/${data.name_page}`)
    setLoading(true)
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-8"
        autoComplete="off"
      >
        <div className="flex flex-col ">
          <FormField
            control={form.control}
            name="name_page"
            render={({ field }) => (
              <FormItem className=" flex-col ">
                <FormLabel>name_page</FormLabel>
                <FormControl>
                  <Input
                    disabled={loading}
                    placeholder="name_page"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button disabled={loading} className="ml-auto" type="submit">
          Salvar
        </Button>
      </form>
    </Form>
  )
}
