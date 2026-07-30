import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const requests = await prisma.menuRequest.findMany({
    orderBy: { voteCount: "desc" },
  });
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const { shopId, name } = await req.json();

  if (!name || !shopId) {
    return NextResponse.json(
      { error: "กรุณาระบุชื่อเมนูที่ต้องการ" },
      { status: 400 }
    );
  }

  const existing = await prisma.menuRequest.findFirst({
    where: { shopId, name: { equals: name, mode: "insensitive" } },
  });

  if (existing) {
    const updated = await prisma.menuRequest.update({
      where: { id: existing.id },
      data: { voteCount: { increment: 1 } },
    });
    return NextResponse.json({ request: updated, merged: true });
  }

  const created = await prisma.menuRequest.create({
    data: { shopId, name, voteCount: 1 },
  });

  return NextResponse.json({ request: created }, { status: 201 });
}
