'use client'
import { useCallback, useEffect, useState } from 'react'
import { fetchMutation, fetchQuery } from 'convex/nextjs'
import { useSession } from 'next-auth/react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'

import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { Spinner } from './ui/spinner'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface User {
  _id: Id<'user'>
  _creationTime: number
  nome: string
  email: string
  role: 'user' | 'admin'
  last_login_at?: number
}

const formatDate = (timestamp?: number) =>
  timestamp ? new Date(timestamp).toLocaleString('pt-BR') : '-'

export function UsuariosAdministradores() {
  const [usuarios, setusuarios] = useState<User[]>([])
  const [carregou, setiscarregou] = useState(false)
  const [loadingUsuario, setLoadingUsuario] = useState<boolean>(false)
  const { data: session } = useSession()

  const loadUsuarios = useCallback(async () => {
    if (session?.user?.id) {
      fetchQuery(api.user.getAllUserRole, {
        userId: session.user.id as Id<'user'>,
      }).then((result) => {
        setusuarios(result)
      })
    }
  }, [session])

  useEffect(() => {
    if (session) {
      if (!carregou) {
        loadUsuarios()
        setiscarregou(true)
      }
    }
  }, [loadUsuarios, session, carregou, setiscarregou])

  const toggleAdmin = async (id: Id<'user'>) => {
    if (!session?.user?.id) return
    setLoadingUsuario(true)

    await fetchMutation(api.user.toggleUserRole, {
      userId: session.user.id as Id<'user'>,
      targetUserId: id,
    })

    loadUsuarios()
    setLoadingUsuario(false)
  }

  return (
    <div className="space-y-8">
      <ScrollArea className="h-[calc(80vh-220px)] w-full overflow-x-auto rounded-md border">
        <Table className="relative">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Admin</TableHead>
              <TableHead className="text-center">Nome</TableHead>
              <TableHead className="text-center">email</TableHead>
              <TableHead className="text-center">Cadastrado em</TableHead>
              <TableHead className="text-center">Último login</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {usuarios ? (
              usuarios.map((usuario) => (
                <TableRow key={usuario._id}>
                  <TableCell className="text-center">
                    <Checkbox
                      disabled={loadingUsuario}
                      checked={usuario.role === 'admin'}
                      onCheckedChange={() => toggleAdmin(usuario._id)}
                    />
                  </TableCell>

                  <TableCell className="text-center">{usuario.nome}</TableCell>
                  <TableCell className="text-center">{usuario.email}</TableCell>
                  <TableCell className="text-center">
                    {formatDate(usuario._creationTime)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatDate(usuario.last_login_at)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <Spinner />
            )}
          </TableBody>
        </Table>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
