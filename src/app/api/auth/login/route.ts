import { getEnvVariable, getErrorResponse } from "@/lib/helpers";
import { LoginUserInput, LoginUserSchema } from "@/lib/validations/user.schema";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LoginUserInput;
    const data = LoginUserSchema.parse(body);

    
    //minha api 
    const responseApi = await fetch(`${process.env.NEXT_PUBLIC_API_MINHA_BASE}/fasesao`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
      })
    });

    if (responseApi.status === 400)  {
      return getErrorResponse(400, "Email ou senha errados");
    }
    
    const JWT_EXPIRES_IN = getEnvVariable("JWT_EXPIRES_IN");
    const {token} = await responseApi.json() 

    const tokenMaxAge = parseInt(JWT_EXPIRES_IN) * 60;
    const cookieOptions = {
      name: "tokenjfimperadores",
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
      }
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
    if (error instanceof ZodError) {
      return getErrorResponse(400, "failed validations", error);
    }

    return getErrorResponse(500, error.message);
  }
}
