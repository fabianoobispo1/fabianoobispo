'use client'

import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'

import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from 'convex/react'
import { useState } from 'react'
import { Plus, Edit2, Trash2, Send } from 'lucide-react'

import BreadCrumb from '@/components/breadcrumb'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CampanhasPage() {
  const { data: session } = useSession()
  const campaigns = useQuery(api.whatsAppCampaign.getCampaignsByUser, {
    userId: session?.user?.id as Id<'user'>,
  })
  const templates = useQuery(api.whatsAppCampaign.getTemplatesByUser, {
    userId: session?.user?.id as Id<'user'>,
  })
  const createCampaign = useMutation(api.whatsAppCampaign.createCampaign)

  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [recipientList, setRecipientList] = useState('')

  const handleCreateCampaign = async () => {
    if (!session?.user?.id || !name || !templateId) return

    try {
      const recipients = recipientList
        .split(/[,\n]/)
        .map((phone) => ({
          phone: phone.trim(),
          variables: [],
        }))
        .filter((r) => r.phone)

      if (recipients.length === 0) {
        alert('Adicione pelo menos um destinatário')
        return
      }

      await createCampaign({
        name,
        description,
        templateId: templateId as Id<'whatsAppTemplate'>,
        recipientList: recipients,
        userId: session.user.id as Id<'user'>,
      })

      setName('')
      setDescription('')
      setTemplateId('')
      setRecipientList('')
      setIsOpen(false)
    } catch (error) {
      console.error('Erro ao criar campanha:', error)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const breadcrumbItems = [
    { title: 'WhatsApp Business', link: '/dashboard/whatsapp' },
    { title: 'Campanhas', link: '/dashboard/whatsapp/campanhas' },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between gap-4">
        <Heading
          title="Campanhas"
          description="Crie e gerencie campanhas de disparo em massa"
        />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
              <DialogDescription>
                Crie uma nova campanha de disparo
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold">
                  Nome da Campanha
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Black Friday 2024"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Descrição</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhe o objetivo da campanha"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-semibold">Template</label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template: Record<string, unknown>) => (
                      <SelectItem
                        key={template._id as string}
                        value={template._id as string}
                      >
                        {template.name as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold">
                  Lista de Destinatários
                </label>
                <Textarea
                  value={recipientList}
                  onChange={(e) => setRecipientList(e.target.value)}
                  placeholder="Adicione números separados por vírgula ou quebra de linha"
                  className="mt-2 min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCampaign}>Criar Campanha</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns === undefined ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando campanhas...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Nenhuma campanha criada ainda
          </p>
          <Button variant="outline">Criar primeira campanha</Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign: Record<string, unknown>) => (
            <Card key={campaign._id as string}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{campaign.name as string}</CardTitle>
                    <CardDescription className="mt-2">
                      {campaign.description as string}
                    </CardDescription>
                  </div>
                  <Badge
                    className={getStatusBadgeColor(campaign.status as string)}
                  >
                    {campaign.status === 'draft'
                      ? 'Rascunho'
                      : campaign.status === 'scheduled'
                        ? 'Agendada'
                        : campaign.status === 'sent'
                          ? 'Enviada'
                          : 'Falha'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Disparar
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
