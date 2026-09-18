'use client'

import { useSession } from 'next-auth/react'
import { useQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { Spinner } from '@/components/ui/spinner'

import { AddPlantDialog } from './add-plant-dialog'
import { PlantCard } from './plant-card'

export function SolarDashboard() {
  const { data: session } = useSession()
  const userId = session?.user?.id as Id<'user'>

  const plants = useQuery(
    api.solar.getDashboardByUser,
    userId ? { userId } : 'skip',
  )

  const isLoading = !plants

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddPlantDialog userId={userId} />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : plants.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-muted-foreground">
          <p>Nenhuma usina cadastrada ainda.</p>
          <p className="text-sm">
            Cadastre a primeira pra começar a acompanhar geração e limpeza.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => (
            <PlantCard key={plant._id} plant={plant} />
          ))}
        </div>
      )}
    </div>
  )
}
