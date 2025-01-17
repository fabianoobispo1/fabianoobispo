import BreadCrumb from '@/components/breadcrumb'
import { Heading } from '@/components/ui/heading'

import { DashboardT } from './_components/Dashboard'
const breadcrumbItems = [{ title: 'Finanças', link: '/dashboard/financas' }]
export default function Page() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6 ">
      <BreadCrumb items={breadcrumbItems} />
      <div className=" flex items-start justify-between gap-4">
        <Heading title={'Finanças'} description={'...'} />
      </div>
      <DashboardT />
    </div>
  )
}
