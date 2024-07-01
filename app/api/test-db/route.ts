// app/api/test-db/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await prisma.$connect();
    const userCount = await prisma.sFBUser.count(); // Exemplo de operação no banco de dados
    return NextResponse.json({
      status: 'success',
      message: 'Conexão bem-sucedida!',
      userCount
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Falha na conexão com o banco de dados.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
