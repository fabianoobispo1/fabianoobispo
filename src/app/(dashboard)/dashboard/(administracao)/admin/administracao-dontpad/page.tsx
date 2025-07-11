import BreadCrumb from '@/components/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Heading } from '@/components/ui/heading'
import { AdministracaoDontPad } from '@/components/AdministracaoDontPad'

const breadcrumbItems = [
  { title: 'Administração', link: '/dashboard/admin' },
  {
    title: 'Administração DontPad',
    link: '/dashboard/admin/administracao-dontpad',
  },
]
export default function page() {
  return (
    <ScrollArea className="h-full w-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />
        <div className=" flex items-start justify-between gap-4">
          <Heading
            title={'Administração DontPad'}
            description={'Gerenciamento de paginas no DontPad'}
          />
        </div>
        <AdministracaoDontPad />
      </div>
    </ScrollArea>
  )
}
