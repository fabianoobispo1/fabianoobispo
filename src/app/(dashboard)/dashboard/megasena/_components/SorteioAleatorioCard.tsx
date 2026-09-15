'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation } from 'convex/react'
import { Check, Copy, Minus, Plus, Save, Shuffle } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { formatCurrency } from '@/lib/utils'
import { showErrorToast } from '@/lib/handle-error'

const PRECO_APOSTA_SIMPLES = 6
const MIN_DEZENAS = 6
const MAX_DEZENAS = 20

function clamp(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo)
}

function combinacoes(n: number, k: number): number {
  if (k < 0 || k > n) return 0
  const kEfetivo = Math.min(k, n - k)
  let resultado = 1
  for (let i = 0; i < kEfetivo; i++) {
    resultado = (resultado * (n - i)) / (i + 1)
  }
  return Math.round(resultado)
}

const TOTAL_COMBINACOES_SENA = combinacoes(60, 6) // 50.063.860

/** Sorteia `quantidade` dezenas distintas de 1 a 60, sem nenhum viés estatístico. */
function sortearDezenas(quantidade: number): number[] {
  const escolhidas = new Set<number>()
  while (escolhidas.size < quantidade) {
    escolhidas.add(Math.floor(Math.random() * 60) + 1)
  }
  return Array.from(escolhidas).sort((a, b) => a - b)
}

const formatadorNumero = new Intl.NumberFormat('pt-BR')

export const SorteioAleatorioCard = () => {
  const [quantidade, setQuantidade] = useState(MIN_DEZENAS)
  const [dezenas, setDezenas] = useState<number[]>([])
  const [copiado, setCopiado] = useState(false)
  const { data: session } = useSession()
  const salvarJogo = useMutation(api.megaSenaJogo.salvar)

  const combinacoesJogo = combinacoes(quantidade, 6)
  const custoAposta = combinacoesJogo * PRECO_APOSTA_SIMPLES
  const chanceSena = Math.round(TOTAL_COMBINACOES_SENA / combinacoesJogo)

  const sortear = () => {
    setDezenas(sortearDezenas(quantidade))
    setCopiado(false)
  }

  const copiar = async () => {
    if (!dezenas.length || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(
        dezenas.map((d) => String(d).padStart(2, '0')).join(', '),
      )
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1600)
    } catch {
      // clipboard indisponível (permissão negada, contexto não seguro etc.) — ignora
    }
  }

  const onSalvar = async () => {
    if (!session?.user?.id || !dezenas.length) return
    try {
      await salvarJogo({
        userId: session.user.id as Id<'user'>,
        dezenas,
      })
      toast.success('Jogo salvo')
    } catch (error) {
      showErrorToast(error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sorteio aleatório</CardTitle>
        <CardDescription>
          Sorteia dezenas de 1 a 60 sem nenhum peso estatístico — cada dezena
          tem exatamente a mesma chance. Ajuste a quantidade pra simular um
          bolão e ver o custo e a chance de acerto.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 rounded-md border p-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setQuantidade((q) => clamp(q - 1, MIN_DEZENAS, MAX_DEZENAS))
              }
              disabled={quantidade <= MIN_DEZENAS}
              aria-label="Menos dezenas"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">
              {quantidade}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                setQuantidade((q) => clamp(q + 1, MIN_DEZENAS, MAX_DEZENAS))
              }
              disabled={quantidade >= MAX_DEZENAS}
              aria-label="Mais dezenas"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {quantidade} dezenas ·{' '}
            {quantidade === MIN_DEZENAS
              ? 'aposta mínima'
              : `${formatadorNumero.format(combinacoesJogo)} jogos combinados`}
          </p>

          <Button type="button" onClick={sortear} className="ml-auto">
            <Shuffle className="mr-2 h-4 w-4" />
            Sortear dezenas
          </Button>
        </div>

        {dezenas.length > 0 && (
          <>
            <div className="flex flex-wrap gap-2" aria-live="polite">
              {dezenas.map((dezena) => (
                <Badge key={dezena} variant="secondary" className="text-sm">
                  {String(dezena).padStart(2, '0')}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Custo da aposta</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(custoAposta)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chance da sena</p>
                <p className="text-lg font-semibold">
                  1 em {formatadorNumero.format(chanceSena)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={copiar}>
                {copiado ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar dezenas
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onSalvar}
                disabled={!session?.user?.id}
              >
                <Save className="mr-2 h-4 w-4" />
                Salvar jogo
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
