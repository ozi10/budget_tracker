import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnership(userId, id) {
  const acc = await prisma.account.findUnique({ where: { id } });
  return acc && acc.userId === userId ? acc : null;
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await assertOwnership(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.account.update({
    where: { id: params.id },
    data: {
      name: body.name?.trim() || existing.name,
      type: body.type || existing.type,
      color: body.color || existing.color,
      icon: body.icon || existing.icon,
      openingBalance: body.openingBalance !== undefined ? Number(body.openingBalance) : existing.openingBalance,
      creditLimit: body.creditLimit !== undefined ? (body.creditLimit ? Number(body.creditLimit) : null) : existing.creditLimit,
      billingDay: body.billingDay !== undefined ? (body.billingDay ? Number(body.billingDay) : null) : existing.billingDay,
      dueDay: body.dueDay !== undefined ? (body.dueDay ? Number(body.dueDay) : null) : existing.dueDay,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await assertOwnership(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Unlink transactions from this account before deleting
  await prisma.transaction.updateMany({
    where: { accountId: params.id },
    data: { accountId: null },
  });

  await prisma.account.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
