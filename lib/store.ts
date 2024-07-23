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
      addTask: async (title: string, description?: string) =>{       

        set((state) => {
          if (state.columns.length === 0) {
            console.error('Nenhuma coluna encontrada para adicionar a tarefa.');
            return state;
          }

          const firstColumnId = state.columns[0].id; // Pegando o ID da primeira coluna
          const newTask = {
            id: uuid(),
            title,
            description,
            status: 'TODO',
            columnId: firstColumnId
          };

          console.log(newTask)

          return {
            tasks: [...state.tasks, newTask]
          };
        });


        set((state) => ({
          tasks: [
            ...state.tasks,
            { id: uuid(), title, description, status: 'TODO' }
          ]
        }))
      },
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

       removeCol: async (id: string) => {
        await removeColumnBase(id);
        set((state) => {
          const updatedColumns = state.columns
            .filter((col) => col.id !== id)
            .map((col, index) => ({ ...col, index: index + 1 })); // Atualiza os índices
            
          updateColumnIndices(updatedColumns); // Atualiza os índices no servidor
          return { columns: updatedColumns };
        });
      },
      setTasks: (newTasks: Task[]) => set({ tasks: newTasks }),

      setCols: (newCols: Column[]) => {
        newCols.forEach(col => {
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

async function updateColumnIndices(columns: Column[]): Promise<void> {
  console.log(columns)
  columns.forEach((col, index) => {
    console.log(index)
    editColumnBase(col.id, col.title, col.index)      
   });
 /*  await fetch('/api/tasks/updateColumnIndices', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(columns)
  }); */
}