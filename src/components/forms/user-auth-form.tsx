'use client'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { redirect } from 'next/navigation'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

import { LoadingButton } from '../../components/ui/loading-button'
import GoogleSignInButton from '../google-auth-button'

const formSchema = z.object({
  email: z.string().email({ message: 'Digite um email valido.' }),
  password: z.string().min(8, { message: 'Senha obrigatoria, min 8' }),
})

type UserFormValue = z.infer<typeof formSchema>

export default function UserAuthForm() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const defaultValues = {
    email: '',
    password: '',
  }
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true)

    const result = await signIn('credentials', {
      redirect: false, // Evita o redirecionamento
      email: data.email,
      password: data.password,
    })

    console.log(result)
    setLoading(false)

    if (result?.error) {
      // Exibe o toast com a mensagem de erro
      toast({
        title: 'Erro',
        variant: 'destructive',
        description: 'Credenciais inválidas. Verifique seu email e senha.',
      })
    } else {
      // Exibe um toast de sucesso ou redireciona para uma página
      toast({
        title: 'Ok',
        description: 'Login bem-sucedido!',
      })
      redirect('/dashboard')
    }

    setLoading(false)
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Digite seu e-mail..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder=""
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <LoadingButton
            loading={loading}
            className="ml-auto w-full"
            type="submit"
          >
            {loading ? 'Carregando' : 'Entrar'}
          </LoadingButton>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            ou continue com
          </span>
        </div>
      </div>
      {/* mudar o nome do componete */}
      <GoogleSignInButton />
      {/*     <GitHubSignInButton /> */}
    </>
  )
}
