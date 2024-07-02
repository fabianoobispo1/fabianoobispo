'use client';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { CartaoList } from './cartao/CartaoList';
import { useEffect, useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContaList } from './conta/ContaList';
import { useSession } from 'next-auth/react';
import { formatBLR } from '@/lib/utils';
import { Skeleton } from '../ui/skeleton';

export default function TotalizadorFinancas() {
  // Estado para armazenar a data atual
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const [valorTotal, setValorTotal] = useState(0);
  const [valorTotalPendente, setValorTotalPendente] = useState(0);

  const { data: session } = useSession();

  useEffect(() => {
    TotalGastos();
  }, [currentDate]);

  const TotalGastos = async () => {
    setLoading(true);
    const userId = session?.user.id;
    const date = format(new Date(currentDate), 'yyyy-MM-dd');

    console.log(currentDate)
    console.log(date)
    const response = await fetch(`/api/carteira/totalgastos/${userId}/${date}`);

    const { ValorTotal, ValorTotalPendente } = await response.json();

    setValorTotalPendente(ValorTotalPendente);
    setValorTotal(ValorTotal);
    setLoading(false);
  };

  // Função para incrementar o mês
  const handleNextMonth =  async () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  // Função para decrementar o mês
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));    
  };

  const handleCartaoInfo = () => {
        TotalGastos();
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total mês anterior
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$100,00</div>
            {/* <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p> */}
          </CardContent>
        </Card>
       
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo atual</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$30,00</div>
            <p className="text-xs text-muted-foreground"></p>
          </CardContent>
        </Card>
        {/*  <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Now
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+573</div>
                  <p className="text-xs text-muted-foreground">
                    +201 since last hour
                  </p>
                </CardContent>
              </Card> */}
      </div>
      <Separator />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total gastos no mês de {format(currentDate, 'MMMM', { locale: ptBR })}</CardTitle>
            {/* <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg> */}
          </CardHeader>
          <CardContent>
            {loading ? (
              <>
                <div className="flex flex-col items-start justify-between gap-2 space-y-0 pb-2">
                  <Skeleton className="h-8 w-full p-2" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatBLR(valorTotal)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Falta pagar: {formatBLR(valorTotalPendente)}
                </p>
              </>
            )}
          </CardContent>
        </Card>

      </div>

      <div className="mt-8 pt-5">
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="rounded bg-white px-2 py-1 text-sm font-semibold text-sky-900 shadow-sm ring-1 ring-inset ring-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5L8.25 12l7.5-7.5"
              />
            </svg>
          </button>
          <span className="text-lg font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="rounded bg-white px-2 py-1 text-sm font-semibold text-sky-900 shadow-sm ring-1 ring-inset ring-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>
        </div>
      </div>

      <Accordion type="multiple">
        <AccordionItem value="item-1">
          <AccordionTrigger>Cartões</AccordionTrigger>
          <AccordionContent>
            <CartaoList
              currentDate={currentDate}
              onUpdateDados={handleCartaoInfo}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Contas</AccordionTrigger>
          <AccordionContent>
            <ContaList
              currentDate={currentDate}
              onUpdateDados={handleCartaoInfo}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
