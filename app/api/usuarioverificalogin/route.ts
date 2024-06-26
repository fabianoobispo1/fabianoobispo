import prisma from "@/lib/prisma";
import { compare, hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { email, password } = body;

     const user = await prisma.sFBUser.findUnique({
      where: {
        email,
      },
    });
    
   if (user == null) {
      return NextResponse.json(
        { message: "Email nao cadastrado" },
        { status: 409 },
      );
    }
    const doestPasswordMatches = await compare( String(password), user.password_hash);

    if (!doestPasswordMatches) {
      return NextResponse.json(
        { message: "senha Invalida" },
        { status: 409 },
      );
    }


    return NextResponse.json(
      { message: "Realizando Login"},
      { status: 201 },
    );
  

  } catch (error: any) {
    return NextResponse.json(
      { message: "Erro ao conectar ao banco de dados." },
      { status: 500 },
    );
  }
}