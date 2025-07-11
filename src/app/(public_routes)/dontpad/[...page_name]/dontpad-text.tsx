'use client'

/* import { fetchQuery } from 'convex/nextjs' */
import { useEffect, useState } from 'react'
import { ScrollArea } from '@radix-ui/react-scroll-area'

import { useToast } from '@/hooks/use-toast'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface DontpadTextProps {
  page_name: string
}

export default function DontpadText({ page_name }: DontpadTextProps) {
  const { toast } = useToast()
  const [loadingData, setLoadingData] = useState(true)

  const [conteudo, setConteudo] = useState('')
  const [ultimoConteudo, setUltimoConteudo] = useState<string | null>(null)

  /* 
  const loadUser = useCallback(async () => {
    setLoadingData(true)

    try {
      const response = await fetchQuery(api.recuperaSenha.getById, {
        _id: page_name as Id<'recuperaSenha'>,
      })

      if (!response) {
        return
      }
      // verifica campo valid_at
      // Obter a data atual como timestamp

      if (response.valid_at < Date.now()) {
        setIdVencido(true)
      }

      // recupera ID do usuario
      const responseUsuario = await fetchQuery(api.user.getByEmail, {
        email: response.email,
      })
      if (!responseUsuario) {
        return
      }

      setNome(responseUsuario.nome)

      form.reset({
        id: responseUsuario._id,
        password: '',
        confirmPassword: '',
      })
    } catch (error) {
      setIdInvalido(true)
      console.log('Erro ao buscar os dados do usuário: ' + error)
    } finally {
      setLoadingData(false)
    }
  }, [page_name, form])
*/

  const getDataPagina = async () => {
    setLoadingData(true)
    const dataLocal = JSON.parse(localStorage.getItem(`${page_name}`) || '{}')

    const atualizar = dataLocal.dataAtualizacao
      ? `?dataAtualizacao=${dataLocal.dataAtualizacao}`
      : ''

    const url = `${process.env.NEXT_PUBLIC_MINHA_API_URL}/dontpad/${page_name}${atualizar}`

    console.log(url)

    const resposta: Response = await fetch(url)

    console.log(resposta)

    const data = await resposta.json()

    console.log(data)

    setConteudo(data.page_content)

    if (ultimoConteudo === null) setUltimoConteudo(data.page_content)

    localStorage.setItem(
      `${page_name}`,
      JSON.stringify({
        dataAtualizacao: data.dataAtualizacao,
        page_content: data.page_content,
      }),
    )
    setLoadingData(false)
  }

  const setDataPagina = async (conteudo: string) => {
    try {
      const resposta: Response = await fetch(
        `${process.env.NEXT_PUBLIC_MINHA_API_URL}/dontpad/${page_name}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ page_content: conteudo }),
        },
      )
      const data = await resposta.json()
      console.log('Resposta da API:', data)
      localStorage.setItem(
        `${page_name}`,
        JSON.stringify({
          dataAtualizacao: data.dataAtualizacao,
          page_content: data.page_content,
        }),
      )

      toast({
        title: 'ok',
        description: 'Salvo com sucesso!',
      })

      /*       toast.success('Salvo com sucesso!', {
        id: toastId,
      }) */
    } catch (error) {
      console.log('Erro ao salvar o conteúdo:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao salvar o conteúdo. Tente novamente.',
      })
    }
  }

  useEffect(() => {
    // Configura um temporizador para 3 segundos sempre que o userInput muda

    if (setUltimoConteudo === null) return
    if (conteudo === ultimoConteudo) return

    const timerToast = setTimeout(() => {
      toast({
        title: 'Salvando...',
        description: 'Aguarde enquanto o conteúdo é salvo.',
      })
    }, 1000)

    setUltimoConteudo(conteudo)
    const timer = setTimeout(() => {
      if (conteudo !== ultimoConteudo) setDataPagina(conteudo)
    }, 1800)
    // Limpa o temporizador ao desmontar o componente ou quando o userInput muda
    return () => {
      clearTimeout(timer)
      clearTimeout(timerToast)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conteudo])

  useEffect(() => {
    getDataPagina()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  /*
  const onSubmit = async (data: ProductFormValues) => {
    setLoading(true)
    console.log(data)

    let password = ''
    const newPassword = data.password
    if (newPassword) {
      password = await hash(newPassword, 6)
    }
    console.log(password)
    await fetchMutation(api.user.UpdateUserLoginPassword, {
      userId: data.id as Id<'user'>,
      password,
    })

    // altera o campo valid_at par ao link nao ser mais valido

    await fetchMutation(api.recuperaSenha.invalidaRecuperarSenha, {
      _id: page_name as Id<'recuperaSenha'>,
    })

    toast({
      title: 'ok',
      description: 'Cadastro alterado.',
    })

    router.push('/entrar')
    setLoading(true)
  } */

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner />
      </div>
    )
  }

  return (
    <ScrollArea className="w-full h-full">
      <div className="flex items-center justify-center h-full w-full">
        <Card className="w-[350px] md:w-[600px] lg:w-[800px] xl:w-[1000px] 2xl:w-[1200px]">
          <CardHeader>Seu Texto</CardHeader>
          <CardContent>
            <Textarea
              className="w-full h-[500px] resize-none"
              value={conteudo}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setConteudo(e.target.value)
              }
            ></Textarea>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
