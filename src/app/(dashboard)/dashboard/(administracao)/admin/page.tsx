'use client'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

import BreadCrumb from '@/components/breadcrumb'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Heading } from '@/components/ui/heading'
import { Button } from '@/components/ui/button'

const breadcrumbItems = [{ title: 'Administração', link: '/dashboard/admin' }]
export default function Page() {
  const router = useRouter()
  const { data: session } = useSession()

  const isAdmin = session?.user?.email === 'fbc623@gmail.com'

  const handleNavigationAdministradores = () => {
    router.push('/dashboard/admin/administradores')
  }

  const handleNavigationAdministracaoDontpad = () => {
    router.push('/dashboard/admin/administracao-dontpad')
  }

  const handleNavigationAdministracaoExercicios = () => {
    router.push('/dashboard/admin/administracao-exercicios')
  }

  const handleNavigationCatalogoExercicios = () => {
    router.push('/dashboard/admin/catalogo-exercicios')
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
          <Button onClick={handleNavigationAdministradores} disabled={!isAdmin}>
            Administradores
          </Button>
        </div>
        <div>
          <Button onClick={handleNavigationAdministracaoDontpad}>
            Administração Dontpad
          </Button>
        </div>
        <div>
          <Button onClick={handleNavigationCatalogoExercicios}>
            Catálogo de Exercícios
          </Button>
        </div>
        <div>
          <Button onClick={handleNavigationAdministracaoExercicios}>
            Gerenciar Fichas de Treino
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}
