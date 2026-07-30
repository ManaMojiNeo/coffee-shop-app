import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const sales = await prisma.sale.findMany({
    where: { shopId: auth.shopId },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ sales });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { paymentMethod, items } = body as {
    paymentMethod: "CASH" | "QR" | "CARD";
    items: { menuItemId: string; quantity: number; unitPrice: number }[];
  };

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" },
      { status: 400 }
    );
  }

  const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  const sale = await prisma.sale.create({
    data: {
      shopId: auth.shopId,
      recordedById: auth.userId,
      paymentMethod,
      total,
      items: {
        create: items.map((it) => ({
          menuItemId: it.menuItemId,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json({ sale }, { status: 201 });
}
