import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, password } = body;

    const usuario = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { message: "Usuário nâo encontrado." },
        { status: 409 },
      );
    }

    const doestPasswordMatches = await compare(password, usuario.password_hash);

    if (!doestPasswordMatches) {
      return NextResponse.json({ message: "Senha Invalida." }, { status: 409 });
    }

    return NextResponse.json({ message: "Usuário logado." }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Erro ao conectar ao banco de dados." },
      { status: 500 },
    );
  }
}
