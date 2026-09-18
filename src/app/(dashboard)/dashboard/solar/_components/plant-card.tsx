'use client'

import Link from 'next/link'
import { Droplets, Zap } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface PlantCardProps {
  plant: {
    _id: string
    name: string
    capacityKwp: number
    location?: string
    lastCleaningDate: number | null
    daysSinceCleaning: number | null
    efficiencyPercent: number
    totalKwhGenerated: number
  }
}

function efficiencyVariant(efficiencyPercent: number) {
  if (efficiencyPercent >= 90) return 'default'
  if (efficiencyPercent >= 75) return 'secondary'
  return 'destructive'
}

export function PlantCard({ plant }: PlantCardProps) {
  return (
    <Link href={`/dashboard/solar/${plant._id}`}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-base">
            <span>{plant.name}</span>
            <Badge variant={efficiencyVariant(plant.efficiencyPercent)}>
              {plant.efficiencyPercent.toFixed(0)}% eficiência
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={plant.efficiencyPercent} />

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4" />
              <span>{plant.capacityKwp} kWp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="h-4 w-4" />
              <span>
                {plant.daysSinceCleaning === null
                  ? 'Sem registro'
                  : `${plant.daysSinceCleaning} dia(s) sem limpar`}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Total gerado: {plant.totalKwhGenerated.toFixed(1)} kWh
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
