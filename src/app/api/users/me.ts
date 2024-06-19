export const dynamic = "force-dynamic";
import { getErrorResponse } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("X-USER-ID");

    if (!userId) {
      return getErrorResponse(
        401,
        "You are not logged in, please provide token to gain access",
      );
    }
    const responseApi = await fetch(
      `${process.env.NEXT_PUBLIC_API_MINHA_BASE}/faperfilid`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userId,
        }),
      },
    );

    const user = await responseApi.json();

    let token = req.cookies.get("tokenjfimperadores")?.value;

    user.id = user.faUsuario.id;
    user.name = user.faUsuario.nome;
    user.email = user.faUsuario.email;
    user.role = "teste";
    user.verified = false;
    user.createdAt = user.faUsuario.created_at;
    user.updatedAt = user.faUsuario.created_at;
    user.administrador = user.faUsuario.administrador;
    user.token = token;

    return NextResponse.json({
      status: "success",

      data: { user: { ...user, password: undefined } },
    });
  } catch (error: any) {
    console.log(error);
  }
}
