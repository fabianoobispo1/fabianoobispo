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
    const contas = await prisma.sFBConta.findMany({
      where: {
        sfbUser_id: userId,
        data_vencimento: {
          gte: new Date(firstDay),
          lte: new Date(lastDay)
        }
      },
      include: {
        sfbUser: {
          select: {
            nome: true
          }
        }
      }
    });

    return NextResponse.json(
      { message: 'Contas recuperada com sucesso.', contas: contas },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro Prisma:', error);
    return NextResponse.json(
      { message: 'Erro ao conectar ao banco de dados.' },
      { status: 500 }
    );
  }
}
