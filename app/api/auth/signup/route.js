import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CATEGORIES } from "@/lib/defaultCategories";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Enter a valid email and a password with at least 8 characters." }, { status: 400 });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        categories: { create: DEFAULT_CATEGORIES },
      },
    });
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error("Signup error", err);
    return NextResponse.json({ error: "Something went wrong creating your account." }, { status: 500 });
  }
}
