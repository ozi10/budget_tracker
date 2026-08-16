import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Compute real-time balance for an account
function computeBalance(account, allTransactions, allTransfers) {
  let balance = Number(account.openingBalance || 0);

  // Add income, subtract expenses linked to this account
  for (const tx of allTransactions) {
    if (tx.accountId !== account.id) continue;
    if (tx.type === "income") balance += Number(tx.amount);
    else balance -= Number(tx.amount);
  }

  // Add transfers in, subtract transfers out
  for (const tr of allTransfers) {
    if (tr.toAccountId === account.id) balance += Number(tr.amount);
    if (tr.fromAccountId === account.id) balance -= Number(tr.amount);
  }

  return Math.round(balance * 100) / 100;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [accounts, transactions, transfers] = await Promise.all([
    prisma.account.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } }),
    prisma.transaction.findMany({ where: { userId: session.user.id, accountId: { not: null } } }),
    prisma.transfer.findMany({ where: { userId: session.user.id } }),
  ]);

  const enriched = accounts.map((acc) => ({
    ...acc,
    balance: computeBalance(acc, transactions, transfers),
  }));

  return NextResponse.json(enriched);
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim() || !body.type) {
    return NextResponse.json({ error: "Name and type are required" }, { status: 400 });
  }

  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      name: body.name.trim(),
      type: body.type,
      color: body.color || "#1A4D3E",
      icon: body.icon || "building",
      openingBalance: Number(body.openingBalance) || 0,
      creditLimit: body.creditLimit ? Number(body.creditLimit) : null,
      billingDay: body.billingDay ? Number(body.billingDay) : null,
      dueDay: body.dueDay ? Number(body.dueDay) : null,
    },
  });

  return NextResponse.json({ ...account, balance: Number(account.openingBalance) });
}
