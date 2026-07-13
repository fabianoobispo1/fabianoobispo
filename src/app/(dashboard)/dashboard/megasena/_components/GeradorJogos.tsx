'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation } from 'convex/react'
import { Dices, Save } from 'lucide-react'
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
import { showErrorToast } from '@/lib/handle-error'

interface GeradorJogosProps {
  frequencia: { dezena: number; quantidade: number }[]
  somaHistograma: { faixa: string; quantidade: number }[]
  paridade: { pares: number; quantidade: number }[]
}

const QUANTIDADE_JOGOS = 5

function faixaSomaMaisComum(
  somaHistograma: { faixa: string; quantidade: number }[],
) {
  const top = [...somaHistograma].sort((a, b) => b.quantidade - a.quantidade)[0]
  if (!top) return { min: 100, max: 200 }
  const [min, max] = top.faixa.split('-').map(Number)
  return { min, max }
}

function paridadeMaisComum(paridade: { pares: number; quantidade: number }[]) {
  const top = [...paridade].sort((a, b) => b.quantidade - a.quantidade)[0]
  return top?.pares ?? 3
}

function gerarJogo(
  quentes: number[],
  frios: number[],
  somaAlvo: { min: number; max: number },
  paridadeAlvo: number,
): number[] {
  let ultimaTentativa: number[] = []

  for (let tentativa = 0; tentativa < 300; tentativa++) {
    const numeros = new Set<number>()
    while (numeros.size < 6) {
      const origem = Math.random() < 0.6 ? quentes : frios
      const escolhido = origem[Math.floor(Math.random() * origem.length)]
      numeros.add(escolhido)
    }

    const jogo = Array.from(numeros).sort((a, b) => a - b)
    ultimaTentativa = jogo

    const soma = jogo.reduce((acc, n) => acc + n, 0)
    const pares = jogo.filter((n) => n % 2 === 0).length
    const somaOk = soma >= somaAlvo.min - 20 && soma <= somaAlvo.max + 20
    const paridadeOk = Math.abs(pares - paridadeAlvo) <= 1

    if (somaOk && paridadeOk) return jogo
  }

  return ultimaTentativa
}

export const GeradorJogos = ({
  frequencia,
  somaHistograma,
  paridade,
}: GeradorJogosProps) => {
  const [jogos, setJogos] = useState<number[][]>([])
  const { data: session } = useSession()
  const salvarJogo = useMutation(api.megaSenaJogo.salvar)

  const onSalvar = async (jogo: number[]) => {
    if (!session?.user?.id) return
    try {
      await salvarJogo({
        userId: session.user.id as Id<'user'>,
        dezenas: jogo,
      })
      toast.success('Jogo salvo')
    } catch (error) {
      showErrorToast(error)
    }
  }

  const gerar = () => {
    const ordenada = [...frequencia].sort((a, b) => b.quantidade - a.quantidade)
    const quentes = ordenada.slice(0, 30).map((f) => f.dezena)
    const frios = ordenada.slice(-30).map((f) => f.dezena)
    const somaAlvo = faixaSomaMaisComum(somaHistograma)
    const paridadeAlvo = paridadeMaisComum(paridade)

    setJogos(
      Array.from({ length: QUANTIDADE_JOGOS }, () =>
        gerarJogo(quentes, frios, somaAlvo, paridadeAlvo),
      ),
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerador de jogos sugeridos</CardTitle>
        <CardDescription>
          Mistura dezenas quentes e frias respeitando a faixa de soma e a
          proporção par/ímpar mais comuns no histórico. Cada sorteio é um evento
          independente — isso não aumenta suas chances reais, é só uma forma
          lúdica de montar jogos a partir do histórico.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={gerar}>
          <Dices className="mr-2 h-4 w-4" />
          Gerar {QUANTIDADE_JOGOS} jogos
        </Button>

        {jogos.length > 0 && (
          <div className="space-y-2">
            {jogos.map((jogo, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <span className="w-16 shrink-0 text-sm text-muted-foreground">
                  Jogo {index + 1}
                </span>
                {jogo.map((numero) => (
                  <Badge key={numero} variant="secondary" className="text-sm">
                    {String(numero).padStart(2, '0')}
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Salvar jogo"
                  onClick={() => onSalvar(jogo)}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
