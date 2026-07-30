import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  const items = await prisma.menuItem.findMany({
    where: auth ? {} : { isActive: true },
    orderBy: { category: "asc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const { name, category, price, cost, imageUrl, story } = await req.json();

  if (!name || !category || price === undefined || price === null) {
    return NextResponse.json(
      { error: "กรุณาระบุชื่อ หมวดหมู่ และราคา" },
      { status: 400 }
    );
  }

  const priceNum = Number(price);
  const costNum = Number(cost ?? 0);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return NextResponse.json(
      { error: "ราคาต้องมากกว่า 0" },
      { status: 400 }
    );
  }

  const item = await prisma.menuItem.create({
    data: {
      shopId: auth.shopId,
      name,
      category,
      price: priceNum,
      cost: costNum,
      imageUrl: imageUrl || null,
      story: story || null,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
