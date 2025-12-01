'use client'

import type { Id } from '@/../convex/_generated/dataModel'
import { api } from '@/../convex/_generated/api'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from 'convex/react'
import { Pencil, Save, X, Video } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'

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

type EditingExercise = {
  name: string
  sets: string
  reps: string
  note: string
  carga?: string
  videoUrl?: string
}

export function AdministracaoExercicios() {
  const { data: session } = useSession()
  const [editingId, setEditingId] = useState<Id<'exercise'> | null>(null)
  const [editData, setEditData] = useState<EditingExercise>({
    name: '',
    sets: '',
    reps: '',
    note: '',
    carga: '',
    videoUrl: '',
  })

  // Buscar planos do usuário
  const plans = useQuery(
    api.workout.getPlansByUser,
    session?.user?.id ? { userId: session.user.id as Id<'user'> } : 'skip',
  )

  // Buscar plano completo
  const fullPlan = useQuery(
    api.workout.getFullWorkoutPlan,
    plans && plans.length > 0 ? { planId: plans[0]._id } : 'skip',
  )

  const updateExercise = useMutation(api.workout.updateExercise)

  const handleEdit = (exercise: Exercise) => {
    setEditingId(exercise._id)
    setEditData({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      note: exercise.note,
      carga: exercise.carga || '',
      videoUrl: exercise.videoUrl || '',
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditData({
      name: '',
      sets: '',
      reps: '',
      note: '',
      carga: '',
      videoUrl: '',
    })
  }

  const handleSave = async (exerciseId: Id<'exercise'>) => {
    await updateExercise({
      exerciseId,
      name: editData.name,
      sets: editData.sets,
      reps: editData.reps,
      note: editData.note,
      carga: editData.carga || undefined,
      videoUrl: editData.videoUrl || undefined,
    })
    handleCancel()
  }

  if (!session) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Faça login para acessar</p>
      </div>
    )
  }

  if (!fullPlan) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{fullPlan.name}</CardTitle>
          <CardDescription>{fullPlan.description}</CardDescription>
        </CardHeader>
      </Card>

      <Accordion type="single" collapsible className="w-full">
        {fullPlan.days?.map((day) => (
          <AccordionItem key={day._id} value={day._id}>
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex items-center gap-2">
                <span>{day.title}</span>
                <Badge variant="outline">
                  {day.exercises.length} exercícios
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                {day.exercises.map((exercise) => (
                  <Card key={exercise._id}>
                    <CardContent className="pt-6">
                      {editingId === exercise._id ? (
                        // Modo de Edição
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium">
                                Nome do Exercício
                              </label>
                              <Input
                                value={editData.name}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Ex: Supino Reto"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Séries
                                </label>
                                <Input
                                  value={editData.sets}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      sets: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: 4"
                                />
                              </div>
                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Reps
                                </label>
                                <Input
                                  value={editData.reps}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      reps: e.target.value,
                                    })
                                  }
                                  placeholder="Ex: 8-12"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-medium">
                                Carga Padrão
                              </label>
                              <Input
                                value={editData.carga}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    carga: e.target.value,
                                  })
                                }
                                placeholder="Ex: 20kg (opcional)"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium">
                                URL do Vídeo
                              </label>
                              <Input
                                value={editData.videoUrl}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    videoUrl: e.target.value,
                                  })
                                }
                                placeholder="https://youtube.com/... (opcional)"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Observações
                            </label>
                            <Textarea
                              value={editData.note}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  note: e.target.value,
                                })
                              }
                              placeholder="Dicas e observações sobre o exercício"
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button onClick={() => handleSave(exercise._id)}>
                              <Save className="mr-2 h-4 w-4" />
                              Salvar
                            </Button>
                            <Button variant="outline" onClick={handleCancel}>
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Modo de Visualização
                        <div>
                          <div className="mb-4 flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold">
                                  {exercise.name}
                                </h3>
                                {exercise.videoUrl && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      window.open(exercise.videoUrl, '_blank')
                                    }
                                    title="Ver vídeo"
                                  >
                                    <Video className="h-4 w-4 text-primary" />
                                  </Button>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {exercise.note}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(exercise)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </Button>
                          </div>

                          <div className="flex flex-wrap gap-4">
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Séries:
                              </span>
                              <span className="ml-2 font-mono font-bold">
                                {exercise.sets}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">
                                Reps:
                              </span>
                              <span className="ml-2 font-mono font-bold">
                                {exercise.reps}
                              </span>
                            </div>
                            {exercise.carga && (
                              <div>
                                <span className="text-xs text-muted-foreground">
                                  Carga:
                                </span>
                                <span className="ml-2 font-mono font-bold">
                                  {exercise.carga}
                                </span>
                              </div>
                            )}
                            {exercise.videoUrl && (
                              <div>
                                <span className="text-xs text-muted-foreground">
                                  Vídeo:
                                </span>
                                <span className="ml-2 text-xs text-primary">
                                  Disponível
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
