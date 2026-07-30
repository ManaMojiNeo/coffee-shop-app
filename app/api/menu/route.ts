import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.menuItem.findMany({
    where: { isActive: true },
    orderBy: { category: "asc" },
  });
  return NextResponse.json({ items });
}
