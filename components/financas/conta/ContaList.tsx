'use client';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { LoadingButton } from '@/components/ui/loading-button';
import { Edit, Save, Trash } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { formatBLR } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

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

export function ContaList({ currentDate, onUpdateDados }: any) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLinha, setLoadingLinha] = useState<boolean>(false);
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
    setLoadingLinha(true);

    const conta = contas.find((conta) => conta.id === id);
    if (!conta) {
      setLoadingLinha(false);
      return;
    }

    await fetch(`/api/conta/remover/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    loadContas();
    setLoadingLinha(false);
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
    setLoadingLinha(true);
    setEditingId(id);
    setLoadingLinha(false);
  };

  const handleSalve = async (id: string) => {
    setLoadingLinha(true);
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
    setLoadingLinha(false);
    onUpdateDados('ok')
    setEditingId(null);
  };

  const totalValores = useMemo(
    () =>
      contas.reduce(
        (sum, conta) => sum + parseFloat(conta.valor.toString()),
        0
      ),
    [contas]
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <LoadingButton loading={loading} onClick={addConta} className="ml-2">
          + Adicionar
        </LoadingButton>
      </div>

      <ScrollArea className="h-[calc(80vh-220px)] w-full overflow-x-auto rounded-md border">
        {loading ? (
          <div className="flex h-[calc(80vh-220px)] w-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <Table className="w-full p-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-52 text-center">Conta</TableHead>
                <TableHead className="w-32 text-center">Valor</TableHead>
                <TableHead className="w-32 text-center">Vencimento</TableHead>
                <TableHead className="w-32 text-center">Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            {contas.length != 0 ? (
              <>
                <TableBody>
                  {contas.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="text-center">
                        {editingId === conta.id ? (
                          <Input
                            name="conta"
                            className="w-52"
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
                          <p className="w-36">{formatBLR(conta.valor)}</p>
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
                            {new Date(
                              conta.data_vencimento
                            ).toLocaleDateString('pt-BR', {
                              timeZone: 'UTC'
                            })}
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
                              ? new Date(
                                  conta.data_pagamento
                                ).toLocaleDateString('pt-BR', {
                              timeZone: 'UTC'
                            })
                              : '-'}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className='flex justify-end gap-4'>
                          {editingId === conta.id ? (
                            <LoadingButton
                              loading={loadingLinha}
                              onClick={() => handleSalve(conta.id)}
                            >
                              <Save className="h-4 w-4" />
                            </LoadingButton>
                          ) : (
                            <LoadingButton
                              loading={loadingLinha}
                              onClick={() => handleEdit(conta.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </LoadingButton>
                          )}
                          <LoadingButton
                            loading={loadingLinha}
                            variant={'destructive'}
                            onClick={() => removeConta(conta.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </LoadingButton>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="text-center">Total</TableCell>
                    <TableCell className="text-center">
                      {formatBLR(totalValores)}
                    </TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableFooter>
              </>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div className="flex h-[calc(80vh-220px)] w-full items-center justify-center">
                      <p className="w-full text-center">Sem Informação</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        )}
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
