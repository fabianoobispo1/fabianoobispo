import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log(body);
    //logica entra aqui
   /*  const { name, email } = body; */
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: "Erro ao conectar ao banco de dados." },
      { status: 500 },
    );
  }
}
