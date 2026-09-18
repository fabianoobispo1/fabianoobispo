import BreadCrumb from '@/components/breadcrumb'

import { PlantDetail } from './_components/PlantDetail'

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const breadcrumbItems = [
    { title: 'Usinas Solares', link: '/dashboard/solar' },
    { title: 'Detalhes', link: `/dashboard/solar/${id}` },
  ]

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <PlantDetail plantId={id} />
    </div>
  )
}
