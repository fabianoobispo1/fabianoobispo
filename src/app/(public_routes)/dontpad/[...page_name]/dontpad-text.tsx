'use client'
import { api } from '@/../convex/_generated/api'

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { useQuery, useMutation } from 'convex/react'
import { Check, Loader2, Pencil } from 'lucide-react'

import { useToast } from '@/hooks/use-toast'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

interface DontpadTextProps {
  page_name: string
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

// Debounce curto: salva logo apos uma pausa breve na digitacao, sem
// disparar uma mutation a cada tecla.
const SAVE_DEBOUNCE_MS = 400

// Intervalo minimo entre "pings" de digitacao (throttle) e por quanto
// tempo um ping recente ainda conta como "esta editando agora".
const EDITING_PING_INTERVAL_MS = 1500
const EDITING_STALE_MS = 3000

export default function DontpadText({ page_name }: DontpadTextProps) {
  const { toast } = useToast()
  const [conteudo, setConteudo] = useState('')
  const [ultimoConteudo, setUltimoConteudo] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [clientId] = useState(() => crypto.randomUUID())
  const lastPingAtRef = useRef(0)
  const [, setTick] = useState(0)

  // Query para buscar dados da página
  const pageData = useQuery(api.dontPad.getByPageName, { page_name })
  const updatePage = useMutation(api.dontPad.update)
  const pingEditing = useMutation(api.dontPad.ping)

  // Re-renderiza periodicamente pra "alguém está editando" desaparecer
  // sozinho quando o outro cliente parar de digitar (sem isso, o estado só
  // reavaliaria quando pageData mudasse de novo).
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const isSomeoneElseEditing =
    !!pageData?.editing_client_id &&
    pageData.editing_client_id !== clientId &&
    !!pageData.editing_at &&
    Date.now() - pageData.editing_at < EDITING_STALE_MS

  const notifyEditing = () => {
    const now = Date.now()
    if (now - lastPingAtRef.current < EDITING_PING_INTERVAL_MS) return
    lastPingAtRef.current = now
    pingEditing({ page_name, client_id: clientId }).catch(() => {})
  }

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

  // Sincroniza mudanças feitas em outra aba/dispositivo (query do Convex é
  // reativa). Só aplica se o usuário não tiver edição local não salva, pra
  // não sobrescrever o que ele está digitando.
  useEffect(() => {
    if (!isInitialized || pageData === undefined) return

    const remoteConteudo = pageData?.page_content ?? ''
    if (remoteConteudo === ultimoConteudo) return

    setUltimoConteudo(remoteConteudo)
    setConteudo((atual) => (atual === ultimoConteudo ? remoteConteudo : atual))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData])

  // Auto-save quando o conteúdo muda. Sem toast a cada save: um indicador
  // discreto no cabeçalho mostra o status, como num editor colaborativo.
  useEffect(() => {
    if (!isInitialized) return
    if (conteudo === ultimoConteudo) return

    setSaveStatus('saving')

    const timer = setTimeout(async () => {
      try {
        await updatePage({
          page_name,
          page_content: conteudo,
        })

        setUltimoConteudo(conteudo)
        setSaveStatus('saved')
      } catch (error) {
        console.log('Erro ao salvar o conteúdo:', error)
        setSaveStatus('error')
        toast({
          title: 'Erro',
          description: 'Erro ao salvar o conteúdo. Tente novamente.',
          variant: 'destructive',
        })
      }
    }, SAVE_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [conteudo, ultimoConteudo, isInitialized, page_name, updatePage, toast])

  // "Salvo" volta a ficar neutro depois de um tempo, pra nao virar um selo
  // permanente na tela.
  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = setTimeout(() => setSaveStatus('idle'), 2000)
    return () => clearTimeout(timer)
  }, [saveStatus])

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
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <span className="flex items-center gap-2">
              Seu Texto
              {isSomeoneElseEditing && (
                <span className="flex items-center gap-1 text-xs font-normal text-amber-500">
                  <Pencil className="h-3 w-3 animate-pulse" />
                  Alguém mais está editando...
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Salvando...
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check className="h-3 w-3" />
                  Salvo
                </>
              )}
              {saveStatus === 'error' && (
                <span className="text-destructive">Erro ao salvar</span>
              )}
            </span>
          </CardHeader>
          <CardContent>
            <Textarea
              className="w-full h-[500px] resize-none"
              value={conteudo}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setConteudo(e.target.value)
                notifyEditing()
              }}
            ></Textarea>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
