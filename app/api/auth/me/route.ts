import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json(
      { error: "ยังไม่ได้เข้าสู่ระบบ" },
      { status: 401 }
    );
  }
  return NextResponse.json({ user: auth });
}
