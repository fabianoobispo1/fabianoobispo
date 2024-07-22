
import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { userId } = params;
  
try {

  const columns = await prisma.sFBkanbanColumn.findMany({
    where: {
      sfbUser_id: userId
    }
  });

console.log(columns)
   

      const tasks = [
         {
          id: '1',
          status: '1',
          title: '1'
        },
        
      ];
      console.log(tasks)

    /* const tasks = await prisma.task.findMany();
    const columns = await prisma.column.findMany(); */
  
 
    
    return NextResponse.json(
      { message: 'Contas recuperada com sucesso.', tasks, columns },
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
