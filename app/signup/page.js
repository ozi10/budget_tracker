"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INK = "#1C2536", PAPER = "#F6F1E4", CARD = "#FCFAF3", LINE = "#DCD0AE", GOLD = "#B8860B", RED = "#B33A3A";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong."); setLoading(false); return; }
    const signInRes = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (signInRes?.error) setError("Account created — please sign in.");
    else router.push("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: PAPER, fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 360, background: CARD, border: `1px solid ${LINE}`, borderRadius: 18, padding: 28 }}>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, color: INK, margin: "0 0 4px" }}>Create your account</h1>
        <p style={{ color: "#4A5268", fontSize: 13, margin: "0 0 22px" }}>Your own private ledger, synced everywhere</p>
        <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${LINE}`, marginBottom: 10, fontSize: 15, boxSizing: "border-box" }} />
        <input type="password" required minLength={8} placeholder="Password (min 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1.5px solid ${LINE}`, marginBottom: 16, fontSize: 15, boxSizing: "border-box" }} />
        {error && <div style={{ color: RED, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={loading}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: INK, color: PAPER, fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
          {loading ? "Creating…" : "Create account"}
        </button>
        <p style={{ textAlign: "center", fontSize: 13, marginTop: 16, color: "#4A5268" }}>
          Already have one? <Link href="/login" style={{ color: GOLD, fontWeight: 600 }}>Sign in</Link>
        </p>
      </form>
    </div>
  );
}
