import { useEffect, useRef, useState } from "react";
import { X, Bell, LineChart, Plus } from "lucide-react";
import { createChart, CandlestickSeries, ColorType, type IChartApi } from "lightweight-charts";
import { useMarket } from "@/store/market";
import { NEWS, formatBig } from "@/lib/mock";
import { TickerBadge, ChangePill, LivePrice, ScoreBadge, SentimentBadge, AIScoreGauge } from "./primitives";
import { AlertModal } from "./AlertModal";
import { toast } from "sonner";

function genMiniCandles(seed: string, count = 60, base = 100) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const data: { time: number; open: number; high: number; low: number; close: number }[] = [];
  let p = base; const start = Math.floor(Date.now() / 1000) - count * 900;
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const drift = (((h % 1000) / 1000) - 0.5) * base * 0.012;
    const open = p; const close = +(p + drift).toFixed(2);
    const high = +(Math.max(open, close) + Math.abs(drift) * 0.5).toFixed(2);
    const low = +(Math.min(open, close) - Math.abs(drift) * 0.5).toFixed(2);
    data.push({ time: start + i * 900, open, high, low, close });
    p = close;
  }
  return data;
}

const QUARTERLY = [
  { q: "Q1 2026", rev: "26.04B", eps: "0.89" },
  { q: "Q4 2025", rev: "22.11B", eps: "0.72" },
  { q: "Q3 2025", rev: "18.76B", eps: "0.61" },
  { q: "Q2 2025", rev: "15.33B", eps: "0.49" },
];

type Tab = "Overview" | "AI Report" | "News" | "Financials";

export function StockDetailPanel({ ticker, onClose }: { ticker: string; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [alertOpen, setAlertOpen] = useState(false);
  const q = useMarket(s => s.quotes[ticker]);
  const addToWatchlist = useMarket(s => s.addToWatchlist);
  const chartRef = useRef<IChartApi>();
  const containerRef = useRef<HTMLDivElement>(null);
  const tickerNews = NEWS.filter(n => n.ticker === ticker).slice(0, 4);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !q) return;
    const chart = createChart(el, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#9ca3af", fontFamily: "JetBrains Mono, monospace", fontSize: 10 },
      grid: { vertLines: { color: "rgba(48,54,61,0.4)" }, horzLines: { color: "rgba(48,54,61,0.4)" } },
      rightPriceScale: { borderColor: "rgba(48,54,61,0.6)", visible: true },
      timeScale: { borderColor: "rgba(48,54,61,0.6)", timeVisible: false, visible: true },
      crosshair: { vertLine: { color: "#2D8CFF", width: 1 }, horzLine: { color: "#2D8CFF", width: 1 } },
      handleScroll: false, handleScale: false,
    });
    chartRef.current = chart;
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#00D4AA", downColor: "#EF4444", borderUpColor: "#00D4AA", borderDownColor: "#EF4444", wickUpColor: "#00D4AA", wickDownColor: "#EF4444",
    });
    series.setData(genMiniCandles(ticker, 60, q.prevClose));
    const resize = () => { if (el) chart.applyOptions({ width: el.clientWidth, height: el.clientHeight }); };
    resize();
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.remove(); };
  }, [ticker, q?.prevClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!q) return null;

  const handleAddWatchlist = () => {
    const added = addToWatchlist(ticker);
    if (added) toast.success(`${ticker} added to watchlist`);
    else toast.info(`${ticker} is already in your watchlist`);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <aside className="fixed top-0 right-0 h-full w-[420px] z-50 border-l border-border bg-surface shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-14 px-4 border-b border-border flex items-center gap-3 shrink-0">
          <TickerBadge symbol={ticker} size="md" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{q.company}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <LivePrice ticker={ticker} className="text-base font-semibold" />
              <ChangePill pct={q.changePct} value={q.change} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setAlertOpen(true)} className="size-7 rounded hover:bg-accent flex items-center justify-center text-muted-foreground" title="Set alert">
              <Bell className="size-3.5" />
            </button>
            <button onClick={onClose} className="size-7 rounded hover:bg-accent flex items-center justify-center text-muted-foreground">
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Mini chart */}
        <div ref={containerRef} className="h-[160px] shrink-0 border-b border-border" />

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {(["Overview", "AI Report", "News", "Financials"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${tab === t ? "border-b-2 border-brand text-brand" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-4">
          {tab === "Overview" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Market Cap", value: `$${formatBig(q.marketCap)}` },
                  { label: "Float", value: formatBig(q.float) },
                  { label: "Avg Volume", value: formatBig(q.volume) },
                  { label: "Rel Volume", value: `${q.relVolume.toFixed(2)}x`, accent: q.relVolume >= 2 },
                  { label: "RSI (14)", value: q.rsi.toString() },
                  { label: "AI Score", value: q.aiScore.toString() },
                  { label: "52W High", value: `$${(q.prevClose * 1.38).toFixed(2)}` },
                  { label: "52W Low", value: `$${(q.prevClose * 0.62).toFixed(2)}` },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="rounded-md border border-border bg-background p-2.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
                    <div className={`font-mono text-sm tabular-nums mt-0.5 font-medium ${accent ? "text-warn" : ""}`}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sector</div>
              <div className="text-sm">{q.sector}</div>
            </div>
          )}

          {tab === "AI Report" && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <AIScoreGauge score={q.aiScore} size={72} />
                <div>
                  <div className="text-xs font-semibold">Setup Quality Score</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {q.aiScore >= 85 ? "Strong setup — high conviction" : q.aiScore >= 75 ? "Good setup — above average" : "Moderate — watch for confirmation"}
                  </div>
                  <ScoreBadge score={q.aiScore} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Analysis</div>
                {[
                  `${q.pattern} pattern detected with ${q.relVolume.toFixed(1)}x relative volume confirmation.`,
                  `Sector momentum in ${q.sector} is elevated; RSI at ${q.rsi} suggests room to run.`,
                  `Aggregated 24h news sentiment scores +${Math.abs(Math.round((q.aiScore - 70) * 1.5))} — bullish catalyst flow.`,
                  `Float of ${formatBig(q.float)} shares supports fast price movement on volume surges.`,
                  `Pattern CNN model flags 78% historical follow-through within 2 sessions.`,
                ].map((bullet, i) => (
                  <p key={i} className="text-xs leading-relaxed text-muted-foreground italic pl-3 border-l-2 border-brand/30">
                    {bullet}
                  </p>
                ))}
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Support / Resistance</div>
                {[
                  { lvl: "R2", price: q.price * 1.06, type: "res" },
                  { lvl: "R1", price: q.price * 1.025, type: "res" },
                  { lvl: "Pivot", price: q.price, type: "piv" },
                  { lvl: "S1", price: q.price * 0.975, type: "sup" },
                  { lvl: "S2", price: q.price * 0.94, type: "sup" },
                ].map(l => (
                  <div key={l.lvl} className="flex items-center justify-between py-1 border-b border-border/40 text-xs">
                    <span className={`font-medium ${l.type === "res" ? "text-bear" : l.type === "sup" ? "text-bull" : "text-muted-foreground"}`}>{l.lvl}</span>
                    <span className="font-mono tabular-nums">{l.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-brand/15 text-brand border border-brand/30 font-medium">{q.pattern}</span>
                <span className="text-[10px] text-muted-foreground">CNN confidence 81%</span>
              </div>
            </div>
          )}

          {tab === "News" && (
            <div className="space-y-2.5">
              {tickerNews.length > 0 ? tickerNews.map(n => (
                <div key={n.id} className="rounded-md border border-border p-2.5 hover:border-brand/40 transition-colors cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">{n.source} · {n.ago} ago</span>
                    <SentimentBadge score={n.sentiment} />
                  </div>
                  <p className="text-xs leading-snug">{n.headline}</p>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-8">No recent news for {ticker}.</p>
              )}
            </div>
          )}

          {tab === "Financials" && (
            <div className="space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quarterly Financials</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
                    <th className="text-left py-1.5 font-medium">Quarter</th>
                    <th className="text-right font-medium">Revenue</th>
                    <th className="text-right font-medium">EPS</th>
                  </tr>
                </thead>
                <tbody>
                  {QUARTERLY.map(row => (
                    <tr key={row.q} className="border-b border-border/40">
                      <td className="py-2 font-medium">{row.q}</td>
                      <td className="text-right font-mono tabular-nums">${row.rev}</td>
                      <td className="text-right font-mono tabular-nums text-bull">${row.eps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-[10px] text-muted-foreground">* Mock data for demonstration purposes</div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-4 pt-2 border-t border-border flex gap-2 shrink-0">
          <button onClick={handleAddWatchlist} className="flex-1 h-9 rounded-md border border-border hover:bg-accent text-xs flex items-center justify-center gap-1.5">
            <Plus className="size-3.5" /> Watchlist
          </button>
          <button className="flex-1 h-9 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5">
            <LineChart className="size-3.5" /> Open Chart
          </button>
        </div>
      </aside>

      {alertOpen && <AlertModal ticker={ticker} onClose={() => setAlertOpen(false)} />}
    </>
  );
}
