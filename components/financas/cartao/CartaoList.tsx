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
import { LoadingButton } from '@/components/ui/loading-button';
import { Trash } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';
import { format} from 'date-fns';

interface Cartao {
  id: string;
  cartao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string;
  limite: number;
  limite_usado: number;
  created_at: string;
  updated_at: string;
  sfbUser_id: string;
  sfbUser?: {
    nome: string;
  };
}

export function CartaoList({ currentDate }: any) {
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
    sfbUser_id: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    loadCartoes();
  }, [currentDate]);

  const loadCartoes = async () => {
    setLoading(true);
    const userId = session?.user.id;
    const date = format(new Date(currentDate), 'yyyy-MM-dd');

    const response = await fetch(`/api/cartao/listar/${userId}/${date}`);

    const { cartoes } = await response.json();
    console.log(cartoes);
    setCartoes(cartoes);
    setLoading(false);
  };

  const addCartao = async () => {
    setLoading(true);

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
      sfbUser_id: ''
    });
    setLoading(false);
  };
  const removeCartao = async (id: string) => {
    setLoadingTodo(true);

    const cartao = cartoes.find((cartao) => cartao.id === id);
    if (!cartao) {
      setLoadingTodo(false);
      return;
    }

    await fetch(`/api/cartao/remover/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    loadCartoes();
    setLoadingTodo(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string
  ) => {
    const { name, value } = e.target;
    setCartoes(
      cartoes.map((cartao) =>
        cartao.id === id ? { ...cartao, [name]: value } : cartao
      )
    );
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSalve = async (id: string) => {
    const cartao = cartoes.reduce<Cartao | null>((acc, item) => {
      if (item.id === id) {
        return item;
      }
      return acc;
    }, null);

    const response = await fetch('/api/cartao/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cartao, sfbUser_id: session?.user.id })
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <LoadingButton loading={loading} onClick={addCartao} className="ml-2">
          + Adicionar
        </LoadingButton>
      </div>

      <ScrollArea className="h-[calc(80vh-220px)] w-full overflow-x-auto rounded-md border">
        <Table className="w-full p-2">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 text-center">Cartao</TableHead>
              <TableHead className="w-32 text-center">Valor</TableHead>
              <TableHead className="w-32 text-center">Vencimento</TableHead>
              <TableHead className="w-32 text-center">Pagamento</TableHead>
              <TableHead className="w-32 text-center">Limite Usado</TableHead>
              <TableHead className="w-32 text-center">
                Limite Liberado
              </TableHead>
              <TableHead className="w-32 text-center">Limite Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cartoes.map((cartao) => (
              <TableRow key={cartao.id}>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input
                      name="cartao"
                      className="w-36"
                      value={cartao.cartao}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    <p className="w-36">{cartao.cartao}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input
                      name="valor"
                      type="number"
                      className="w-36"
                      value={cartao.valor}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    <p className="w-36">{cartao.valor}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input
                      name="data_vencimento"
                      type="date"
                      className="w-36"
                      value={cartao.data_vencimento}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    <p className="w-36">
                      {new Date(cartao.data_vencimento).toLocaleDateString()}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input
                      name="data_pagamento"
                      type="date"
                      className="w-36"
                      value={cartao.data_pagamento || ''}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    <p className="w-36">
                      {cartao.data_pagamento
                        ? new Date(cartao.data_pagamento).toLocaleDateString()
                        : '-'}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input
                      name="limite_usado"
                      type="number"
                      className="w-36"
                      value={cartao.limite_usado}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    <p className="w-36">{cartao.limite_usado}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <p className="w-36">{cartao.limite - cartao.limite_usado}</p>
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <Input
                      name="limite"
                      type="number"
                      className="w-36"
                      value={cartao.limite}
                      onChange={(e) => handleInputChange(e, cartao.id)}
                    />
                  ) : (
                    <p className="w-36">{cartao.limite}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === cartao.id ? (
                    <button onClick={() => handleSalve(cartao.id)}>
                      Salvar
                    </button>
                  ) : (
                    <button onClick={() => handleEdit(cartao.id)}>
                      Editar
                    </button>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <LoadingButton
                    loading={loadingTodo}
                    variant={'destructive'}
                    onClick={() => removeCartao(cartao.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </LoadingButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
