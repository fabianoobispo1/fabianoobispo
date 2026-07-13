'use client'

import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from 'convex/react'
import { Trash2 } from 'lucide-react'
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

interface MeusJogosSalvosProps {
  ultimoResultado?: { concurso: number; dezenas: number[] }
}

export const MeusJogosSalvos = ({ ultimoResultado }: MeusJogosSalvosProps) => {
  const { data: session } = useSession()
  const userId = session?.user?.id as Id<'user'> | undefined

  const jogos = useQuery(
    api.megaSenaJogo.listarPorUsuario,
    userId ? { userId } : 'skip',
  )
  const remover = useMutation(api.megaSenaJogo.remover)

  const onRemover = async (jogoId: Id<'megaSenaJogoGerado'>) => {
    try {
      await remover({ jogoId })
      toast.success('Jogo removido')
    } catch (error) {
      showErrorToast(error)
    }
  }

  if (!jogos || jogos.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meus jogos salvos</CardTitle>
        <CardDescription>
          Jogos gerados que você guardou, com os acertos em relação ao último
          concurso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {jogos.map((jogo) => {
          const acertos = ultimoResultado
            ? jogo.dezenas.filter((d) => ultimoResultado.dezenas.includes(d))
                .length
            : null

          return (
            <div key={jogo._id} className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {jogo.dezenas.map((n) => (
                  <Badge
                    key={n}
                    variant={
                      ultimoResultado?.dezenas.includes(n)
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {String(n).padStart(2, '0')}
                  </Badge>
                ))}
              </div>
              {acertos !== null && (
                <span className="text-sm text-muted-foreground">
                  {acertos} acerto(s) no concurso {ultimoResultado?.concurso}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                title="Remover jogo"
                onClick={() => onRemover(jogo._id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
