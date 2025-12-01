'use client'

import type { Id } from '@/../convex/_generated/dataModel'
import { api } from '@/../convex/_generated/api'

import React, { useState, useEffect, useCallback } from 'react'
import { Dumbbell, Shield, Activity, Video } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from 'convex/react'

import { Spinner } from '@/components/ui/spinner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Exercise = {
  _id: Id<'exercise'>
  name: string
  sets: string
  reps: string
  note: string
  carga?: string
  videoUrl?: string
  order: number
}

type WorkoutDay = {
  _id: Id<'workoutDay'>
  title: string
  focus: string
  dayOfWeek: string
  order: number
  exercises: Exercise[]
}

export function WorkoutDisplay() {
  const { data: session } = useSession()
  const [activeDay, setActiveDay] = useState<WorkoutDay | null>(null)
  const [currentPlanId, setCurrentPlanId] = useState<Id<'workoutPlan'> | null>(
    null,
  )
  const [editingCarga, setEditingCarga] = useState<{
    [key: string]: string
  }>({})

  // Buscar planos do usuário
  const plans = useQuery(
    api.workout.getPlansByUser,
    session?.user?.id ? { userId: session.user.id as Id<'user'> } : 'skip',
  )

  // Buscar plano completo
  const fullPlan = useQuery(
    api.workout.getFullWorkoutPlan,
    currentPlanId ? { planId: currentPlanId } : 'skip',
  )

  const seedPlan = useMutation(api.workout.seedDefaultPlan)
  const updateCarga = useMutation(api.workout.updateExerciseCarga)
  const deletePlan = useMutation(api.workout.deletePlan)

  // Função para recriar o plano
  const recreatePlan = async () => {
    if (!session?.user?.id || !currentPlanId) return
    await deletePlan({ planId: currentPlanId })
    const newPlanId = await seedPlan({ userId: session.user.id as Id<'user'> })
    setCurrentPlanId(newPlanId)
  }

  // Debounce para salvar carga automaticamente
  const handleCargaChange = useCallback(
    (exerciseId: Id<'exercise'>, value: string) => {
      setEditingCarga((prev) => ({ ...prev, [exerciseId]: value }))

      // Salvar após 1 segundo sem digitar
      const timeoutId = setTimeout(() => {
        updateCarga({ exerciseId, carga: value })
      }, 1000)

      return () => clearTimeout(timeoutId)
    },
    [updateCarga],
  )

  // Criar plano padrão se não existir
  const initializePlan = useCallback(async () => {
    if (session?.user?.id && plans?.length === 0) {
      const planId = await seedPlan({ userId: session.user.id as Id<'user'> })
      setCurrentPlanId(planId)
    } else if (plans && plans.length > 0) {
      setCurrentPlanId(plans[0]._id)
    }
  }, [session, plans, seedPlan])

  useEffect(() => {
    initializePlan()
  }, [initializePlan])

  // Definir dia ativo quando o plano carregar
  useEffect(() => {
    if (fullPlan?.days && fullPlan.days.length > 0 && !activeDay) {
      setActiveDay(fullPlan.days[0])
    }
  }, [fullPlan, activeDay])

  if (!session) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">
          Faça login para acessar sua ficha
        </p>
      </div>
    )
  }

  if (!fullPlan || !activeDay) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="large" />
      </div>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-220px)] w-full">
      <div className="space-y-6">
        {/* Debug Button - Remover depois */}
        <Button onClick={recreatePlan} variant="outline" size="sm">
          🔄 Recriar Plano (com vídeos)
        </Button>

        {/* Header */}
        <div>
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold">{fullPlan.name}</h2>
              <p className="text-sm text-muted-foreground">
                {fullPlan.description ||
                  'Ficha de retorno: Força, Estabilidade e Proteção Articular.'}
              </p>
            </div>
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Activity size={16} /> {fullPlan.days.length}x por Semana
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell size={16} /> Foco em Performance
            </span>
          </div>
        </div>

        {/* Seleção de Dias */}
        <div className="flex flex-wrap gap-2">
          {fullPlan.days.map((day: WorkoutDay) => (
            <button
              key={day._id}
              onClick={() => setActiveDay(day)}
              className={`rounded-lg px-6 py-3 font-semibold transition-all duration-200 ${
                activeDay._id === day._id
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {day.title}
            </button>
          ))}
        </div>

        {/* Card do Treino */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="mb-1 text-2xl font-bold">{activeDay.title}</h3>
            <p className="font-medium text-primary">{activeDay.focus}</p>
          </div>

          <div className="space-y-4">
            {activeDay.exercises.map((ex) => {
              console.log('Exercise:', ex.name, 'VideoURL:', ex.videoUrl)
              return (
                <div
                  key={ex._id}
                  className="group rounded-lg border bg-card/50 p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold transition-colors group-hover:text-primary">
                          {ex.name}
                        </h4>
                        {ex.videoUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => window.open(ex.videoUrl, '_blank')}
                            title="Ver vídeo explicativo"
                          >
                            <Video className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {ex.note}
                      </p>
                    </div>

                    <div className="mt-2 flex gap-3 sm:mt-0">
                      <div className="min-w-[80px] rounded bg-secondary px-3 py-1 text-center">
                        <span className="block text-xs uppercase text-muted-foreground">
                          Séries
                        </span>
                        <span className="font-mono font-bold text-primary">
                          {ex.sets}
                        </span>
                      </div>
                      <div className="min-w-[80px] rounded bg-secondary px-3 py-1 text-center">
                        <span className="block text-xs uppercase text-muted-foreground">
                          Reps
                        </span>
                        <span className="font-mono font-bold text-primary">
                          {ex.reps}
                        </span>
                      </div>
                      <div className="min-w-[90px] rounded bg-secondary px-3 py-1">
                        <span className="block text-xs uppercase text-muted-foreground">
                          Carga
                        </span>
                        <Input
                          type="text"
                          placeholder="ex: 20kg"
                          value={
                            editingCarga[ex._id] !== undefined
                              ? editingCarga[ex._id]
                              : ex.carga || ''
                          }
                          onChange={(e) =>
                            handleCargaChange(ex._id, e.target.value)
                          }
                          className="h-7 border-0 bg-transparent p-0 text-center font-mono font-bold text-primary focus-visible:ring-1 focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="pb-4 text-center text-sm text-muted-foreground">
          <p>
            Lembre-se: Técnica vem antes da carga. Consulte um médico antes de
            iniciar.
          </p>
        </div>
      </div>
    </ScrollArea>
  )
}
