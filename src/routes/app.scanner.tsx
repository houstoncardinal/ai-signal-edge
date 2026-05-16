import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMarket } from "@/store/market";
import { TickerBadge, ChangePill, LivePrice, ScoreBadge, formatBig } from "@/components/trade/primitives";
import { ChevronDown, Play, Save, RefreshCw, Filter, Columns3 } from "lucide-react";
import { StockDetailPanel } from "@/components/trade/StockDetailPanel";
import { ErrorBoundary } from "@/components/trade/ErrorBoundary";

export const Route = createFileRoute("/app/scanner")({ component: Scanner });

const PRESETS = ["AI Top Picks", "Top Gainers", "High Relative Volume", "Gap Ups", "Low Float Runners", "Breakouts", "Oversold Bounce"];

type SortKey = "ticker" | "price" | "changePct" | "volume" | "relVolume" | "float" | "marketCap" | "rsi" | "aiScore";
type SortDir = "asc" | "desc";

const ALL_COLUMNS: { key: string; label: string; required?: boolean }[] = [
  { key: "ticker", label: "Ticker", required: true },
  { key: "company", label: "Company", required: true },
  { key: "price", label: "Price" },
  { key: "changePct", label: "Chg %" },
  { key: "volume", label: "Volume" },
  { key: "relVolume", label: "Rel Vol" },
  { key: "float", label: "Float" },
  { key: "marketCap", label: "Mkt Cap" },
  { key: "rsi", label: "RSI" },
  { key: "pattern", label: "Pattern" },
  { key: "aiScore", label: "AI Score" },
];

function Scanner() {
  const quotes = useMarket((s) => s.quotes);
  const ticks = useMarket((s) => s.ticks);
  const [preset, setPreset] = useState("AI Top Picks");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [minRelVol, setMinRelVol] = useState(1);
  const [minScore, setMinScore] = useState(60);
  const [selected, setSelected] = useState<string | null>(null);
  const [auto, setAuto] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("aiScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showCols, setShowCols] = useState(false);
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(["marketCap", "float"]));
  const [flashRows, setFlashRows] = useState<Set<string>>(new Set());
  const prevPrices = useRef<Record<string, number>>({});

  useEffect(() => {
    const current = Object.values(quotes);
    const flashing = new Set<string>();
    current.forEach(q => {
      if (prevPrices.current[q.ticker] !== undefined && prevPrices.current[q.ticker] !== q.price) {
        flashing.add(q.ticker);
      }
      prevPrices.current[q.ticker] = q.price;
    });
    if (flashing.size > 0) {
      setFlashRows(flashing);
      const t = setTimeout(() => setFlashRows(new Set()), 800);
      return () => clearTimeout(t);
    }
  }, [ticks]);

  const rows = useMemo(() => {
    let r = Object.values(quotes).filter(q => q.price >= minPrice && q.price <= maxPrice && q.relVolume >= minRelVol && q.aiScore >= minScore);
    if (preset === "AI Top Picks") r.sort((a, b) => b.aiScore - a.aiScore);
    else if (preset === "Top Gainers") r.sort((a, b) => b.changePct - a.changePct);
    else if (preset === "High Relative Volume") r.sort((a, b) => b.relVolume - a.relVolume);
    else if (preset === "Low Float Runners") r = r.filter(q => q.float < 600_000_000).sort((a, b) => b.changePct - a.changePct);
    else if (preset === "Gap Ups") r = r.filter(q => q.changePct > 2).sort((a, b) => b.changePct - a.changePct);

    r.sort((a: any, b: any) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return r;
  }, [quotes, preset, minPrice, maxPrice, minRelVol, minScore, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function toggleCol(key: string) {
    setHiddenCols(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  const visibleCols = ALL_COLUMNS.filter(c => c.required || !hiddenCols.has(c.key));

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-border ml-1">↕</span>;
    return <span className="text-brand ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <ErrorBoundary>
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Filter sidebar */}
        <aside className="w-56 shrink-0 border-r border-border bg-surface overflow-auto hidden md:block">
          <div className="p-3 border-b border-border">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Preset Scan</label>
            <select value={preset} onChange={e => setPreset(e.target.value)} className="mt-1 w-full h-8 px-2 bg-background border border-border rounded text-sm">
              {PRESETS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <FilterGroup title="Price">
            <RangeRow label="Min" value={minPrice} onChange={setMinPrice} max={500} />
            <RangeRow label="Max" value={maxPrice} onChange={setMaxPrice} max={500} />
          </FilterGroup>
          <FilterGroup title="Relative Volume">
            <RangeRow label="Min Rel Vol" value={minRelVol} onChange={setMinRelVol} max={10} step={0.1} />
          </FilterGroup>
          <FilterGroup title="AI Score">
            <RangeRow label="Min Score" value={minScore} onChange={setMinScore} max={100} />
          </FilterGroup>
          <FilterGroup title="Float" defaultOpen={false}>
            <p className="text-[11px] text-muted-foreground">Float filters auto-applied by preset.</p>
          </FilterGroup>
          <FilterGroup title="Technical (RSI · MACD)" defaultOpen={false}>
            <p className="text-[11px] text-muted-foreground">RSI 30–70 · MACD bullish cross — coming soon.</p>
          </FilterGroup>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="h-12 px-4 border-b border-border bg-surface flex items-center gap-3 shrink-0">
            <button className="h-8 px-3 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-sm font-medium flex items-center gap-1.5">
              <Play className="size-3.5 fill-current" /> Run Scan
            </button>
            <button className="h-8 px-3 rounded-md border border-border bg-background hover:bg-accent text-sm flex items-center gap-1.5">
              <Save className="size-3.5" /> Save
            </button>

            {/* Columns toggle */}
            <div className="relative">
              <button onClick={() => setShowCols(v => !v)} className="h-8 px-3 rounded-md border border-border bg-background hover:bg-accent text-sm flex items-center gap-1.5">
                <Columns3 className="size-3.5" /> Columns
              </button>
              {showCols && (
                <div className="absolute top-10 left-0 z-20 w-44 rounded-md border border-border bg-surface shadow-xl p-2 space-y-1">
                  {ALL_COLUMNS.filter(c => !c.required).map(c => (
                    <label key={c.key} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent cursor-pointer text-xs">
                      <input type="checkbox" checked={!hiddenCols.has(c.key)} onChange={() => toggleCol(c.key)} className="accent-brand" />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-border" />
            <span className="text-xs text-muted-foreground"><span className="font-mono tabular-nums text-foreground">{rows.length}</span> results</span>
            <span className="text-xs text-muted-foreground hidden sm:block">· Updated <span className="font-mono">2s</span> ago</span>
            <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <RefreshCw className={`size-3.5 ${auto ? "text-bull" : ""}`} />
              <span className="hidden sm:block">Auto-refresh</span>
              <span
                onClick={() => setAuto(!auto)}
                className={`relative inline-flex h-4 w-7 rounded-full transition-colors cursor-pointer ${auto ? "bg-bull animate-pulse-green" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 size-3 rounded-full bg-white transition-transform ${auto ? "translate-x-3.5" : "translate-x-0.5"}`} />
              </span>
            </label>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground z-10">
                <tr>
                  {visibleCols.map((col, i) => (
                    <th key={col.key}
                      className={`font-medium py-2 px-3 ${i >= 2 ? "text-right" : "text-left"} ${!["ticker", "company", "pattern"].includes(col.key) ? "cursor-pointer hover:text-foreground" : ""}`}
                      onClick={() => { if (!["ticker", "company", "pattern"].includes(col.key)) handleSort(col.key as SortKey); }}
                    >
                      {col.label}{!["ticker", "company", "pattern"].includes(col.key) && <SortIcon col={col.key as SortKey} />}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(q => (
                  <tr key={q.ticker}
                    onClick={() => setSelected(q.ticker === selected ? null : q.ticker)}
                    className={`border-b border-border/50 cursor-pointer transition-colors ${selected === q.ticker ? "bg-brand/10" : ""} ${flashRows.has(q.ticker) ? "animate-flash-yellow" : "hover:bg-accent/40"}`}
                  >
                    {visibleCols.map((col, i) => {
                      const right = i >= 2;
                      if (col.key === "ticker") return <td key="ticker" className="py-1.5 px-3"><TickerBadge symbol={q.ticker} /></td>;
                      if (col.key === "company") return <td key="company" className="px-3 text-xs text-muted-foreground truncate max-w-[160px]">{q.company}</td>;
                      if (col.key === "price") return <td key="price" className="px-3 text-right"><LivePrice ticker={q.ticker} /></td>;
                      if (col.key === "changePct") return <td key="changePct" className="px-3 text-right"><ChangePill pct={q.changePct} /></td>;
                      if (col.key === "volume") return <td key="volume" className={`px-3 ${right ? "text-right" : ""} font-mono text-xs tabular-nums text-muted-foreground`}>{formatBig(q.volume)}</td>;
                      if (col.key === "relVolume") return <td key="relVolume" className="px-3 text-right font-mono text-xs tabular-nums"><span className={q.relVolume >= 2 ? "text-warn font-semibold" : ""}>{q.relVolume.toFixed(2)}x</span></td>;
                      if (col.key === "float") return <td key="float" className="px-3 text-right font-mono text-xs tabular-nums text-muted-foreground">{formatBig(q.float)}</td>;
                      if (col.key === "marketCap") return <td key="marketCap" className="px-3 text-right font-mono text-xs tabular-nums text-muted-foreground">{formatBig(q.marketCap)}</td>;
                      if (col.key === "rsi") return <td key="rsi" className="px-3 text-right font-mono text-xs tabular-nums"><span className={q.rsi > 70 ? "text-bear" : q.rsi < 30 ? "text-bull" : ""}>{q.rsi}</span></td>;
                      if (col.key === "pattern") return <td key="pattern" className="px-3 text-right text-xs text-muted-foreground">{q.pattern}</td>;
                      if (col.key === "aiScore") return <td key="aiScore" className="px-3 text-right"><ScoreBadge score={q.aiScore} /></td>;
                      return null;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Filter className="size-8 opacity-40" />
                No matches for current filters.
              </div>
            )}
          </div>
        </div>

        {selected && <StockDetailPanel ticker={selected} onClose={() => setSelected(null)} />}
      </div>
    </ErrorBoundary>
  );
}

function FilterGroup({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent/40">
        <span className="text-[11px] uppercase tracking-wider font-medium">{title}</span>
        <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function RangeRow({ label, value, onChange, max, step = 1 }: { label: string; value: number; onChange: (n: number) => void; max: number; step?: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums">{value}</span>
      </div>
      <input type="range" min={0} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} className="w-full accent-brand" />
    </div>
  );
}
