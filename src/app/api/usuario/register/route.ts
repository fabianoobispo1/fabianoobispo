import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log(body);
    //logica entra aqui
    const { name, email, password} = body;

    const password_hash = await hash(password, 6);

    const userWithSameEmail = await prisma.user.findUnique({
        where:{
            email
        }
    });

    if (userWithSameEmail) {
      return NextResponse.json(
        { message: 'Usuário já existente com esse Email' },
        { status: 201 }
      );
  }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash
      },
    });

    
    return NextResponse.json(
      { message: 'Usuário cadastrado com sucesso.', user: newUser },
      { status: 201 }
    );

  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Erro ao conectar ao banco de dados." },
      { status: 500 },
    );
  }
}
