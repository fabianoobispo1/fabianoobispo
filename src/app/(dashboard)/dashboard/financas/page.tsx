import BreadCrumb from '@/components/breadcrumb'

import { Financas } from './financas'

const breadcrumbItems = [{ title: 'Finanças', link: '/dashboard/financas' }]
export default function page() {
  return (
    <div className="w-full space-y-4 p-4 pt-6 ">
      <BreadCrumb items={breadcrumbItems} />
      <Financas />
    </div>
  )
}
