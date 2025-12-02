'use client'

import type { Id } from '@/../convex/_generated/dataModel'
import { api } from '@/../convex/_generated/api'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from 'convex/react'
import { Pencil, Save, X, Video, Plus, Search, Trash2 } from 'lucide-react'

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

const MUSCLE_GROUPS = [
  { value: 'all', label: 'Todos' },
  { value: 'peito', label: 'Peito' },
  { value: 'costas', label: 'Costas' },
  { value: 'pernas', label: 'Pernas' },
  { value: 'ombros', label: 'Ombros' },
  { value: 'braços', label: 'Braços' },
  { value: 'core', label: 'Core/Abdômen' },
  { value: 'mobilidade', label: 'Mobilidade' },
]

export function AdministracaoExercicios() {
  const { data: session } = useSession()
  const [editingId, setEditingId] = useState<Id<'exercise'> | null>(null)
  const [isAddingToDayId, setIsAddingToDayId] =
    useState<Id<'workoutDay'> | null>(null)
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingPlan, setEditingPlan] = useState(false)
  const [planName, setPlanName] = useState('')
  const [planDescription, setPlanDescription] = useState('')
  const [isAddingDay, setIsAddingDay] = useState(false)
  const [newDayData, setNewDayData] = useState({
    title: '',
    focus: '',
    dayOfWeek: '',
  })
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditingExercise>({
    name: '',
    sets: '',
    reps: '',
    note: '',
    carga: '',
    videoUrl: '',
  })

  const plans = useQuery(
    api.workout.getPlansByUser,
    session?.user?.id ? { userId: session.user.id as Id<'user'> } : 'skip',
  )

  const fullPlan = useQuery(
    api.workout.getFullWorkoutPlan,
    plans && plans.length > 0 ? { planId: plans[0]._id } : 'skip',
  )

  const catalogExercises = useQuery(api.exerciseCatalog.getAllCatalogExercises)

  const updateExercise = useMutation(api.workout.updateExercise)
  const addExerciseFromCatalog = useMutation(
    api.workout.createExerciseFromCatalog,
  )
  const updatePlan = useMutation(api.workout.updatePlan)
  const createDay = useMutation(api.workout.createDay)
  const deleteDay = useMutation(api.workout.deleteDay)

  const filteredCatalog =
    catalogExercises?.filter((ex) => {
      const matchesGroup =
        filterGroup === 'all' || ex.muscleGroup === filterGroup
      const matchesSearch =
        searchTerm === '' ||
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.description.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesGroup && matchesSearch
    }) || []

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

  const handleAddFromCatalog = async (
    catalogId: Id<'exerciseCatalog'>,
    dayId: Id<'workoutDay'>,
  ) => {
    const day = fullPlan?.days?.find((d) => d._id === dayId)
    const nextOrder = day ? day.exercises.length : 0

    await addExerciseFromCatalog({
      dayId,
      catalogId,
      order: nextOrder,
    })
    setIsAddingToDayId(null)
    setFilterGroup('all')
    setSearchTerm('')
  }

  const handleEditPlan = () => {
    if (fullPlan) {
      setPlanName(fullPlan.name)
      setPlanDescription(fullPlan.description || '')
      setEditingPlan(true)
    }
  }

  const handleSavePlan = async () => {
    if (fullPlan) {
      await updatePlan({
        planId: fullPlan._id,
        name: planName,
        description: planDescription,
      })
      setEditingPlan(false)
    }
  }

  const handleAddDay = async () => {
    if (fullPlan && newDayData.title && newDayData.focus) {
      const nextOrder = fullPlan.days?.length || 0
      await createDay({
        planId: fullPlan._id,
        title: newDayData.title,
        focus: newDayData.focus,
        dayOfWeek: newDayData.dayOfWeek || '',
        order: nextOrder,
      })
      setIsAddingDay(false)
      setNewDayData({ title: '', focus: '', dayOfWeek: '' })
    }
  }

  const handleDeleteDay = async (dayId: Id<'workoutDay'>) => {
    if (
      confirm(
        'Tem certeza que deseja excluir este dia? Todos os exercícios serão removidos.',
      )
    ) {
      await deleteDay({ dayId })
    }
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
          {editingPlan ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nome do Plano
                </label>
                <Input
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Nome do plano de treino"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Descrição
                </label>
                <Textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Descrição do plano"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSavePlan}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={() => setEditingPlan(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{fullPlan.name}</CardTitle>
                <CardDescription>{fullPlan.description}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleEditPlan}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </div>
          )}
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAddingDay(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Novo Dia de Treino
          </Button>

          {isAddingDay && (
            <div className="mt-4 space-y-4 rounded-lg border p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Título do Dia *
                  </label>
                  <Input
                    value={newDayData.title}
                    onChange={(e) =>
                      setNewDayData({ ...newDayData, title: e.target.value })
                    }
                    placeholder="Ex: Segunda-Feira"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Dia da Semana (opcional)
                  </label>
                  <Input
                    value={newDayData.dayOfWeek}
                    onChange={(e) =>
                      setNewDayData({
                        ...newDayData,
                        dayOfWeek: e.target.value,
                      })
                    }
                    placeholder="Ex: seg"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Foco do Treino *
                </label>
                <Input
                  value={newDayData.focus}
                  onChange={(e) =>
                    setNewDayData({ ...newDayData, focus: e.target.value })
                  }
                  placeholder="Ex: Força de Empurrar & Base"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddDay}>
                  <Save className="mr-2 h-4 w-4" />
                  Criar Dia
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingDay(false)
                    setNewDayData({ title: '', focus: '', dayOfWeek: '' })
                  }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="w-full">
        {fullPlan.days?.map((day) => (
          <AccordionItem key={day._id} value={day._id}>
            <AccordionTrigger className="text-lg font-semibold">
              <div className="flex w-full items-center justify-between pr-4">
                <div className="flex items-center gap-2">
                  <span>{day.title}</span>
                  <Badge variant="outline">
                    {day.exercises.length} exercícios
                  </Badge>
                  <span className="text-sm font-normal text-muted-foreground">
                    - {day.focus}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteDay(day._id)
                  }}
                  className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsAddingToDayId(day._id)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Exercício do Catálogo
                </Button>

                {day.exercises.map((exercise) => (
                  <Card key={exercise._id}>
                    <CardContent className="pt-6">
                      {editingId === exercise._id ? (
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
                                      setVideoUrl(exercise.videoUrl!)
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

      <Dialog
        open={!!isAddingToDayId}
        onOpenChange={() => setIsAddingToDayId(null)}
      >
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Exercício do Catálogo</DialogTitle>
            <DialogDescription>
              Selecione um exercício do catálogo para adicionar ao treino
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Grupo Muscular
                </label>
                <Select value={filterGroup} onValueChange={setFilterGroup}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map((group) => (
                      <SelectItem key={group.value} value={group.value}>
                        {group.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Pesquisar
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome ou descrição..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <Badge variant="secondary">
              {filteredCatalog.length} exercícios
            </Badge>
          </div>

          <div className="space-y-3">
            {filteredCatalog.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Nenhum exercício encontrado
              </p>
            ) : (
              filteredCatalog.map((exercise) => (
                <Card key={exercise._id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{exercise.name}</h4>
                          {exercise.videoUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setVideoUrl(exercise.videoUrl!)}
                              className="h-6 w-6 p-0"
                            >
                              <Video className="h-3 w-3 text-primary" />
                            </Button>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {exercise.description}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">
                            {exercise.muscleGroup}
                          </Badge>
                          {exercise.equipment && (
                            <Badge variant="secondary" className="text-xs">
                              {exercise.equipment}
                            </Badge>
                          )}
                          {exercise.defaultSets && exercise.defaultReps && (
                            <Badge variant="secondary" className="text-xs">
                              {exercise.defaultSets} × {exercise.defaultReps}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          isAddingToDayId &&
                          handleAddFromCatalog(exercise._id, isAddingToDayId)
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Vídeo */}
      <Dialog open={!!videoUrl} onOpenChange={() => setVideoUrl(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Vídeo Explicativo</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {videoUrl && (
              <iframe
                width="100%"
                height="100%"
                src={videoUrl.replace('watch?v=', 'embed/')}
                title="Vídeo do exercício"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
