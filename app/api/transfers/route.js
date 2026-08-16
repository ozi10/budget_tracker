import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const transfers = await prisma.transfer.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(transfers);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.fromAccountId || !body.toAccountId || !body.amount || Number(body.amount) <= 0) {
    return NextResponse.json({ error: "fromAccountId, toAccountId, and positive amount are required" }, { status: 400 });
  }
  if (body.fromAccountId === body.toAccountId) {
    return NextResponse.json({ error: "Cannot transfer to the same account" }, { status: 400 });
  }

  // Verify ownership of both accounts
  const [from, to] = await Promise.all([
    prisma.account.findUnique({ where: { id: body.fromAccountId } }),
    prisma.account.findUnique({ where: { id: body.toAccountId } }),
  ]);
  if (!from || from.userId !== session.user.id || !to || to.userId !== session.user.id) {
    return NextResponse.json({ error: "Invalid account(s)" }, { status: 400 });
  }

  const transfer = await prisma.transfer.create({
    data: {
      userId: session.user.id,
      fromAccountId: body.fromAccountId,
      toAccountId: body.toAccountId,
      amount: Number(body.amount),
      note: body.note || "",
      date: new Date(body.date || Date.now()),
    },
  });
  return NextResponse.json(transfer);
}
