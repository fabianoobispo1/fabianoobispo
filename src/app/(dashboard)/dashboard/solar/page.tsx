import BreadCrumb from '@/components/breadcrumb'
import { Heading } from '@/components/ui/heading'

import { SolarDashboard } from './_components/SolarDashboard'

const breadcrumbItems = [{ title: 'Usinas Solares', link: '/dashboard/solar' }]

export default function Page() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between gap-4">
        <Heading
          title="Usinas Solares"
          description="Acompanhe a geração de energia e a limpeza das suas placas"
        />
      </div>
      <SolarDashboard />
    </div>
  )
}
