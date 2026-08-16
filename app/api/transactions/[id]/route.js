import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnership(userId, id) {
  const tx = await prisma.transaction.findUnique({ where: { id } });
  return tx && tx.userId === userId ? tx : null;
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await assertOwnership(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  if (body.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category || category.userId !== session.user.id) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
  }
  const updated = await prisma.transaction.update({
    where: { id: params.id },
    data: {
      type: body.type === "income" ? "income" : "expense",
      amount: Number(body.amount),
      categoryId: body.categoryId || existing.categoryId,
      note: body.note ?? existing.note,
      date: body.date ? new Date(body.date) : existing.date,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await assertOwnership(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.transaction.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
