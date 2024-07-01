import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const cartao = await prisma.sFBCartao.findMany({
      where	:{
        id: String(id)
      }
    })
    if (!cartao) return NextResponse.json({ message: 'Cartao Removido' }, { status: 200 });

    await prisma.sFBCartao.delete({
      where: { id: String(id) }
    });

    return NextResponse.json({ message: 'Cartao Removido' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro ao atualizar o recurso', error },
      { status: 500 }
    );
  }
}
