import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMarket } from "@/store/market";
import { TickerBadge } from "@/components/trade/primitives";
import { Plus, BookOpen, TrendingUp, TrendingDown, X, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/trade/EmptyState";
import { ErrorBoundary } from "@/components/trade/ErrorBoundary";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/app/journal")({ component: JournalPage });

type Tab = "Log" | "Analytics" | "Calendar";
const STRATEGIES = ["Momentum", "Breakout", "Dip Buy", "Reversal", "Gap Play", "Swing", "Scalp"] as const;

function JournalPage() {
  const journalEntries = useMarket(s => s.journalEntries);
  const addJournalEntry = useMarket(s => s.addJournalEntry);
  const [tab, setTab] = useState<Tab>("Log");
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortKey, setSortKey] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);

  const winners = journalEntries.filter(e => e.pnl > 0);
  const losers = journalEntries.filter(e => e.pnl <= 0);
  const totalPnl = journalEntries.reduce((a, e) => a + e.pnl, 0);
  const winRate = journalEntries.length > 0 ? (winners.length / journalEntries.length * 100).toFixed(1) : "0";
  const avgR = journalEntries.length > 0 ? (journalEntries.reduce((a, e) => a + e.rMultiple, 0) / journalEntries.length).toFixed(2) : "0";

  const sorted = [...journalEntries].sort((a: any, b: any) => {
    const av = a[sortKey]; const bv = b[sortKey];
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  function handleSort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-3rem)]">
        {/* Header stats */}
        <div className="px-4 py-3 border-b border-border bg-surface grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
          <StatCard label="Total Trades" value={journalEntries.length.toString()} />
          <StatCard label="Win Rate" value={`${winRate}%`} color={parseFloat(winRate) >= 50 ? "text-bull" : "text-bear"} />
          <StatCard label="Avg R Multiple" value={`${avgR}R`} color={parseFloat(avgR) >= 1 ? "text-bull" : "text-bear"} />
          <StatCard label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toLocaleString()}`} color={totalPnl >= 0 ? "text-bull" : "text-bear"} />
        </div>

        {/* Tab strip */}
        <div className="flex border-b border-border bg-surface shrink-0">
          {(["Log", "Analytics", "Calendar"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 text-sm font-medium transition-colors ${tab === t ? "border-b-2 border-brand text-brand" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={() => setShowAddModal(true)} className="mr-4 my-1.5 h-7 px-3 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-xs font-medium flex items-center gap-1.5">
            <Plus className="size-3.5" /> Add Trade
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
            </div>
          ) : tab === "Log" ? (
            <LogTab entries={sorted} onSort={handleSort} sortKey={sortKey} sortDir={sortDir} />
          ) : tab === "Analytics" ? (
            <AnalyticsTab entries={journalEntries} />
          ) : (
            <CalendarTab entries={journalEntries} />
          )}
        </div>

        {showAddModal && <AddTradeModal onClose={() => setShowAddModal(false)} onAdd={(entry) => { addJournalEntry(entry); toast.success("Trade logged"); setShowAddModal(false); }} />}
      </div>
    </ErrorBoundary>
  );
}

function StatCard({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono text-xl font-semibold tabular-nums mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <span className="text-border ml-1">↕</span>;
  return dir === "asc" ? <ChevronUp className="size-3 inline text-brand ml-1" /> : <ChevronDown className="size-3 inline text-brand ml-1" />;
}

function LogTab({ entries, onSort, sortKey, sortDir }: { entries: any[]; onSort: (k: string) => void; sortKey: string; sortDir: "asc" | "desc" }) {
  if (entries.length === 0) {
    return <EmptyState icon={BookOpen} title="No trades logged yet" description='Click "Add Trade" to log your first trade and start tracking your performance.' />;
  }

  const COLS = [
    { key: "date", label: "Date" }, { key: "ticker", label: "Ticker" }, { key: "direction", label: "Dir" },
    { key: "entry", label: "Entry" }, { key: "exit", label: "Exit" }, { key: "size", label: "Size" },
    { key: "pnl", label: "P&L ($)" }, { key: "pnlPct", label: "P&L %" }, { key: "rMultiple", label: "R" },
    { key: "strategy", label: "Strategy" }, { key: "notes", label: "Notes" },
  ];

  return (
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-surface border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground z-10">
        <tr>
          {COLS.map(c => (
            <th key={c.key} onClick={() => onSort(c.key)} className="px-3 py-2 text-left font-medium cursor-pointer hover:text-foreground whitespace-nowrap">
              {c.label}<SortIcon active={sortKey === c.key} dir={sortDir} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map(e => (
          <tr key={e.id} className="border-b border-border/50 hover:bg-accent/40 text-xs">
            <td className="px-3 py-2 font-mono text-muted-foreground tabular-nums">{e.date}</td>
            <td className="px-3 py-2"><TickerBadge symbol={e.ticker} /></td>
            <td className="px-3 py-2">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${e.direction === "Long" ? "bg-bull/15 text-bull border border-bull/30" : "bg-bear/15 text-bear border border-bear/30"}`}>
                {e.direction === "Long" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />} {e.direction}
              </span>
            </td>
            <td className="px-3 py-2 font-mono tabular-nums">{e.entry.toFixed(2)}</td>
            <td className="px-3 py-2 font-mono tabular-nums">{e.exit.toFixed(2)}</td>
            <td className="px-3 py-2 font-mono tabular-nums">{e.size}</td>
            <td className={`px-3 py-2 font-mono tabular-nums font-semibold ${e.pnl >= 0 ? "text-bull" : "text-bear"}`}>
              {e.pnl >= 0 ? "+" : ""}${e.pnl.toLocaleString()}
            </td>
            <td className={`px-3 py-2 font-mono tabular-nums ${e.pnlPct >= 0 ? "text-bull" : "text-bear"}`}>
              {e.pnlPct >= 0 ? "+" : ""}{e.pnlPct.toFixed(2)}%
            </td>
            <td className={`px-3 py-2 font-mono tabular-nums ${e.rMultiple >= 1 ? "text-bull" : e.rMultiple < 0 ? "text-bear" : "text-warn"}`}>
              {e.rMultiple >= 0 ? "+" : ""}{e.rMultiple.toFixed(1)}R
            </td>
            <td className="px-3 py-2 text-muted-foreground">{e.strategy}</td>
            <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate" title={e.notes}>{e.notes || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AnalyticsTab({ entries }: { entries: any[] }) {
  if (entries.length === 0) {
    return <EmptyState icon={TrendingUp} title="No analytics yet" description="Log trades to see your performance analytics." />;
  }

  const cumulativePnl = entries.slice().reverse().reduce<{ date: string; cumPnl: number }[]>((acc, e, i) => {
    const prev = acc[i - 1]?.cumPnl ?? 0;
    acc.push({ date: e.date.slice(5), cumPnl: +(prev + e.pnl).toFixed(0) });
    return acc;
  }, []);

  const byStrategy = Object.entries(
    entries.reduce<Record<string, { pnl: number; count: number }>>((acc, e) => {
      if (!acc[e.strategy]) acc[e.strategy] = { pnl: 0, count: 0 };
      acc[e.strategy].pnl += e.pnl;
      acc[e.strategy].count++;
      return acc;
    }, {})
  ).map(([strategy, { pnl, count }]) => ({ strategy, pnl: +pnl.toFixed(0), count }));

  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const byDow = DOW.map(d => ({ day: d, pnl: Math.floor((Math.random() - 0.4) * 1500) }));

  const chartTooltipStyle = { backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 };

  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-3">Cumulative P&L Over Time</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativePnl}>
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--bull)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--bull)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,0.5)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v}`, "P&L"]} />
              <Area type="monotone" dataKey="cumPnl" stroke="var(--bull)" fill="url(#pnlGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-3">P&L by Strategy</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byStrategy}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,0.5)" />
              <XAxis dataKey="strategy" tick={{ fontSize: 9, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v}`, "P&L"]} />
              <Bar dataKey="pnl" fill="var(--brand)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="lg:col-span-2">
        <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-3">Trade Distribution by Day of Week</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byDow}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,0.5)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`$${v}`, "Avg P&L"]} />
              <Bar dataKey="pnl" radius={[3, 3, 0, 0]} fill="var(--warn)"
                label={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function CalendarTab({ entries }: { entries: any[] }) {
  const [month, setMonth] = useState(new Date(2026, 4, 1)); // May 2026

  const pnlByDate = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] ?? 0) + e.pnl;
    return acc;
  }, {});

  const year = month.getFullYear(); const monthIdx = month.getMonth();
  const firstDay = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function prevMonth() { setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); }
  function nextMonth() { setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); }

  return (
    <div className="p-4 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="size-7 rounded hover:bg-accent flex items-center justify-center"><ChevronUp className="size-4 -rotate-90" /></button>
        <h3 className="text-sm font-semibold">{MONTHS[monthIdx]} {year}</h3>
        <button onClick={nextMonth} className="size-7 rounded hover:bg-accent flex items-center justify-center"><ChevronUp className="size-4 rotate-90" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(d => <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const pnl = pnlByDate[dateStr];
          const isToday = dateStr === "2026-05-12";
          return (
            <div key={day} title={pnl !== undefined ? `P&L: ${pnl >= 0 ? "+" : ""}$${pnl}` : undefined}
              className={`rounded-md p-1.5 min-h-[44px] flex flex-col items-center justify-start transition-colors hover:bg-accent/60 ${isToday ? "ring-1 ring-brand" : ""}`}>
              <span className="text-xs font-medium">{day}</span>
              {pnl !== undefined && (
                <span className={`size-2 rounded-full mt-1 ${pnl >= 0 ? "bg-bull" : "bg-bear"}`} />
              )}
              {pnl !== undefined && (
                <span className={`text-[9px] font-mono mt-0.5 ${pnl >= 0 ? "text-bull" : "text-bear"}`}>
                  {pnl >= 0 ? "+" : ""}${Math.abs(pnl)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type AddTradeFormData = {
  ticker: string; direction: "Long" | "Short"; entry: string; exit: string;
  size: string; strategy: string; notes: string; date: string;
};

function AddTradeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: any) => void }) {
  const [form, setForm] = useState<AddTradeFormData>({
    ticker: "", direction: "Long", entry: "", exit: "", size: "", strategy: "Breakout", notes: "", date: "2026-05-12",
  });

  function set(k: keyof AddTradeFormData, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function submit() {
    if (!form.ticker || !form.entry || !form.exit || !form.size) { toast.error("Fill in all required fields"); return; }
    const entry = parseFloat(form.entry); const exit = parseFloat(form.exit); const size = parseInt(form.size);
    const pnl = form.direction === "Long" ? (exit - entry) * size : (entry - exit) * size;
    const pnlPct = form.direction === "Long" ? (exit - entry) / entry * 100 : (entry - exit) / entry * 100;
    const stop = form.direction === "Long" ? entry * 0.98 : entry * 1.02;
    const rMultiple = +(pnl / (Math.abs(entry - stop) * size)).toFixed(2);
    onAdd({ ticker: form.ticker.toUpperCase(), direction: form.direction, entry, exit, size, pnl: +pnl.toFixed(2), pnlPct: +pnlPct.toFixed(2), rMultiple, strategy: form.strategy, notes: form.notes, date: form.date });
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-xl border border-border bg-surface shadow-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold">Add Trade</h2>
          <button onClick={onClose} className="size-6 rounded hover:bg-accent flex items-center justify-center"><X className="size-3.5 text-muted-foreground" /></button>
        </div>
        <div className="p-4 space-y-3">
          <Row label="Ticker *">
            <input value={form.ticker} onChange={e => set("ticker", e.target.value.toUpperCase())} className={INPUT} placeholder="NVDA" />
          </Row>
          <Row label="Direction">
            <div className="flex rounded-md border border-border overflow-hidden text-xs h-8">
              {(["Long", "Short"] as const).map(d => (
                <button key={d} onClick={() => set("direction", d)}
                  className={`flex-1 transition-colors ${form.direction === d ? (d === "Long" ? "bg-bull text-background" : "bg-bear text-white") : "bg-background hover:bg-accent"}`}>
                  {d}
                </button>
              ))}
            </div>
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Entry *"><input type="number" value={form.entry} onChange={e => set("entry", e.target.value)} className={INPUT} placeholder="0.00" /></Row>
            <Row label="Exit *"><input type="number" value={form.exit} onChange={e => set("exit", e.target.value)} className={INPUT} placeholder="0.00" /></Row>
            <Row label="Share Size *"><input type="number" value={form.size} onChange={e => set("size", e.target.value)} className={INPUT} placeholder="100" /></Row>
            <Row label="Date"><input type="date" value={form.date} onChange={e => set("date", e.target.value)} className={INPUT} /></Row>
          </div>
          <Row label="Strategy">
            <select value={form.strategy} onChange={e => set("strategy", e.target.value)} className={INPUT}>
              {STRATEGIES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Row>
          <Row label="Notes">
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} className={`${INPUT} h-20 resize-none`} placeholder="Trade rationale..." />
          </Row>
          <button className="h-8 px-3 text-xs text-muted-foreground border border-border rounded flex items-center gap-1.5">
            <Plus className="size-3.5" /> Attach Chart (UI only)
          </button>
          <div className="flex gap-2 pt-1">
            <button onClick={submit} className="flex-1 h-9 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-sm font-medium">Log Trade</button>
            <button onClick={onClose} className="flex-1 h-9 rounded-md border border-border hover:bg-accent text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const INPUT = "w-full h-8 px-2 bg-background border border-border rounded text-sm focus:ring-2 focus:ring-brand/40 focus:outline-none";
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  );
}
