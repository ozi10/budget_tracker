import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function stripToJson(text) {
  let t = text.trim();
  t = t.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  const s1 = t.indexOf("["), s2 = t.indexOf("{");
  const start = s1 === -1 ? s2 : (s2 === -1 ? s1 : Math.min(s1, s2));
  const end = Math.max(t.lastIndexOf("]"), t.lastIndexOf("}"));
  if (start !== -1 && end !== -1) t = t.slice(start, end + 1);
  return t;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI capture isn't configured on this server yet (missing ANTHROPIC_API_KEY)." }, { status: 500 });
  }

  const { text, imageBase64, imageMediaType } = await req.json();
  const categories = await prisma.category.findMany({ where: { userId: session.user.id } });
  const catNames = categories.map((c) => c.name).join(", ");
  const today = new Date().toISOString().slice(0, 10);

  const system = `You are a receipt, statement and expense-note parser for a personal budgeting app.
Existing categories: ${catNames}.
Today's date is ${today}.
Given the user's input (a plain description of one or more transactions, OR a photo of a receipt, bank statement, or bank passbook page), extract every distinct transaction you can find.
Respond with ONLY a raw JSON array, no prose, no markdown code fences. Each element must look like:
{"type":"expense"|"income","amount":number,"category":"best matching name from the existing categories, or a short new category name if truly nothing fits","note":"short 2-6 word description or merchant name","date":"YYYY-MM-DD"}
Rules:
- If a date isn't stated, use today's date.
- Amounts are plain numbers, no currency symbols, no commas.
- For bank statements/passbooks, "credit" or "deposit" entries are income, "debit" or "withdrawal" entries are expenses.
- If the image is unreadable or there is truly nothing to extract, respond with an empty array [].`;

  const content = [];
  if (imageBase64) content.push({ type: "image", source: { type: "base64", media_type: imageMediaType || "image/jpeg", data: imageBase64 } });
  content.push({ type: "text", text: text && text.trim() ? text : "Extract the transaction(s) from this image." });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-sonnet-5", max_tokens: 2000, system, messages: [{ role: "user", content }] }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return NextResponse.json({ error: "AI request failed (" + response.status + ")", detail: errText.slice(0, 300) }, { status: 502 });
    }
    const data = await response.json();
    const textOut = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const parsed = JSON.parse(stripToJson(textOut));
    const rows = (Array.isArray(parsed) ? parsed : [parsed]).map((r) => {
      const match = categories.find((c) => c.name.toLowerCase() === String(r.category || "").trim().toLowerCase());
      return {
        type: r.type === "income" ? "income" : "expense",
        amount: Number(r.amount) || 0,
        note: r.note || "",
        date: /^\d{4}-\d{2}-\d{2}$/.test(r.date) ? r.date : today,
        categoryId: match ? match.id : null,
        newCategoryName: match ? null : (r.category || "Other"),
      };
    }).filter((r) => r.amount > 0);
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("AI parse error", err);
    return NextResponse.json({ error: "Couldn't read that. Try again with clearer text or a clearer photo." }, { status: 500 });
  }
}
