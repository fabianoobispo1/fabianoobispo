import BreadCrumb from '@/components/breadcrumb'
import { Heading } from '@/components/ui/heading'

import { MegaSenaDashboard } from './_components/MegaSenaDashboard'

const breadcrumbItems = [
  { title: 'Loteria', link: '/dashboard/megasena' },
  { title: 'Mega-Sena', link: '/dashboard/megasena' },
]

export default function Page() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between gap-4">
        <Heading
          title="Mega-Sena"
          description="Histórico completo de resultados e insights estatísticos para montar seus jogos."
        />
      </div>
      <MegaSenaDashboard />
    </div>
  )
}
