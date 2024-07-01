import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { cartao, sfbUser_id } = body;
    cartao.valor = parseFloat(cartao.valor);
    cartao.limite = parseFloat(cartao.limite);
    cartao.limite_usado = parseFloat(cartao.limite_usado);
    cartao.data_vencimento = new Date(cartao.data_vencimento);
    if (cartao.data_pagamento != '') {
      cartao.data_pagamento = new Date(cartao.data_pagamento);
    } else {
      cartao.data_pagamento = null;
    }
    //verifica se ja existe pra fazer update
    const exsiteCartao = await prisma.sFBCartao.findUnique({
      where: {
        id: cartao.id
      }
    });

    if (exsiteCartao) {
      const cartaoEditado = await prisma.sFBCartao.update({
        include: {
          sfbUser: {
            select: {
              nome: true
            }
          }
        },
        where: {
          id: cartao.id
        },
        data: {
          cartao: cartao.cartao,
          valor: cartao.valor,
          data_vencimento: cartao.data_vencimento,
          data_pagamento: cartao.data_pagamento,
          limite: cartao.limite,
          limite_usado: cartao.limite_usado,
          sfbUser_id
        }
      });

      return NextResponse.json(
        { message: 'Cartao atualizado com sucesso.', cartao: cartaoEditado },
        { status: 201 }
      );
    } else {
      const novoCartao = await prisma.sFBCartao.create({
        include: {
          sfbUser: {
            select: {
              nome: true
            }
          }
        },
        data: {
          cartao: cartao.cartao,
          valor: cartao.valor,
          data_vencimento: cartao.data_vencimento,
          data_pagamento: cartao.data_pagamento,
          limite: cartao.limite,
          limite_usado: cartao.limite_usado,
          sfbUser_id
        }
      });

      return NextResponse.json(
        { message: 'Cartao cadastrado com sucesso.', cartao: novoCartao },
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
