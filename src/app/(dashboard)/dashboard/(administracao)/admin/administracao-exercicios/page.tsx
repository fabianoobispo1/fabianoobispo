import BreadCrumb from '@/components/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Heading } from '@/components/ui/heading'
import { AdministracaoExercicios } from '@/components/AdministracaoExercicios'

const breadcrumbItems = [
  { title: 'Administração', link: '/dashboard/admin' },
  {
    title: 'Administração Exercícios',
    link: '/dashboard/admin/administracao-exercicios',
  },
]
export default function page() {
  return (
    <ScrollArea className="h-full w-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />
        <div className=" flex items-start justify-between gap-4">
          <Heading
            title={'Administração de Exercícios'}
            description={
              'Gerenciamento de exercícios e vídeos da ficha de treino'
            }
          />
        </div>
        <AdministracaoExercicios />
      </div>
    </ScrollArea>
  )
}
