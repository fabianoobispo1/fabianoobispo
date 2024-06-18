import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
/*     const name = searchParams.get("name");
    const password = searchParams.get("password");
    const confirmPassword = searchParams.get("confirmPassword"); */

    console.log(email);

    return NextResponse.json(
      { message: "Usuário cadastrado com sucesso." },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Erro ao conectar ao banco de dados." },
      { status: 500 },
    );
  }
}
