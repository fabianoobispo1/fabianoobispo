'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useQuery } from 'convex/react'
import { Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import { parseDezenas } from '@/lib/megasena'

const formSchema = z.object({
  dezenas: z
    .string()
    .min(1, { message: 'Informe as 6 dezenas separadas por vírgula.' }),
})

type FormSchema = z.infer<typeof formSchema>

export const ConferirApostaCard = () => {
  const [dezenasConferidas, setDezenasConferidas] = useState<number[] | null>(
    null,
  )

  const resultado = useQuery(
    api.megaSena.conferirAposta,
    dezenasConferidas ? { dezenas: dezenasConferidas } : 'skip',
  )

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { dezenas: '' },
  })

  const onSubmit = (data: FormSchema) => {
    const dezenas = parseDezenas(data.dezenas)
    if (!dezenas) {
      form.setError('dezenas', {
        message:
          'Informe exatamente 6 dezenas únicas entre 1 e 60, separadas por vírgula.',
      })
      return
    }
    setDezenasConferidas(dezenas)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confira sua aposta</CardTitle>
        <CardDescription>
          Veja quantos acertos suas dezenas teriam tido no histórico. Cada
          sorteio é independente — isso é só curiosidade estatística, não
          aumenta suas chances no próximo concurso.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-wrap items-start gap-2"
          >
            <FormField
              control={form.control}
              name="dezenas"
              render={({ field }) => (
                <FormItem className="min-w-[240px] flex-1">
                  <FormControl>
                    <Input placeholder="Ex: 4, 5, 30, 33, 41, 52" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              Conferir
            </Button>
          </form>
        </Form>

        {resultado && dezenasConferidas && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex flex-wrap items-center gap-2">
              {dezenasConferidas.map((n) => (
                <Badge key={n} variant="secondary">
                  {String(n).padStart(2, '0')}
                </Badge>
              ))}
            </div>

            <p className="text-sm">
              No último concurso (nº {resultado.ultimoConcurso}):{' '}
              <strong>{resultado.acertosUltimoConcurso} acerto(s)</strong>
            </p>

            {resultado.melhorResultado && (
              <p className="text-sm text-muted-foreground">
                Melhor resultado histórico: {resultado.melhorResultado.acertos}{' '}
                acerto(s) no concurso {resultado.melhorResultado.concurso}
              </p>
            )}

            <div className="space-y-1">
              {resultado.distribuicaoHistorica.map((linha) => (
                <div
                  key={linha.acertos}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {linha.acertos} acerto(s)
                  </span>
                  <span>{linha.quantidade} vez(es)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
