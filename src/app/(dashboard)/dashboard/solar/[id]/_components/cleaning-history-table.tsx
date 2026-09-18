'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CleaningHistoryTableProps {
  cleanings: { _id: string; date: number; note?: string }[]
}

export function CleaningHistoryTable({ cleanings }: CleaningHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Histórico de limpezas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cleanings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma limpeza registrada ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cleanings.map((cleaning) => (
                <TableRow key={cleaning._id}>
                  <TableCell>
                    {new Date(cleaning.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cleaning.note || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
