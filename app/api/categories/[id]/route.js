import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function assertOwnership(userId, id) {
  const cat = await prisma.category.findUnique({ where: { id } });
  return cat && cat.userId === userId ? cat : null;
}

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await assertOwnership(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updated = await prisma.category.update({
    where: { id: params.id },
    data: {
      name: body.name?.trim() || existing.name,
      icon: body.icon || existing.icon,
      color: body.color || existing.color,
      type: body.type || existing.type,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const existing = await assertOwnership(session.user.id, params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.locked) return NextResponse.json({ error: "This category can't be deleted" }, { status: 400 });

  let other = await prisma.category.findFirst({ where: { userId: session.user.id, name: "Other" } });
  if (!other) {
    other = await prisma.category.create({ data: { userId: session.user.id, name: "Other", icon: "wallet", color: "#6B6252", type: "both", locked: true } });
  }
  await prisma.transaction.updateMany({ where: { categoryId: params.id }, data: { categoryId: other.id } });
  await prisma.category.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
