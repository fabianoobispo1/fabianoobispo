import { redirect } from 'next/navigation'

import { auth } from '@/auth/auth'
import BreadCrumb from '@/components/breadcrumb'

import { GerenciadorTemplates } from '../_components/gerenciador-templates'

const breadcrumbItems = [
  { title: 'WhatsApp Business', link: '/dashboard/whatsapp' },
  { title: 'Templates', link: '/dashboard/whatsapp/templates' },
]

export default async function TemplatesPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/')
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <GerenciadorTemplates />
    </div>
  )
}
