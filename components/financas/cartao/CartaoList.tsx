'use client';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingButton } from '@/components/ui/loading-button';
import { Trash } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';

interface Cartao {
  id: string;
  cartao: string;
  valor: number;
  data_vencimento: string,
  data_pagamento: string,
  limite: number;
  limite_usado: number;
  created_at: string;
  updated_at: string;
  sfbUser_id: string;
  sfbUser?: {
    nome: string;
  };
}

export function CartaoList() {
  const [id, setId] = useState<string | undefined>('')
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
 const [loading, setLoading] = useState<boolean>(false);
  const [loadingTodo, setLoadingTodo] = useState<boolean>(false);
  const [newCartao, setNewCartao] = useState<Cartao>({
    id: '',
    cartao: '',
    valor: 0,
    data_vencimento: '',
    data_pagamento: '',
    limite: 0,
    limite_usado: 0,
    created_at: '',
    updated_at: '',
    sfbUser_id: '',
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    /* loadTodos(); */
  }, []);

/*   const loadTodos = async () => {
    setLoading(true);   
    const userId = session?.user.id;
    const response = await fetch(`/api/todo/listar/${userId}`); 
    
    const { todos } = await response.json();
    setTodos(todos);
    setLoading(false);
  }; */

  const addCartao = async () => {
    setLoading(true);
    /* if (newTodo.trim() === '') {
      setLoading(false);
      return;
    } */

   /*  const response = await fetch('/api/todo/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newTodo, sfbUser_id: session?.user.id })
    });

    const { todo } = await response.json();
    setTodos([...todos, todo]);
    setNewTodo(''); */
    
  
    const newCartaoWithId = { ...newCartao, id: String(Date.now()) };
    setCartoes([...cartoes, newCartaoWithId]);
    setEditingId(newCartaoWithId.id);
    setNewCartao({
      id: '',
      cartao: '',
      valor: 0,
      data_vencimento: '',
      data_pagamento: '',
      limite: 0,
      limite_usado: 0,
      created_at: '',
      updated_at: '',
      sfbUser_id: '',
    });
    setLoading(false);
  };

/*   const toggleTodo = async (id: string) => {
    setLoadingTodo(true);
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) {
      setLoadingTodo(false);
      return;
    }

    const updatedTodo = { ...todo, isCompleted: !todo.isCompleted };
    await fetch(`/api/todo/atualizar/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTodo)
    });

    setTodos(todos.map((todo) => (todo.id === id ? updatedTodo : todo)));
    setLoadingTodo(false);
  }; */

/*   const removeTodo = async (id: string) => {
    setLoadingTodo(true);
    const todo = todos.find((todo) => todo.id === id);
    if (!todo) {
      setLoadingTodo(false);
      return;
    }

    await fetch(`/api/todo/remover/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    loadTodos();
    setLoadingTodo(false);
  }; */

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const { name, value } = e.target;
    setCartoes(cartoes.map(cartao => 
      cartao.id === id ? { ...cartao, [name]: value } : cartao
    ));
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
          <LoadingButton loading={loading} onClick={addCartao} className="ml-2">
            + Adicionar
        </LoadingButton>
      </div>

      <ScrollArea className="h-[calc(80vh-220px)] w-full overflow-x-auto rounded-md border">
        <Table className="relative">
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Cartão</TableHead>
              <TableHead className="text-center">Valor</TableHead>
              <TableHead className="text-center">Vencimento</TableHead>            
              <TableHead className="text-center">Pagamento</TableHead>
              <TableHead className="text-center">Limite Usado</TableHead>
              <TableHead className="text-center">Limite Liberado</TableHead>
              <TableHead className="text-center">Limite Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {cartoes.map((cartao) => (
              <TableRow key={cartao.id}>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input 
                      name="cartao"
                      value={cartao.cartao}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    cartao.cartao
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input 
                      name="valor"
                      type="number"
                      value={cartao.valor}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    cartao.valor
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input 
                      name="data_vencimento"
                      type="date"
                      value={cartao.data_vencimento}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    cartao.data_vencimento
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input 
                      name="data_pagamento"
                      type="date"
                      value={cartao.data_pagamento}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    cartao.data_pagamento
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input 
                      name="limite_usado"
                      type="number"
                      value={cartao.limite_usado}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    cartao.limite_usado
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {cartao.limite - cartao.limite_usado}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input 
                      name="limite"
                      type="number"
                      value={cartao.limite}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    cartao.limite
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <button onClick={() => setEditingId(null)}>Salvar</button>
                  ) : (
                    <button onClick={() => handleEdit(cartao.id)}>Editar</button>
                  )}
                </TableCell>
              </TableRow>
            ))}
           {/*  {todos.map((todo) => (
              <TableRow key={todo.id}>
                <TableCell>{todo.text}</TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={todo.isCompleted}
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  {new Date(todo.created_at).toLocaleDateString()}
                </TableCell>
                  <TableCell className="flex gap-2 items-center justify-center">
                  <LoadingButton
                    className="w-32"
                    loading={loadingTodo}
                    onClick={() => toggleTodo(todo.id)}
                  >
                    {todo.isCompleted ? 'Desfazer' : 'Completo'}
                  </LoadingButton>
                  <LoadingButton
                    loading={loadingTodo}
                    variant={"destructive"}
                    onClick={() => removeTodo(todo.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </LoadingButton>
                </TableCell>
              </TableRow>
            ))} */}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
