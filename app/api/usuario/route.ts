import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { nome, email, password } = body;

    const password_hash = await hash(password, 6);

    const userWithSameEmail = await prisma.sFBUser.findUnique({
      where: {
        email,
      },
    });

    if (userWithSameEmail) {
      return NextResponse.json(
        { message: "Usuário já existente com esse Email" },
        { status: 409 },
      );
    }

    const newUser = await prisma.sFBUser.create({
      data: {
        nome,
        email,
        password_hash,
      },
    });

    return NextResponse.json(
      { message: "Usuário cadastrado com sucesso.", user: newUser },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Erro ao conectar ao banco de dados." },
      { status: 500 },
    );
  }
}