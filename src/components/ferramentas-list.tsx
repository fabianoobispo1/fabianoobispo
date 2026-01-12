import Link from 'next/link'
import { LucideIcon } from 'lucide-react'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type Ferramenta = {
  id: string
  nome: string
  descricao: string
  icon: LucideIcon
  route: string
}

type FerramentasListProps = {
  ferramentas: Ferramenta[]
  variant?: 'grid' | 'list'
}

export function FerramentasList({
  ferramentas,
  variant = 'grid',
}: FerramentasListProps) {
  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {ferramentas.map((ferramenta) => {
          const Icon = ferramenta.icon
          return (
            <Link key={ferramenta.id} href={ferramenta.route}>
              <div className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                <div className="p-2 bg-primary/10 rounded-md">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{ferramenta.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {ferramenta.descricao}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {ferramentas.map((ferramenta) => {
        const Icon = ferramenta.icon
        return (
          <Link key={ferramenta.id} href={ferramenta.route}>
            <Card className="cursor-pointer hover:border-primary transition-colors h-full">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{ferramenta.nome}</CardTitle>
                    <CardDescription className="mt-1.5">
                      {ferramenta.descricao}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
