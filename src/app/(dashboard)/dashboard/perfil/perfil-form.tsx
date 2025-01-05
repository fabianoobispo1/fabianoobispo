'use client'
import * as z from 'zod'
import { useCallback, useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { useSession } from 'next-auth/react'
import { compare, hash } from 'bcryptjs'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { DatePickerWithDropdown } from '@/components/calendar/with-dropdown'
import { useToast } from '@/hooks/use-toast'
import { Spinner } from '@/components/ui/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUploadFile } from '@/hooks/use-upload-file'
import { FileUploaderButton } from '@/components/file-uploader-button'

import { api } from '../../../../../convex/_generated/api'
import type { Id } from '../../../../../convex/_generated/dataModel'

const formSchema = z
  .object({
    id: z.string(),
    nome: z.string().min(3, { message: 'Nome precisa ser preenchido.' }),
    data_nascimento: z.preprocess(
      (val) => (val === null ? undefined : val), // Transforma null em undefined
      z.date({
        required_error: 'A data de nascimento precisa ser preenchida.',
      }),
    ),
    email: z.string().email({ message: 'Digite um email valido.' }),
    image: z.string().optional(),
    provider: z.string().optional(),
    oldPassword: z
      .string()
      .min(8, { message: 'Senha obrigatória, min 8' })
      .optional(),
    password: z
      .string()
      .min(8, { message: 'Senha obrigatória, min 8' })
      .optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.oldPassword || (data.oldPassword && data.password), {
    message: 'Informe a nova senha.',
    path: ['password'], // Aponta para o campo `password`
  })
  .refine((data) => !data.password || (data.password && data.confirmPassword), {
    message:
      'O campo de confirmação de senha é obrigatório quando a senha é preenchida.',
    path: ['confirmPassword'], // Aponta para o campo `confirmPassword`
  })
  .refine(
    (data) =>
      !data.password ||
      !data.confirmPassword ||
      data.password === data.confirmPassword,
    {
      message: 'As senhas não coincidem.',
      path: ['confirmPassword'], // Aponta para o campo `confirmPassword`
    },
  )

type ProductFormValues = z.infer<typeof formSchema>

export const PerfilForm: React.FC = () => {
  const { onUpload, progresses, isUploading, uploadedFiles } = useUploadFile(
    'imageUploader',
    {
      defaultUploadedFiles: [],
    },
  )

  const { data: session } = useSession()
  const [loadingData, setLoadingData] = useState(true)
  const [bloqueioProvider, setBloqueioProvider] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [img, setImg] = useState('')
  const [imgKey, setImgKey] = useState('')
  const [passwordHash, setPasswordHash] = useState('1')
  const [emailAtual, setEmailAtual] = useState('')
  const [carregou, setiscarregou] = useState(false)
  const { toast } = useToast()

  const defaultValues = {
    id: '',
    nome: '',
    data_nascimento: undefined,
    email: '',
    imagee: '',
    oldPassword: '',
    password: '',
    confirmPassword: '',
    provider: '',
  }
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const loadUser = useCallback(async () => {
    setLoadingData(true)
    console.log('entrou no loadUser')
    console.log(sessionId)
    if (session) {
      console.log(session.user.id)
      try {
        const response = await fetchQuery(api.user.getById, {
          userId: session.user.id as Id<'user'>,
        })
        console.log(response)
        if (!response) {
          console.error('Erro ao buscar os dados do usuário:')
          return
        }

        if (response.provider !== 'credentials') {
          setBloqueioProvider(true)
        }
        // Atualiza os valores do formulário com os dados da API
        setImg(response.image ?? '')
        setImgKey(response.image_key ?? '')
        setPasswordHash(response.password)
        setEmailAtual(response.email)
        form.reset({
          id: response._id,
          nome: response.nome,
          email: response.email,
          data_nascimento: response.data_nascimento
            ? new Date(response.data_nascimento)
            : undefined,
          image: response.image ?? '',
          oldPassword: '',
          password: '',
          confirmPassword: '',
          provider: response.provider,
        })
      } catch (error) {
        console.error('Erro ao buscar os dados do usuário:', error)
      } finally {
        setLoadingData(false) // Define o carregamento como concluído
      }
    }
  }, [sessionId, session, form])

  useEffect(() => {
    if (session) {
      if (!carregou) {
        setSessionId(session.user.id)
        loadUser()
        setiscarregou(true)
      }
    }
  }, [setSessionId, session, setiscarregou, carregou, loadUser])

  useEffect(() => {
    if (uploadedFiles.length > 0) {
      setImg(uploadedFiles[0]?.url || '')
      setImgKey(uploadedFiles[0]?.key || '')
      form.setValue('image', uploadedFiles[0]?.url || '') // Exemplo de atualização do campo de imagem
    }
  }, [uploadedFiles, form])

  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true)

    let password = ''
    if (data.oldPassword) {
      const isMatch = await compare(data.oldPassword, passwordHash)

      if (!isMatch) {
        toast({
          title: 'Erro',
          variant: 'destructive',
          description: 'Senha antiga incorreta.',
        })
        setLoading(false)
        return
      }
      const newPassword = data.password
      if (newPassword) {
        password = await hash(newPassword, 6)
      }
    }
    // verifica email
    if (emailAtual !== data.email) {
      // se for alterado, precisa verificar se ja exsite o cadastro
      const emailExists = await fetchQuery(api.user.getByEmail, {
        email: data.email,
      })

      if (emailExists) {
        toast({
          title: 'Erro',
          variant: 'destructive',
          description: 'Email já cadastrado.',
        })
        setLoading(false)
        return
      }
    }

    const timestamp = data.data_nascimento
      ? new Date(data.data_nascimento).getTime()
      : 0

    await fetchMutation(api.user.UpdateUser, {
      userId: data.id as Id<'user'>,
      email: data.email,
      image: data.image,
      nome: data.nome,
      data_nascimento: timestamp,
      provider: data.provider,
      image_key: imgKey,
      password,
    })

    toast({
      title: 'ok',
      description: 'Cadastro alterado.',
    })

    form.reset({
      oldPassword: '',
      password: '',
      confirmPassword: '',
    })
    setLoading(false)
  }

  const removeImage = async () => {
    removeFileFromUploadthing(imgKey)
    setImg('')
    setImgKey('')
    form.setValue('image', '')
  }

  async function removeFileFromUploadthing(fileKey: string) {
    const imageKey = fileKey.substring(fileKey.lastIndexOf('/') + 1)

    fetch('/api/uploadthing/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageKey }),
    })
      .then(async (res) => {
        if (res.ok) {
          toast({
            variant: 'default',
            description: 'Imagem removida.',
          })
        } else {
          const errorData = await res.json()
          toast({
            variant: 'destructive',
            description: errorData.message || 'Something went wrong',
          })
        }
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          description: 'Something went wrong',
        })
      })
      .finally(() => {})
  }

  if (loadingData) {
    return <Spinner />
  }

  return (
    <ScrollArea className="h-[70vh] w-full px-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-8"
          autoComplete="off"
        >
          <div className="flex flex-col gap-4  md:grid md:grid-cols-2 ">
            <Avatar className="h-32 w-32">
              <AvatarImage src={img || ''} alt="Avatar" />
              <AvatarFallback>
                {form.getValues('nome')?.[0] || '?'}
              </AvatarFallback>
            </Avatar>
            {bloqueioProvider ? (
              <></>
            ) : (
              <div className="flex flex-col gap-4">
                {isUploading ? (
                  <Spinner />
                ) : (
                  <FileUploaderButton
                    progresses={progresses}
                    onUpload={onUpload}
                    disabled={isUploading}
                  />
                )}

                <Button
                  variant={'ghost'}
                  className="border-2"
                  type="button"
                  onClick={removeImage}
                >
                  Remover Imagem
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem className=" flex-col hidden">
                  <FormLabel>Imagem</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading}
                      placeholder="URL da imagem"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem className=" flex-col hidden">
                  <FormLabel>id</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="id" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input disabled={loading} placeholder="Nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      disabled={loading || bloqueioProvider}
                      placeholder="Email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_nascimento"
              render={({ field }) => (
                <DatePickerWithDropdown
                  label="Data Nascimento"
                  date={field.value || undefined} // Passa undefined se for null
                  setDate={(date) => field.onChange(date || null)} // Define null ao limpar
                />
              )}
            />

            {bloqueioProvider ? (
              <></>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha antiga</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          type="password"
                          placeholder=""
                          disabled={loading || bloqueioProvider}
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
                      <FormLabel>Nova senha</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          type="password"
                          placeholder=""
                          disabled={loading || bloqueioProvider}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comfirmar nova senha</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          type="password"
                          placeholder=""
                          disabled={loading || bloqueioProvider}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          <Button disabled={loading} className="ml-auto" type="submit">
            Salvar
          </Button>
        </form>
      </Form>
    </ScrollArea>
  )
}
