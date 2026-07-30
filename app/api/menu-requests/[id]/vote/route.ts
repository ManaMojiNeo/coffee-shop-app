import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const updated = await prisma.menuRequest.update({
    where: { id: params.id },
    data: { voteCount: { increment: 1 } },
  });

  return NextResponse.json({ request: updated });
}
