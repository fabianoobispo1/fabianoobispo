import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { title, index } = await req.json();

    const updateColumn = await prisma.sFBkanbanColumn.update({
      where: { id: String(id) },
      data: { title, index }
    });

    return NextResponse.json({ message: 'Todo atualizado' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Erro ao atualizar o recurso', error },
      { status: 500 }
    );
  }
}
