import { NextRequest } from "next/server";
import { verifyToken, TokenPayload } from "@/lib/auth";

export function requireAuth(req: NextRequest): TokenPayload | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
