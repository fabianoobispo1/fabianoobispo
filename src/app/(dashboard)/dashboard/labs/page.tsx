'use client'

import { useSession } from 'next-auth/react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/../convex/_generated/api'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Trash2, Play, Loader } from 'lucide-react'

export default function LabsPage() {
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)

  const userId = session?.user?.id

  // Queries e Mutations
  const userLabs = useQuery(api.lab.getUserLabs, userId ? { userId } : 'skip')
  const createLab = useMutation(api.lab.createLab)
  const deleteLab = useMutation(api.lab.deleteLab)
  const updateActivity = useMutation(api.lab.updateLastActivity)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCreateLab = async () => {
    if (!userId) return

    try {
      setCreating(true)
      await createLab({ userId })
    } catch (error: any) {
      alert(`Erro: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteLab = async (labId: string) => {
    if (!userId) return

    try {
      setDeleting(labId)
      await deleteLab({ labId: labId as any, userId })
      setShowDeleteDialog(null)
    } catch (error: any) {
      alert(`Erro: ${error.message}`)
    } finally {
      setDeleting(null)
    }
  }

  const handleCopySsh = (sshCmd: string, labId: string) => {
    navigator.clipboard.writeText(sshCmd)
    setCopied(labId)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleActivityClick = async (labId: string) => {
    try {
      await updateActivity({ labId: labId as any })
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error)
    }
  }

  if (!mounted || !userId) {
    return <div className="p-6">Carregando...</div>
  }

  const statusColor: Record<string, string> = {
    creating: 'bg-yellow-100 text-yellow-800',
    running: 'bg-green-100 text-green-800',
    stopped: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Labs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ambientes descartáveis para testes. Auto-apagam após 2 horas de inatividade.
          </p>
        </div>

        <Button onClick={handleCreateLab} disabled={creating} size="lg">
          {creating ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Novo Lab
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Labs Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userLabs?.length || 0}/3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Memória</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">512 MB</div>
            <p className="text-xs text-gray-500">por lab</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Timeout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 horas</div>
            <p className="text-xs text-gray-500">inatividade</p>
          </CardContent>
        </Card>
      </div>

      {/* Labs List */}
      <div className="space-y-3">
        {!userLabs || userLabs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-6 pb-6 text-center">
              <p className="text-gray-500">Nenhum lab criado ainda.</p>
              <p className="text-sm text-gray-400 mt-1">
                Clique em "Novo Lab" para começar!
              </p>
            </CardContent>
          </Card>
        ) : (
          userLabs.map((lab) => (
            <Card key={lab._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{lab.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      ID: {lab.containerId} • Criado:{' '}
                      {new Date(lab.created_at).toLocaleString('pt-BR')}
                    </CardDescription>
                  </div>
                  <Badge className={statusColor[lab.status]}>
                    {lab.status === 'creating' && <Loader className="h-3 w-3 mr-1 animate-spin" />}
                    {lab.status}
                  </Badge>
                </div>
              </CardHeader>

              {lab.status === 'running' && lab.ip && (
                <CardContent className="space-y-4 pt-0">
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <code className="break-all">
                          ssh -p {lab.port} root@[seu-vps] (IP interno: {lab.ip})
                        </code>
                      </div>
                      <button
                        onClick={() => {
                          const cmd = `ssh -p ${lab.port} root@[seu-vps]`
                          handleCopySsh(cmd, lab._id)
                        }}
                        className="ml-2 p-1 hover:bg-gray-800 rounded"
                        title="Copiar"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>• SSH disponível em ~10 segundos após criação</p>
                    <p>• Qualquer dados locais serão perdidos após destruição</p>
                    <p>
                      • Última atividade:{' '}
                      {new Date(lab.lastActivity).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleActivityClick(lab._id)}
                      variant="outline"
                      size="sm"
                    >
                      Renovar (2h)
                    </Button>

                    <AlertDialog
                      open={showDeleteDialog === lab._id}
                      onOpenChange={(open) =>
                        setShowDeleteDialog(open ? lab._id : null)
                      }
                    >
                      <Button
                        onClick={() => setShowDeleteDialog(lab._id)}
                        variant="destructive"
                        size="sm"
                        disabled={deleting === lab._id}
                      >
                        {deleting === lab._id ? (
                          <>
                            <Loader className="h-3 w-3 mr-1 animate-spin" />
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-1" />
                          </>
                        )}
                        Deletar
                      </Button>

                      <AlertDialogContent>
                        <AlertDialogTitle>Deletar Lab?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Todos os dados dentro do lab serão perdidos. Esta ação é
                          irreversível.
                        </AlertDialogDescription>
                        <div className="flex gap-2 justify-end">
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteLab(lab._id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Deletar
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              )}

              {lab.status === 'creating' && (
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-500">
                    Preparando seu ambiente... isto pode levar alguns segundos.
                  </p>
                </CardContent>
              )}

              {lab.error && (
                <CardContent className="pt-0">
                  <div className="bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700">
                    {lab.error}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">Como usar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            1. Clique em <strong>"Novo Lab"</strong> para criar um novo container
          </p>
          <p>
            2. Copie o comando SSH e acesse o lab de qualquer lugar (porta 2222+)
          </p>
          <p>3. Use para testes, experimentos, ou qualquer coisa temporária</p>
          <p>
            4. Labs ficam <strong>2 horas</strong> inativos antes de serem deletados
            automaticamente
          </p>
          <p className="text-xs text-gray-600 mt-4">
            ℹ️ Máximo 3 labs simultâneos por usuário, 512 MB RAM, 0.2 CPU cada.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
