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


interface Conta {
  id: string;
  conta: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string;
  created_at: string;
  updated_at: string;
  sfbUser_id: string;
  sfbUser?: {
    nome: string;
  };
}

export function ContaList({ currentDate }: any) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTodo, setLoadingTodo] = useState<boolean>(false);
  const [newConta, setNewConta] = useState<Conta>({
    id: '',
    conta: '',
    valor: 0,
    data_vencimento: '',
    data_pagamento: '',
    created_at: '',
    updated_at: '',
    sfbUser_id: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: session } = useSession();

  useEffect(() => {
    loadContas();
  }, [currentDate]);

  const loadContas = async () => {
    setLoading(true);
    const userId = session?.user.id;
    const date = format(new Date(currentDate), 'yyyy-MM-dd');

    const response = await fetch(`/api/conta/listar/${userId}/${date}`);
    console.log(response);
    const { contas } = await response.json();

    setContas(contas);
    setLoading(false);
  };

  const addConta = async () => {
    setLoading(true);

    const newContaWithId = { ...newConta, id: String(Date.now()) };
    setContas([...contas, newContaWithId]);
    setEditingId(newContaWithId.id);
    setNewConta({
      id: '',
      conta: '',
      valor: 0,
      data_vencimento: '',
      data_pagamento: '',
      created_at: '',
      updated_at: '',
      sfbUser_id: ''
    });
    setLoading(false);
  };
  const removeConta = async (id: string) => {
    setLoadingTodo(true);

    const conta = contas.find((conta) => conta.id === id);
    if (!conta) {
      setLoadingTodo(false);
      return;
    }

    await fetch(`/api/conta/remover/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    loadContas();
    setLoadingTodo(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string
  ) => {
    const { name, value } = e.target;
    setContas(
      contas.map((conta) =>
        conta.id === id ? { ...conta, [name]: value } : conta
      )
    );
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
  };

  const handleSalve = async (id: string) => {
    const conta = contas.reduce<Conta | null>((acc, item) => {
      if (item.id === id) {
        return item;
      }
      return acc;
    }, null);

    const response = await fetch('/api/conta/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conta, sfbUser_id: session?.user.id })
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <LoadingButton loading={loading} onClick={addConta} className="ml-2">
          + Adicionar
        </LoadingButton>
      </div>

      <ScrollArea className="h-[calc(80vh-220px)] w-full overflow-x-auto rounded-md border">
        <Table className="w-full p-2">
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 text-center">Conta</TableHead>
              <TableHead className="w-32 text-center">Valor</TableHead>
              <TableHead className="w-32 text-center">Vencimento</TableHead>
              <TableHead className="w-32 text-center">Pagamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.map((conta) => (
              <TableRow key={conta.id}>
                <TableCell className="text-center">
                  {editingId === conta.id ? (
                    <Input
                      name="conta"
                      className="w-36"
                      value={conta.conta}
                      onChange={(e) => handleInputChange(e, conta.id)}
                    />
                  ) : (
                    <p className="w-36">{conta.conta}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === conta.id ? (
                    <Input
                      name="valor"
                      type="number"
                      className="w-36"
                      value={conta.valor}
                      onChange={(e) => handleInputChange(e, conta.id)}
                    />
                  ) : (
                    <p className="w-36">{conta.valor}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === conta.id ? (
                    <Input
                      name="data_vencimento"
                      type="date"
                      className="w-36"
                      value={conta.data_vencimento}
                      onChange={(e) => handleInputChange(e, conta.id)}
                    />
                  ) : (
                    <p className="w-36">
                      {new Date(conta.data_vencimento).toLocaleDateString()}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === conta.id ? (
                    <Input
                      name="data_pagamento"
                      type="date"
                      className="w-36"
                      value={conta.data_pagamento || ''}
                      onChange={(e) => handleInputChange(e, conta.id)}
                    />
                  ) : (
                    <p className="w-36">
                      {conta.data_pagamento
                        ? new Date(conta.data_pagamento).toLocaleDateString()
                        : '-'}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {editingId === conta.id ? (
                    <button onClick={() => handleSalve(conta.id)}>
                      Salvar
                    </button>
                  ) : (
                    <button onClick={() => handleEdit(conta.id)}>Editar</button>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <LoadingButton
                    loading={loadingTodo}
                    variant={'destructive'}
                    onClick={() => removeConta(conta.id)}
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
