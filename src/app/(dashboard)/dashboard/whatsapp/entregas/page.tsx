'use client'

import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'

import { useSession } from 'next-auth/react'
import { useQuery } from 'convex/react'
import { useState } from 'react'
import { Search, Eye } from 'lucide-react'

import BreadCrumb from '@/components/breadcrumb'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function EntregasPage() {
  const { data: session } = useSession()
  const campaigns = useQuery(api.whatsAppCampaign.getCampaignsByUser, {
    userId: session?.user?.id as Id<'user'>,
  })

  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Record<
    string,
    unknown
  > | null>(null)

  const messages = useQuery(
    api.whatsAppCampaign.getMessagesByCampaign,
    selectedCampaignId && session?.user?.id
      ? {
          campaignId: selectedCampaignId as Id<'campaign'>,
          userId: session.user.id as Id<'user'>,
        }
      : 'skip',
  )

  const filteredMessages = messages?.filter((msg: Record<string, unknown>) => {
    const matchesSearch =
      (msg.recipientPhone as string)?.includes(searchTerm) ||
      (msg.recipientName as string)?.includes(searchTerm)
    const matchesStatus =
      selectedStatus === 'all' || msg.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      read: 'bg-purple-100 text-purple-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      sent: 'Enviado',
      delivered: 'Entregue',
      failed: 'Falha',
      read: 'Lido',
    }
    return labels[status] || status
  }

  const breadcrumbItems = [
    { title: 'WhatsApp Business', link: '/dashboard/whatsapp' },
    { title: 'Entregas', link: '/dashboard/whatsapp/entregas' },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between gap-4">
        <Heading
          title="Rastreador de Entregas"
          description="Monitore o status de entrega das suas mensagens"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-semibold">Campanha</label>
              <Select
                value={selectedCampaignId}
                onValueChange={setSelectedCampaignId}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione uma campanha" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns?.map((campaign: Record<string, unknown>) => (
                    <SelectItem
                      key={campaign._id as string}
                      value={campaign._id as string}
                    >
                      {campaign.name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="read">Lido</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-semibold">Buscar</label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Número ou nome"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      {!selectedCampaignId ? (
        <Card className="text-center py-12">
          <p className="text-muted-foreground">
            Selecione uma campanha para visualizar as entregas
          </p>
        </Card>
      ) : messages === undefined ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando mensagens...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mensagens ({filteredMessages?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contato</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages?.map((message: Record<string, unknown>) => (
                    <TableRow key={message._id as string}>
                      <TableCell className="font-medium">
                        {(message.recipientName as string) || 'N/A'}
                      </TableCell>
                      <TableCell>{message.recipientPhone as string}</TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusBadgeColor(
                            message.status as string,
                          )}
                        >
                          {getStatusLabel(message.status as string)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(message.sentAt as number).toLocaleDateString(
                          'pt-BR',
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message)
                            setDetailsOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Mensagem</DialogTitle>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">Contato</label>
                <p className="text-sm">
                  {(selectedMessage.recipientName as string) || 'N/A'}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold">Telefone</label>
                <p className="text-sm">
                  {(selectedMessage.recipientPhone as string) || 'N/A'}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold">Status</label>
                <Badge
                  className={getStatusBadgeColor(
                    selectedMessage.status as string,
                  )}
                >
                  {getStatusLabel(selectedMessage.status as string)}
                </Badge>
              </div>

              <div>
                <label className="text-sm font-semibold">Conteúdo</label>
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                  {(selectedMessage.message as string) ||
                    (selectedMessage.content as string) ||
                    'N/A'}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold">Enviado em</label>
                <p className="text-sm">
                  {new Date(selectedMessage.sentAt as number).toLocaleString(
                    'pt-BR',
                  )}
                </p>
              </div>

              {(selectedMessage.deliveredAt as unknown as boolean) && (
                <div>
                  <label className="text-sm font-semibold">Entregue em</label>
                  <p className="text-sm">
                    {new Date(
                      selectedMessage.deliveredAt as number,
                    ).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
