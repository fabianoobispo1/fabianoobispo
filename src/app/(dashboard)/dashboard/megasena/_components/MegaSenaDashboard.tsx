'use client'

import { useState } from 'react'
import { useAction, useQuery } from 'convex/react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/lib/utils'
import { showErrorToast } from '@/lib/handle-error'

import { FrequenciaCharts } from './FrequenciaCharts'
import { DistribuicaoCharts } from './DistribuicaoCharts'
import { InsightsTables } from './InsightsTables'
import { GeradorJogos } from './GeradorJogos'
import { UltimosResultados } from './UltimosResultados'
import { CadastroManualDialog } from './CadastroManualDialog'

export const MegaSenaDashboard = () => {
  const [isAtualizando, setIsAtualizando] = useState(false)

  const stats = useQuery(api.megaSena.getStats)
  const ultimos = useQuery(api.megaSena.getLatest, { limit: 10 })
  const atualizar = useAction(api.megaSena.fetchLatestFromCaixa)

  const onAtualizar = async () => {
    try {
      setIsAtualizando(true)
      const resultado = await atualizar()
      if (resultado.inserted > 0) {
        toast.success('Novo resultado importado da Caixa')
      } else {
        toast.info('Já estamos com o último resultado disponível')
      }
    } catch (error) {
      showErrorToast(error)
    } finally {
      setIsAtualizando(false)
    }
  }

  if (!stats || !ultimos) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  const ultimoResultado = ultimos[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Fonte: histórico importado + API oficial da Caixa (atualização
          automática diária).
        </p>
        <div className="flex gap-2">
          <CadastroManualDialog />
          <Button onClick={onAtualizar} disabled={isAtualizando}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isAtualizando ? 'animate-spin' : ''}`}
            />
            Atualizar agora
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total de concursos
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {stats.totalConcursos}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Último concurso ({ultimoResultado?.concurso})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {ultimoResultado?.dezenas.map((dezena) => (
              <Badge key={dezena} variant="secondary">
                {String(dezena).padStart(2, '0')}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Status
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {ultimoResultado && ultimoResultado.ganhadores6 > 0
              ? `${ultimoResultado.ganhadores6} ganhador(es)`
              : `Acumulado: ${formatCurrency(ultimoResultado?.acumulado6 ?? 0)}`}
          </CardContent>
        </Card>
      </div>

      <FrequenciaCharts frequencia={stats.frequencia} />
      <DistribuicaoCharts
        somaHistograma={stats.somaHistograma}
        paridade={stats.paridade}
      />
      <InsightsTables
        atraso={stats.atraso}
        paresFrequentes={stats.paresFrequentes}
      />
      <GeradorJogos
        frequencia={stats.frequencia}
        somaHistograma={stats.somaHistograma}
        paridade={stats.paridade}
      />
      <UltimosResultados resultados={ultimos} />
    </div>
  )
}
