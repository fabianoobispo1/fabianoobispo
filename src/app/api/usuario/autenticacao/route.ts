import { getEnvVariable } from "@/lib/helpers";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken";
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

    const JWT_EXPIRES_IN = getEnvVariable("JWT_EXPIRES_IN");
    const JWT_SECRET_KEY = getEnvVariable("JWT_SECRET_KEY");
    const token = jwt.sign({ sign: { sub: usuario.id } }, JWT_SECRET_KEY, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const tokenMaxAge = parseInt(JWT_EXPIRES_IN) * 60;
    const cookieOptions = {
      name: "tokensite",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV !== "development",
      maxAge: tokenMaxAge,
    };

    const response = new NextResponse(
      JSON.stringify({
        status: "success",
        token,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

    await Promise.all([
      response.cookies.set(cookieOptions),
      response.cookies.set({
        name: "logged-in",
        value: "true",
        maxAge: tokenMaxAge,
      }),
    ]);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { message: "Erro ao conectar ao banco de dados." },
      { status: 500 },
    );
  }
}
