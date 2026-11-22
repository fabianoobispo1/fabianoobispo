import BreadCrumb from '@/components/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Heading } from '@/components/ui/heading'

import { ContatosDashboard } from './_components/ContatosDashboard'

// Acesso restrito a admin pelo layout de /dashboard/admin (redirect) e, de
// verdade, pelo requireAdmin nas funcoes de convex/contacts.ts.

const breadcrumbItems = [
  { title: 'Administração', link: '/dashboard/admin' },
  { title: 'Contatos', link: '/dashboard/admin/contatos' },
]

export default function Page() {
  return (
    <ScrollArea className="h-full w-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />
        <Heading
          title="Contatos"
          description="Dashboard da tabela contacts (WhatsApp)"
        />
        <ContatosDashboard />
      </div>
    </ScrollArea>
  )
}
