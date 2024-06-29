import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const { userId } = params;

  try {
    const todos = await prisma.sFBTodo.findMany({
      where:{
        sfbUser_id: userId
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
      { message: 'Todos recuperado com sucesso.', todos: todos },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Erro ao conectar ao banco de dados.' },
      { status: 500 }
    );
  }
}
