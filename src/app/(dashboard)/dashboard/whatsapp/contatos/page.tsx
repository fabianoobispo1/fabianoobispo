'use client'

import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useMutation } from 'convex/react'

import BreadCrumb from '@/components/breadcrumb'
import { Heading } from '@/components/ui/heading'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const breadcrumbItems = [
  { title: 'WhatsApp Business', link: '/dashboard/whatsapp' },
  { title: 'Importar Contatos', link: '/dashboard/whatsapp/contatos' },
]

interface ContactItem {
  number: string
  name: string
  lastMessageAt: string
  lastMessageText: string
}

export default function ImportarContatosPage() {
  const { data: session } = useSession()
  const importContacts = useMutation(api.contacts.importFromJson)

  const [contacts, setContacts] = useState<ContactItem[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    inserted: number
    updated: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setResult(null)
    try {
      const file = e.target.files?.[0]
      if (!file) return
      setFileName(file.name)
      const text = await file.text()
      const json = JSON.parse(text)
      if (!json || !Array.isArray(json.contacts)) {
        setError('JSON inválido: esperado objeto com array "contacts"')
        setContacts(null)
        return
      }
      // valida e normaliza entradas com segurança de tipo
      const parsed: ContactItem[] = (json.contacts as unknown[])
        .map((c: unknown) => {
          const obj = c as Record<string, unknown>
          const numberVal = obj?.number
          const nameVal = obj?.name
          if (typeof numberVal !== 'string' && typeof numberVal !== 'number')
            return null
          if (typeof nameVal !== 'string' && typeof nameVal !== 'number')
            return null
          return {
            number:
              typeof numberVal === 'string' ? numberVal : String(numberVal),
            name: typeof nameVal === 'string' ? nameVal : String(nameVal),
            lastMessageAt:
              typeof obj?.lastMessageAt === 'string'
                ? obj.lastMessageAt
                : String(obj?.lastMessageAt ?? ''),
            lastMessageText:
              typeof obj?.lastMessageText === 'string'
                ? obj.lastMessageText
                : String(obj?.lastMessageText ?? ''),
          }
        })
        .filter((c): c is ContactItem => c !== null)
      setContacts(parsed)
    } catch (err) {
      setError(
        err instanceof Error
          ? `Falha ao ler/parsear o arquivo JSON: ${err.message}`
          : 'Falha ao ler/parsear o arquivo JSON',
      )
      setContacts(null)
    }
  }

  const handleImport = async () => {
    if (!session?.user?.id) return
    if (!contacts || contacts.length === 0) {
      setError('Nenhum contato válido para importar')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await importContacts({
        userId: session.user.id as Id<'user'>,
        contacts,
      })
      setResult(res)
    } catch (err) {
      setError(
        err instanceof Error
          ? `Erro ao importar contatos: ${err.message}`
          : 'Erro ao importar contatos',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between gap-4">
        <Heading
          title="Importar Contatos"
          description="Faça upload de um arquivo JSON para importar contatos"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Arquivo JSON</CardTitle>
          <CardDescription>
            Selecione o arquivo com a estrutura esperada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            accept="application/json"
            onChange={handleFileChange}
          />
          {fileName && (
            <p className="text-xs text-muted-foreground">
              Selecionado: {fileName}
            </p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={loading || !contacts || contacts.length === 0}
            >
              {loading ? 'Importando...' : 'Importar'}
            </Button>
            {result && (
              <Badge variant="outline">
                Inseridos: {result.inserted} • Atualizados: {result.updated}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {contacts && (
        <Card>
          <CardHeader>
            <CardTitle>Pré-visualização</CardTitle>
            <CardDescription>Mostrando até 10 contatos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {contacts.slice(0, 10).map((c, idx) => (
                <div key={idx} className="p-3 rounded border">
                  <p className="text-sm">
                    <span className="font-semibold">Número:</span> {c.number}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Nome:</span> {c.name}
                  </p>
                  {c.lastMessageAt && (
                    <p className="text-xs text-muted-foreground">
                      Última mensagem: {c.lastMessageAt}
                    </p>
                  )}
                  {c.lastMessageText && (
                    <p className="text-xs text-muted-foreground">
                      Texto: {c.lastMessageText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
