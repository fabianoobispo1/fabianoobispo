import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

<<<<<<< HEAD
    const { name, email, password} = body;
=======
    console.log(body);
    //logica entra aqui
    const { name, email, password } = body;
>>>>>>> 20d9590b01b8a051c109ae3190b512defd763c6c

    const password_hash = await hash(password, 6);

    const userWithSameEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (userWithSameEmail) {
      return NextResponse.json(
<<<<<<< HEAD
        { message: 'Usuário já existente com esse Email' },
        { status: 409 }
=======
        { message: "Usuário já existente com esse Email" },
        { status: 201 },
>>>>>>> 20d9590b01b8a051c109ae3190b512defd763c6c
      );
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
      },
    });

    return NextResponse.json(
      { message: "Usuário cadastrado com sucesso.", user: newUser },
      { status: 201 },
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Erro ao conectar ao banco de dados." },
      { status: 500 },
    );
  }
}
