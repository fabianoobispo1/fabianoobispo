'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '../ui/textarea';

import { useTaskStore } from '@/lib/store';

export default function NewTaskDialog() {
  const addTask = useTaskStore((state) => state.addTask);
  const columns = useTaskStore((state) => state.columns);
  console.log(columns)
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    console.log(Object.fromEntries(formData));
  
    const { title, description } = Object.fromEntries(formData);

    if (typeof title !== 'string' || typeof description !== 'string') return;
    addTask(title, description);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          ＋ Adicionar nova tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar nova tarefa</DialogTitle>
          <DialogDescription>
            O que você quer fazer hoje?
          </DialogDescription>
        </DialogHeader>
        <form
          id="todo-form"
          className="grid gap-4 py-4"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 items-center gap-4 w-full">
            <Select
            /*   disabled={loading}
              onValueChange={field.onChange}*/
              /* value={columns.value}
              defaultValue={column.id.value}  */
              name='colun'
            >

              <SelectTrigger className='w-full'>
                <SelectValue
                  defaultValue={'-'}
                  placeholder="Selecione a coluna"
                />
              </SelectTrigger>

              <SelectContent>


                <SelectItem key={0} value={'-'}>
                  -
                </SelectItem>
                {columns.map((column) => (
                  <SelectItem
                    key={column.index}
                    value={column.id}
                  >
                    {column.title}
                  </SelectItem>
                ))}

              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Input
              id="title"
              name="title"
              placeholder="Título da tarefa..."
              className="col-span-4"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Textarea
              id="description"
              name="description"
              placeholder="Descrição..."
              className="col-span-4"
            />
          </div>
        </form>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type="submit" size="sm" form="todo-form">
              Adicionar tarefa
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
