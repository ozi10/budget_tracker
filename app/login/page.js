"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wallet, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.error) setError("Incorrect email or password.");
    else router.push("/");
  }

  return (
    <div style={{ 
      minHeight: "100dvh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "#F8F7F2", 
      fontFamily: "'Inter', -apple-system, sans-serif", 
      padding: "20px 16px" 
    }}>
      <form onSubmit={handleSubmit} 
        style={{ 
          width: "100%", 
          maxWidth: 380, 
          background: "#FFFFFF", 
          border: "1px solid #E5DEC9", 
          borderRadius: 28, 
          padding: "36px 28px",
          boxShadow: "0 12px 36px rgba(26,32,44,0.06)" 
        }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={20} color="#D97706" />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, color: "#1A202C", margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>Ledger</h1>
            <p style={{ color: "#64748B", fontSize: 13, margin: "2px 0 0" }}>Sign in to your private financial tracker</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Email</label>
            <input type="email" required placeholder="name@domain.com" value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "1px solid #E5DEC9", fontSize: 15, boxSizing: "border-box", outline: "none", background: "#F8F7F2", color: "#1A202C", transition: "all .2s" }} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Password</label>
            <input type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: "1px solid #E5DEC9", fontSize: 15, boxSizing: "border-box", outline: "none", background: "#F8F7F2", color: "#1A202C", transition: "all .2s" }} />
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.25)", borderRadius: 12, padding: "10px 14px", color: "#DC2626", fontSize: 13 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ width: "100%", padding: "14px", borderRadius: 16, border: "none", background: "#1E293B", color: "#FFFFFF", fontWeight: 700, fontSize: 15, cursor: "pointer", marginTop: 22, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 16px rgba(30,41,59,0.25)", transition: "all .2s" }}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={16} /></>}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, marginTop: 20, color: "#64748B" }}>
          Don't have an account? <Link href="/signup" style={{ color: "#D97706", fontWeight: 700, textDecoration: "none" }}>Create one</Link>
        </p>
      </form>
    </div>
  );
}

