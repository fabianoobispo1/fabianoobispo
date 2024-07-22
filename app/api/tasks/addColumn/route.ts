import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { title, userID } = body;

    const newColumn  = await prisma.sFBkanbanColumn.create({      
      data: { title, sfbUser_id: userID  }
    }); 

    return NextResponse.json(
      { id: newColumn.id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Erro ao conectar ao banco de dados.' },
      { status: 500 }
    );
  }
}
