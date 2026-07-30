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

  const expenses = await prisma.expense.findMany({
    where: { shopId: auth.shopId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบก่อน" },
      { status: 401 }
    );
  }

  const { category, amount, note } = await req.json();

  if (!category || amount === undefined || amount === null) {
    return NextResponse.json(
      { error: "กรุณาระบุหมวดหมู่และจำนวนเงิน" },
      { status: 400 }
    );
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json(
      { error: "จำนวนเงินต้องมากกว่า 0" },
      { status: 400 }
    );
  }

  const expense = await prisma.expense.create({
    data: {
      shopId: auth.shopId,
      recordedById: auth.userId,
      category,
      amount: amountNum,
      note,
    },
  });

  return NextResponse.json({ expense }, { status: 201 });
}
