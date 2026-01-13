import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  FileText,
  Send,
  BarChart3,
  CheckCircle,
  ArrowRight,
} from 'lucide-react'

import { auth } from '@/auth/auth'
import BreadCrumb from '@/components/breadcrumb'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const breadcrumbItems = [
  { title: 'WhatsApp Business', link: '/dashboard/whatsapp' },
]

export default async function WhatsAppPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const tools = [
    {
      title: 'Templates',
      description: 'Crie e gerencie modelos de mensagens profissionais',
      icon: FileText,
      href: '/dashboard/whatsapp/templates',
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Campanhas',
      description: 'Crie campanhas de disparo em massa com segurança',
      icon: Send,
      href: '/dashboard/whatsapp/campanhas',
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Rastreador de Entregas',
      description: 'Monitore o status de cada mensagem enviada',
      icon: CheckCircle,
      href: '/dashboard/whatsapp/entregas',
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      title: 'Monitor de Campanhas',
      description: 'Visualize estatísticas e analytics em tempo real',
      icon: BarChart3,
      href: '/dashboard/whatsapp/monitor',
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      title: 'Importar Contatos',
      description: 'Faça upload de JSON e salve contatos',
      icon: CheckCircle,
      href: '/dashboard/whatsapp/contatos',
      color: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between gap-4">
        <Heading
          title="WhatsApp Business"
          description="Ferramentas profissionais para gerenciar seus disparos e campanhas"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon
          return (
            <Link key={tool.href} href={tool.href}>
              <Card
                className={`${tool.color} h-full hover:border-primary transition-colors cursor-pointer`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${tool.iconColor}`} />
                        {tool.title}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {tool.description}
                      </CardDescription>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground mt-1" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Primeiros Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold mb-2">1. Crie um Template</p>
              <p className="text-xs text-muted-foreground mb-3">
                Comece criando um modelo de mensagem profissional
              </p>
              <Link href="/dashboard/whatsapp/templates">
                <Button variant="outline" size="sm">
                  Criar Template
                </Button>
              </Link>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold mb-2">
                2. Configure Campanha
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Defina destinatários e agendamento
              </p>
              <Link href="/dashboard/whatsapp/campanhas">
                <Button variant="outline" size="sm">
                  Nova Campanha
                </Button>
              </Link>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold mb-2">
                3. Acompanhe Resultados
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Veja em tempo real como está o desempenho
              </p>
              <Link href="/dashboard/whatsapp/monitor">
                <Button variant="outline" size="sm">
                  Ver Monitor
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
