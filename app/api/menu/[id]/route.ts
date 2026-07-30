import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.category !== undefined) data.category = body.category;
  if (body.price !== undefined) data.price = Number(body.price);
  if (body.cost !== undefined) data.cost = Number(body.cost);
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
  if (body.story !== undefined) data.story = body.story || null;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  const item = await prisma.menuItem.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json({ item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const item = await prisma.menuItem.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ item });
}
