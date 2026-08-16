import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(transactions);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.amount || Number(body.amount) <= 0 || !body.categoryId) {
    return NextResponse.json({ error: "Amount and category are required" }, { status: 400 });
  }
  const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
  if (!category || category.userId !== session.user.id) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  // Validate accountId if provided
  if (body.accountId) {
    const account = await prisma.account.findUnique({ where: { id: body.accountId } });
    if (!account || account.userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid account" }, { status: 400 });
    }
  }
  const tx = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      categoryId: body.categoryId,
      accountId: body.accountId || null,
      type: body.type === "income" ? "income" : "expense",
      amount: Number(body.amount),
      note: body.note || "",
      date: new Date(body.date || Date.now()),
      source: body.source || "manual",
    },
  });
  return NextResponse.json(tx);
}
