import BreadCrumb from '@/components/breadcrumb'
import { Heading } from '@/components/ui/heading'

import { WorkoutDisplay } from './_components/WorkoutDisplay'

const breadcrumbItems = [
  { title: 'Ficha de Exercícios', link: '/dashboard/fichaexercicios' },
]

export default function Page() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <BreadCrumb items={breadcrumbItems} />
      <div className="flex items-start justify-between gap-4">
        <Heading
          title="Ficha de Exercícios"
          description="Seu plano de treino personalizado"
        />
      </div>
      <WorkoutDisplay />
    </div>
  )
}
