'use client'
import { api } from '@/../convex/_generated/api'

import { useEffect, useState } from 'react'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useQuery, useMutation } from 'convex/react'

import { useToast } from '@/hooks/use-toast'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface DontpadTextProps {
  page_name: string
}

export default function DontpadText({ page_name }: DontpadTextProps) {
  const { toast } = useToast()
  const [conteudo, setConteudo] = useState('')
  const [ultimoConteudo, setUltimoConteudo] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Query para buscar dados da página
  const pageData = useQuery(api.dontPad.getByPageName, { page_name })
  const updatePage = useMutation(api.dontPad.update)

  // Inicializa o conteúdo quando os dados são carregados
  useEffect(() => {
    if (pageData && !isInitialized) {
      setConteudo(pageData.page_content || '')
      setUltimoConteudo(pageData.page_content || '')
      setIsInitialized(true)
    } else if (pageData === null && !isInitialized) {
      // Página não existe ainda
      setConteudo('')
      setUltimoConteudo('')
      setIsInitialized(true)
    }
  }, [pageData, isInitialized])

  // Auto-save quando o conteúdo muda
  useEffect(() => {
    if (!isInitialized) return
    if (conteudo === ultimoConteudo) return

    const timerToast = setTimeout(() => {
      toast({
        title: 'Salvando...',
        description: 'Aguarde enquanto o conteúdo é salvo.',
      })
    }, 1000)

    const timer = setTimeout(async () => {
      if (conteudo !== ultimoConteudo) {
        try {
          await updatePage({
            page_name,
            page_content: conteudo,
          })

          setUltimoConteudo(conteudo)

          toast({
            title: 'ok',
            description: 'Salvo com sucesso!',
          })
        } catch (error) {
          console.log('Erro ao salvar o conteúdo:', error)
          toast({
            title: 'Erro',
            description: 'Erro ao salvar o conteúdo. Tente novamente.',
            variant: 'destructive',
          })
        }
      }
    }, 1800)

    return () => {
      clearTimeout(timer)
      clearTimeout(timerToast)
    }
  }, [conteudo, ultimoConteudo, isInitialized, page_name, updatePage, toast])

  if (pageData === undefined || !isInitialized) {
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
