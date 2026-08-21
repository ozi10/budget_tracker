"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Plus, Sparkles, Camera, X, Check, Trash2, ChevronLeft, ChevronRight,
  Wallet, ArrowUpRight, ArrowDownRight, Home as HomeIcon, List as ListIcon,
  PieChart as PieChartIcon, Tags, ShoppingCart, Utensils, Car, Zap, Film,
  HeartPulse, GraduationCap, Plane, Gift, Briefcase, Coffee, Smartphone,
  PawPrint, Wrench, TrendingUp, Loader2, FileText, AlertCircle, Pencil,
  ReceiptText, LogOut, Settings as SettingsIcon, Moon, Sun, DollarSign,
  Building2, Banknote, CreditCard, ArrowLeftRight, RefreshCw
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/* ---------------------------------- THEME ---------------------------------- */
const THEMES = {
  light: {
    INK: "#161616", 
    INK_SOFT: "#4A4A4A", 
    INK_MUTED: "#7A7A7A",
    PAPER: "#F2F1ED", 
    PAPER_DIM: "#E8E5DE",
    CARD: "#FFFFFF", 
    CARD_MUTED: "#FAF9F6",
    LINE: "#DDD9CE", 
    LINE_SUBTLE: "rgba(221,217,206,0.6)",
    RED: "#710014", 
    RED_BG: "rgba(113,0,20,0.08)",
    RED_SOFT: "#A85A6D",
    GREEN: "#2D7A5F", 
    GREEN_BG: "rgba(45,122,95,0.08)",
    GREEN_SOFT: "#5BA892",
    GOLD: "#B38F6F", 
    GOLD_SOFT: "#C9A885", 
    GOLD_BG: "rgba(179,143,111,0.1)",
    SHADOW: "rgba(22,22,22,0.05)",
    SHADOW_MD: "0 8px 24px rgba(22,22,22,0.06)",
    SHADOW_LG: "0 14px 34px rgba(22,22,22,0.09)",
    HEADER_BG: "#161616",
    HEADER_TEXT: "#F2F1ED",
    HEADER_MUTED: "rgba(242,241,237,0.7)"
  },
  dark: {
    INK: "#F2F1ED", 
    INK_SOFT: "#C9C7BE", 
    INK_MUTED: "#A5A19A",
    PAPER: "#161616", 
    PAPER_DIM: "#1F1F1F",
    CARD: "#252525", 
    CARD_MUTED: "#2D2D2D",
    LINE: "#3A3835", 
    LINE_SUBTLE: "rgba(58,56,53,0.7)",
    RED: "#D97077", 
    RED_BG: "rgba(217,112,119,0.12)",
    RED_SOFT: "#E8959B",
    GREEN: "#5BA892", 
    GREEN_BG: "rgba(91,168,146,0.12)",
    GREEN_SOFT: "#7DBCA8",
    GOLD: "#C9A885", 
    GOLD_SOFT: "#DCC0A0", 
    GOLD_BG: "rgba(201,168,133,0.12)",
    SHADOW: "rgba(0,0,0,0.4)",
    SHADOW_MD: "0 8px 24px rgba(0,0,0,0.35)",
    SHADOW_LG: "0 14px 34px rgba(0,0,0,0.45)",
    HEADER_BG: "#1A1A1A",
    HEADER_TEXT: "#F2F1ED",
    HEADER_MUTED: "#9A9894"
  }
};
const F_DISPLAY = "'Fraunces', Georgia, serif", F_BODY = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", F_MONO = "'IBM Plex Mono', ui-monospace, monospace";

const ICONS = {
  cart: ShoppingCart, food: Utensils, car: Car, bolt: Zap, film: Film, health: HeartPulse,
  grad: GraduationCap, plane: Plane, gift: Gift, briefcase: Briefcase, coffee: Coffee,
  phone: Smartphone, paw: PawPrint, wrench: Wrench, trend: TrendingUp, wallet: Wallet, home: HomeIcon,
};
const ICON_KEYS = Object.keys(ICONS);
const COLOR_PRESETS = ["#710014", "#2D7A5F", "#B38F6F", "#A85A6D", "#5BA892", "#1A4D3E", "#8B6B47", "#6B3A52", "#4A7C6B", "#161616", "#6B5B4F", "#9A6F5A", "#5A6B7A", "#7A5B6B", "#3D6B5A", "#8B7A5A"];

const ACCOUNT_TYPES = {
  bank:        { label: "Bank Account",  Icon: Building2,    color: "#1A4D3E" },
  cash:        { label: "Cash",          Icon: Banknote,     color: "#8B6B47" },
  credit_card: { label: "Credit Card",   Icon: CreditCard,   color: "#710014" },
  upi:         { label: "UPI / Wallet",  Icon: Smartphone,   color: "#5A6B7A" },
};

/* -------------------------------- HELPERS ---------------------------------- */
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const fmtAmount = (n) => inr.format(Math.round(Number(n) || 0));
const toDateInput = (iso) => new Date(iso).toISOString().slice(0, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
function evaluateExpression(expr) {
  const trimmed = String(expr).trim();
  if (!trimmed) return null;
  if (!/^[\d+\-*/.\s()]+$/.test(trimmed)) return null;
  try {
    const result = Function('"use strict"; return (' + trimmed + ')')();
    return typeof result === 'number' && result > 0 ? result : null;
  } catch { return null; }
}
function fmtDateHeader(iso) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yest = new Date(today); yest.setDate(yest.getDate() - 1);
  const cmp = new Date(iso + "T00:00:00");
  if (cmp.getTime() === today.getTime()) return "Today";
  if (cmp.getTime() === yest.getTime()) return "Yesterday";
  return cmp.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: cmp.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}
function monthLabel(d) { return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }); }
function isSameMonth(iso, ref) { const d = new Date(iso); return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth(); }
function groupByDate(transactions) {
  const byDate = {};
  for (const t of transactions) { const k = toDateInput(t.date); if (!byDate[k]) byDate[k] = []; byDate[k].push(t); }
  return Object.entries(byDate).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}
async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(",")[1]);
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}
async function api(path, opts = {}) {
  const headers = { "content-type": "application/json", ...(opts.headers || {}) };
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/* ------------------------------ SMALL UI -------------------------------- */
function IconStamp({ icon, color, size = 42, T = THEMES.light }) {
  const Ic = ICONS[icon] || Wallet;
  return (
    <div style={{ 
      width: size, 
      height: size, 
      borderRadius: Math.round(size * 0.38), 
      flexShrink: 0, 
      background: color + "18", 
      border: `1px solid ${color}35`, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      boxShadow: `0 2px 8px ${color}15`
    }}>
      <Ic size={Math.round(size * 0.48)} color={color} strokeWidth={2.2} />
    </div>
  );
}

function SegmentedControl({ options, value, onChange, accent, T = THEMES.light }) {
  return (
    <div style={{ 
      display: "flex", 
      background: T.PAPER_DIM, 
      borderRadius: 16, 
      padding: 4, 
      border: `1px solid ${T.LINE}`,
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.04)"
    }}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          style={{ 
            flex: 1, 
            padding: "9px 12px", 
            borderRadius: 12, 
            border: "none", 
            cursor: "pointer", 
            fontFamily: F_BODY, 
            fontWeight: 600, 
            fontSize: 13, 
            background: value === opt.value ? T.CARD : "transparent", 
            color: value === opt.value ? (accent || T.INK) : T.INK_SOFT, 
            boxShadow: value === opt.value ? `0 2px 8px ${T.SHADOW}` : "none", 
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Sheet({ title, onClose, children, footer, T = THEMES.light }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", animation: "fadeIn .2s ease" }} />
      <div style={{ 
        position: "relative", 
        background: T.CARD, 
        borderRadius: "28px 28px 0 0", 
        maxHeight: "90vh", 
        maxWidth: 480,
        width: "100%",
        margin: "0 auto",
        display: "flex", 
        flexDirection: "column", 
        animation: "slideUp .24s cubic-bezier(.16,1,.3,1)", 
        boxShadow: T.SHADOW_LG,
        border: `1px solid ${T.LINE}`,
        borderBottom: "none",
        paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))"
      }}>
        {/* Grab indicator */}
        <div style={{ width: 38, height: 4.5, borderRadius: 3, background: T.LINE, margin: "10px auto 4px", opacity: 0.8 }} />
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 14px", borderBottom: `1px solid ${T.LINE}` }}>
          <span style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 20, color: T.INK }}>{title}</span>
          <button onClick={onClose} aria-label="Close" style={{ background: T.PAPER_DIM, border: `1px solid ${T.LINE}`, borderRadius: "50%", width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .18s" }}><X size={16} color={T.INK_SOFT} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 20, flex: 1, WebkitOverflowScrolling: "touch" }}>{children}</div>
        {footer && <div style={{ padding: "14px 20px", borderTop: `1px solid ${T.LINE}`, background: T.PAPER_DIM, borderRadius: "0 0 28px 28px" }}>{footer}</div>}
      </div>
    </div>
  );
}

function PrimaryButton({ children, onClick, disabled, color, style, T = THEMES.light }) {
  const defaultColor = color || T.INK;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ 
        width: "100%", 
        padding: "14px 18px", 
        borderRadius: 16, 
        border: "none", 
        background: disabled ? T.LINE : defaultColor, 
        color: disabled ? T.INK_SOFT : "#FFFFFF", 
        fontFamily: F_BODY, 
        fontWeight: 700, 
        fontSize: 15, 
        cursor: disabled ? "not-allowed" : "pointer", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        gap: 8, 
        letterSpacing: 0.2, 
        transition: "background-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease", 
        boxShadow: disabled ? "none" : `0 6px 16px ${defaultColor}30`, 
        transform: "translateZ(0)",
        WebkitTapHighlightColor: "transparent",
        ...style 
      }}>
      {children}
    </button>
  );
}

function Field({ label, children, T = THEMES.light }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: F_BODY, fontSize: 11, fontWeight: 700, color: T.INK_SOFT, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
      {children}
    </div>
  );
}

const getInputStyle = (T) => ({ 
  width: "100%", 
  padding: "12px 16px", 
  borderRadius: 14, 
  border: `1px solid ${T.LINE}`, 
  background: T.PAPER, 
  fontFamily: F_BODY, 
  fontSize: 15, 
  color: T.INK, 
  outline: "none", 
  boxSizing: "border-box", 
  transition: "all .2s ease" 
});

function TransactionRow({ t, category, account, onClick, isLast, T = THEMES.light }) {
  const isExpense = t.type === "expense";
  return (
    <button onClick={onClick} 
      style={{ 
        width: "100%", 
        display: "flex", 
        alignItems: "center", 
        gap: 14, 
        padding: "12px 6px", 
        background: "transparent", 
        border: "none", 
        borderBottom: isLast ? "none" : `1px solid ${T.LINE_SUBTLE}`, 
        cursor: "pointer", 
        textAlign: "left", 
        transition: "background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease", 
        willChange: "transform",
        transform: "translateZ(0)"
      }}>
      <IconStamp icon={category?.icon || "wallet"} color={category?.color || "#64748B"} size={42} T={T} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F_BODY, fontWeight: 600, fontSize: 14.5, color: T.INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.note || category?.name || "Transaction"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: T.INK_SOFT }}>{category?.name || "Other"}</span>
          {account && (
            <span style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 6, background: T.PAPER_DIM, color: T.INK_SOFT, fontWeight: 600, border: `1px solid ${T.LINE}` }}>
              {account.type === "credit_card" ? "💳" : account.type === "cash" ? "💵" : account.type === "upi" ? "📱" : "🏦"} {account.name}
            </span>
          )}
          {t.source && t.source !== "manual" && (
            <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 6, background: T.GOLD_BG, color: T.GOLD, fontWeight: 600 }}>AI</span>
          )}
        </div>
      </div>
      <div style={{ fontFamily: F_MONO, fontWeight: 600, fontSize: 15, color: isExpense ? T.RED : T.GREEN, flexShrink: 0, letterSpacing: -0.2 }}>
        {isExpense ? "−" : "+"}{fmtAmount(t.amount)}
      </div>
    </button>
  );
}

function EmptyState({ icon: Icon, title, sub, T = THEMES.light }) {
  return (
    <div style={{ textAlign: "center", padding: "36px 20px", color: T.INK_SOFT }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: T.PAPER_DIM, border: `1px solid ${T.LINE}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: `0 4px 12px ${T.SHADOW}` }}>
        <Icon size={24} color={T.INK_SOFT} />
      </div>
      <div style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 17, color: T.INK, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: F_BODY, fontSize: 13, maxWidth: 240, margin: "0 auto", lineHeight: 1.5, color: T.INK_SOFT }}>{sub}</div>
    </div>
  );
}

function SectionTitle({ children, action, onAction, T = THEMES.light }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12 }}>
      <div style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 17.5, color: T.INK }}>{children}</div>
      {action && onAction && (
        <button onClick={onAction} style={{ background: "none", border: "none", color: T.GOLD, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "2px 4px" }}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ============================== MAIN APP ================================ */
export default function BudgetApp() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('budget-theme');
      const preferredTheme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(preferredTheme);
      setMounted(true);
    }
  }, []);
  const [aiApiKey, setAiApiKey] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('budget-ai-key') || "";
    return "";
  });
  const T = THEMES[theme] || THEMES.light;
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [screen, setScreen] = useState("home");
  const [txFilter, setTxFilter] = useState("all");
  const [fabOpen, setFabOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [reportMonth, setReportMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('budget-theme', newTheme);
  };

  useEffect(() => { localStorage.setItem('budget-ai-key', aiApiKey); }, [aiApiKey]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.style.backgroundColor = T.PAPER;
      document.body.style.backgroundColor = T.PAPER;
      
      let metaTheme = document.querySelector('meta[name="theme-color"]');
      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
      }
      metaTheme.setAttribute('content', T.HEADER_BG);
    }
  }, [theme, T]);

  useEffect(() => {
    (async () => {
      try {
        const [cats, txs, accs, trs] = await Promise.all([
          api("/api/categories"),
          api("/api/transactions"),
          api("/api/accounts"),
          api("/api/transfers"),
        ]);
        setCategories(cats); setTransactions(txs);
        setAccounts(accs); setTransfers(trs);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const catById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const totals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of transactions) { if (t.type === "income") income += Number(t.amount); else expense += Number(t.amount); }
    return { income, expense, balance: income - expense };
  }, [transactions]);
  const thisMonth = useMemo(() => new Date(), []);
  const monthTotals = useMemo(() => {
    let income = 0, expense = 0;
    for (const t of transactions) if (isSameMonth(t.date, thisMonth)) { if (t.type === "income") income += Number(t.amount); else expense += Number(t.amount); }
    return { income, expense };
  }, [transactions, thisMonth]);

  async function saveTransaction(fields, id) {
    const tx = id ? await api(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(fields) }) : await api("/api/transactions", { method: "POST", body: JSON.stringify(fields) });
    setTransactions((prev) => (id ? prev.map((t) => (t.id === id ? tx : t)) : [tx, ...prev]));
    return tx;
  }
  async function removeTransaction(id) { await api(`/api/transactions/${id}`, { method: "DELETE" }); setTransactions((prev) => prev.filter((t) => t.id !== id)); }
  async function saveCategory(fields, id) {
    const cat = id ? await api(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(fields) }) : await api("/api/categories", { method: "POST", body: JSON.stringify(fields) });
    setCategories((prev) => (id ? prev.map((c) => (c.id === id ? cat : c)) : [...prev, cat]));
    return cat;
  }
  async function removeCategory(id) {
    await api(`/api/categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
    const cats = await api("/api/categories");
    const txs = await api("/api/transactions");
    setCategories(cats); setTransactions(txs);
  }
  function openAddTx() { setEditingTx({ type: "expense", amount: "", categoryId: categories.find((c) => c.type !== "income")?.id || categories[0]?.id, accountId: null, note: "", date: todayISO() }); setFabOpen(false); }

  // Recompute account balances from local state (avoids re-fetching)
  const accountsWithBalance = useMemo(() => {
    return accounts.map((acc) => {
      let bal = Number(acc.openingBalance || 0);
      for (const tx of transactions) {
        if (tx.accountId !== acc.id) continue;
        if (tx.type === "income") bal += Number(tx.amount);
        else bal -= Number(tx.amount);
      }
      for (const tr of transfers) {
        if (tr.toAccountId === acc.id) bal += Number(tr.amount);
        if (tr.fromAccountId === acc.id) bal -= Number(tr.amount);
      }
      return { ...acc, balance: Math.round(bal * 100) / 100 };
    });
  }, [accounts, transactions, transfers]);

  async function saveAccount(fields, id) {
    const acc = id
      ? await api(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(fields) })
      : await api("/api/accounts", { method: "POST", body: JSON.stringify(fields) });
    setAccounts((prev) => (id ? prev.map((a) => (a.id === id ? acc : a)) : [...prev, acc]));
    return acc;
  }
  async function removeAccount(id) {
    await api(`/api/accounts/${id}`, { method: "DELETE" });
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }
  async function saveTransfer(fields) {
    const tr = await api("/api/transfers", { method: "POST", body: JSON.stringify(fields) });
    setTransfers((prev) => [tr, ...prev]);
    return tr;
  }
  async function removeTransfer(id) {
    await api(`/api/transfers/${id}`, { method: "DELETE" });
    setTransfers((prev) => prev.filter((t) => t.id !== id));
  }

  if (loading || !mounted) {
    return (
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: T.PAPER, color: T.INK_SOFT, fontFamily: F_BODY, gap: 12 }}>
        <Loader2 size={28} color={T.GOLD} className="animate-spin" />
        <span style={{ fontSize: 14, fontWeight: 500 }}>Loading your ledger…</span>
      </div>
    );
  }

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100dvh", 
      maxWidth: 480, 
      margin: "0 auto", 
      background: T.PAPER, 
      fontFamily: F_BODY, 
      overflow: "hidden", 
      color: T.INK,
      position: "relative"
    }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.88); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 0 0 rgba(217,119,6,0.35); } 50% { box-shadow: 0 0 0 8px rgba(217,119,6,0); } }
        input:focus, textarea:focus, select:focus { border-color: ${T.GOLD} !important; outline: none; box-shadow: 0 0 0 3px ${T.GOLD}20 !important; }
      `}</style>

      <Header totals={totals} onSettings={() => setShowSettings(true)} toggleTheme={toggleTheme} currentTheme={theme} T={T} />

      <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", padding: "0 16px 28px", minHeight: 0 }}>
        {screen === "home" && (
          <HomeScreen 
            monthTotals={monthTotals} 
            transactions={transactions} 
            categories={categories}
            accounts={accountsWithBalance}
            accountsById={Object.fromEntries(accountsWithBalance.map((a) => [a.id, a]))}
            catById={catById} 
            onSeeAll={(f) => { setTxFilter(f || "all"); setScreen("transactions"); }} 
            onOpenTx={(t) => setEditingTx(t)} 
            onEditCat={(c) => setEditingCat(c)}
            onGoCategories={() => setScreen("categories")}
            onGoWallets={() => setScreen("wallets")}
            T={T} 
          />
        )}
        {screen === "transactions" && <TransactionsScreen transactions={transactions} catById={catById} accountsById={Object.fromEntries(accountsWithBalance.map((a) => [a.id, a]))} filter={txFilter} setFilter={setTxFilter} onOpenTx={(t) => setEditingTx(t)} T={T} />}
        {screen === "reports" && <ReportsScreen transactions={transactions} categories={categories} catById={catById} month={reportMonth} setMonth={setReportMonth} T={T} />}
        {screen === "categories" && <CategoriesScreen categories={categories} transactions={transactions} onAdd={() => setEditingCat({ name: "", icon: "wallet", color: COLOR_PRESETS[0], type: "expense", monthlyBudget: null })} onEdit={(c) => setEditingCat(c)} onDelete={removeCategory} T={T} />}
        {screen === "wallets" && (
          <AccountsScreen
            accounts={accountsWithBalance}
            transfers={transfers}
            transactions={transactions}
            catById={catById}
            onAdd={() => setEditingAccount({ name: "", type: "bank", openingBalance: "", color: ACCOUNT_TYPES.bank.color, creditLimit: "", billingDay: "", dueDay: "" })}
            onEdit={(a) => setEditingAccount(a)}
            onDelete={removeAccount}
            onTransfer={() => setShowTransfer(true)}
            onDeleteTransfer={removeTransfer}
            T={T}
          />
        )}
      </main>

      {/* Floating Action Button with Backdrop */}
      <div style={{ 
        position: "fixed", 
        right: "max(16px, calc((100vw - 480px) / 2 + 16px))", 
        bottom: "calc(max(12px, env(safe-area-inset-bottom, 0px)) + 64px)", 
        zIndex: 50, 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "flex-end", 
        gap: 10 
      }}>
        {fabOpen && (
          <>
            <FabAction label="AI scan" icon={Sparkles} color={T.GOLD} onClick={() => { setShowAI(true); setFabOpen(false); }} glow T={T} />
            <FabAction label="Add manually" icon={Plus} color="#161616" onClick={openAddTx} T={T} />
          </>
        )}
        <button onClick={() => setFabOpen((v) => !v)} aria-label="Add transaction" 
          style={{ 
            width: 58, 
            height: 58, 
            borderRadius: 20, 
            border: `1px solid ${T.GOLD}40`, 
            background: T.GOLD, 
            color: "#FFFFFF", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            cursor: "pointer", 
            boxShadow: `0 8px 20px ${T.GOLD}40`, 
            transform: fabOpen ? "rotate(45deg) scale(0.95)" : "rotate(0) scale(1)", 
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)" 
          }}>
          <Plus size={28} strokeWidth={2.5} />
        </button>
      </div>
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 45, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(2px)", WebkitBackdropFilter: "blur(2px)" }} />}

      <TabBar screen={screen} setScreen={setScreen} T={T} />

      {editingTx && <TxModal tx={editingTx} categories={categories} accounts={accountsWithBalance} onClose={() => setEditingTx(null)} onSave={async (fields, id) => { await saveTransaction(fields, id); setEditingTx(null); }} onDelete={async (id) => { await removeTransaction(id); setEditingTx(null); }} T={T} />}
      {showAI && <AIModal categories={categories} onClose={() => setShowAI(false)} onCreateCategory={saveCategory} onImport={async (txs) => { for (const t of txs) await saveTransaction(t); setShowAI(false); }} apiKey={aiApiKey} T={T} />}
      {editingCat && <CategoryModal cat={editingCat} onClose={() => setEditingCat(null)} onSave={async (fields, id) => { await saveCategory(fields, id); setEditingCat(null); }} onDelete={async (id) => { await removeCategory(id); setEditingCat(null); }} T={T} />}
      {showSettings && <SettingsModal email={session?.user?.email} onClose={() => setShowSettings(false)} toggleTheme={toggleTheme} currentTheme={theme} T={T} apiKey={aiApiKey} onApiKeyChange={setAiApiKey} />}
      {editingAccount && <AccountModal account={editingAccount} onClose={() => setEditingAccount(null)} onSave={async (fields, id) => { await saveAccount(fields, id); setEditingAccount(null); }} onDelete={async (id) => { await removeAccount(id); setEditingAccount(null); }} T={T} />}
      {showTransfer && <TransferModal accounts={accountsWithBalance} onClose={() => setShowTransfer(false)} onSave={async (fields) => { await saveTransfer(fields); setShowTransfer(false); }} T={T} />}
    </div>
  );
}

function Header({ totals, onSettings, toggleTheme, currentTheme, T }) {
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return (
    <div style={{ 
      paddingTop: "max(14px, env(safe-area-inset-top, 0px))", 
      paddingLeft: 18, 
      paddingRight: 18, 
      paddingBottom: 16, 
      flexShrink: 0, 
      background: T.HEADER_BG, 
      color: T.HEADER_TEXT, 
      borderBottom: `1px solid ${T.LINE}`, 
      boxShadow: T.SHADOW_MD 
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: T.GOLD + "25", border: `1px solid ${T.GOLD}50`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={18} color={T.GOLD_SOFT} />
          </div>
          <div>
            <div style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 18, color: T.HEADER_TEXT, letterSpacing: -0.3 }}>Ledger</div>
            <div style={{ fontSize: 11, color: T.HEADER_MUTED, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 600 }}>{dateStr}</div>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={toggleTheme} aria-label="Toggle Theme" 
            style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}>
            {currentTheme === 'light' ? <Moon size={16} color={T.HEADER_TEXT} /> : <Sun size={16} color={T.GOLD_SOFT} />}
          </button>
          <button onClick={onSettings} aria-label="Settings" 
            style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}>
            <SettingsIcon size={16} color={T.HEADER_TEXT} />
          </button>
        </div>
      </div>

      {/* Balance Card Section */}
      <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 18, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: 11, color: T.HEADER_MUTED, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>Net Balance</div>
          <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 28, marginTop: 4, color: totals.balance < 0 ? T.RED_SOFT : T.HEADER_TEXT, letterSpacing: -0.5 }}>
            {fmtAmount(totals.balance)}
          </div>
        </div>
        <div style={{ padding: "4px 10px", borderRadius: 20, background: totals.balance >= 0 ? T.GREEN_BG : T.RED_BG, border: `1px solid ${totals.balance >= 0 ? T.GREEN : T.RED}40`, display: "flex", alignItems: "center", gap: 4 }}>
          {totals.balance >= 0 ? <ArrowUpRight size={13} color={T.GREEN_SOFT} /> : <ArrowDownRight size={13} color={T.RED_SOFT} />}
          <span style={{ fontSize: 11, fontWeight: 700, color: totals.balance >= 0 ? T.GREEN_SOFT : T.RED_SOFT, fontFamily: F_MONO }}>
            {totals.balance >= 0 ? "Positive" : "Deficit"}
          </span>
        </div>
      </div>
    </div>
  );
}

function TabBar({ screen, setScreen, T }) {
  const tabs = [
    { key: "home", label: "Home", icon: HomeIcon }, 
    { key: "transactions", label: "Ledger", icon: ListIcon }, 
    { key: "wallets", label: "Wallets", icon: Wallet },
    { key: "reports", label: "Reports", icon: PieChartIcon }, 
    { key: "categories", label: "Tags", icon: Tags }
  ];
  return (
    <div style={{ 
      display: "flex", 
      borderTop: `1px solid ${T.LINE}`, 
      background: T.CARD, 
      paddingTop: 6,
      paddingLeft: 8,
      paddingRight: 8,
      paddingBottom: "max(10px, env(safe-area-inset-bottom, 0px))", 
      boxShadow: T.SHADOW_MD,
      flexShrink: 0,
      zIndex: 40
    }}>
      {tabs.map((t) => {
        const active = screen === t.key, Ic = t.icon;
        return (
          <button key={t.key} onClick={() => setScreen(t.key)} 
            style={{ 
              flex: 1, 
              background: active ? T.GOLD_BG : "transparent", 
              border: "none", 
              borderRadius: 12,
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              gap: 3, 
              padding: "7px 2px", 
              cursor: "pointer", 
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", 
              opacity: active ? 1 : 0.55 
            }}>
            <Ic size={19} color={active ? T.GOLD : T.INK_SOFT} strokeWidth={active ? 2.5 : 2} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? (T.INK || T.GOLD) : T.INK_SOFT }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}


function FabAction({ label, icon: Icon, color, onClick, glow, T = THEMES.light }) {
  return (
    <button onClick={onClick} 
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 10, 
        background: "none", 
        border: "none", 
        cursor: "pointer", 
        animation: "none",
        willChange: "transform",
        transform: "translateZ(0)"
      }}>
      <span style={{ 
        background: "#161616", 
        color: "#FFFFFF", 
        fontSize: 12.5, 
        fontWeight: 600, 
        padding: "7px 12px", 
        borderRadius: 12, 
        whiteSpace: "nowrap", 
        boxShadow: T.SHADOW_MD,
        border: `1px solid #161616`
      }}>
        {label}
      </span>
      <span style={{ 
        width: 46, 
        height: 46, 
        borderRadius: 16, 
        background: color, 
        color: "#FFFFFF", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        boxShadow: `0 6px 16px ${color}35`, 
        animation: glow ? "glow 1.8s infinite" : "none" 
      }}>
        <Icon size={20} strokeWidth={2.2} />
      </span>
    </button>
  );
}

function HomeScreen({ monthTotals, transactions, categories, accounts = [], accountsById = {}, catById, onSeeAll, onOpenTx, onEditCat, onGoCategories, onGoWallets, T = THEMES.light }) {
  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);
  const thisMonth = useMemo(() => new Date(), []);

  // Category spending calculation for current month
  const categorySpendMap = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      if (t.type === "expense" && isSameMonth(t.date, thisMonth)) {
        map[t.categoryId] = (map[t.categoryId] || 0) + Number(t.amount);
      }
    }
    return map;
  }, [transactions, thisMonth]);

  const budgetedCategories = useMemo(() => {
    return categories
      .filter((c) => c.monthlyBudget && Number(c.monthlyBudget) > 0)
      .map((c) => {
        const spent = categorySpendMap[c.id] || 0;
        const budget = Number(c.monthlyBudget);
        const pct = Math.round((spent / budget) * 100);
        const isOver = spent > budget;
        return { ...c, spent, budget, pct, isOver };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [categories, categorySpendMap]);

  const budgetSummary = useMemo(() => {
    let totalBudget = 0, totalSpent = 0;
    for (const b of budgetedCategories) {
      totalBudget += b.budget;
      totalSpent += b.spent;
    }
    const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
    return { totalBudget, totalSpent, overallPct };
  }, [budgetedCategories]);

  const pieData = useMemo(() => {
    const sums = {};
    for (const t of transactions) { 
      if (t.type !== "expense" || !isSameMonth(t.date, thisMonth)) continue; 
      sums[t.categoryId] = (sums[t.categoryId] || 0) + Number(t.amount); 
    }
    return Object.entries(sums)
      .map(([id, value]) => ({ id, value, name: catById[id]?.name || "Other", color: catById[id]?.color || "#94A3B8" }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, catById]);

  return (
    <div>
      {/* Quick Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        <button onClick={() => onSeeAll("income")} 
          style={{ 
            textAlign: "left", 
            background: T.CARD, 
            border: `1px solid ${T.LINE}`, 
            borderRadius: 22, 
            padding: "16px 16px", 
            cursor: "pointer", 
            transition: "all .2s ease", 
            boxShadow: T.SHADOW_MD 
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.GREEN }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: T.GREEN_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowUpRight size={15} color={T.GREEN} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Income</span>
          </div>
          <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 19, color: T.INK, marginTop: 10, letterSpacing: -0.3 }}>
            {fmtAmount(monthTotals.income)}
          </div>
        </button>

        <button onClick={() => onSeeAll("expense")} 
          style={{ 
            textAlign: "left", 
            background: T.CARD, 
            border: `1px solid ${T.LINE}`, 
            borderRadius: 22, 
            padding: "16px 16px", 
            cursor: "pointer", 
            transition: "all .2s ease", 
            boxShadow: T.SHADOW_MD 
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.RED }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: T.RED_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowDownRight size={15} color={T.RED} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Expenses</span>
          </div>
          <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 19, color: T.INK, marginTop: 10, letterSpacing: -0.3 }}>
            {fmtAmount(monthTotals.expense)}
          </div>
        </button>
      </div>

      {/* Spending Breakdown Donut Card */}
      <SectionTitle T={T}>Monthly Spending by Category</SectionTitle>
      {pieData.length === 0 ? (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "24px 16px", boxShadow: T.SHADOW_MD }}>
          <EmptyState icon={PieChartIcon} title="No spending logged" sub="Add expenses to see your dynamic category distribution." T={T} />
        </div>
      ) : (
        <div style={{ 
          background: T.CARD, 
          border: `1px solid ${T.LINE}`, 
          borderRadius: 22, 
          padding: "16px 18px", 
          display: "flex", 
          alignItems: "center", 
          gap: 16, 
          boxShadow: T.SHADOW_MD 
        }}>
          <div style={{ width: 104, height: 104, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={50} strokeWidth={2} stroke={T.CARD}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            {pieData.slice(0, 4).map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: e.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: T.INK_SOFT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12.5, fontWeight: 500 }}>{e.name}</span>
                <span style={{ fontFamily: F_MONO, color: T.INK, fontWeight: 600, fontSize: 12.5 }}>{fmtAmount(e.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wallets & Accounts Quick Overview */}
      <SectionTitle action={accounts.length > 0 ? "All Accounts →" : "Add Wallet +"} onAction={onGoWallets} T={T}>
        Wallets & Accounts
      </SectionTitle>
      {accounts.length === 0 ? (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "18px 16px", boxShadow: T.SHADOW_MD, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: T.GOLD_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wallet size={20} color={T.GOLD} />
            </div>
            <div>
              <div style={{ fontFamily: F_BODY, fontWeight: 700, fontSize: 13.5, color: T.INK }}>Track your bank, cash & cards</div>
              <div style={{ fontSize: 11.5, color: T.INK_SOFT }}>See real-time balances and credit card limits</div>
            </div>
          </div>
          <button onClick={onGoWallets} style={{ padding: "7px 12px", borderRadius: 10, border: `1px solid ${T.GOLD}40`, background: T.GOLD_BG, color: T.GOLD, fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            Add
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: accounts.length === 1 ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
          {accounts.slice(0, 4).map((acc) => {
            const typeInfo = ACCOUNT_TYPES[acc.type] || ACCOUNT_TYPES.bank;
            const TypeIcon = typeInfo.Icon;
            const isCC = acc.type === "credit_card";
            return (
              <div key={acc.id} onClick={onGoWallets} style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 18, padding: "12px 14px", boxShadow: T.SHADOW_MD, cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: acc.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TypeIcon size={15} color={acc.color} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: T.INK_SOFT, textTransform: "uppercase", letterSpacing: 0.4 }}>
                    {typeInfo.label.split(" ")[0]}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{acc.name}</div>
                  <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 14, color: isCC ? (acc.balance > 0 ? T.RED : T.INK) : (acc.balance < 0 ? T.RED : T.INK), marginTop: 2 }}>
                    {fmtAmount(acc.balance)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Budgets & Visual Progress Bars Section */}
      <SectionTitle action={budgetedCategories.length > 0 ? "Manage →" : "Set Budgets +"} onAction={onGoCategories} T={T}>
        Category Budgets
      </SectionTitle>

      {budgetedCategories.length === 0 ? (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "20px 18px", boxShadow: T.SHADOW_MD, textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: T.GOLD_BG, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
            <Tags size={20} color={T.GOLD} />
          </div>
          <div style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 16, color: T.INK }}>No category budgets set</div>
          <p style={{ fontSize: 12.5, color: T.INK_SOFT, margin: "4px auto 14px", maxWidth: 280, lineHeight: 1.4 }}>
            Set monthly targets on your categories to monitor real-time spending limits.
          </p>
          <button onClick={onGoCategories} style={{ padding: "8px 16px", borderRadius: 12, border: `1px solid ${T.GOLD}40`, background: T.GOLD_BG, color: T.GOLD, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Set Category Budgets
          </button>
        </div>
      ) : (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "16px 18px", boxShadow: T.SHADOW_MD }}>
          {/* Overall budget health summary */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${T.LINE_SUBTLE}` }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.INK_SOFT, textTransform: "uppercase", letterSpacing: 0.5 }}>Total Budget Spent</span>
              <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 16, color: T.INK, marginTop: 2 }}>
                {fmtAmount(budgetSummary.totalSpent)} <span style={{ color: T.INK_SOFT, fontSize: 13, fontWeight: 500 }}>of {fmtAmount(budgetSummary.totalBudget)}</span>
              </div>
            </div>
            <span style={{ 
              fontFamily: F_MONO, 
              fontWeight: 700, 
              fontSize: 12.5, 
              padding: "3px 8px", 
              borderRadius: 8, 
              background: budgetSummary.overallPct >= 100 ? T.RED_BG : budgetSummary.overallPct >= 75 ? T.GOLD_BG : T.GREEN_BG, 
              color: budgetSummary.overallPct >= 100 ? T.RED : budgetSummary.overallPct >= 75 ? T.GOLD : T.GREEN 
            }}>
              {budgetSummary.overallPct}% Used
            </span>
          </div>

          {/* Individual Category Progress Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {budgetedCategories.map((b) => {
              const statusColor = b.isOver ? T.RED : b.pct >= 75 ? T.GOLD : T.GREEN;
              const barFill = Math.min(b.pct, 100);
              return (
                <div key={b.id} onClick={() => onEditCat(b)} style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <IconStamp icon={b.icon} color={b.color} size={28} T={T} />
                      <span style={{ fontFamily: F_BODY, fontWeight: 600, fontSize: 13.5, color: T.INK }}>{b.name}</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontFamily: F_MONO, fontWeight: 600, fontSize: 13, color: T.INK }}>
                        {fmtAmount(b.spent)} <span style={{ color: T.INK_SOFT, fontSize: 11.5, fontWeight: 400 }}>/ {fmtAmount(b.budget)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Progress Track */}
                  <div style={{ height: 8, borderRadius: 8, background: T.PAPER_DIM, overflow: "hidden", position: "relative" }}>
                    <div 
                      style={{ 
                        width: `${barFill}%`, 
                        height: "100%", 
                        borderRadius: 8, 
                        background: statusColor, 
                        transition: "width 0.4s ease" 
                      }} 
                    />
                  </div>

                  {/* Status Indicator */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: T.INK_SOFT }}>
                      {b.isOver ? (
                        <span style={{ color: T.RED, fontWeight: 700 }}>⚠️ Exceeded by {fmtAmount(b.spent - b.budget)}</span>
                      ) : (
                        <span>{fmtAmount(b.budget - b.spent)} remaining</span>
                      )}
                    </span>
                    <span style={{ fontSize: 11, fontFamily: F_MONO, fontWeight: 700, color: statusColor }}>
                      {b.pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity Card */}
      <SectionTitle action={transactions.length > 0 ? "View All →" : null} onAction={() => onSeeAll("all")} T={T}>
        Recent Activity
      </SectionTitle>
      {recent.length === 0 ? (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "20px", boxShadow: T.SHADOW_MD }}>
          <EmptyState icon={ReceiptText} title="No transactions yet" sub="Tap the + button to record an expense or scan a receipt with AI." T={T} />
        </div>
      ) : (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "6px 14px", boxShadow: T.SHADOW_MD }}>
          {recent.map((t, idx) => (
            <TransactionRow key={t.id} t={t} category={catById[t.categoryId]} account={accountsById[t.accountId]} isLast={idx === recent.length - 1} onClick={() => onOpenTx(t)} T={T} />
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionsScreen({ transactions, catById, accountsById = {}, filter, setFilter, onOpenTx, T = THEMES.light }) {
  const filtered = useMemo(() => transactions.filter((t) => filter === "all" || t.type === filter), [transactions, filter]);
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const total = useMemo(() => filtered.reduce((s, t) => s + (t.type === "expense" ? -1 : 1) * Number(t.amount), 0), [filtered]);
  return (
    <div>
      <div style={{ marginTop: 16 }}>
        <SegmentedControl value={filter} onChange={setFilter} options={[{ value: "all", label: "All Transactions" }, { value: "expense", label: "Expenses" }, { value: "income", label: "Income" }]} T={T} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "16px 4px 6px" }}>
        <span style={{ fontSize: 12, color: T.INK_SOFT, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{filtered.length} entries</span>
        <span style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 16, color: total < 0 ? T.RED : T.GREEN }}>{fmtAmount(total)}</span>
      </div>
      {grouped.length === 0 ? (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: 20, marginTop: 8, boxShadow: T.SHADOW_MD }}>
          <EmptyState icon={ReceiptText} title="No entries found" sub="Transactions you record will appear here grouped chronologically." T={T} />
        </div>
      ) : grouped.map(([date, txs]) => (
        <div key={date} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: T.INK_SOFT, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6, marginLeft: 6 }}>
            {fmtDateHeader(date)}
          </div>
          <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "4px 14px", boxShadow: T.SHADOW_MD }}>
            {txs.map((t, idx) => (
              <TransactionRow key={t.id} t={t} category={catById[t.categoryId]} account={accountsById[t.accountId]} isLast={idx === txs.length - 1} onClick={() => onOpenTx(t)} T={T} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsScreen({ transactions, categories, catById, month, setMonth, T = THEMES.light }) {
  const monthTx = useMemo(() => transactions.filter((t) => isSameMonth(t.date, month)), [transactions, month]);
  const mIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const mExpense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const barData = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(month); d.setMonth(d.getMonth() - i);
      let inc = 0, exp = 0;
      for (const t of transactions) if (isSameMonth(t.date, d)) { if (t.type === "income") inc += Number(t.amount); else exp += Number(t.amount); }
      arr.push({ label: d.toLocaleDateString("en-IN", { month: "short" }), Income: inc, Expense: exp });
    }
    return arr;
  }, [transactions, month]);
  const pieData = useMemo(() => {
    const sums = {};
    for (const t of monthTx) { 
      if (t.type !== "expense") continue; 
      sums[t.categoryId] = (sums[t.categoryId] || 0) + Number(t.amount); 
    }
    return Object.entries(sums)
      .map(([id, value]) => ({ 
        id, 
        value, 
        name: catById[id]?.name || "Other", 
        color: catById[id]?.color || "#94A3B8",
        budget: catById[id]?.monthlyBudget ? Number(catById[id].monthlyBudget) : null
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthTx, catById]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, background: T.CARD, padding: "8px 14px", borderRadius: 18, border: `1px solid ${T.LINE}`, boxShadow: T.SHADOW_MD }}>
        <button onClick={() => { const d = new Date(month); d.setMonth(d.getMonth() - 1); setMonth(d); }} style={{ ...navBtnStyle, border: `1px solid ${T.LINE}`, background: T.PAPER_DIM }}><ChevronLeft size={16} color={T.INK} /></button>
        <span style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 16, color: T.INK }}>{monthLabel(month)}</span>
        <button onClick={() => { const d = new Date(month); d.setMonth(d.getMonth() + 1); setMonth(d); }} style={{ ...navBtnStyle, border: `1px solid ${T.LINE}`, background: T.PAPER_DIM }}><ChevronRight size={16} color={T.INK} /></button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
        <StatChip label="Income" value={mIncome} color={T.GREEN} T={T} />
        <StatChip label="Expense" value={mExpense} color={T.RED} T={T} />
        <StatChip label="Net" value={mIncome - mExpense} color={mIncome - mExpense >= 0 ? T.GREEN : T.RED} T={T} />
      </div>

      <SectionTitle T={T}>Cashflow Trend</SectionTitle>
      <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "16px 10px 8px", height: 190, boxShadow: T.SHADOW_MD }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} barGap={4}>
            <CartesianGrid vertical={false} stroke={T.LINE} strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.INK_SOFT, fontFamily: F_BODY }} axisLine={{ stroke: T.LINE }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: T.INK_SOFT, fontFamily: F_BODY }} axisLine={false} tickLine={false} width={36} />
            <Tooltip formatter={(v) => fmtAmount(v)} contentStyle={{ fontFamily: F_BODY, fontSize: 12, borderRadius: 12, border: `1px solid ${T.LINE}`, background: T.CARD, color: T.INK, boxShadow: T.SHADOW_MD }} />
            <Bar dataKey="Income" fill={T.GREEN} radius={[4, 4, 0, 0]} />
            <Bar dataKey="Expense" fill={T.RED} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <SectionTitle T={T}>Category Breakdown & Limits</SectionTitle>
      {pieData.length === 0 ? (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: 20, boxShadow: T.SHADOW_MD }}>
          <EmptyState icon={PieChartIcon} title="No spending recorded" sub="Category distribution will appear here once expenses are logged." T={T} />
        </div>
      ) : (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "10px 18px", boxShadow: T.SHADOW_MD }}>
          {pieData.map((e, idx) => {
            const pct = mExpense > 0 ? Math.round((e.value / mExpense) * 100) : 0;
            const budgetPct = e.budget ? Math.round((e.value / e.budget) * 100) : null;
            return (
              <div key={e.id} style={{ padding: "12px 0", borderBottom: idx === pieData.length - 1 ? "none" : `1px solid ${T.LINE_SUBTLE}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: e.color }} />
                    <span style={{ color: T.INK, fontWeight: 600 }}>{e.name}</span>
                    {e.budget && (
                      <span style={{ fontSize: 10.5, fontWeight: 600, padding: "1px 6px", borderRadius: 6, background: budgetPct >= 100 ? T.RED_BG : T.PAPER_DIM, color: budgetPct >= 100 ? T.RED : T.INK_SOFT }}>
                        Budget: {fmtAmount(e.budget)}
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: F_MONO, color: T.INK, fontWeight: 600 }}>
                    {fmtAmount(e.value)} <span style={{ color: T.INK_SOFT, fontWeight: 400 }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: T.PAPER_DIM, overflow: "hidden" }}>
                  <div style={{ width: pct + "%", height: "100%", borderRadius: 6, background: e.color, transition: "width 0.4s ease" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const navBtnStyle = { width: 34, height: 34, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "none" };

function StatChip({ label, value, color, T = THEMES.light }) {
  return (
    <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 18, padding: "12px 10px", textAlign: "center", boxShadow: T.SHADOW_MD }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: T.INK_SOFT, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 14, color, marginTop: 4, letterSpacing: -0.2 }}>{fmtAmount(value)}</div>
    </div>
  );
}

function CategoriesScreen({ categories, transactions, onAdd, onEdit, onDelete, T = THEMES.light }) {
  const thisMonth = new Date();
  const usage = useMemo(() => { 
    const m = {}; 
    for (const t of transactions) m[t.categoryId] = (m[t.categoryId] || 0) + 1; 
    return m; 
  }, [transactions]);

  const monthSpend = useMemo(() => {
    const m = {};
    for (const t of transactions) {
      if (t.type === "expense" && isSameMonth(t.date, thisMonth)) {
        m[t.categoryId] = (m[t.categoryId] || 0) + Number(t.amount);
      }
    }
    return m;
  }, [transactions, thisMonth]);

  return (
    <div>
      <div style={{ marginTop: 16, marginBottom: 12 }}>
        <PrimaryButton onClick={onAdd} color={T.GOLD} T={T}><Plus size={16} strokeWidth={2.5} /> New category</PrimaryButton>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {categories.map((c) => {
          const budget = c.monthlyBudget ? Number(c.monthlyBudget) : null;
          const spent = monthSpend[c.id] || 0;
          const pct = budget ? Math.round((spent / budget) * 100) : null;
          return (
            <div key={c.id} style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 20, padding: "14px", boxShadow: T.SHADOW_MD, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <IconStamp icon={c.icon} color={c.color} size={40} T={T} />
                  {budget && (
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      padding: "2px 7px", 
                      borderRadius: 8, 
                      background: pct >= 100 ? T.RED_BG : T.GOLD_BG, 
                      color: pct >= 100 ? T.RED : T.GOLD,
                      fontFamily: F_MONO
                    }}>
                      {pct}%
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: F_BODY, fontWeight: 700, fontSize: 14, color: T.INK, marginTop: 10 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: T.INK_SOFT, marginTop: 2, textTransform: "capitalize" }}>
                  {c.type} · {usage[c.id] || 0} txs
                </div>
                {budget ? (
                  <div style={{ marginTop: 8, fontSize: 11, fontFamily: F_MONO, color: T.INK, fontWeight: 600 }}>
                    🎯 {fmtAmount(budget)}<span style={{ color: T.INK_SOFT, fontWeight: 400 }}>/mo</span>
                  </div>
                ) : (
                  <div style={{ marginTop: 8, fontSize: 11, color: T.INK_MUTED }}>
                    No budget limit
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => onEdit(c)} aria-label="Edit category" style={{ ...iconBtnStyle, flex: 1, borderColor: T.LINE, background: T.PAPER_DIM }}>
                  <Pencil size={13} color={T.INK_SOFT} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.INK_SOFT, marginLeft: 4 }}>Edit</span>
                </button>
                {!c.locked && (
                  <button onClick={() => onDelete(c.id)} aria-label="Delete category" style={{ ...iconBtnStyle, borderColor: T.RED + "30", background: T.RED_BG }}>
                    <Trash2 size={13} color={T.RED} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const iconBtnStyle = { height: 32, padding: "0 8px", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "1px solid transparent", transition: "all .15s ease" };

function TxModal({ tx, categories, accounts = [], onClose, onSave, onDelete, T = THEMES.light }) {
  const [type, setType] = useState(tx.type);
  const [amount, setAmount] = useState(String(tx.amount || ""));
  const [categoryId, setCategoryId] = useState(tx.categoryId);
  const [accountId, setAccountId] = useState(tx.accountId || null);
  const [note, setNote] = useState(tx.note || "");
  const [date, setDate] = useState(tx.date ? toDateInput(tx.date) : todayISO());
  const availableCats = categories.filter((c) => c.type === type || c.type === "both");
  useEffect(() => { if (!availableCats.find((c) => c.id === categoryId)) setCategoryId(availableCats[0]?.id); }, [type]); // eslint-disable-line
  const evaluated = evaluateExpression(amount);
  const finalAmount = evaluated !== null ? evaluated : Number(amount);
  const canSave = amount && finalAmount > 0 && categoryId;
  const inputStyleThemed = getInputStyle(T);

  return (
    <Sheet title={tx.id ? "Edit Transaction" : "New Transaction"} onClose={onClose} T={T}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          {tx.id && (
            <button onClick={() => onDelete(tx.id)} aria-label="Delete" style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${T.RED}35`, background: T.RED_BG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}>
              <Trash2 size={18} color={T.RED} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <PrimaryButton disabled={!canSave} color={type === "expense" ? T.RED : T.GREEN} onClick={() => onSave({ type, amount: finalAmount, categoryId, accountId: accountId || null, note: note.trim(), date }, tx.id)}>
              <Check size={16} strokeWidth={2.5} /> Save Transaction
            </PrimaryButton>
          </div>
        </div>
      }>
      <SegmentedControl value={type} onChange={setType} accent={type === "expense" ? T.RED : T.GREEN} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} T={T} />
      <div style={{ marginTop: 20 }}>
        <Field label="Amount" T={T}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: F_MONO, color: T.INK_SOFT, fontSize: 18, fontWeight: 700 }}>₹</span>
            <input autoFocus type="text" inputMode="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00 (or e.g. 400 + 800)" style={{ ...inputStyleThemed, paddingLeft: 34, fontFamily: F_MONO, fontSize: 20, fontWeight: 700 }} />
            {evaluated !== null && evaluated !== Number(amount) && (
              <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: T.PAPER_DIM, fontFamily: F_MONO, fontSize: 13, color: T.INK, fontWeight: 600, border: `1px solid ${T.LINE}` }}>
                = {fmtAmount(evaluated)}
              </div>
            )}
          </div>
        </Field>
        <Field label="Category" T={T}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {availableCats.map((c) => (
              <button key={c.id} onClick={() => setCategoryId(c.id)} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 7, 
                  padding: "7px 12px", 
                  borderRadius: 14, 
                  border: `1.5px solid ${categoryId === c.id ? c.color : T.LINE}`, 
                  background: categoryId === c.id ? c.color + "18" : T.PAPER, 
                  cursor: "pointer", 
                  transition: "all .18s ease" 
                }}>
                <IconStamp icon={c.icon} color={c.color} size={20} T={T} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: T.INK }}>{c.name}</span>
              </button>
            ))}
          </div>
        </Field>

        {accounts.length > 0 && (
          <Field label="Account / Wallet (Optional)" T={T}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button type="button" onClick={() => setAccountId(null)} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6, 
                  padding: "6px 12px", 
                  borderRadius: 12, 
                  border: `1.5px solid ${accountId === null ? T.INK : T.LINE}`, 
                  background: accountId === null ? T.PAPER_DIM : T.PAPER, 
                  cursor: "pointer", 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: T.INK 
                }}>
                Unassigned
              </button>
              {accounts.map((a) => {
                const typeInfo = ACCOUNT_TYPES[a.type] || ACCOUNT_TYPES.bank;
                const TypeIcon = typeInfo.Icon;
                const isSelected = accountId === a.id;
                return (
                  <button type="button" key={a.id} onClick={() => setAccountId(a.id)} 
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 6, 
                      padding: "6px 12px", 
                      borderRadius: 12, 
                      border: `1.5px solid ${isSelected ? a.color : T.LINE}`, 
                      background: isSelected ? a.color + "18" : T.PAPER, 
                      cursor: "pointer", 
                      fontSize: 12, 
                      fontWeight: 600, 
                      color: T.INK 
                    }}>
                    <TypeIcon size={14} color={a.color} />
                    <span>{a.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <Field label="Description" T={T}><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Dinner with team" style={inputStyleThemed} /></Field>
        <Field label="Date" T={T}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyleThemed, padding: "10px 12px", fontSize: 14 }} /></Field>
      </div>
    </Sheet>
  );
}

function CategoryModal({ cat, onClose, onSave, onDelete, T = THEMES.light }) {
  const [name, setName] = useState(cat.name || "");
  const [icon, setIcon] = useState(cat.icon || "wallet");
  const [color, setColor] = useState(cat.color || COLOR_PRESETS[0]);
  const [type, setType] = useState(cat.type || "expense");
  const [monthlyBudget, setMonthlyBudget] = useState(cat.monthlyBudget ? String(cat.monthlyBudget) : "");
  const isNew = !cat.id;
  const canSave = name.trim().length > 0;
  const inputStyleThemed = getInputStyle(T);

  const evaluatedBudget = evaluateExpression(monthlyBudget);
  const finalBudgetNumber = evaluatedBudget !== null ? evaluatedBudget : (monthlyBudget.trim() ? Number(monthlyBudget) : null);

  return (
    <Sheet title={isNew ? "New Category" : "Edit Category"} onClose={onClose} T={T}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          {!isNew && !cat.locked && (
            <button onClick={() => onDelete(cat.id)} aria-label="Delete" style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${T.RED}35`, background: T.RED_BG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Trash2 size={18} color={T.RED} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <PrimaryButton disabled={!canSave} color={color || T.GOLD} onClick={() => onSave({ name: name.trim(), icon, color, type, monthlyBudget: finalBudgetNumber && finalBudgetNumber > 0 ? finalBudgetNumber : null }, cat.id)} T={T}>
              <Check size={16} strokeWidth={2.5} /> Save Category
            </PrimaryButton>
          </div>
        </div>
      }>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
        <IconStamp icon={icon} color={color} size={64} T={T} />
      </div>
      <Field label="Category Name" T={T}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" style={inputStyleThemed} /></Field>
      <Field label="Type" T={T}><SegmentedControl value={type} onChange={setType} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }, { value: "both", label: "Both" }]} T={T} /></Field>
      
      {/* Monthly Budget Spending Limit */}
      <Field label="Monthly Budget Target (Optional)" T={T}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: F_MONO, color: T.INK_SOFT, fontSize: 16, fontWeight: 700 }}>₹</span>
          <input 
            type="text" 
            inputMode="decimal" 
            value={monthlyBudget} 
            onChange={(e) => setMonthlyBudget(e.target.value)} 
            placeholder="e.g. 10000 (or leave empty)" 
            style={{ ...inputStyleThemed, paddingLeft: 34, fontFamily: F_MONO, fontWeight: 600 }} 
          />
        </div>
        <div style={{ fontSize: 11.5, color: T.INK_SOFT, marginTop: 6, lineHeight: 1.4 }}>
          Set a monthly target to display progress bars and spending alerts on your home screen.
        </div>
      </Field>

      <Field label="Select Icon" T={T}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {ICON_KEYS.map((k) => { const Ic = ICONS[k]; return (
            <button key={k} onClick={() => setIcon(k)} 
              style={{ 
                aspectRatio: "1", 
                borderRadius: 12, 
                border: `1.5px solid ${icon === k ? color : T.LINE}`, 
                background: icon === k ? color + "20" : T.PAPER, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                cursor: "pointer",
                transition: "all .15s ease" 
              }}>
              <Ic size={18} color={icon === k ? color : T.INK_SOFT} />
            </button>
          ); })}
        </div>
      </Field>
      <Field label="Accent Color" T={T}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {COLOR_PRESETS.map((c) => (
            <button key={c} onClick={() => setColor(c)} 
              style={{ 
                width: 30, 
                height: 30, 
                borderRadius: 10, 
                background: c, 
                border: color === c ? `3px solid ${T.INK}` : "1px solid rgba(0,0,0,0.1)", 
                cursor: "pointer",
                boxShadow: color === c ? `0 2px 8px ${c}50` : "none",
                transform: color === c ? "scale(1.1)" : "scale(1)",
                transition: "all .15s ease" 
              }} />
          ))}
        </div>
      </Field>
    </Sheet>
  );
}

function SettingsModal({ email, onClose, toggleTheme, currentTheme, T, apiKey, onApiKeyChange }) {
  return (
    <Sheet title="Settings" onClose={onClose} T={T}>
      <Field label="Account" T={T}>
        <div style={{ ...getInputStyle(T), color: T.INK, background: T.PAPER_DIM, fontWeight: 500 }}>{email}</div>
      </Field>
      <Field label="Anthropic API Key (AI Scanning)" T={T}>
        <input type="password" value={apiKey} onChange={(e) => onApiKeyChange(e.target.value)} placeholder="sk-ant-api03-..." style={{ ...getInputStyle(T), fontSize: 13, fontFamily: F_MONO }} />
        <div style={{ fontSize: 11.5, color: T.INK_SOFT, marginTop: 7, lineHeight: 1.4 }}>Encrypted locally on this device for receipt OCR & statement parsing.</div>
      </Field>
      <Field label="Appearance" T={T}>
        <button onClick={toggleTheme}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: `1px solid ${T.LINE}`, background: T.PAPER, color: T.INK, fontFamily: F_BODY, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s" }}>
          {currentTheme === 'light' ? <><Moon size={16} /> Switch to Dark Mode</> : <><Sun size={16} color={T.GOLD} /> Switch to Light Mode</>}
        </button>
      </Field>
      <button onClick={() => signOut({ callbackUrl: "/login" })}
        style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: `1px solid ${T.RED}35`, background: T.RED_BG, color: T.RED, fontFamily: F_BODY, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 18, transition: "all .2s" }}>
        <LogOut size={16} /> Sign out of Ledger
      </button>
    </Sheet>
  );
}

function AIModal({ categories, onClose, onImport, onCreateCategory, apiKey, T = THEMES.light }) {
  const [mode, setMode] = useState("describe");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const fileRef = useRef(null);

  function handleFile(f) { if (!f) return; setFile(f); setPreview(URL.createObjectURL(f)); }

  async function runParse() {
    setLoading(true); setError(null);
    try {
      let imageBase64 = null, imageMediaType = null;
      if (mode === "photo" && file) { imageBase64 = await fileToBase64(file); imageMediaType = file.type || "image/jpeg"; }
      const { rows } = await api("/api/ai/parse", {
        method: "POST",
        body: JSON.stringify({ text, imageBase64, imageMediaType }),
        headers: apiKey ? { "x-user-ai-key": apiKey } : {},
      });
      const withIds = rows.map((r) => ({ rid: Math.random().toString(36).slice(2), ...r, include: true }));
      if (withIds.length === 0) setError("No transactions detected. Try adding more detail or uploading a clearer receipt image.");
      setResults(withIds);
    } catch (e) { setError(e.message || "Unable to read. Check your connection or API key."); }
    finally { setLoading(false); }
  }
  function updateRow(rid, patch) { setResults((prev) => prev.map((r) => (r.rid === rid ? { ...r, ...patch } : r))); }
  function removeRow(rid) { setResults((prev) => prev.filter((r) => r.rid !== rid)); }

  async function confirmImport() {
    const newCatCache = {}; const finalTx = [];
    for (const r of results) {
      if (!r.include) continue;
      let categoryId = r.categoryId;
      if (!categoryId) {
        const key = (r.newCategoryName || "Other").toLowerCase();
        if (!newCatCache[key]) {
          const newCat = await onCreateCategory({ name: r.newCategoryName || "Other", icon: "wallet", color: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)], type: r.type });
          newCatCache[key] = newCat.id;
        }
        categoryId = newCatCache[key];
      }
      finalTx.push({ type: r.type, amount: r.amount, categoryId, note: r.note, date: r.date, source: mode === "photo" ? "ai-photo" : "ai-text" });
    }
    onImport(finalTx);
  }
  const includedCount = results ? results.filter((r) => r.include).length : 0;

  return (
    <Sheet title="AI Smart Capture" onClose={onClose} T={T}
      footer={results ? (
        <PrimaryButton disabled={includedCount === 0} color={T.GOLD} onClick={confirmImport} T={T}>
          <Check size={16} strokeWidth={2.5} /> Import {includedCount} transaction{includedCount === 1 ? "" : "s"}
        </PrimaryButton>
      ) : (
        <PrimaryButton disabled={loading || (mode === "describe" ? !text.trim() : !file)} color={T.GOLD} onClick={runParse} T={T}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {loading ? "Analyzing receipt…" : "Extract with Claude"}
        </PrimaryButton>
      )}>
      {!results && (
        <>
          <SegmentedControl value={mode} onChange={(m) => { setMode(m); setError(null); }} accent={T.GOLD} options={[{ value: "describe", label: "Text Description" }, { value: "photo", label: "Receipt / Photo" }]} T={T} />
          {mode === "describe" ? (
            <div style={{ marginTop: 16 }}>
              <Field label="What did you spend or receive?" T={T}>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="e.g. Spent ₹650 on groceries at Nature's Basket and ₹320 on Uber cab" style={{ ...getInputStyle(T), resize: "none", lineHeight: 1.5 }} />
              </Field>
              <p style={{ fontSize: 12, color: T.INK_SOFT, lineHeight: 1.5 }}>Mention amounts and merchants — AI will auto-categorize and extract each line item.</p>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <Field label="Upload Receipt or Statement" T={T}>
                {preview ? (
                  <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${T.LINE}` }}>
                    <img src={preview} alt="preview" style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
                    <button onClick={() => { setFile(null); setPreview(null); }} aria-label="Remove image" style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} color="#FFFFFF" /></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "28px 16px", borderRadius: 18, border: `1.5px dashed ${T.LINE}`, background: T.PAPER, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, transition: "all .2s" }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: T.GOLD_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Camera size={22} color={T.GOLD} />
                    </div>
                    <span style={{ fontSize: 13, color: T.INK, fontWeight: 600 }}>Tap to snap or upload receipt</span>
                    <span style={{ fontSize: 11.5, color: T.INK_SOFT }}>Supports paper bills, receipts, or bank statements</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />
              </Field>
            </div>
          )}
          {error && (
            <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start", background: T.RED_BG, border: `1px solid ${T.RED}35`, borderRadius: 14, padding: "12px 14px" }}>
              <AlertCircle size={16} color={T.RED} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12.5, color: T.RED, lineHeight: 1.4 }}>{error}</span>
            </div>
          )}
        </>
      )}
      {results && (
        <div>
          <p style={{ fontSize: 12.5, color: T.INK_SOFT, marginBottom: 12 }}>Review detected items before saving to your ledger:</p>
          {results.map((r) => {
            const availableCats = categories.filter((c) => c.type === r.type || c.type === "both");
            return (
              <div key={r.rid} style={{ background: r.include ? T.PAPER : T.PAPER_DIM, border: `1px solid ${T.LINE}`, borderRadius: 16, padding: 14, marginBottom: 10, opacity: r.include ? 1 : 0.5, transition: "all .2s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <input type="checkbox" checked={r.include} onChange={(e) => updateRow(r.rid, { include: e.target.checked })} style={{ width: 18, height: 18, accentColor: T.GOLD }} />
                  <div style={{ flex: 1 }}>
                    <SegmentedControl value={r.type} onChange={(v) => updateRow(r.rid, { type: v, categoryId: null })} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} T={T} />
                  </div>
                  <button onClick={() => removeRow(r.rid)} aria-label="Remove item" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}><X size={16} color={T.INK_SOFT} /></button>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ position: "relative", flex: "0 0 42%" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F_MONO, fontSize: 13, color: T.INK_SOFT }}>₹</span>
                    <input type="number" value={r.amount} onChange={(e) => updateRow(r.rid, { amount: Number(e.target.value) })} style={{ ...getInputStyle(T), padding: "8px 8px 8px 24px", fontFamily: F_MONO, fontSize: 14, fontWeight: 700 }} />
                  </div>
                  <input type="date" value={r.date} onChange={(e) => updateRow(r.rid, { date: e.target.value })} style={{ ...getInputStyle(T), padding: "8px 10px", fontSize: 11, flex: 1, minWidth: 0 }} />
                </div>
                <input value={r.note} onChange={(e) => updateRow(r.rid, { note: e.target.value })} placeholder="Merchant or note" style={{ ...getInputStyle(T), padding: "8px 12px", fontSize: 13, marginBottom: 8 }} />
                <select value={r.categoryId || "__new__"} onChange={(e) => updateRow(r.rid, { categoryId: e.target.value === "__new__" ? null : e.target.value })} style={{ ...getInputStyle(T), padding: "8px 12px", fontSize: 13 }}>
                  {!r.categoryId && <option value="__new__">✦ New: {r.newCategoryName}</option>}
                  {availableCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

function AccountsScreen({ accounts = [], transfers = [], transactions = [], catById = {}, onAdd, onEdit, onDelete, onTransfer, onDeleteTransfer, T = THEMES.light }) {
  // Compute totals
  const { netWorth, totalAssets, totalDebt } = useMemo(() => {
    let assets = 0, debt = 0;
    for (const a of accounts) {
      if (a.type === "credit_card") {
        debt += Math.max(0, a.balance);
      } else {
        if (a.balance >= 0) assets += a.balance;
        else debt += Math.abs(a.balance);
      }
    }
    return { netWorth: assets - debt, totalAssets: assets, totalDebt: debt };
  }, [accounts]);

  const [filterType, setFilterType] = useState("all");

  const filteredAccounts = useMemo(() => {
    if (filterType === "all") return accounts;
    return accounts.filter((a) => a.type === filterType);
  }, [accounts, filterType]);

  return (
    <div>
      {/* Net Worth Summary Card */}
      <div style={{ marginTop: 16, padding: "18px 20px", borderRadius: 24, background: T.CARD, border: `1px solid ${T.LINE}`, boxShadow: T.SHADOW_MD }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.INK_SOFT, textTransform: "uppercase", letterSpacing: 0.6 }}>Total Net Worth</div>
        <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 28, color: netWorth < 0 ? T.RED : T.INK, marginTop: 4, letterSpacing: -0.5 }}>
          {fmtAmount(netWorth)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.LINE_SUBTLE}` }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: T.INK_SOFT, textTransform: "uppercase" }}>Total Assets</div>
            <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 15, color: T.GREEN, marginTop: 2 }}>{fmtAmount(totalAssets)}</div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: T.INK_SOFT, textTransform: "uppercase" }}>Credit / Debt</div>
            <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 15, color: totalDebt > 0 ? T.RED : T.INK_SOFT, marginTop: 2 }}>{fmtAmount(totalDebt)}</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14, marginBottom: 8 }}>
        <PrimaryButton onClick={onTransfer} color={T.GOLD} T={T}>
          <ArrowLeftRight size={16} strokeWidth={2.5} /> Transfer Funds
        </PrimaryButton>
        <button onClick={onAdd}
          style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: `1px solid ${T.LINE}`, background: T.CARD, color: T.INK, fontFamily: F_BODY, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: T.SHADOW_MD }}>
          <Plus size={16} strokeWidth={2.5} /> New Account
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginTop: 12 }}>
        <SegmentedControl 
          value={filterType} 
          onChange={setFilterType} 
          options={[
            { value: "all", label: "All" },
            { value: "bank", label: "Banks" },
            { value: "credit_card", label: "Cards" },
            { value: "cash", label: "Cash" },
            { value: "upi", label: "UPI" }
          ]} 
          T={T} 
        />
      </div>

      {/* Accounts List */}
      <SectionTitle T={T}>
        {filterType === "all" ? "All Wallets & Accounts" : `${ACCOUNT_TYPES[filterType]?.label || "Account"}s`}
      </SectionTitle>

      {filteredAccounts.length === 0 ? (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "28px 20px", textAlign: "center", boxShadow: T.SHADOW_MD }}>
          <EmptyState icon={Wallet} title="No accounts yet" sub="Add your bank accounts, cash in hand, or credit cards to track live balances." T={T} />
          <button onClick={onAdd} style={{ marginTop: 12, padding: "10px 18px", borderRadius: 12, border: "none", background: T.GOLD, color: "#FFFFFF", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Add First Account
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredAccounts.map((acc) => {
            const typeInfo = ACCOUNT_TYPES[acc.type] || ACCOUNT_TYPES.bank;
            const TypeIcon = typeInfo.Icon;
            const isCC = acc.type === "credit_card";
            const creditLimit = acc.creditLimit ? Number(acc.creditLimit) : null;
            const outstanding = Math.max(0, acc.balance);
            const ccUtilization = creditLimit && creditLimit > 0 ? Math.round((outstanding / creditLimit) * 100) : null;

            return (
              <div key={acc.id} 
                style={{ 
                  background: T.CARD, 
                  border: `1px solid ${T.LINE}`, 
                  borderRadius: 22, 
                  padding: "18px 18px", 
                  boxShadow: T.SHADOW_MD,
                  position: "relative",
                  overflow: "hidden"
                }}>
                {/* Accent top stripe */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: acc.color }} />

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: acc.color + "18", border: `1px solid ${acc.color}35`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <TypeIcon size={22} color={acc.color} />
                    </div>
                    <div>
                      <div style={{ fontFamily: F_BODY, fontWeight: 700, fontSize: 16, color: T.INK }}>{acc.name}</div>
                      <div style={{ fontSize: 11.5, color: T.INK_SOFT, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>{typeInfo.label}</span>
                        {acc.openingBalance !== 0 && <span>· Open: {fmtAmount(acc.openingBalance)}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.INK_SOFT, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      {isCC ? "Outstanding" : "Balance"}
                    </div>
                    <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 18, color: isCC ? (outstanding > 0 ? T.RED : T.INK) : (acc.balance < 0 ? T.RED : T.INK), marginTop: 2 }}>
                      {fmtAmount(acc.balance)}
                    </div>
                  </div>
                </div>

                {/* Credit Card Specific: Utilization & Cycle Days */}
                {isCC && (
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.LINE_SUBTLE}` }}>
                    {creditLimit && creditLimit > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                          <span style={{ color: T.INK_SOFT }}>Credit Limit: <strong style={{ color: T.INK, fontFamily: F_MONO }}>{fmtAmount(creditLimit)}</strong></span>
                          <span style={{ fontFamily: F_MONO, fontWeight: 700, color: ccUtilization >= 80 ? T.RED : ccUtilization >= 50 ? T.GOLD : T.GREEN }}>
                            {ccUtilization}% used
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 6, background: T.PAPER_DIM, overflow: "hidden" }}>
                          <div style={{ width: `${Math.min(ccUtilization || 0, 100)}%`, height: "100%", borderRadius: 6, background: ccUtilization >= 80 ? T.RED : ccUtilization >= 50 ? T.GOLD : T.GREEN, transition: "width 0.4s ease" }} />
                        </div>
                      </div>
                    )}

                    {(acc.billingDay || acc.dueDay) && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, color: T.INK_SOFT }}>
                        {acc.billingDay && (
                          <span style={{ padding: "3px 8px", borderRadius: 8, background: T.PAPER_DIM, border: `1px solid ${T.LINE}` }}>
                            📅 Statement: <strong>{acc.billingDay}th</strong> of month
                          </span>
                        )}
                        {acc.dueDay && (
                          <span style={{ padding: "3px 8px", borderRadius: 8, background: T.RED_BG, border: `1px solid ${T.RED}30`, color: T.RED, fontWeight: 600 }}>
                            ⏰ Payment Due: <strong>{acc.dueDay}th</strong>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14, paddingTop: 10, borderTop: `1px solid ${T.LINE_SUBTLE}` }}>
                  <button onClick={() => onEdit(acc)} style={{ ...iconBtnStyle, borderColor: T.LINE, background: T.PAPER_DIM, padding: "6px 12px", height: "auto" }}>
                    <Pencil size={13} color={T.INK_SOFT} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.INK_SOFT, marginLeft: 4 }}>Edit</span>
                  </button>
                  <button onClick={() => onDelete(acc.id)} style={{ ...iconBtnStyle, borderColor: T.RED + "30", background: T.RED_BG, padding: "6px 12px", height: "auto" }}>
                    <Trash2 size={13} color={T.RED} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.RED, marginLeft: 4 }}>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transfers History Section */}
      <SectionTitle T={T}>Inter-Account Transfers</SectionTitle>
      {transfers.length === 0 ? (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "20px", boxShadow: T.SHADOW_MD, textAlign: "center" }}>
          <EmptyState icon={ArrowLeftRight} title="No transfers yet" sub="Record ATM cash withdrawals, wallet top-ups, or credit card bill payments here." T={T} />
        </div>
      ) : (
        <div style={{ background: T.CARD, border: `1px solid ${T.LINE}`, borderRadius: 22, padding: "8px 14px", boxShadow: T.SHADOW_MD }}>
          {transfers.map((tr, idx) => {
            const fromAcc = accounts.find((a) => a.id === tr.fromAccountId);
            const toAcc = accounts.find((a) => a.id === tr.toAccountId);
            return (
              <div key={tr.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px", borderBottom: idx === transfers.length - 1 ? "none" : `1px solid ${T.LINE_SUBTLE}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: T.GOLD_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ArrowLeftRight size={16} color={T.GOLD} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: T.INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {fromAcc?.name || "Account"} → {toAcc?.name || "Account"}
                    </div>
                    <div style={{ fontSize: 11, color: T.INK_SOFT, marginTop: 1 }}>
                      {fmtDateHeader(toDateInput(tr.date))} {tr.note ? `· ${tr.note}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 14, color: T.INK }}>
                    {fmtAmount(tr.amount)}
                  </span>
                  <button onClick={() => onDeleteTransfer(tr.id)} aria-label="Delete transfer" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    <Trash2 size={14} color={T.RED} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AccountModal({ account, onClose, onSave, onDelete, T = THEMES.light }) {
  const [name, setName] = useState(account.name || "");
  const [type, setType] = useState(account.type || "bank");
  const [openingBalance, setOpeningBalance] = useState(account.openingBalance !== undefined ? String(account.openingBalance || "") : "");
  const [color, setColor] = useState(account.color || ACCOUNT_TYPES[account.type || "bank"]?.color || "#1A4D3E");
  const [creditLimit, setCreditLimit] = useState(account.creditLimit ? String(account.creditLimit) : "");
  const [billingDay, setBillingDay] = useState(account.billingDay ? String(account.billingDay) : "");
  const [dueDay, setDueDay] = useState(account.dueDay ? String(account.dueDay) : "");

  const isNew = !account.id;
  const canSave = name.trim().length > 0;
  const inputStyleThemed = getInputStyle(T);

  const evaluatedOpenBal = evaluateExpression(openingBalance);
  const finalOpenBal = evaluatedOpenBal !== null ? evaluatedOpenBal : (openingBalance.trim() ? Number(openingBalance) : 0);

  const evaluatedLimit = evaluateExpression(creditLimit);
  const finalLimit = evaluatedLimit !== null ? evaluatedLimit : (creditLimit.trim() ? Number(creditLimit) : null);

  const handleTypeChange = (newType) => {
    setType(newType);
    if (!account.id) {
      setColor(ACCOUNT_TYPES[newType]?.color || COLOR_PRESETS[0]);
    }
  };

  return (
    <Sheet title={isNew ? "New Account / Wallet" : "Edit Account"} onClose={onClose} T={T}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          {!isNew && (
            <button onClick={() => onDelete(account.id)} aria-label="Delete" style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${T.RED}35`, background: T.RED_BG, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Trash2 size={18} color={T.RED} />
            </button>
          )}
          <div style={{ flex: 1 }}>
            <PrimaryButton disabled={!canSave} color={color || T.GOLD} onClick={() => onSave({ 
              name: name.trim(), 
              type, 
              color, 
              openingBalance: finalOpenBal,
              creditLimit: type === "credit_card" ? finalLimit : null,
              billingDay: type === "credit_card" && billingDay ? Number(billingDay) : null,
              dueDay: type === "credit_card" && dueDay ? Number(dueDay) : null
            }, account.id)} T={T}>
              <Check size={16} strokeWidth={2.5} /> Save Account
            </PrimaryButton>
          </div>
        </div>
      }>
      
      <Field label="Account Type" T={T}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(ACCOUNT_TYPES).map(([k, info]) => {
            const Icon = info.Icon;
            const isSelected = type === k;
            return (
              <button key={k} type="button" onClick={() => handleTypeChange(k)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "10px 12px", 
                  borderRadius: 14, 
                  border: `1.5px solid ${isSelected ? info.color : T.LINE}`, 
                  background: isSelected ? info.color + "18" : T.PAPER, 
                  cursor: "pointer",
                  transition: "all .18s ease" 
                }}>
                <Icon size={18} color={isSelected ? info.color : T.INK_SOFT} />
                <span style={{ fontSize: 13, fontWeight: 600, color: T.INK }}>{info.label}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Account Name" T={T}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "credit_card" ? "e.g. Amazon Pay ICICI Card" : type === "bank" ? "e.g. HDFC Salary Account" : type === "cash" ? "e.g. Cash in Hand" : "e.g. Google Pay / Paytm"} style={inputStyleThemed} />
      </Field>

      <Field label={type === "credit_card" ? "Initial Outstanding Balance" : "Starting / Current Balance"} T={T}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: F_MONO, color: T.INK_SOFT, fontSize: 16, fontWeight: 700 }}>₹</span>
          <input 
            type="text" 
            inputMode="decimal" 
            value={openingBalance} 
            onChange={(e) => setOpeningBalance(e.target.value)} 
            placeholder="0.00" 
            style={{ ...inputStyleThemed, paddingLeft: 34, fontFamily: F_MONO, fontWeight: 600 }} 
          />
        </div>
        <div style={{ fontSize: 11.5, color: T.INK_SOFT, marginTop: 5 }}>
          {type === "credit_card" ? "Enter any existing unpaid bill amount" : "Your current balance in this account"}
        </div>
      </Field>

      {/* Credit Card Specific Fields */}
      {type === "credit_card" && (
        <>
          <Field label="Credit Limit (Optional)" T={T}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: F_MONO, color: T.INK_SOFT, fontSize: 16, fontWeight: 700 }}>₹</span>
              <input 
                type="text" 
                inputMode="decimal" 
                value={creditLimit} 
                onChange={(e) => setCreditLimit(e.target.value)} 
                placeholder="e.g. 150000" 
                style={{ ...inputStyleThemed, paddingLeft: 34, fontFamily: F_MONO, fontWeight: 600 }} 
              />
            </div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Statement Date" T={T}>
              <input 
                type="number" 
                min={1} 
                max={28} 
                value={billingDay} 
                onChange={(e) => setBillingDay(e.target.value)} 
                placeholder="Day (1-28)" 
                style={inputStyleThemed} 
              />
            </Field>
            <Field label="Payment Due Date" T={T}>
              <input 
                type="number" 
                min={1} 
                max={28} 
                value={dueDay} 
                onChange={(e) => setDueDay(e.target.value)} 
                placeholder="Day (1-28)" 
                style={inputStyleThemed} 
              />
            </Field>
          </div>
        </>
      )}

      <Field label="Accent Color" T={T}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {COLOR_PRESETS.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} 
              style={{ 
                width: 30, 
                height: 30, 
                borderRadius: 10, 
                background: c, 
                border: color === c ? `3px solid ${T.INK}` : "1px solid rgba(0,0,0,0.1)", 
                cursor: "pointer",
                boxShadow: color === c ? `0 2px 8px ${c}50` : "none",
                transform: color === c ? "scale(1.1)" : "scale(1)",
                transition: "all .15s ease" 
              }} />
          ))}
        </div>
      </Field>
    </Sheet>
  );
}

function TransferModal({ accounts = [], onClose, onSave, T = THEMES.light }) {
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id || "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id || accounts[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const inputStyleThemed = getInputStyle(T);
  const evaluated = evaluateExpression(amount);
  const finalAmount = evaluated !== null ? evaluated : Number(amount);
  const canSave = fromAccountId && toAccountId && fromAccountId !== toAccountId && amount && finalAmount > 0;

  function handleSubmit() {
    if (fromAccountId === toAccountId) {
      setError("Please choose two different accounts for the transfer.");
      return;
    }
    if (!finalAmount || finalAmount <= 0) {
      setError("Please enter a valid transfer amount.");
      return;
    }
    onSave({ fromAccountId, toAccountId, amount: finalAmount, date, note: note.trim() });
  }

  return (
    <Sheet title="Transfer Between Accounts" onClose={onClose} T={T}
      footer={
        <PrimaryButton disabled={!canSave} color={T.GOLD} onClick={handleSubmit} T={T}>
          <Check size={16} strokeWidth={2.5} /> Record Transfer
        </PrimaryButton>
      }>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.INK_SOFT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>From</label>
          <select value={fromAccountId} onChange={(e) => { setFromAccountId(e.target.value); setError(""); }} style={{ ...inputStyleThemed, padding: "10px 8px", fontSize: 13 }}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({fmtAmount(a.balance)})</option>
            ))}
          </select>
        </div>

        <div style={{ paddingTop: 18 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: T.PAPER_DIM, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowLeftRight size={14} color={T.INK_SOFT} />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.INK_SOFT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>To</label>
          <select value={toAccountId} onChange={(e) => { setToAccountId(e.target.value); setError(""); }} style={{ ...inputStyleThemed, padding: "10px 8px", fontSize: 13 }}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({fmtAmount(a.balance)})</option>
            ))}
          </select>
        </div>
      </div>

      <Field label="Transfer Amount" T={T}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: F_MONO, color: T.INK_SOFT, fontSize: 18, fontWeight: 700 }}>₹</span>
          <input autoFocus type="text" inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setError(""); }} placeholder="0.00" style={{ ...inputStyleThemed, paddingLeft: 34, fontFamily: F_MONO, fontSize: 20, fontWeight: 700 }} />
          {evaluated !== null && evaluated !== Number(amount) && (
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, background: T.PAPER_DIM, fontFamily: F_MONO, fontSize: 13, color: T.INK, fontWeight: 600, border: `1px solid ${T.LINE}` }}>
              = {fmtAmount(evaluated)}
            </div>
          )}
        </div>
      </Field>

      <Field label="Transfer Date" T={T}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyleThemed} />
      </Field>

      <Field label="Note (Optional)" T={T}>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. ATM withdrawal, Credit card bill payment" style={inputStyleThemed} />
      </Field>

      {error && (
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center", background: T.RED_BG, border: `1px solid ${T.RED}30`, borderRadius: 12, padding: "10px 14px", color: T.RED, fontSize: 12.5 }}>
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}
    </Sheet>
  );
}



