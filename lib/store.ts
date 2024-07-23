import { create } from 'zustand';
import { v4 as uuid } from 'uuid';
import { persist } from 'zustand/middleware';


export type Column = {
  id: string;
  index: number;
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
  addCol: (title: string, userID: string, totalColuns: number) => Promise<void>;
  dragTask: (id: string | null) => void;
  removeTask: (title: string) => void;
  removeCol: (id: string) => void;
  setTasks: (updatedTask: Task[]) => void;
  setCols: (cols: Column[]) => void;
  updateCol: (id: string, newName: string) => void;
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
      updateCol: (id: string, newName: string) => {
        editColumnBase(id,newName)
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === id ? { ...col, title: newName } : col
          )
        }))
      },
      addCol: async (title: string, userID: string, totalColunas: number) => {
         const id = await addColumnBase(title, userID, totalColunas+1);
        set((state) => ({
          columns: [...state.columns, { id, title, index: totalColunas, userID }]
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

      setCols: (newCols: Column[]) => {
        newCols.forEach(col => {
          // Faça algo com cada coluna
          editColumnBase(col.id, col.title, col.index)
      
        });
   
        set({ columns: newCols })}
    }),
    { name: 'task-store', skipHydration: true }
  )
);

// Função para enviar dados para o servidor
async function addColumnBase(title: string, userID: string, index: number): Promise<string> {
  const response = await fetch('/api/tasks/addColumn', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, userID, index })
  });
  const { id } = await response.json();
  return id;
}

async function editColumnBase(id: string, title: string, index?: number) {
  await fetch(`/api/tasks/updateColumn/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, index })
  });
}

async function removeColumnBase(id: string) {
  await fetch(`/api/tasks/removeColumn/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

}
