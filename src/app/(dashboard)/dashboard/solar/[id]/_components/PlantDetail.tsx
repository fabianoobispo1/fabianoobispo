'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Spinner } from '@/components/ui/spinner'
import { Heading } from '@/components/ui/heading'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

import { RegisterCleaningDialog } from './register-cleaning-dialog'
import { RegisterGenerationDialog } from './register-generation-dialog'
import { GenerationChart } from './generation-chart'
import { CleaningHistoryTable } from './cleaning-history-table'

interface PlantDetailProps {
  plantId: string
}

function efficiencyVariant(efficiencyPercent: number) {
  if (efficiencyPercent >= 90) return 'default'
  if (efficiencyPercent >= 75) return 'secondary'
  return 'destructive'
}

export function PlantDetail({ plantId }: PlantDetailProps) {
  const { data: session } = useSession()
  const userId = session?.user?.id as Id<'user'>

  const plant = useQuery(api.solar.getPlantById, {
    plantId: plantId as Id<'solarPlant'>,
  })
  const generations = useQuery(api.solar.listGenerationsByPlant, {
    plantId: plantId as Id<'solarPlant'>,
  })
  const cleanings = useQuery(api.solar.listCleaningsByPlant, {
    plantId: plantId as Id<'solarPlant'>,
  })

  if (plant === undefined) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (plant === null) {
    return <p className="text-muted-foreground">Usina não encontrada.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Heading
          title={plant.name}
          description={
            plant.location
              ? `${plant.capacityKwp} kWp · ${plant.location}`
              : `${plant.capacityKwp} kWp`
          }
        />
        <div className="flex gap-2">
          <RegisterCleaningDialog plantId={plant._id} userId={userId} />
          <RegisterGenerationDialog plantId={plant._id} userId={userId} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Eficiência atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">
                {plant.efficiencyPercent.toFixed(0)}%
              </span>
              <Badge variant={efficiencyVariant(plant.efficiencyPercent)}>
                {plant.efficiencyPercent >= 90
                  ? 'Boa'
                  : plant.efficiencyPercent >= 75
                    ? 'Atenção'
                    : 'Crítica'}
              </Badge>
            </div>
            <Progress value={plant.efficiencyPercent} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Última limpeza
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {plant.lastCleaningDate
                ? new Date(plant.lastCleaningDate).toLocaleDateString('pt-BR')
                : '—'}
            </p>
            <p className="text-sm text-muted-foreground">
              {plant.daysSinceCleaning === null
                ? 'Nenhum registro'
                : `${plant.daysSinceCleaning} dia(s) sem limpar`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Total gerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {(generations ?? [])
                .reduce((sum, g) => sum + g.kwhGenerated, 0)
                .toFixed(1)}{' '}
              kWh
            </p>
            <p className="text-sm text-muted-foreground">
              {(generations ?? []).length} registro(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <GenerationChart generations={generations ?? []} />

      <CleaningHistoryTable cleanings={cleanings ?? []} />
    </div>
  )
}
