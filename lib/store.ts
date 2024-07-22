import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { persist } from 'zustand/middleware';
import { UniqueIdentifier } from '@dnd-kit/core';

export type Column = {
  id: string;
  title: string;
  userID: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: string;
};

export type State = {
  tasks: Task[];
  columns: Column[];
  draggedTask: string | null;
};

export type Actions = {
  addTask: (title: string, description?: string) => void;
  addCol: (title: string, userID: string) => Promise<void>;
  dragTask: (id: string | null) => void;
  removeTask: (title: string) => void;
  removeCol: (id: string) => void;
  setTasks: (updatedTask: Task[]) => void;
  setCols: (cols: Column[]) => void;
  updateCol: (id: UniqueIdentifier, newName: string) => void;
};

export const useTaskStore = create<State & Actions>()(
  persist(
    (set) => ({
      tasks: [],
      columns: [],
      draggedTask: null,
      addTask: (title: string, description?: string) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { id: uuid(), title, description, status: 'TODO' }
          ]
        })),
      updateCol: (id: UniqueIdentifier, newName: string) =>
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, title: newName } : col
          )
        })),
      addCol: async (title: string, userID: string) => {
        const id = await addColumnBase(title, userID);
        set((state) => ({
          columns: [...state.columns, { id, title, userID }]
        }));
      },
      dragTask: (id: string | null) => set({ draggedTask: id }),

      removeTask: (id: string) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id)
        })),

      removeCol:  (id:string) => {
        removeColumnBase(id);
        set((state) => ({
          columns: state.columns.filter((col) => col.id !== id)
        }))
      },
      setTasks: (newTasks: Task[]) => set({ tasks: newTasks }),
      setCols: (newCols: Column[]) => set({ columns: newCols })
    }),
    { name: 'task-store', skipHydration: true }
  )
);

// Função para enviar dados para o servidor
async function addColumnBase(title: string, userID: string): Promise<string> {
  const response = await fetch('/api/tasks/addColumn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, userID })
  });
  const { id } = await response.json();
  return id;
}

async function removeColumnBase(id: string) {
  await fetch(`/api/tasks/removeColumn/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

}
