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
import { Trash, Edit, Save } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { formatBLR } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

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

export function CartaoList({ currentDate, onUpdateDados }: any) {
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLinha, setLoadingLinha] = useState<boolean>(false);
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
    setLoadingLinha(true);

    const cartao = cartoes.find((cartao) => cartao.id === id);
    if (!cartao) {
      setLoadingLinha(false);
      return;
    }

    await fetch(`/api/cartao/remover/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    loadCartoes();
    setLoadingLinha(false);
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
    setLoadingLinha(true);
    setEditingId(id);
    setLoadingLinha(false);
  };

  const totalValores = useMemo(
    () =>
      cartoes.reduce(
        (sum, cartao) => sum + parseFloat(cartao.valor.toString()),
        0
      ),
    [cartoes]
  );
  const totalLimiteUsado = useMemo(
    () =>
      cartoes.reduce(
        (sum, cartao) => sum + parseFloat(cartao.limite_usado.toString()),
        0
      ),
    [cartoes]
  );
  const totalLimite = useMemo(
    () =>
      cartoes.reduce(
        (sum, cartao) => sum + parseFloat(cartao.limite.toString()),
        0
      ),
    [cartoes]
  );

  const handleSalve = async (id: string) => {
    setLoadingLinha(true);
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
    onUpdateDados('ok');
    setLoadingLinha(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <LoadingButton loading={loading} onClick={addCartao} className="ml-2">
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
            {cartoes.length != 0 ? (
              <>
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
                          <p className="w-36">{formatBLR(cartao.valor)}</p>
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
                            {new Date(
                              cartao.data_vencimento
                            ).toLocaleDateString('pt-BR', {
                              timeZone: 'UTC'
                            })}
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
                              ? new Date(
                                  cartao.data_pagamento
                                ).toLocaleDateString('pt-BR', {
                              timeZone: 'UTC'
                            })
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
                          <p className="w-36">
                            {formatBLR(cartao.limite_usado)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <p className="w-36">
                          {formatBLR(cartao.limite - cartao.limite_usado)}
                        </p>
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
                          <p className="w-36">{formatBLR(cartao.limite)}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex justify-end gap-4">
                          {editingId === cartao.id ? (
                            <LoadingButton
                              loading={loadingLinha}
                              onClick={() => handleSalve(cartao.id)}
                            >
                              <Save className="h-4 w-4" />
                            </LoadingButton>
                          ) : (
                            <LoadingButton
                              loading={loadingLinha}
                              onClick={() => handleEdit(cartao.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </LoadingButton>
                          )}
                          <LoadingButton
                            loading={loadingLinha}
                            variant={'destructive'}
                            onClick={() => removeCartao(cartao.id)}
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
                    <TableCell colSpan={2}></TableCell>
                    <TableCell className="text-center">
                      {formatBLR(totalLimiteUsado)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatBLR(totalLimite - totalLimiteUsado)}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatBLR(totalLimite)}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
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
