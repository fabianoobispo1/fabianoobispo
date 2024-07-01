import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.sFBConta.delete({
      where: { id: String(id) }
    });

    return NextResponse.json({ message: 'Conta Removida' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro ao atualizar o recurso', error },
      { status: 500 }
    );
  }
}
