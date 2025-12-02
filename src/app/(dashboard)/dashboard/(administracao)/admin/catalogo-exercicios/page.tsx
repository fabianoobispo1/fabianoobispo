import BreadCrumb from '@/components/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Heading } from '@/components/ui/heading'
import { CatalogoExercicios } from '@/components/CatalogoExercicios'

const breadcrumbItems = [
  { title: 'Administração', link: '/dashboard/admin' },
  {
    title: 'Catálogo de Exercícios',
    link: '/dashboard/admin/catalogo-exercicios',
  },
]
export default function page() {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />
        <div className=" flex items-start justify-between gap-4">
          <Heading
            title={'Catálogo de Exercícios'}
            description={
              'Gerencie o catálogo global de exercícios disponíveis para todos os usuários'
            }
          />
        </div>
        <CatalogoExercicios />
      </div>
    </ScrollArea>
  )
}
