import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const categories = await prisma.category.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.name || !body.name.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  const category = await prisma.category.create({
    data: {
      userId: session.user.id,
      name: body.name.trim(),
      icon: body.icon || "wallet",
      color: body.color || "#6B6252",
      type: body.type || "expense",
      locked: false,
    },
  });
  return NextResponse.json(category);
}
