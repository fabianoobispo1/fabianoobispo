export const dynamic = "force-dynamic";
import { getErrorResponse } from "@/lib/helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("X-USER-ID");
    console.log(userId);

    if (!userId) {
      return getErrorResponse(
        401,
        "You are not logged in, please provide token to gain access",
      );
    }

    return NextResponse.json({
      status: "success",
    });
  } catch (error: any) {
    console.log(error);
  }
}
