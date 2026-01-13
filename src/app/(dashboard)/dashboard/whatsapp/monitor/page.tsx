'use client'

import { api } from '@/../convex/_generated/api'
import type { Id } from '@/../convex/_generated/dataModel'

import { useSession } from 'next-auth/react'
import { useQuery } from 'convex/react'
import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
} from 'lucide-react'

import BreadCrumb from '@/components/breadcrumb'
import { Heading } from '@/components/ui/heading'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function MonitorPage() {
  const { data: session } = useSession()
  const campaigns = useQuery(api.whatsAppCampaign.getCampaignsByUser, {
    userId: session?.user?.id as Id<'user'>,
  })

  const [selectedCampaignId, setSelectedCampaignId] = useState('')

  const stats = useQuery(
    api.whatsAppCampaign.getCampaignStats,
    selectedCampaignId && session?.user?.id
      ? {
          campaignId: selectedCampaignId as Id<'campaign'>,
          userId: session.user.id as Id<'user'>,
        }
      : 'skip',
  )

  const activityLog = useQuery(api.whatsAppCampaign.getActivityLog, {
    userId: session?.user?.id as Id<'user'>,
  })

  const statusData = stats
    ? [
        { name: 'Pendente', value: stats.pending, fill: '#f59e0b' },
        { name: 'Enviado', value: stats.sent, fill: '#3b82f6' },
        { name: 'Entregue', value: stats.delivered, fill: '#10b981' },
        { name: 'Lido', value: stats.read, fill: '#8b5cf6' },
        { name: 'Falha', value: stats.failed, fill: '#ef4444' },
      ]
    : []

  const statCards = [
    {
      label: 'Total de Mensagens',
      value: stats?.total || 0,
      icon: MessageSquare,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Entregues',
      value: stats?.delivered || 0,
      icon: CheckCircle,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Pendentes',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      label: 'Falhas',
      value: stats?.failed || 0,
      icon: AlertCircle,
      color: 'bg-red-50',
      iconColor: 'text-red-600',
    },
    {
      label: 'Lidos',
      value: stats?.read || 0,
      icon: Eye,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
  ]

  const successRate =
    stats && stats.total > 0
      ? (((stats.delivered + stats.read) / stats.total) * 100).toFixed(1)
      : '0'

  const breadcrumbItems = [
    { title: 'WhatsApp Business', link: '/dashboard/whatsapp' },
    { title: 'Monitor', link: '/dashboard/whatsapp/monitor' },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between gap-4">
        <Heading
          title="Monitor de Campanhas"
          description="Visualize estatísticas e histórico de atividades"
        />
      </div>

      {/* Campaign Selector */}
      <Card>
        <CardContent className="pt-6">
          <Select
            value={selectedCampaignId}
            onValueChange={setSelectedCampaignId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma campanha para visualizar estatísticas" />
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
        </CardContent>
      </Card>

      {!selectedCampaignId ? (
        <Card className="text-center py-12">
          <p className="text-muted-foreground">
            Selecione uma campanha para visualizar estatísticas
          </p>
        </Card>
      ) : stats === undefined ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            {statCards.map((card, idx) => {
              const Icon = card.icon
              return (
                <Card key={idx} className={card.color}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {card.label}
                        </p>
                        <p className="text-2xl font-bold mt-1">{card.value}</p>
                      </div>
                      <Icon className={`h-8 w-8 ${card.iconColor}`} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold text-green-600">
                  {successRate}%
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {stats?.delivered || 0} mensagens entregues e{' '}
                    {stats?.read || 0} lidas de {stats?.total || 0} total
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Status Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Count Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Contagem por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
              <CardDescription>
                Últimas ações realizadas na conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLog && activityLog.length > 0 ? (
                  activityLog
                    .slice(0, 10)
                    .map((activity: Record<string, unknown>, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 pb-4 border-b last:border-b-0"
                      >
                        <div className="mt-1">
                          <Badge variant="outline">
                            {activity.action as string}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {activity.description as string}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(
                              activity.timestamp as number,
                            ).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-muted-foreground">
                    Nenhuma atividade registrada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
