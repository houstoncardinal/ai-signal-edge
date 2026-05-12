import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMarket } from "@/store/market";
import { TickerBadge, ChangePill, LivePrice, ScoreBadge, formatBig } from "@/components/trade/primitives";
import { ChevronDown, Play, Save, RefreshCw, X, Filter } from "lucide-react";

export const Route = createFileRoute("/app/scanner")({ component: Scanner });

const PRESETS = ["AI Top Picks", "Top Gainers", "High Relative Volume", "Gap Ups", "Low Float Runners", "Breakouts", "Oversold Bounce"];

function Scanner() {
  const quotes = useMarket((s) => s.quotes);
  const [preset, setPreset] = useState("AI Top Picks");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [minRelVol, setMinRelVol] = useState(1);
  const [minScore, setMinScore] = useState(60);
  const [selected, setSelected] = useState<string | null>(null);
  const [auto, setAuto] = useState(true);

  const rows = useMemo(() => {
    let r = Object.values(quotes).filter(q => q.price >= minPrice && q.price <= maxPrice && q.relVolume >= minRelVol && q.aiScore >= minScore);
    if (preset === "AI Top Picks") r.sort((a, b) => b.aiScore - a.aiScore);
    else if (preset === "Top Gainers") r.sort((a, b) => b.changePct - a.changePct);
    else if (preset === "High Relative Volume") r.sort((a, b) => b.relVolume - a.relVolume);
    else if (preset === "Low Float Runners") r = r.filter(q => q.float < 600_000_000).sort((a, b) => b.changePct - a.changePct);
    else if (preset === "Gap Ups") r = r.filter(q => q.changePct > 2).sort((a, b) => b.changePct - a.changePct);
    return r;
  }, [quotes, preset, minPrice, maxPrice, minRelVol, minScore]);

  const sel = selected ? quotes[selected] : null;

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Filter sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-surface overflow-auto">
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
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 px-4 border-b border-border bg-surface flex items-center gap-3">
          <button className="h-8 px-3 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-sm font-medium flex items-center gap-1.5">
            <Play className="size-3.5 fill-current" /> Run Scan
          </button>
          <button className="h-8 px-3 rounded-md border border-border bg-background hover:bg-accent text-sm flex items-center gap-1.5">
            <Save className="size-3.5" /> Save
          </button>
          <div className="h-6 w-px bg-border" />
          <span className="text-xs text-muted-foreground"><span className="font-mono tabular-nums text-foreground">{rows.length}</span> results</span>
          <span className="text-xs text-muted-foreground">· Updated <span className="font-mono">2s</span> ago</span>
          <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <RefreshCw className="size-3.5" />
            <span>Auto-refresh</span>
            <span className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${auto ? "bg-brand" : "bg-muted"}`} onClick={() => setAuto(!auto)}>
              <span className={`absolute top-0.5 size-3 rounded-full bg-white transition-transform ${auto ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </span>
          </label>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground z-10">
              <tr>
                {["Ticker", "Company", "Price", "Chg %", "Volume", "Rel Vol", "Float", "Mkt Cap", "RSI", "Pattern", "AI Score"].map((h, i) => (
                  <th key={h} className={`font-medium py-2 px-3 ${i >= 2 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(q => (
                <tr key={q.ticker} onClick={() => setSelected(q.ticker)}
                  className={`border-b border-border/50 cursor-pointer hover:bg-accent/40 ${selected === q.ticker ? "bg-brand/10" : ""}`}>
                  <td className="py-1.5 px-3"><TickerBadge symbol={q.ticker} /></td>
                  <td className="px-3 text-xs text-muted-foreground truncate max-w-[200px]">{q.company}</td>
                  <td className="px-3 text-right"><LivePrice ticker={q.ticker} /></td>
                  <td className="px-3 text-right"><ChangePill pct={q.changePct} /></td>
                  <td className="px-3 text-right font-mono text-xs tabular-nums text-muted-foreground">{formatBig(q.volume)}</td>
                  <td className="px-3 text-right font-mono text-xs tabular-nums">
                    <span className={q.relVolume >= 2 ? "text-warn font-semibold" : ""}>{q.relVolume.toFixed(2)}x</span>
                  </td>
                  <td className="px-3 text-right font-mono text-xs tabular-nums text-muted-foreground">{formatBig(q.float)}</td>
                  <td className="px-3 text-right font-mono text-xs tabular-nums text-muted-foreground">{formatBig(q.marketCap)}</td>
                  <td className="px-3 text-right font-mono text-xs tabular-nums">
                    <span className={q.rsi > 70 ? "text-bear" : q.rsi < 30 ? "text-bull" : ""}>{q.rsi}</span>
                  </td>
                  <td className="px-3 text-right text-xs text-muted-foreground">{q.pattern}</td>
                  <td className="px-3 text-right"><ScoreBadge score={q.aiScore} /></td>
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

      {/* Slide-in detail */}
      {sel && (
        <aside className="w-96 shrink-0 border-l border-border bg-surface overflow-auto animate-in slide-in-from-right">
          <div className="h-12 px-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TickerBadge symbol={sel.ticker} size="md" />
              <span className="text-sm text-muted-foreground">{sel.company}</span>
            </div>
            <button onClick={() => setSelected(null)} className="size-7 rounded hover:bg-accent flex items-center justify-center"><X className="size-4" /></button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-baseline gap-3">
              <LivePrice ticker={sel.ticker} className="text-3xl font-semibold" />
              <ChangePill pct={sel.changePct} value={sel.change} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Stat label="Volume" value={formatBig(sel.volume)} />
              <Stat label="Rel Vol" value={`${sel.relVolume.toFixed(2)}x`} accent={sel.relVolume >= 2} />
              <Stat label="Float" value={formatBig(sel.float)} />
              <Stat label="Mkt Cap" value={`$${formatBig(sel.marketCap)}`} />
              <Stat label="RSI" value={sel.rsi.toString()} />
              <Stat label="Sector" value={sel.sector} />
            </div>
            <div className="rounded-md border border-border p-3 bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Setup Quality</span>
                <ScoreBadge score={sel.aiScore} />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground italic">
                Pattern recognition flags <span className="text-foreground font-medium not-italic">{sel.pattern}</span> with relative volume confirmation.
                LLM rationale: setup aligns with sector momentum and aggregated 24h sentiment, suggesting elevated follow-through probability.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 h-9 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-sm font-medium">Open Chart</button>
              <button className="flex-1 h-9 rounded-md border border-border hover:bg-accent text-sm">Add to Watchlist</button>
            </div>
          </div>
        </aside>
      )}
    </div>
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

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-md border border-border p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono text-sm tabular-nums mt-0.5 ${accent ? "text-warn font-semibold" : ""}`}>{value}</div>
    </div>
  );
}
