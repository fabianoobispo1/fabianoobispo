'use client'

import { useState } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { useSession } from 'next-auth/react'
import { Plus, Trash2, Edit2, CheckCircle, Lock } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import type { SSHConnection } from '@/types/terminal'
import { sealCredential, terminalPublicKey } from '@/lib/terminal-crypto'

interface ConnectionManagerProps {
  onConnectionSelect: (connection: SSHConnection) => void
  selectedConnectionId?: string
}

export function ConnectionManager({
  onConnectionSelect,
  selectedConnectionId,
}: ConnectionManagerProps) {
  const { isAuthenticated } = useConvexAuth()
  const { data: session } = useSession()
  const connections = useQuery(
    api.sshConnection.getConnectionsByUser,
    isAuthenticated ? {} : 'skip',
  )

  const createConnection = useMutation(api.sshConnection.createConnection)
  const updateConnection = useMutation(api.sshConnection.updateConnection)
  const deleteConnection = useMutation(api.sshConnection.deleteConnection)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  // Host/porta/usuário/método da conexão em edição: estão dentro da
  // credencial selada, então mudar qualquer um exige redigitar a credencial
  const [editingBinding, setEditingBinding] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '22',
    username: 'root',
    authMethod: 'password' as 'password' | 'privateKey',
    password: '',
    privateKey: '',
    privateKeyPassphrase: '',
    description: '',
    isDefault: false,
  })

  const bindingOf = (d: {
    host: string
    port: string | number
    username: string
    authMethod: string
  }) => `${d.authMethod}|${d.username}@${d.host}:${Number(d.port) || 22}`
  const credentialTyped =
    formData.authMethod === 'password'
      ? Boolean(formData.password)
      : Boolean(formData.privateKey)
  // Na edição, credencial em branco = manter a atual (se o binding não mudou)
  const credentialRequired =
    !editingId || bindingOf(formData) !== editingBinding

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.host || !formData.username) {
        alert('Preenchha os campos obrigatórios')
        return
      }

      if (credentialRequired && !credentialTyped) {
        alert(
          editingId
            ? 'Host, porta, usuário ou método mudou: digite a credencial novamente.'
            : 'Informe a senha ou a chave privada.',
        )
        return
      }
      if (!session?.user?.id) {
        alert('Sessão expirada: entre novamente.')
        return
      }

      const commonData = {
        name: formData.name,
        host: formData.host.trim(),
        port: parseInt(formData.port) || 22,
        username: formData.username.trim(),
        authMethod: formData.authMethod,
        description: formData.description,
        isDefault: formData.isDefault,
      }

      // A credencial é selada AQUI, com a chave pública do Terminal Server;
      // o texto puro nunca sai do navegador
      const sealedCredential = credentialTyped
        ? await sealCredential({
            owner: session.user.id,
            host: commonData.host,
            port: commonData.port,
            username: commonData.username,
            authMethod: commonData.authMethod,
            password: formData.password,
            privateKey: formData.privateKey,
            passphrase: formData.privateKeyPassphrase,
          })
        : undefined

      if (editingId) {
        await updateConnection({
          connectionId: editingId as Id<'sshConnection'>,
          ...commonData,
          sealedCredential,
        })
      } else {
        await createConnection({
          ...commonData,
          sealedCredential: sealedCredential!,
        })
      }

      resetForm()
      setIsDialogOpen(false)
    } catch (error) {
      alert('Erro ao salvar conexão: ' + String(error))
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta conexão?')) {
      try {
        await deleteConnection({
          connectionId: id as Id<'sshConnection'>,
        })
      } catch (error) {
        alert('Erro ao deletar: ' + String(error))
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '22',
      username: 'root',
      authMethod: 'password',
      password: '',
      privateKey: '',
      privateKeyPassphrase: '',
      description: '',
      isDefault: false,
    })
    setEditingId(null)
    setEditingBinding(null)
  }

  const handleEdit = (conn: NonNullable<typeof connections>[number]) => {
    setFormData({
      name: conn.name,
      host: conn.host,
      port: String(conn.port),
      username: conn.username,
      authMethod: conn.authMethod,
      // A credencial salva nunca volta para a UI: em branco = manter a atual
      password: '',
      privateKey: '',
      privateKeyPassphrase: '',
      description: conn.description || '',
      isDefault: conn.isDefault,
    })
    setEditingId(conn._id)
    setEditingBinding(bindingOf(conn))
    setIsDialogOpen(true)
  }

  if (!connections) {
    return <div>Carregando conexões...</div>
  }

  const publicKeyMissing = !terminalPublicKey()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Conexões SSH Salvas</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nova Conexão
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Editar Conexão' : 'Nova Conexão SSH'}
              </DialogTitle>
              <DialogDescription>
                Configure os detalhes de conexão SSH ao seu servidor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Dados Básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Conexão *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Servidor Principal"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="host">Host/IP *</Label>
                  <Input
                    id="host"
                    placeholder="seu-vps.com ou 192.168.1.1"
                    value={formData.host}
                    onChange={(e) =>
                      setFormData({ ...formData, host: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Porta e Usuário */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="port">Porta SSH *</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="22"
                    value={formData.port}
                    onChange={(e) =>
                      setFormData({ ...formData, port: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="username">Usuário *</Label>
                  <Input
                    id="username"
                    placeholder="root"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Método de Autenticação */}
              <div>
                <Label htmlFor="authMethod">Método de Autenticação *</Label>
                <Select
                  value={formData.authMethod}
                  onValueChange={(value: 'password' | 'privateKey') =>
                    setFormData({ ...formData, authMethod: value })
                  }
                >
                  <SelectTrigger id="authMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">Senha</SelectItem>
                    <SelectItem value="privateKey">Chave Privada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Senha ou Chave Privada */}
              {formData.authMethod === 'password' ? (
                <div>
                  <Label htmlFor="password" className="flex gap-2 items-center">
                    <Lock className="w-4 h-4" />
                    Senha SSH {credentialRequired ? '*' : ''}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={
                      credentialRequired
                        ? 'Sua senha SSH'
                        : 'Em branco = manter a senha atual'
                    }
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    🔐 Cifrada no navegador com a chave do Terminal Server; nem
                    o banco nem o site conseguem lê-la
                  </p>
                </div>
              ) : (
                <div>
                  <Label
                    htmlFor="privateKey"
                    className="flex gap-2 items-center"
                  >
                    <Lock className="w-4 h-4" />
                    Chave Privada SSH *
                  </Label>
                  <textarea
                    id="privateKey"
                    placeholder={
                      credentialRequired
                        ? '-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----'
                        : 'Em branco = manter a chave atual'
                    }
                    value={formData.privateKey}
                    onChange={(e) =>
                      setFormData({ ...formData, privateKey: e.target.value })
                    }
                    className="w-full h-32 p-2 border rounded font-mono text-xs bg-background"
                  />
                  <Input
                    id="privateKeyPassphrase"
                    type="password"
                    autoComplete="new-password"
                    className="mt-2"
                    placeholder="Senha da chave (opcional)"
                    value={formData.privateKeyPassphrase}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        privateKeyPassphrase: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    🔐 Cifrada no navegador com a chave do Terminal Server; nem
                    o banco nem o site conseguem lê-la
                  </p>
                </div>
              )}

              {/* Descrição e Default */}
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  placeholder="Ex: Servidor de produção"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                />
                <Label htmlFor="isDefault" className="mb-0 cursor-pointer">
                  Usar como conexão padrão
                </Label>
              </div>

              {/* Botões */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingId ? 'Atualizar' : 'Criar'} Conexão
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {publicKeyMissing && (
        <p className="text-sm text-red-600">
          NEXT_PUBLIC_TERMINAL_PUBLIC_KEY não configurada: não é possível salvar
          credenciais.
        </p>
      )}

      {/* Lista de Conexões */}
      {connections.length === 0 ? (
        <div className="text-center py-8 text-slate-500 border rounded-lg border-dashed">
          <p>Nenhuma conexão SSH salva</p>
          <p className="text-sm">Crie sua primeira conexão para começar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((conn) => (
            <div
              key={conn._id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedConnectionId === conn._id
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
              onClick={() =>
                onConnectionSelect(conn as unknown as SSHConnection)
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{conn.name}</h3>
                    {!conn.hasCredential && (
                      <Badge variant="destructive">Sem credencial</Badge>
                    )}
                    {conn.isDefault && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Padrão
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {conn.username}@{conn.host}:{conn.port}
                  </p>
                  {conn.description && (
                    <p className="text-xs text-slate-500 mt-1">
                      {conn.description}
                    </p>
                  )}
                  {conn.lastUsed && (
                    <p className="text-xs text-slate-400 mt-1">
                      Último uso:{' '}
                      {new Date(conn.lastUsed).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(conn)
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(conn._id)
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
