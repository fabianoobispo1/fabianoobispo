import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { conta, sfbUser_id } = body;
    conta.valor = parseFloat(conta.valor);
    conta.limite = parseFloat(conta.limite);
    conta.limite_usado = parseFloat(conta.limite_usado);
    conta.data_vencimento = new Date(conta.data_vencimento);
    if (conta.data_pagamento != '') {
      conta.data_pagamento = new Date(conta.data_pagamento);
    } else {
      conta.data_pagamento = null;
    }
    //verifica se ja existe pra fazer update
    const exsiteconta = await prisma.sFBConta.findUnique({
      where: {
        id: conta.id
      }
    });

    if (exsiteconta) {
      const contaEditada = await prisma.sFBConta.update({
        include: {
          sfbUser: {
            select: {
              nome: true
            }
          }
        },
        where: {
          id: conta.id
        },
        data: {
          conta: conta.conta,
          valor: conta.valor,
          data_vencimento: conta.data_vencimento,
          data_pagamento: conta.data_pagamento,
          sfbUser_id
        }
      });

      return NextResponse.json(
        { message: 'conta atualizado com sucesso.', conta: contaEditada },
        { status: 201 }
      );
    } else {
      const novoconta = await prisma.sFBConta.create({
        include: {
          sfbUser: {
            select: {
              nome: true
            }
          }
        },
        data: {
          conta: conta.conta,
          valor: conta.valor,
          data_vencimento: conta.data_vencimento,
          data_pagamento: conta.data_pagamento,
          sfbUser_id
        }
      });

      return NextResponse.json(
        { message: 'conta cadastrada com sucesso.', conta: novoconta },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error('Erro Prisma:', error);
    return NextResponse.json(
      { message: 'Erro ao conectar ao banco de dados.' },
      { status: 500 }
    );
  }
}
