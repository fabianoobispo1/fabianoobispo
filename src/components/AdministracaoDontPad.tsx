'use client'
import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Trash } from 'lucide-react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { Spinner } from './ui/spinner'

interface DontPad {
  id: string
  page_name: string
  page_content: string
  ads: boolean
  updated_at: Date
  created_at: Date
}

export function AdministracaoDontPad() {
  const [dontPads, setDontPads] = useState<DontPad[]>([])
  const [carregou, setiscarregou] = useState(false)
  const [loading, setLoading] = useState(false)

  const { data: session } = useSession()

  const loadDontPads = useCallback(async () => {
    if (session) {
      try {
        const resposta: Response = await fetch(
          `${process.env.NEXT_PUBLIC_MINHA_API_URL}/dontpad/listall`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        )
        const data = await resposta.json()
        setDontPads(data.dontpadAll || [])
      } catch (error) {
        console.error('Erro ao buscar DontPads:', error)
      }
    }
  }, [session])

  useEffect(() => {
    setLoading(true)
    if (session) {
      if (!carregou) {
        loadDontPads()
        setiscarregou(true)
        setLoading(false)
      }
    }
  }, [session, carregou, setiscarregou, loadDontPads, setLoading])

  function removerTela(id: string) {
    console.log('teste', id)
  }

  return (
    <div className="space-y-8">
      <ScrollArea className="h-[calc(80vh-220px)] w-full overflow-x-auto rounded-md border">
        {loading ? (
          <Table className="relative">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Nome</TableHead>
                <TableHead className="text-center">email</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {dontPads ? (
                dontPads.map((dontPad) => (
                  <TableRow key={dontPad.id}>
                    <TableCell className="text-center">
                      {dontPad.page_name}
                    </TableCell>
                    <TableCell className="text-center">
                      {dontPad.page_content}
                    </TableCell>

                    <TableCell className="text-center">
                      <Button
                        variant="destructive"
                        onClick={() => removerTela(dontPad.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <Spinner />
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        )}

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
