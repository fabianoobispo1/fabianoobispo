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

interface InsightsTablesProps {
  atraso: { dezena: number; concursosSemSair: number }[]
  paresFrequentes: { par: [number, number]; quantidade: number }[]
}

const formatDezena = (value: number) => String(value).padStart(2, '0')

export const InsightsTables = ({
  atraso,
  paresFrequentes,
}: InsightsTablesProps) => {
  const atrasoTop = atraso.slice(0, 15)
  const paresTop = paresFrequentes.slice(0, 15)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Dezenas com maior atraso</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dezena</TableHead>
                <TableHead className="text-right">Concursos sem sair</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atrasoTop.map((item) => (
                <TableRow key={item.dezena}>
                  <TableCell>
                    <Badge variant="outline">{formatDezena(item.dezena)}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.concursosSemSair}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pares de dezenas mais frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Par</TableHead>
                <TableHead className="text-right">Vezes juntas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paresTop.map((item) => (
                <TableRow key={`${item.par[0]}-${item.par[1]}`}>
                  <TableCell className="flex gap-1">
                    <Badge variant="outline">{formatDezena(item.par[0])}</Badge>
                    <Badge variant="outline">{formatDezena(item.par[1])}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {item.quantidade}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
