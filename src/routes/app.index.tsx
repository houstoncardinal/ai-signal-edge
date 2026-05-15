import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMarket } from "@/store/market";
import { INDEXES, NEWS, SIGNALS, formatBig } from "@/lib/mock";
import { TickerBadge, ChangePill, LivePrice, SentimentBadge, AIScoreGauge, ScoreBadge, MiniSpark } from "@/components/trade/primitives";
import { Activity, Sparkles, TrendingUp, TrendingDown, Star, ArrowUpRight, Circle, DollarSign } from "lucide-react";
import { StockDetailPanel } from "@/components/trade/StockDetailPanel";
import { ErrorBoundary } from "@/components/trade/ErrorBoundary";

export const Route = createFileRoute("/app/")({ component: Dashboard });

function heatColor(pct: number): { bg: string; fg: string } {
  if (pct > 5) return { bg: "rgba(0,212,170,0.80)", fg: "#000" };
  if (pct > 3) return { bg: "rgba(0,212,170,0.55)", fg: "#fff" };
  if (pct > 1) return { bg: "rgba(0,212,170,0.32)", fg: "#fff" };
  if (pct > -1) return { bg: "rgba(120,130,150,0.25)", fg: "#aaa" };
  if (pct > -3) return { bg: "rgba(239,68,68,0.32)", fg: "#fff" };
  if (pct > -5) return { bg: "rgba(239,68,68,0.55)", fg: "#fff" };
  return { bg: "rgba(239,68,68,0.80)", fg: "#fff" };
}

function Dashboard() {
  const quotes = useMarket((s) => s.quotes);
  const watchlist = useMarket((s) => s.watchlist);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);

  const all = Object.values(quotes);
  const gainers = [...all].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers = [...all].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
  const newSignals = SIGNALS.filter(s => s.isNew).length;

  const paperPnl = 1284; // simulated daily P&L
  const heatTickers = all.slice(0, 15);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Market status */}
        <div className="rounded-lg border border-border bg-surface px-4 py-3 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-bull" />
            </span>
            <span className="text-sm font-medium">Market Open</span>
            <span className="text-xs text-muted-foreground">· 14:32:08 ET</span>
          </div>
          <div className="h-6 w-px bg-border" />
          {INDEXES.map(idx => (
            <div key={idx.ticker} className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{idx.ticker}</span>
              <span className="font-mono text-sm tabular-nums">{idx.price.toFixed(2)}</span>
              <ChangePill pct={idx.changePct} />
            </div>
          ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KpiCard label="AI Signals Today" value={SIGNALS.length.toString()} sub={`${newSignals} new in last hour`} icon={Sparkles} color="brand" />
          <KpiCard label="High Confidence" value={SIGNALS.filter(s => s.confidence === "High").length.toString()} sub="Score ≥ 80" icon={Activity} color="bull" />
          <KpiCard label="Watchlist Active" value={watchlist.length.toString()} sub="Tracking live" icon={Star} color="warn" />
          <KpiCard label="Scanned Tickers" value="14,832" sub="Updated 2s ago" icon={TrendingUp} color="brand" />
          <KpiCard
            label="Today's P&L"
            value={`+$${paperPnl.toLocaleString()}`}
            sub="Paper trading"
            icon={DollarSign}
            color="bull"
          />
        </div>

        {/* Heat map */}
        <ErrorBoundary label="Heat map">
          <Panel title="Pre-Market Heat Map" right={<span className="text-[10px] text-muted-foreground">15 stocks · color = % change</span>}>
            <div className="grid grid-cols-5 gap-1.5">
              {heatTickers.map(q => {
                const { bg, fg } = heatColor(q.changePct);
                return (
                  <button key={q.ticker}
                    onClick={() => setSelectedTicker(q.ticker)}
                    className="rounded-md p-2 text-left transition-transform hover:scale-105 active:scale-95"
                    style={{ backgroundColor: bg }}
                  >
                    <div className="font-mono text-xs font-semibold" style={{ color: fg }}>{q.ticker}</div>
                    <div className="font-mono text-[10px] tabular-nums mt-0.5" style={{ color: fg }}>
                      {q.changePct >= 0 ? "+" : ""}{q.changePct.toFixed(2)}%
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </ErrorBoundary>

        {/* Two-col widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Panel title="Top Gainers" right={<Link to="/app/scanner" className="text-xs text-brand hover:underline flex items-center gap-1">View scanner <ArrowUpRight className="size-3" /></Link>}>
            <MoverList rows={gainers} positive onRowClick={setSelectedTicker} />
          </Panel>
          <Panel title="Top Losers">
            <MoverList rows={losers} onRowClick={setSelectedTicker} />
          </Panel>
        </div>

        {/* Watchlist + Recent signals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Panel className="lg:col-span-2" title="My Watchlist · Default" right={<span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live</span>}>
            <table className="w-full text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left font-medium py-2">Ticker</th>
                  <th className="text-right font-medium">Last</th>
                  <th className="text-right font-medium">Change</th>
                  <th className="text-right font-medium">Vol</th>
                  <th className="text-right font-medium">RSI</th>
                  <th className="text-right font-medium">AI</th>
                  <th className="text-right font-medium pr-2">Trend</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map(t => {
                  const q = quotes[t]; if (!q) return null;
                  return (
                    <tr key={t} onClick={() => setSelectedTicker(t)} className="border-b border-border/60 hover:bg-accent/40 cursor-pointer">
                      <td className="py-2"><TickerBadge symbol={t} /></td>
                      <td className="text-right"><LivePrice ticker={t} /></td>
                      <td className="text-right"><ChangePill pct={q.changePct} /></td>
                      <td className="text-right font-mono text-xs text-muted-foreground tabular-nums">{formatBig(q.volume)}</td>
                      <td className="text-right font-mono text-xs tabular-nums">{q.rsi}</td>
                      <td className="text-right"><ScoreBadge score={q.aiScore} /></td>
                      <td className="text-right pr-2"><div className="inline-block"><MiniSpark ticker={t} color={q.changePct >= 0 ? "var(--bull)" : "var(--bear)"} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
          <Panel title="Recent AI Signals" right={<Link to="/app/signals" className="text-xs text-brand hover:underline">All signals →</Link>}>
            <div className="space-y-2.5">
              {SIGNALS.slice(0, 3).map(s => (
                <div key={s.id} className="rounded-md border border-border p-2.5 hover:border-brand/40 transition-colors cursor-pointer" onClick={() => setSelectedTicker(s.ticker)}>
                  <div className="flex items-center gap-2">
                    <TickerBadge symbol={s.ticker} />
                    <span className="text-xs font-medium">{s.setup}</span>
                    <span className="ml-auto"><ScoreBadge score={s.aiScore} /></span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground font-mono tabular-nums">
                    <span>Entry {s.entry[0]}–{s.entry[1]}</span>
                    <span className="text-bull">Tgt {s.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Right news rail — auto-scrolling */}
      <aside className="hidden xl:flex w-80 shrink-0 flex-col border-l border-border bg-surface overflow-hidden">
        <div className="h-10 px-4 flex items-center justify-between border-b border-border shrink-0">
          <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">News Feed</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5"><Circle className="size-1.5 fill-bull text-bull" /> Live</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-news-scroll">
            {[...NEWS, ...NEWS].map((n, idx) => (
              <article key={`${n.id}-${idx}`} className="p-3 border-b border-border/60 hover:bg-accent/40 cursor-pointer">
                <div className="flex items-center justify-between">
                  <TickerBadge symbol={n.ticker} />
                  <SentimentBadge score={n.sentiment} />
                </div>
                <p className="mt-1.5 text-xs leading-snug">{n.headline}</p>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{n.source}</span>
                  <span>{n.ago} ago</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </aside>

      {selectedTicker && <StockDetailPanel ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="skeleton h-12 rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
      </div>
      <div className="skeleton h-48 rounded-lg" />
      <div className="grid grid-cols-2 gap-4">
        <div className="skeleton h-40 rounded-lg" />
        <div className="skeleton h-40 rounded-lg" />
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: any; color: "brand" | "bull" | "warn" }) {
  const c = color === "brand" ? "text-brand bg-brand/10" : color === "bull" ? "text-bull bg-bull/10" : "text-warn bg-warn/10";
  return (
    <div className="rounded-lg border border-border bg-surface p-3 flex items-center gap-3">
      <div className={`size-9 rounded-md flex items-center justify-center shrink-0 ${c}`}><Icon className="size-4" /></div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</div>
        <div className={`font-mono text-xl font-semibold tabular-nums leading-tight ${color === "bull" ? "text-bull" : ""}`}>{value}</div>
        <div className="text-[11px] text-muted-foreground truncate">{sub}</div>
      </div>
    </div>
  );
}

function Panel({ title, right, children, className = "" }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-border bg-surface ${className}`}>
      <header className="h-9 px-3 flex items-center justify-between border-b border-border">
        <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">{title}</h3>
        {right}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function MoverList({ rows, positive, onRowClick }: { rows: any[]; positive?: boolean; onRowClick?: (ticker: string) => void }) {
  return (
    <ul className="divide-y divide-border/60">
      {rows.map(q => (
        <li key={q.ticker} onClick={() => onRowClick?.(q.ticker)}
          className="flex items-center gap-3 py-2 first:pt-0 last:pb-0 cursor-pointer hover:bg-accent/40 rounded px-1 -mx-1 transition-colors">
          <TickerBadge symbol={q.ticker} />
          <span className="text-xs text-muted-foreground truncate flex-1">{q.company}</span>
          <span className="font-mono text-xs tabular-nums">{q.price.toFixed(2)}</span>
          <ChangePill pct={q.changePct} />
          {positive ? <TrendingUp className="size-3.5 text-bull shrink-0" /> : <TrendingDown className="size-3.5 text-bear shrink-0" />}
        </li>
      ))}
    </ul>
  );
}
