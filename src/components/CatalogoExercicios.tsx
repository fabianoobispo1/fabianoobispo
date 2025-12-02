'use client'

import type { Id } from '@/../convex/_generated/dataModel'
import { api } from '@/../convex/_generated/api'

import React, { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { Plus, Pencil, Save, X, Video, Trash2, Dumbbell } from 'lucide-react'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type CatalogExercise = {
  _id: Id<'exerciseCatalog'>
  name: string
  description: string
  muscleGroup: string
  equipment?: string
  videoUrl?: string
  defaultSets?: string
  defaultReps?: string
}

type EditingExercise = {
  name: string
  description: string
  muscleGroup: string
  equipment: string
  videoUrl: string
  defaultSets: string
  defaultReps: string
}

const MUSCLE_GROUPS = [
  { value: 'peito', label: 'Peito' },
  { value: 'costas', label: 'Costas' },
  { value: 'pernas', label: 'Pernas' },
  { value: 'ombros', label: 'Ombros' },
  { value: 'braços', label: 'Braços' },
  { value: 'core', label: 'Core/Abdômen' },
  { value: 'mobilidade', label: 'Mobilidade' },
]

const EQUIPMENT = [
  { value: 'barra', label: 'Barra' },
  { value: 'halteres', label: 'Halteres' },
  { value: 'máquina', label: 'Máquina' },
  { value: 'peso corporal', label: 'Peso Corporal' },
  { value: 'outro', label: 'Outro' },
]

export function CatalogoExercicios() {
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<Id<'exerciseCatalog'> | null>(null)
  const [deleteId, setDeleteId] = useState<Id<'exerciseCatalog'> | null>(null)
  const [filterGroup, setFilterGroup] = useState<string>('all')
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [editData, setEditData] = useState<EditingExercise>({
    name: '',
    description: '',
    muscleGroup: 'peito',
    equipment: 'barra',
    videoUrl: '',
    defaultSets: '3',
    defaultReps: '10',
  })

  const catalogExercises = useQuery(api.exerciseCatalog.getAllCatalogExercises)
  const createExercise = useMutation(api.exerciseCatalog.createCatalogExercise)
  const updateExercise = useMutation(api.exerciseCatalog.updateCatalogExercise)
  const deleteExercise = useMutation(api.exerciseCatalog.deleteCatalogExercise)
  const seedCatalog = useMutation(api.exerciseCatalog.seedCatalog)

  const filteredExercises =
    catalogExercises?.filter((ex) =>
      filterGroup === 'all' ? true : ex.muscleGroup === filterGroup,
    ) || []

  const handleEdit = (exercise: CatalogExercise) => {
    setEditingId(exercise._id)
    setEditData({
      name: exercise.name,
      description: exercise.description,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment || '',
      videoUrl: exercise.videoUrl || '',
      defaultSets: exercise.defaultSets || '3',
      defaultReps: exercise.defaultReps || '10',
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setIsCreating(false)
    setEditData({
      name: '',
      description: '',
      muscleGroup: 'peito',
      equipment: 'barra',
      videoUrl: '',
      defaultSets: '3',
      defaultReps: '10',
    })
  }

  const handleSave = async () => {
    if (isCreating) {
      await createExercise({
        name: editData.name,
        description: editData.description,
        muscleGroup: editData.muscleGroup,
        equipment: editData.equipment || undefined,
        videoUrl: editData.videoUrl || undefined,
        defaultSets: editData.defaultSets || undefined,
        defaultReps: editData.defaultReps || undefined,
      })
    } else if (editingId) {
      await updateExercise({
        catalogId: editingId,
        name: editData.name,
        description: editData.description,
        muscleGroup: editData.muscleGroup,
        equipment: editData.equipment || undefined,
        videoUrl: editData.videoUrl || undefined,
        defaultSets: editData.defaultSets || undefined,
        defaultReps: editData.defaultReps || undefined,
      })
    }
    handleCancel()
  }

  const handleDelete = async () => {
    if (deleteId) {
      await deleteExercise({ catalogId: deleteId })
      setDeleteId(null)
    }
  }

  const handleSeedCatalog = async () => {
    await seedCatalog({})
  }

  if (!catalogExercises) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="large" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Catálogo Global de Exercícios</CardTitle>
              <CardDescription>
                {catalogExercises.length} exercícios cadastrados
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {catalogExercises.length === 0 && (
                <Button onClick={handleSeedCatalog} variant="outline">
                  <Dumbbell className="mr-2 h-4 w-4" />
                  Popular Catálogo
                </Button>
              )}
              <Button
                onClick={() => {
                  setIsCreating(true)
                  setEditingId(null)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Exercício
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filtrar por grupo:</label>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {MUSCLE_GROUPS.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary">
              {filteredExercises.length} exercícios
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de criação/edição */}
      {(isCreating || editingId) && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Novo Exercício' : 'Editar Exercício'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nome do Exercício *
                </label>
                <Input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  placeholder="Ex: Supino Reto"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Grupo Muscular *
                </label>
                <Select
                  value={editData.muscleGroup}
                  onValueChange={(value) =>
                    setEditData({ ...editData, muscleGroup: value })
                  }
                >
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
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Equipamento
                </label>
                <Select
                  value={editData.equipment}
                  onValueChange={(value) =>
                    setEditData({ ...editData, equipment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT.map((eq) => (
                      <SelectItem key={eq.value} value={eq.value}>
                        {eq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Séries Padrão
                </label>
                <Input
                  value={editData.defaultSets}
                  onChange={(e) =>
                    setEditData({ ...editData, defaultSets: e.target.value })
                  }
                  placeholder="Ex: 4"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reps Padrão
                </label>
                <Input
                  value={editData.defaultReps}
                  onChange={(e) =>
                    setEditData({ ...editData, defaultReps: e.target.value })
                  }
                  placeholder="Ex: 8-12"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                URL do Vídeo
              </label>
              <Input
                value={editData.videoUrl}
                onChange={(e) =>
                  setEditData({ ...editData, videoUrl: e.target.value })
                }
                placeholder="https://youtube.com/... (opcional)"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Descrição *
              </label>
              <Textarea
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                placeholder="Descrição e dicas sobre o exercício"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                {isCreating ? 'Criar' : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de exercícios */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredExercises.map((exercise) => (
          <Card key={exercise._id}>
            <CardContent className="pt-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">{exercise.name}</h3>
                    {exercise.videoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVideoUrl(exercise.videoUrl!)}
                        title="Ver vídeo"
                      >
                        <Video className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {exercise.description}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <Badge>{exercise.muscleGroup}</Badge>
                {exercise.equipment && (
                  <Badge variant="outline">{exercise.equipment}</Badge>
                )}
                {exercise.defaultSets && (
                  <Badge variant="secondary">
                    {exercise.defaultSets} × {exercise.defaultReps}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(exercise)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteId(exercise._id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nenhum exercício encontrado nesta categoria
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este exercício do catálogo? Esta
              ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
