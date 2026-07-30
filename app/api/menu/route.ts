import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await prisma.menuItem.findMany({
    where: { isActive: true },
    orderBy: { category: "asc" },
  });
  return NextResponse.json({ items });
}
