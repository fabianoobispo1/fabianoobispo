'use client'
import { useState } from 'react'
import { Trash } from 'lucide-react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'

import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'

import { LoadingButton } from './ui/loading-button'
import { ScrollArea, ScrollBar } from './ui/scroll-area'
import { Spinner } from './ui/spinner'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

interface Todo {
  _id: Id<'todo'>
  _creationTime: number
  text: string
  isCompleted: boolean
  created_at: number
  updated_at: number
  userId: Id<'user'>
}
export function TodoList() {
  const { isAuthenticated } = useConvexAuth()
  // Reativo: atualiza sozinho após create/toggle/remove
  const todos: Todo[] | undefined = useQuery(
    api.todo.listMine,
    isAuthenticated ? {} : 'skip',
  )

  const [newTodo, setNewTodo] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const [loadingTodo, setLoadingTodo] = useState<boolean>(false)

  const registerTodo = useMutation(api.todo.create)
  const toggleTodoCompletion = useMutation(api.todo.toggleTodoCompletion)
  const removeTodoMutation = useMutation(api.todo.remove)

  const addTodo = async () => {
    setLoading(true)
    if (newTodo.trim() === '') {
      setLoading(false)
      return
    }

    if (isAuthenticated) {
      await registerTodo({ text: newTodo })
      setNewTodo('')
    }
    setLoading(false)
  }

  const toggleTodo = async (id: Id<'todo'>) => {
    setLoadingTodo(true)
    await toggleTodoCompletion({ todoId: id })
    setLoadingTodo(false)
  }

  const removeTodo = async (id: Id<'todo'>) => {
    setLoadingTodo(true)

    await removeTodoMutation({ todoId: id })
    setLoadingTodo(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Adicionar nova tarefa"
        />
        <LoadingButton loading={loading} onClick={addTodo} className="ml-2">
          Adicionar
        </LoadingButton>
      </div>

      <ScrollArea className="h-[calc(80vh-220px)] w-full overflow-x-auto rounded-md border">
        <Table className="relative">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Tarefa</TableHead>
              <TableHead className="text-center">Completou</TableHead>
              <TableHead className="text-center">Criado em</TableHead>
              <TableHead className="text-center">Opções</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {todos ? (
              todos.map((todo) => (
                <TableRow key={todo._id}>
                  <TableCell>{todo.text}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={todo.isCompleted}
                      onCheckedChange={() => toggleTodo(todo._id)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {new Date(todo.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex items-center justify-center gap-2">
                    <LoadingButton
                      className="w-32"
                      loading={loadingTodo}
                      onClick={() => toggleTodo(todo._id)}
                    >
                      {todo.isCompleted ? 'Desfazer' : 'Completo'}
                    </LoadingButton>
                    <LoadingButton
                      loading={loadingTodo}
                      variant={'destructive'}
                      onClick={() => removeTodo(todo._id)}
                    >
                      <Trash className="h-4 w-4" />
                    </LoadingButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <Spinner />
            )}
          </TableBody>
        </Table>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
