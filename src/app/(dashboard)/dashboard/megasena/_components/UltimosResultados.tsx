'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency } from '@/lib/utils'
import { formatDataBR } from '@/lib/megasena'
import type { Id } from '@/convex/_generated/dataModel'

interface Resultado {
  _id: Id<'megaSenaResult'>
  concurso: number
  data: number
  dezenas: number[]
  ganhadores6: number
  acumulado6: number
}

interface UltimosResultadosProps {
  resultados: Resultado[]
}

export const UltimosResultados = ({ resultados }: UltimosResultadosProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimos resultados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concurso</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Dezenas</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultados.map((resultado) => (
              <TableRow key={resultado._id}>
                <TableCell>{resultado.concurso}</TableCell>
                <TableCell>{formatDataBR(resultado.data)}</TableCell>
                <TableCell className="flex flex-wrap gap-1">
                  {resultado.dezenas.map((dezena) => (
                    <Badge key={dezena} variant="outline">
                      {String(dezena).padStart(2, '0')}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell className="text-right">
                  {resultado.ganhadores6 > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      {resultado.ganhadores6} ganhador(es)
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Acumulou {formatCurrency(resultado.acumulado6)}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
