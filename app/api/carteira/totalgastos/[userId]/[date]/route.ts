import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string; date: string } }
) {
  const { userId, date } = params;

  const getFirstAndLastDayOfMonth = (dateString: string) => {
    const date = parseISO(dateString);
    const firstDay = startOfMonth(date);
    const lastDay = endOfMonth(date);

    return {
      firstDay: format(firstDay, 'yyyy-MM-dd'),
      lastDay: format(lastDay, 'yyyy-MM-dd')
    };
  };

  const { firstDay, lastDay } = getFirstAndLastDayOfMonth(date);
  try {
    const ValorTotal = await prisma.sFBUser.findMany({
      where: {
        id: userId      
      },
      include: {
        sfbCartao: {
          select: {
            valor: true,
            data_pagamento: true
          },
          where:{
            data_vencimento: {
              gte: new Date(firstDay),
              lte: new Date(lastDay)
            }
          }
        },
        sfbConta: {
          select: {
            valor:true,
            data_pagamento: true
          },
          where:{
            data_vencimento: {
              gte: new Date(firstDay),
              lte: new Date(lastDay)
            }
        } 
      }
    }
    });

    if (ValorTotal.length === 0) {
      return NextResponse.json(
        { message: 'Recuperado com sucesso.', ValorTotal: 0 },
        { status: 201 }
      );
    }

    const calcularTotal = (items: { valor: number }[]): number => {
      return items.reduce((acc, item) => acc + item.valor, 0);
    };

    const calcularTotalPendente = (items: { valor: number; data_pagamento: Date | null }[]): number => {
      return items
        .filter(item => item.data_pagamento === null)
        .reduce((acc, item) => acc + item.valor, 0);
    };

    const totalCartao = calcularTotal(ValorTotal[0].sfbCartao);
    const totalConta = calcularTotal(ValorTotal[0].sfbConta);

    const totalCartaoPendente = calcularTotalPendente(ValorTotal[0].sfbCartao);
    const totalContaPendente = calcularTotalPendente(ValorTotal[0].sfbConta);
    
  

    return NextResponse.json(
      { message: 'Recuperado com sucesso.', ValorTotal: totalCartao + totalConta, ValorTotalPendente:  totalCartaoPendente + totalContaPendente },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Erro ao conectar ao banco de dados.' },
      { status: 500 }
    );
  }
}
