'use client'
import { useRouter } from 'next/navigation'

import BreadCrumb from '@/components/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'

const breadcrumbItems = [{ title: 'Administração', link: '/dashboard/admin' }]
export default function Page() {
  const router = useRouter()

  const handleNavigation = () => {
    router.push('/dashboard/admin/administradores')
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex-1 space-y-4 p-4 pt-6 ">
        <BreadCrumb items={breadcrumbItems} />
        <div className=" flex items-start justify-between gap-4">
          <Heading
            title={'Administração'}
            description={'Informações administrativas'}
          />
        </div>

        <div>
          <Button onClick={handleNavigation}>Administradores</Button>
        </div>
      </div>
    </ScrollArea>
  )
}
