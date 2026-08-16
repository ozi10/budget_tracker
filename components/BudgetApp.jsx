"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  Plus, Sparkles, Camera, X, Check, Trash2, ChevronLeft, ChevronRight,
  Wallet, ArrowUpRight, ArrowDownRight, Home as HomeIcon, List as ListIcon,
  PieChart as PieChartIcon, Tags, ShoppingCart, Utensils, Car, Zap, Film,
  HeartPulse, GraduationCap, Plane, Gift, Briefcase, Coffee, Smartphone,
  PawPrint, Wrench, TrendingUp, Loader2, FileText, AlertCircle, Pencil,
  ReceiptText, LogOut, Settings as SettingsIcon,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/* ---------------------------------- THEME ---------------------------------- */
const THEMES = {
  light: {
    INK: "#1C2536", INK_SOFT: "#4A5268", PAPER: "#F6F1E4", PAPER_DIM: "#EFE7D3",
    CARD: "#FFFFFF", LINE: "#E0D9C7", RED: "#B33A3A", GREEN: "#3A6B52",
    GOLD: "#B8860B", GOLD_SOFT: "#E4C77B", SHADOW: "rgba(28,37,54,0.08)"
  },
  dark: {
    INK: "#F6F1E4", INK_SOFT: "#C9C2B8", PAPER: "#0F1419", PAPER_DIM: "#1A2029",
    CARD: "#161C23", LINE: "#2A3139", RED: "#E08A8A", GREEN: "#6BB88A",
    GOLD: "#E4C77B", GOLD_SOFT: "#B8860B", SHADOW: "rgba(0,0,0,0.3)"
  }
};
const F_DISPLAY = "'Fraunces', Georgia, serif", F_BODY = "'Inter', -apple-system, sans-serif", F_MONO = "'IBM Plex Mono', ui-monospace, monospace";

const ICONS = {
  cart: ShoppingCart, food: Utensils, car: Car, bolt: Zap, film: Film, health: HeartPulse,
  grad: GraduationCap, plane: Plane, gift: Gift, briefcase: Briefcase, coffee: Coffee,
  phone: Smartphone, paw: PawPrint, wrench: Wrench, trend: TrendingUp, wallet: Wallet, home: HomeIcon,
};
const ICON_KEYS = Object.keys(ICONS);
const COLOR_PRESETS = ["#B33A3A", "#3A6B52", "#3A5B8A", "#8A6D3B", "#6B4A8A", "#8A3A6B", "#3A8A6E", "#8A5A2A", "#2A7A5A", "#6B6252", "#4A5A9A", "#8A4A4A", "#4A7A8A", "#7A5A3A", "#5A7A3A", "#9A5A7A"];

/* -------------------------------- HELPERS ---------------------------------- */
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const fmtAmount = (n) => inr.format(Math.round(Number(n) || 0));
const toDateInput = (iso) => new Date(iso).toISOString().slice(0, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
function evaluateExpression(expr) {
  const trimmed = String(expr).trim();
  if (!trimmed) return null;
  if (!/^[\d+\-*/.\\s()]+$/.test(trimmed)) return null;
  try {
    const result = Function('\"use strict\"; return (' + trimmed + ')')();
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
async function api(path, opts) {
  const res = await fetch(path, { headers: { "content-type": "application/json" }, ...opts });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

/* ------------------------------ SMALL UI -------------------------------- */
function IconStamp({ icon, color, size = 40, T = THEMES.light }) {
  const Ic = ICONS[icon] || Wallet;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: color + "20", border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Ic size={size * 0.5} color={color} strokeWidth={2.2} />
    </div>
  );
}
function SegmentedControl({ options, value, onChange, accent, T = THEMES.light }) {
  return (
    <div style={{ display: "flex", background: T.PAPER_DIM, borderRadius: 14, padding: 4, border: `1.5px solid ${T.LINE}` }}>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => onChange(opt.value)}
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: F_BODY, fontWeight: 600, fontSize: 13, background: value === opt.value ? T.CARD : "transparent", color: value === opt.value ? (accent || T.INK) : T.INK_SOFT, boxShadow: value === opt.value ? `0 2px 6px ${T.SHADOW}` : "none", transition: "all .2s" }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
function Sheet({ title, onClose, children, footer, T = THEMES.light }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(28,37,54,0.5)", animation: "fadeIn .18s ease" }} />
      <div style={{ position: "relative", background: T.PAPER, borderRadius: "28px 28px 0 0", maxHeight: "88%", display: "flex", flexDirection: "column", animation: "slideUp .22s cubic-bezier(.2,.8,.3,1)", boxShadow: `0 -12px 40px ${T.SHADOW}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 14px", borderBottom: `1.5px solid ${T.LINE}` }}>
          <span style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 20, color: T.INK }}>{title}</span>
          <button onClick={onClose} style={{ background: T.LINE + "40", border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}><X size={18} color={T.INK_SOFT} /></button>
        </div>
        <div style={{ overflowY: "auto", padding: 20, flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: 16, borderTop: `1.5px solid ${T.LINE}`, background: T.CARD }}>{footer}</div>}
      </div>
    </div>
  );
}
function PrimaryButton({ children, onClick, disabled, color, style, T = THEMES.light }) {
  const defaultColor = color || T.INK;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: "100%", padding: "14px 16px", borderRadius: 14, border: "none", background: disabled ? T.LINE : defaultColor, color: T.PAPER, fontFamily: F_BODY, fontWeight: 700, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, letterSpacing: 0.3, transition: "all .2s", boxShadow: disabled ? "none" : `0 4px 12px ${defaultColor}40`, ...style }}>
      {children}
    </button>
  );
}
function Field({ label, children, T = THEMES.light }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: F_BODY, fontSize: 11, fontWeight: 700, color: T.INK_SOFT, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</div>
      {children}
    </div>
  );
}
const getInputStyle = (T) => ({ width: "100%", padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${T.LINE}`, background: T.CARD, fontFamily: F_BODY, fontSize: 15, color: T.INK, outline: "none", boxSizing: "border-box", transition: "all .2s" });
const inputStyle = getInputStyle(THEMES.light);

function TransactionRow({ t, category, onClick, T = THEMES.light }) {
  const isExpense = t.type === "expense";
  return (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 4px", background: "transparent", border: "none", borderBottom: `1.5px solid ${T.LINE}40`, cursor: "pointer", textAlign: "left", transition: "all .2s" }}>
      <IconStamp icon={category?.icon || "wallet"} color={category?.color || "#6B6252"} T={T} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F_BODY, fontWeight: 600, fontSize: 14.5, color: T.INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.note || category?.name || "Transaction"}</div>
        <div style={{ fontFamily: F_BODY, fontSize: 12, color: T.INK_SOFT, marginTop: 2 }}>{category?.name || "Other"}</div>
      </div>
      <div style={{ fontFamily: F_MONO, fontWeight: 600, fontSize: 14.5, color: isExpense ? T.RED : T.GREEN, flexShrink: 0 }}>{isExpense ? "−" : "+"}{fmtAmount(t.amount)}</div>
    </button>
  );
}
function EmptyState({ icon: Icon, title, sub, T = THEMES.light }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: T.INK_SOFT }}>
      <div style={{ width: 60, height: 60, borderRadius: "50%", background: T.PAPER_DIM, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Icon size={28} color={T.INK_SOFT} /></div>
      <div style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 17, color: T.INK, marginBottom: 6 }}>{title}</div>
      <div style={{ fontFamily: F_BODY, fontSize: 13, maxWidth: 240, margin: "0 auto", lineHeight: 1.6, color: T.INK_SOFT }}>{sub}</div>
    </div>
  );
}
function SectionTitle({ children, T = THEMES.light }) {
  return <div style={{ marginTop: 26, marginBottom: 10, fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 18, color: T.INK }}>{children}</div>;
}

/* ============================== MAIN APP ================================ */
export default function BudgetApp() {
  const { data: session } = useSession();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('budget-theme');
      return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'light';
  });
  const T = THEMES[theme];
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [screen, setScreen] = useState("home");
  const [txFilter, setTxFilter] = useState("all");
  const [fabOpen, setFabOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [reportMonth, setReportMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('budget-theme', newTheme);
  };

  useEffect(() => {
    (async () => {
      try {
        const [cats, txs] = await Promise.all([api("/api/categories"), api("/api/transactions")]);
        setCategories(cats); setTransactions(txs);
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
  function openAddTx() { setEditingTx({ type: "expense", amount: "", categoryId: categories.find((c) => c.type !== "income")?.id || categories[0]?.id, note: "", date: todayISO() }); setFabOpen(false); }

  if (loading) {
    return <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: T.PAPER, color: T.INK_SOFT, fontFamily: F_BODY }}>Loading your ledger…</div>;
  }

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto", height: "100dvh", maxWidth: 430, margin: "0 auto", background: T.PAPER, fontFamily: F_BODY, overflow: "hidden", color: T.INK }}>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 0 0 rgba(184,134,11,0.35); } 50% { box-shadow: 0 0 0 8px rgba(184,134,11,0); } }
        input:focus, textarea:focus, select:focus { border-color: ${T.GOLD} !important; }
      `}</style>

      <Header totals={totals} onSettings={() => setShowSettings(true)} T={T} />

      <div style={{ overflowY: "auto", overflowX: "hidden", padding: "0 16px 20px", minHeight: 0 }}>
        {screen === "home" && <HomeScreen monthTotals={monthTotals} transactions={transactions} catById={catById} onSeeAll={(f) => { setTxFilter(f || "all"); setScreen("transactions"); }} onOpenTx={(t) => setEditingTx(t)} T={T} />}
        {screen === "transactions" && <TransactionsScreen transactions={transactions} catById={catById} filter={txFilter} setFilter={setTxFilter} onOpenTx={(t) => setEditingTx(t)} T={T} />}
        {screen === "reports" && <ReportsScreen transactions={transactions} catById={catById} month={reportMonth} setMonth={setReportMonth} T={T} />}
        {screen === "categories" && <CategoriesScreen categories={categories} transactions={transactions} onAdd={() => setEditingCat({ name: "", icon: "wallet", color: COLOR_PRESETS[0], type: "expense" })} onEdit={(c) => setEditingCat(c)} onDelete={removeCategory} T={T} />}
      </div>

      <div style={{ position: "fixed", right: 16, bottom: "calc(82px + env(safe-area-inset-bottom))", zIndex: 40, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, maxWidth: 398 }}>
        {fabOpen && (
          <>
            <FabAction label="AI capture" icon={Sparkles} color={T.GOLD} onClick={() => { setShowAI(true); setFabOpen(false); }} glow />
            <FabAction label="Add manually" icon={Plus} color={T.INK} onClick={openAddTx} T={T} />
          </>
        )}
        <button onClick={() => setFabOpen((v) => !v)} style={{ width: 56, height: 56, borderRadius: "50%", border: "none", background: T.INK, color: T.PAPER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 6px 18px ${T.SHADOW}`, transform: fabOpen ? "rotate(45deg)" : "rotate(0)", transition: "transform .2s" }}><Plus size={26} /></button>
      </div>
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 35 }} />}

      <TabBar screen={screen} setScreen={setScreen} T={T} />

      {editingTx && <TxModal tx={editingTx} categories={categories} onClose={() => setEditingTx(null)} onSave={async (fields, id) => { await saveTransaction(fields, id); setEditingTx(null); }} onDelete={async (id) => { await removeTransaction(id); setEditingTx(null); }} T={T} />}
      {showAI && <AIModal categories={categories} onClose={() => setShowAI(false)} onCreateCategory={saveCategory} onImport={async (txs) => { for (const t of txs) await saveTransaction(t); setShowAI(false); }} T={T} />}
      {editingCat && <CategoryModal cat={editingCat} onClose={() => setEditingCat(null)} onSave={async (fields, id) => { await saveCategory(fields, id); setEditingCat(null); }} onDelete={async (id) => { await removeCategory(id); setEditingCat(null); }} T={T} />}
      {showSettings && <SettingsModal email={session?.user?.email} onClose={() => setShowSettings(false)} toggleTheme={toggleTheme} currentTheme={theme} T={T} />}
    </div>
  );
}

function Header({ totals, onSettings, T }) {
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div style={{ padding: "calc(18px + env(safe-area-inset-top)) 18px 14px", flexShrink: 0, background: T.INK, color: T.PAPER, borderRadius: "0 0 24px 24px", boxShadow: `0 4px 12px ${T.SHADOW}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11.5, opacity: 0.65, letterSpacing: 0.5, textTransform: "uppercase" }}>{dateStr}</div>
          <div style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: 15.5, marginTop: 2 }}>Ledger</div>
        </div>
        <button onClick={onSettings} style={{ width: 40, height: 40, borderRadius: "50%", background: T.GOLD_SOFT + "1a", border: `2px solid ${T.GOLD_SOFT}40`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}><SettingsIcon size={18} color={T.GOLD_SOFT} /></button>
      </div>
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: 0.6 }}>Total balance</div>
        <div style={{ fontFamily: F_MONO, fontWeight: 600, fontSize: 32, marginTop: 4, color: totals.balance < 0 ? "#E08A8A" : T.PAPER }}>{fmtAmount(totals.balance)}</div>
      </div>
    </div>
  );
}
function TabBar({ screen, setScreen, T }) {
  const tabs = [{ key: "home", label: "Home", icon: HomeIcon }, { key: "transactions", label: "Ledger", icon: ListIcon }, { key: "reports", label: "Reports", icon: PieChartIcon }, { key: "categories", label: "Categories", icon: Tags }];
  return (
    <div style={{ display: "flex", borderTop: `1.5px solid ${T.LINE}`, background: T.CARD, padding: "10px 8px calc(10px + env(safe-area-inset-bottom))", boxShadow: `0 -4px 12px ${T.SHADOW}` }}>
      {tabs.map((t) => {
        const active = screen === t.key, Ic = t.icon;
        return (
          <button key={t.key} onClick={() => setScreen(t.key)} style={{ flex: 1, background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 0", cursor: "pointer", transition: "all .2s", opacity: active ? 1 : 0.6 }}>
            <Ic size={22} color={active ? T.INK : T.INK_SOFT} strokeWidth={active ? 2.4 : 2} />
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? T.INK : T.INK_SOFT }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
function FabAction({ label, icon: Icon, color, onClick, glow }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", animation: "popIn .18s ease" }}>
      <span style={{ background: INK, color: PAPER, fontSize: 12.5, fontWeight: 600, padding: "6px 10px", borderRadius: 8, whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>{label}</span>
      <span style={{ width: 46, height: 46, borderRadius: "50%", background: color, color: PAPER, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.3)", animation: glow ? "glow 1.8s infinite" : "none" }}><Icon size={20} /></span>
    </button>
  );
}

function HomeScreen({ monthTotals, transactions, catById, onSeeAll, onOpenTx, T = THEMES.light }) {
  const recent = transactions.slice(0, 5);
  const thisMonth = new Date();
  const pieData = useMemo(() => {
    const sums = {};
    for (const t of transactions) { if (t.type !== "expense" || !isSameMonth(t.date, thisMonth)) continue; sums[t.categoryId] = (sums[t.categoryId] || 0) + Number(t.amount); }
    return Object.entries(sums).map(([id, value]) => ({ id, value, name: catById[id]?.name || "Other", color: catById[id]?.color || "#999" })).sort((a, b) => b.value - a.value);
  }, [transactions, catById]);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        <button onClick={() => onSeeAll("income")} style={{ flex: 1, textAlign: "left", background: T.CARD, border: `1.5px solid ${T.LINE}`, borderRadius: 18, padding: "16px 16px", cursor: "pointer", transition: "all .2s", boxShadow: `0 2px 8px ${T.SHADOW}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.GREEN }}><ArrowUpRight size={16} /><span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Income</span></div>
          <div style={{ fontFamily: F_MONO, fontWeight: 600, fontSize: 20, color: T.INK, marginTop: 8 }}>{fmtAmount(monthTotals.income)}</div>
        </button>
        <button onClick={() => onSeeAll("expense")} style={{ flex: 1, textAlign: "left", background: T.CARD, border: `1.5px solid ${T.LINE}`, borderRadius: 18, padding: "16px 16px", cursor: "pointer", transition: "all .2s", boxShadow: `0 2px 8px ${T.SHADOW}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.RED }}><ArrowDownRight size={16} /><span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Expenses</span></div>
          <div style={{ fontFamily: F_MONO, fontWeight: 600, fontSize: 20, color: T.INK, marginTop: 8 }}>{fmtAmount(monthTotals.expense)}</div>
        </button>
      </div>
      <SectionTitle T={T}>This month's spending</SectionTitle>
      {pieData.length === 0 ? (
        <div style={{ background: T.CARD, border: `1.5px solid ${T.LINE}`, borderRadius: 18, padding: "20px 10px", boxShadow: `0 2px 8px ${T.SHADOW}` }}><EmptyState icon={PieChartIcon} title="No spending yet" sub="Add an expense to see your category breakdown here." T={T} /></div>
      ) : (
        <div style={{ background: T.CARD, border: `1.5px solid ${T.LINE}`, borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: `0 2px 8px ${T.SHADOW}` }}>
          <div style={{ width: 100, height: 100, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={48} strokeWidth={2} stroke={T.CARD}>{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
            {pieData.slice(0, 4).map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: T.INK_SOFT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: 12.5 }}>{e.name}</span>
                <span style={{ fontFamily: F_MONO, color: T.INK, fontWeight: 600, fontSize: 12 }}>{fmtAmount(e.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 22, marginBottom: 6 }}>
        <span style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: 16, color: INK }}>Recent activity</span>
        {transactions.length > 0 && <button onClick={() => onSeeAll("all")} style={{ background: "none", border: "none", color: GOLD, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>See all</button>}
      </div>
      {recent.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No transactions yet" sub="Tap the + button to add one, or let the AI read a receipt or passbook page for you." />
      ) : (
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: "4px 12px" }}>{recent.map((t) => <TransactionRow key={t.id} t={t} category={catById[t.categoryId]} onClick={() => onOpenTx(t)} />)}</div>
      )}
    </div>
  );
}

function TransactionsScreen({ transactions, catById, filter, setFilter, onOpenTx }) {
  const filtered = useMemo(() => transactions.filter((t) => filter === "all" || t.type === filter), [transactions, filter]);
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const total = useMemo(() => filtered.reduce((s, t) => s + (t.type === "expense" ? -1 : 1) * Number(t.amount), 0), [filtered]);
  return (
    <div>
      <div style={{ marginTop: 16 }}><SegmentedControl value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "expense", label: "Expenses" }, { value: "income", label: "Income" }]} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "14px 2px 4px" }}>
        <span style={{ fontSize: 12.5, color: INK_SOFT, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>{filtered.length} entries</span>
        <span style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 15, color: total < 0 ? RED : GREEN }}>{fmtAmount(total)}</span>
      </div>
      {grouped.length === 0 ? <EmptyState icon={ReceiptText} title="Nothing here yet" sub="Transactions you add will show up in this ledger, grouped by day." /> : grouped.map(([date, txs]) => (
        <div key={date} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: INK_SOFT, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginLeft: 2 }}>{fmtDateHeader(date)}</div>
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: "4px 12px" }}>{txs.map((t) => <TransactionRow key={t.id} t={t} category={catById[t.categoryId]} onClick={() => onOpenTx(t)} />)}</div>
        </div>
      ))}
    </div>
  );
}

function ReportsScreen({ transactions, catById, month, setMonth }) {
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
    for (const t of monthTx) { if (t.type !== "expense") continue; sums[t.categoryId] = (sums[t.categoryId] || 0) + Number(t.amount); }
    return Object.entries(sums).map(([id, value]) => ({ id, value, name: catById[id]?.name || "Other", color: catById[id]?.color || "#999" })).sort((a, b) => b.value - a.value);
  }, [monthTx, catById]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
        <button onClick={() => { const d = new Date(month); d.setMonth(d.getMonth() - 1); setMonth(d); }} style={navBtnStyle}><ChevronLeft size={18} color={INK} /></button>
        <span style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: 16, color: INK }}>{monthLabel(month)}</span>
        <button onClick={() => { const d = new Date(month); d.setMonth(d.getMonth() + 1); setMonth(d); }} style={navBtnStyle}><ChevronRight size={18} color={INK} /></button>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <StatChip label="Income" value={mIncome} color={GREEN} />
        <StatChip label="Expense" value={mExpense} color={RED} />
        <StatChip label="Net" value={mIncome - mExpense} color={mIncome - mExpense >= 0 ? GREEN : RED} />
      </div>
      <SectionTitle>Last 6 months</SectionTitle>
      <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: "14px 8px 4px", height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} barGap={2}>
            <CartesianGrid vertical={false} stroke={LINE} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: INK_SOFT, fontFamily: F_BODY }} axisLine={{ stroke: LINE }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: INK_SOFT, fontFamily: F_BODY }} axisLine={false} tickLine={false} width={34} />
            <Tooltip formatter={(v) => fmtAmount(v)} contentStyle={{ fontFamily: F_BODY, fontSize: 12, borderRadius: 8, border: `1px solid ${LINE}` }} />
            <Bar dataKey="Income" fill={GREEN} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Expense" fill={RED} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <SectionTitle>By category</SectionTitle>
      {pieData.length === 0 ? <EmptyState icon={PieChartIcon} title="No expenses this month" sub="Category breakdown will appear once you log an expense." /> : (
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: "6px 14px" }}>
          {pieData.map((e) => {
            const pct = mExpense > 0 ? Math.round((e.value / mExpense) * 100) : 0;
            return (
              <div key={e.id} style={{ padding: "10px 0", borderBottom: `1px dashed ${LINE}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}><span style={{ color: INK, fontWeight: 600 }}>{e.name}</span><span style={{ fontFamily: F_MONO, color: INK }}>{fmtAmount(e.value)} · {pct}%</span></div>
                <div style={{ height: 6, borderRadius: 4, background: PAPER_DIM, overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: e.color }} /></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
const navBtnStyle = { width: 32, height: 32, borderRadius: "50%", border: `1px solid ${LINE}`, background: CARD, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
function StatChip({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: "10px 10px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: INK_SOFT, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 14, color, marginTop: 3 }}>{fmtAmount(value)}</div>
    </div>
  );
}

function CategoriesScreen({ categories, transactions, onAdd, onEdit, onDelete }) {
  const usage = useMemo(() => { const m = {}; for (const t of transactions) m[t.categoryId] = (m[t.categoryId] || 0) + 1; return m; }, [transactions]);
  return (
    <div>
      <div style={{ marginTop: 16, marginBottom: 10 }}><PrimaryButton onClick={onAdd}><Plus size={16} /> New category</PrimaryButton></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {categories.map((c) => (
          <div key={c.id} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 12 }}>
            <IconStamp icon={c.icon} color={c.color} size={36} />
            <div style={{ fontFamily: F_BODY, fontWeight: 700, fontSize: 13.5, color: INK, marginTop: 8 }}>{c.name}</div>
            <div style={{ fontSize: 11, color: INK_SOFT, marginTop: 1, textTransform: "capitalize" }}>{c.type} · {usage[c.id] || 0} entries</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <button onClick={() => onEdit(c)} style={iconBtnStyle}><Pencil size={13} color={INK_SOFT} /></button>
              {!c.locked && <button onClick={() => onDelete(c.id)} style={iconBtnStyle}><Trash2 size={13} color={RED} /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
const iconBtnStyle = { width: 26, height: 26, borderRadius: 7, border: `1px solid ${LINE}`, background: PAPER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };

function TxModal({ tx, categories, onClose, onSave, onDelete, T = THEMES.light }) {
  const [type, setType] = useState(tx.type);
  const [amount, setAmount] = useState(String(tx.amount || ""));
  const [categoryId, setCategoryId] = useState(tx.categoryId);
  const [note, setNote] = useState(tx.note || "");
  const [date, setDate] = useState(tx.date ? toDateInput(tx.date) : todayISO());
  const availableCats = categories.filter((c) => c.type === type || c.type === "both");
  useEffect(() => { if (!availableCats.find((c) => c.id === categoryId)) setCategoryId(availableCats[0]?.id); }, [type]); // eslint-disable-line
  const evaluated = evaluateExpression(amount);
  const finalAmount = evaluated !== null ? evaluated : Number(amount);
  const canSave = amount && finalAmount > 0 && categoryId;
  const inputStyleThemed = getInputStyle(T);

  return (
    <Sheet title={tx.id ? "Edit transaction" : "Add transaction"} onClose={onClose} T={T}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          {tx.id && <button onClick={() => onDelete(tx.id)} style={{ width: 46, height: 46, borderRadius: 12, border: `1.5px solid ${T.RED}40`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all .2s" }}><Trash2 size={18} color={T.RED} /></button>}
          <div style={{ flex: 1 }}><PrimaryButton disabled={!canSave} color={type === "expense" ? T.RED : T.GREEN} onClick={() => onSave({ type, amount: finalAmount, categoryId, note: note.trim(), date }, tx.id)}><Check size={16} /> Save</PrimaryButton></div>
        </div>
      }>
      <SegmentedControl value={type} onChange={setType} accent={type === "expense" ? T.RED : T.GREEN} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} T={T} />
      <div style={{ marginTop: 20 }}>
        <Field label="Amount" T={T}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontFamily: F_MONO, color: T.INK_SOFT, fontSize: 16, fontWeight: 600 }}>₹</span>
            <input autoFocus type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 400 + 800 + 900" style={{ ...inputStyleThemed, paddingLeft: 30, fontFamily: F_MONO, fontSize: 18, fontWeight: 600 }} />
            {evaluated !== null && evaluated !== Number(amount) && (
              <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: T.PAPER_DIM, fontFamily: F_MONO, fontSize: 13, color: T.INK, fontWeight: 600, border: `1px solid ${T.LINE}` }}>
                = {fmtAmount(evaluated)}
              </div>
            )}
          </div>
        </Field>
        <Field label="Category" T={T}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {availableCats.map((c) => (
              <button key={c.id} onClick={() => setCategoryId(c.id)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 22, border: `1.5px solid ${categoryId === c.id ? c.color : T.LINE}`, background: categoryId === c.id ? c.color + "15" : T.CARD, cursor: "pointer", transition: "all .2s" }}>
                <IconStamp icon={c.icon} color={c.color} size={20} T={T} /><span style={{ fontSize: 13, fontWeight: 600, color: T.INK }}>{c.name}</span>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Note" T={T}><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Coffee with Priya" style={inputStyleThemed} /></Field>
        <Field label="Date" T={T}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyleThemed} /></Field>
      </div>
    </Sheet>
  );
}

function CategoryModal({ cat, onClose, onSave, onDelete }) {
  const [name, setName] = useState(cat.name);
  const [icon, setIcon] = useState(cat.icon);
  const [color, setColor] = useState(cat.color);
  const [type, setType] = useState(cat.type);
  const isNew = !cat.id;
  const canSave = name.trim().length > 0;
  return (
    <Sheet title={isNew ? "New category" : "Edit category"} onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: 10 }}>
          {!isNew && !cat.locked && <button onClick={() => onDelete(cat.id)} style={{ width: 46, height: 46, borderRadius: 12, border: `1.5px solid ${RED}55`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Trash2 size={18} color={RED} /></button>}
          <div style={{ flex: 1 }}><PrimaryButton disabled={!canSave} onClick={() => onSave({ name: name.trim(), icon, color, type }, cat.id)}><Check size={16} /> Save category</PrimaryButton></div>
        </div>
      }>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><IconStamp icon={icon} color={color} size={64} /></div>
      <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Groceries" style={inputStyle} /></Field>
      <Field label="Applies to"><SegmentedControl value={type} onChange={setType} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }, { value: "both", label: "Both" }]} /></Field>
      <Field label="Icon">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {ICON_KEYS.map((k) => { const Ic = ICONS[k]; return (
            <button key={k} onClick={() => setIcon(k)} style={{ aspectRatio: "1", borderRadius: 10, border: `1.5px solid ${icon === k ? color : LINE}`, background: icon === k ? color + "1c" : CARD, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Ic size={17} color={icon === k ? color : INK_SOFT} /></button>
          ); })}
        </div>
      </Field>
      <Field label="Color">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COLOR_PRESETS.map((c) => <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, border: color === c ? `2.5px solid ${INK}` : "2.5px solid transparent", cursor: "pointer" }} />)}
        </div>
      </Field>
    </Sheet>
  );
}

function SettingsModal({ email, onClose, toggleTheme, currentTheme, T }) {
  return (
    <Sheet title="Settings" onClose={onClose} T={T}>
      <Field label="Signed in as" T={T}><div style={{ ...inputStyle, color: T.INK_SOFT, background: T.CARD, borderColor: T.LINE }}>{email}</div></Field>
      <Field label="Theme" T={T}>
        <button onClick={toggleTheme}
          style={{ width: "100%", padding: "12px 16px", borderRadius: 14, border: `2px solid ${T.GOLD}40`, background: T.GOLD + "08", color: T.GOLD, fontFamily: F_BODY, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .2s" }}>
          {currentTheme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </Field>
      <button onClick={() => signOut({ callbackUrl: "/login" })}
        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${T.RED}40`, background: "transparent", color: T.RED, fontFamily: F_BODY, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16, transition: "all .2s" }}>
        <LogOut size={16} /> Sign out
      </button>
      <p style={{ fontSize: 12, color: T.INK_SOFT, lineHeight: 1.6, marginTop: 20 }}>Your data is stored in your own private account and syncs across any device you sign into.</p>
    </Sheet>
  );
}

function AIModal({ categories, onClose, onImport, onCreateCategory }) {
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
      const { rows } = await api("/api/ai/parse", { method: "POST", body: JSON.stringify({ text, imageBase64, imageMediaType }) });
      const withIds = rows.map((r) => ({ rid: Math.random().toString(36).slice(2), ...r, include: true }));
      if (withIds.length === 0) setError("Couldn't find any transactions in that. Try adding more detail, or a clearer photo.");
      setResults(withIds);
    } catch (e) { setError(e.message || "Something went wrong reading that."); }
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
    <Sheet title="AI capture" onClose={onClose}
      footer={results ? (
        <PrimaryButton disabled={includedCount === 0} color={GOLD} onClick={confirmImport}><Check size={16} /> Add {includedCount} transaction{includedCount === 1 ? "" : "s"}</PrimaryButton>
      ) : (
        <PrimaryButton disabled={loading || (mode === "describe" ? !text.trim() : !file)} color={GOLD} onClick={runParse}>{loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} {loading ? "Reading…" : "Parse with AI"}</PrimaryButton>
      )}>
      {!results && (
        <>
          <SegmentedControl value={mode} onChange={(m) => { setMode(m); setError(null); }} accent={GOLD} options={[{ value: "describe", label: "Describe it" }, { value: "photo", label: "Photo" }]} />
          {mode === "describe" ? (
            <div style={{ marginTop: 16 }}>
              <Field label="What happened?"><textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="e.g. Spent ₹450 on groceries at Big Bazaar today, and got ₹250 cab to office" style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} /></Field>
              <p style={{ fontSize: 12, color: INK_SOFT, lineHeight: 1.5 }}>Mention what it was for, the amount, and roughly when — the AI will sort it into your categories.</p>
            </div>
          ) : (
            <div style={{ marginTop: 16 }}>
              <Field label="Receipt, statement or passbook photo">
                {preview ? (
                  <div style={{ position: "relative" }}>
                    <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 12, border: `1px solid ${LINE}`, maxHeight: 260, objectFit: "cover" }} />
                    <button onClick={() => { setFile(null); setPreview(null); }} style={{ position: "absolute", top: 8, right: 8, background: "rgba(28,37,54,0.75)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={14} color={PAPER} /></button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "30px 12px", borderRadius: 12, border: `1.5px dashed ${LINE}`, background: PAPER_DIM, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", gap: 10 }}><Camera size={22} color={INK_SOFT} /><FileText size={22} color={INK_SOFT} /></div>
                    <span style={{ fontSize: 12.5, color: INK_SOFT, fontWeight: 600 }}>Tap to take a photo or choose one</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFile(e.target.files?.[0])} style={{ display: "none" }} />
              </Field>
              <p style={{ fontSize: 12, color: INK_SOFT, lineHeight: 1.5 }}>Works with receipts, bank statement screenshots, or passbook pages — including several transactions at once.</p>
            </div>
          )}
          {error && <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start", background: RED + "12", border: `1px solid ${RED}33`, borderRadius: 10, padding: "10px 12px" }}><AlertCircle size={16} color={RED} style={{ flexShrink: 0, marginTop: 1 }} /><span style={{ fontSize: 12.5, color: RED }}>{error}</span></div>}
        </>
      )}
      {results && (
        <div>
          <p style={{ fontSize: 12.5, color: INK_SOFT, marginBottom: 12 }}>Review before adding — tap a field to fix anything the AI got wrong.</p>
          {results.map((r) => {
            const availableCats = categories.filter((c) => c.type === r.type || c.type === "both");
            return (
              <div key={r.rid} style={{ background: r.include ? CARD : PAPER_DIM, border: `1px solid ${LINE}`, borderRadius: 12, padding: 12, marginBottom: 10, opacity: r.include ? 1 : 0.55 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <input type="checkbox" checked={r.include} onChange={(e) => updateRow(r.rid, { include: e.target.checked })} style={{ width: 16, height: 16 }} />
                  <SegmentedControl value={r.type} onChange={(v) => updateRow(r.rid, { type: v, categoryId: null })} options={[{ value: "expense", label: "Expense" }, { value: "income", label: "Income" }]} />
                  <button onClick={() => removeRow(r.rid)} style={{ background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}><X size={16} color={INK_SOFT} /></button>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ position: "relative", flex: "0 0 40%" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontFamily: F_MONO, fontSize: 13, color: INK_SOFT }}>₹</span>
                    <input type="number" value={r.amount} onChange={(e) => updateRow(r.rid, { amount: Number(e.target.value) })} style={{ ...inputStyle, padding: "8px 8px 8px 22px", fontFamily: F_MONO, fontSize: 13 }} />
                  </div>
                  <input type="date" value={r.date} onChange={(e) => updateRow(r.rid, { date: e.target.value })} style={{ ...inputStyle, padding: "8px 8px", fontSize: 12.5, flex: 1 }} />
                </div>
                <input value={r.note} onChange={(e) => updateRow(r.rid, { note: e.target.value })} placeholder="Note" style={{ ...inputStyle, padding: "8px 10px", fontSize: 13, marginBottom: 8 }} />
                <select value={r.categoryId || "__new__"} onChange={(e) => updateRow(r.rid, { categoryId: e.target.value === "__new__" ? null : e.target.value })} style={{ ...inputStyle, padding: "8px 10px", fontSize: 13 }}>
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
