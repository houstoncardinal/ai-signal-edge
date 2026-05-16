import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries, HistogramSeries, ColorType, type IChartApi, type ISeriesApi } from "lightweight-charts";
import { useMarket } from "@/store/market";
import { TickerBadge, LivePrice, ChangePill, ScoreBadge, SentimentBadge } from "@/components/trade/primitives";
import { NEWS, formatBig } from "@/lib/mock";
import { Search, Activity, BarChart3, ChevronUp, ChevronDown } from "lucide-react";
import { ErrorBoundary } from "@/components/trade/ErrorBoundary";

export const Route = createFileRoute("/app/charts")({ component: ChartView });

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "D", "W"] as const;
type TF = (typeof TIMEFRAMES)[number];

const TF_BARS: Record<TF, number> = { "1m": 390, "5m": 180, "15m": 120, "1h": 180, "4h": 120, "D": 252, "W": 104 };
const TF_SECS: Record<TF, number> = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "D": 86400, "W": 604800 };

function genCandles(seed: string, count: number, interval: number, basePrice: number) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const data: any[] = []; let p = basePrice; const start = Math.floor(Date.now() / 1000) - count * interval;
  for (let i = 0; i < count; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    const drift = (((h % 1000) / 1000) - 0.5) * basePrice * 0.012;
    const open = p; const close = +(p + drift).toFixed(2);
    const high = +(Math.max(open, close) + Math.abs(drift) * 0.6).toFixed(2);
    const low = +(Math.min(open, close) - Math.abs(drift) * 0.6).toFixed(2);
    h = (h * 1103515245 + 12345) >>> 0;
    const volume = Math.floor(((h % 1000) / 1000) * 800000 + 200000);
    data.push({ time: start + i * interval, open, high, low, close, value: volume, color: close >= open ? "rgba(0,212,170,0.5)" : "rgba(239,68,68,0.5)" });
    p = close;
  }
  return data;
}

function ChartView() {
  const activeChartTicker = useMarket(s => s.activeChartTicker);
  const [ticker, setTicker] = useState(activeChartTicker);
  const [tf, setTf] = useState<TF>("1h");
  const [showL2, setShowL2] = useState(true);
  const quotes = useMarket(s => s.quotes);
  const q = quotes[ticker] ?? quotes["NVDA"];
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  useEffect(() => { setTicker(activeChartTicker); }, [activeChartTicker]);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#9ca3af", fontFamily: "JetBrains Mono, monospace" },
      grid: { vertLines: { color: "rgba(48,54,61,0.4)" }, horzLines: { color: "rgba(48,54,61,0.4)" } },
      rightPriceScale: { borderColor: "rgba(48,54,61,0.6)" },
      timeScale: { borderColor: "rgba(48,54,61,0.6)", timeVisible: true },
      crosshair: { vertLine: { color: "#2D8CFF", width: 1 }, horzLine: { color: "#2D8CFF", width: 1 } },
    });
    chartRef.current = chart;
    candleRef.current = chart.addSeries(CandlestickSeries, {
      upColor: "#00D4AA", downColor: "#EF4444", borderUpColor: "#00D4AA", borderDownColor: "#EF4444", wickUpColor: "#00D4AA", wickDownColor: "#EF4444",
    });
    volRef.current = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "" });
    volRef.current.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    const resize = () => containerRef.current && chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    resize();
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.remove(); };
  }, []);

  useEffect(() => {
    if (!candleRef.current || !volRef.current || !q) return;
    const bars = TF_BARS[tf]; const interval = TF_SECS[tf];
    const data = genCandles(ticker + tf, bars, interval, q.prevClose);
    candleRef.current.setData(data);
    volRef.current.setData(data.map(d => ({ time: d.time, value: d.value, color: d.color })));
    chartRef.current?.timeScale().fitContent();
  }, [ticker, tf, q?.prevClose]);

  const tickerNews = NEWS.filter(n => n.ticker === ticker).slice(0, 4);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-3rem)]">
        {/* Top bar */}
        <div className="h-12 px-4 border-b border-border bg-surface flex items-center gap-3 shrink-0 flex-wrap">
          <div className="relative">
            <Search className="size-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
              className="h-8 pl-7 pr-2 w-28 bg-background border border-border rounded font-mono text-sm uppercase focus:ring-2 focus:ring-brand/40 focus:outline-none" />
          </div>
          {q && (
            <>
              <LivePrice ticker={ticker} className="text-lg font-semibold" />
              <ChangePill pct={q.changePct} value={q.change} />
              <span className="text-xs text-muted-foreground hidden sm:block">{q.company}</span>
            </>
          )}
          <div className="h-6 w-px bg-border ml-2" />
          <div className="flex items-center gap-0.5 p-0.5 rounded-md border border-border bg-background">
            {TIMEFRAMES.map(t => (
              <button key={t} onClick={() => setTf(t)}
                className={`h-6 px-2 rounded text-xs font-mono transition-colors ${tf === t ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
          <button className="h-8 px-2.5 rounded-md border border-border bg-background hover:bg-accent text-xs flex items-center gap-1.5 hidden sm:flex"><BarChart3 className="size-3.5" /> Candles</button>
          <button className="h-8 px-2.5 rounded-md border border-border bg-background hover:bg-accent text-xs flex items-center gap-1.5 hidden sm:flex"><Activity className="size-3.5" /> VWAP · EMA</button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <div ref={containerRef} className="flex-1 min-h-0" />
            {showL2 && q && (
              <div className="h-56 border-t border-border bg-surface grid grid-cols-2 shrink-0">
                <L2Book price={q.price} />
                <TimeSales ticker={ticker} basePrice={q.price} />
              </div>
            )}
            <button onClick={() => setShowL2(!showL2)} className="h-7 border-t border-border bg-surface hover:bg-accent flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
              {showL2 ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />} Level 2 · Time & Sales
            </button>
          </div>

          {/* AI side panel */}
          <aside className="w-72 shrink-0 border-l border-border bg-surface overflow-auto hidden lg:block">
            <div className="p-4 space-y-4">
              <div className="rounded-md border border-border p-3 bg-background">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Setup Quality</span>
                  {q && <ScoreBadge score={q.aiScore} />}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div><div className="text-muted-foreground">Pattern</div><div className="font-medium mt-0.5">{q?.pattern}</div></div>
                  <div><div className="text-muted-foreground">RSI(14)</div><div className="font-mono tabular-nums mt-0.5">{q?.rsi}</div></div>
                  <div><div className="text-muted-foreground">Float</div><div className="font-mono mt-0.5">{q && formatBig(q.float)}</div></div>
                  <div><div className="text-muted-foreground">Rel Vol</div><div className="font-mono mt-0.5">{q?.relVolume.toFixed(2)}x</div></div>
                </div>
              </div>

              <Section title="Support / Resistance">
                {q && [
                  { lvl: "R2", price: q.price * 1.06, type: "res" },
                  { lvl: "R1", price: q.price * 1.025, type: "res" },
                  { lvl: "Pivot", price: q.price, type: "piv" },
                  { lvl: "S1", price: q.price * 0.975, type: "sup" },
                  { lvl: "S2", price: q.price * 0.94, type: "sup" },
                ].map(l => (
                  <div key={l.lvl} className="flex items-center justify-between py-1 text-xs">
                    <span className={`font-medium ${l.type === "res" ? "text-bear" : l.type === "sup" ? "text-bull" : "text-muted-foreground"}`}>{l.lvl}</span>
                    <span className="font-mono tabular-nums">{l.price.toFixed(2)}</span>
                  </div>
                ))}
              </Section>

              <Section title="Pattern Detected">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-brand/15 text-brand border border-brand/30 font-medium">{q?.pattern || "—"}</span>
                  <span className="text-[10px] text-muted-foreground">CNN 81%</span>
                </div>
              </Section>

              <Section title="News & Sentiment" right={q && <SentimentBadge score={Math.round((q.aiScore - 70) * 2)} />}>
                <div className="space-y-2">
                  {tickerNews.length > 0 ? tickerNews.map(n => (
                    <div key={n.id} className="text-[11px] leading-snug border-l-2 border-brand/40 pl-2">
                      <p>{n.headline}</p>
                      <div className="flex items-center justify-between mt-0.5 text-muted-foreground text-[10px]">
                        <span>{n.source} · {n.ago}</span>
                        <SentimentBadge score={n.sentiment} />
                      </div>
                    </div>
                  )) : <p className="text-[11px] text-muted-foreground">No tagged news in last 24h.</p>}
                </div>
              </Section>
            </div>
          </aside>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{title}</h4>
        {right}
      </div>
      <div>{children}</div>
    </div>
  );
}

function L2Book({ price }: { price: number }) {
  const [rows, setRows] = useState(() => buildL2(price));
  const [flashedRows, setFlashedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setRows(prev => {
        const next = prev.map((r, i) => ({
          ...r,
          bidSize: Math.max(100, r.bidSize + Math.floor((Math.random() - 0.5) * 600)),
          askSize: Math.max(100, r.askSize + Math.floor((Math.random() - 0.5) * 600)),
        }));
        const changed = new Set<number>();
        prev.forEach((r, i) => { if (r.bidSize !== next[i].bidSize || r.askSize !== next[i].askSize) changed.add(i); });
        setFlashedRows(changed);
        setTimeout(() => setFlashedRows(new Set()), 400);
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const maxSize = Math.max(...rows.map(r => Math.max(r.bidSize, r.askSize)));

  return (
    <div className="overflow-auto">
      <div className="grid grid-cols-4 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border px-3 py-1.5 sticky top-0 bg-surface">
        <span>Bid Size</span><span className="text-bull">Bid</span><span className="text-bear">Ask</span><span className="text-right">Ask Size</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className={`grid grid-cols-4 text-xs font-mono tabular-nums px-3 py-1 border-b border-border/30 relative transition-colors ${flashedRows.has(i) ? "bg-brand/10" : ""}`}>
          <div className="relative"><div className="absolute inset-y-0 left-0 bg-bull/10 transition-all" style={{ width: `${(r.bidSize / maxSize) * 100}%` }} /><span className="relative">{r.bidSize}</span></div>
          <span className="text-bull">{r.bidPrice.toFixed(2)}</span>
          <span className="text-bear">{r.askPrice.toFixed(2)}</span>
          <div className="relative text-right"><div className="absolute inset-y-0 right-0 bg-bear/10 transition-all" style={{ width: `${(r.askSize / maxSize) * 100}%` }} /><span className="relative">{r.askSize}</span></div>
        </div>
      ))}
    </div>
  );
}

function buildL2(price: number) {
  return Array.from({ length: 10 }).map((_, i) => ({
    bidPrice: +(price - 0.01 - i * 0.02).toFixed(2),
    askPrice: +(price + 0.01 + i * 0.02).toFixed(2),
    bidSize: Math.floor(2400 - i * 180 + Math.random() * 400),
    askSize: Math.floor(2200 - i * 160 + Math.random() * 400),
  }));
}

function TimeSales({ ticker, basePrice }: { ticker: string; basePrice: number }) {
  const tick = useMarket(s => s.ticks[ticker]);
  const rowsRef = useRef<{ time: string; price: number; size: number; side: "B" | "S"; flash?: boolean }[]>([]);

  if (rowsRef.current.length === 0) {
    rowsRef.current = Array.from({ length: 30 }).map((_, i) => ({
      time: new Date(Date.now() - i * 1500).toLocaleTimeString("en-US", { hour12: false }),
      price: +(basePrice + (Math.random() - 0.5) * 0.5).toFixed(2),
      size: Math.floor(Math.random() * 800 + 100),
      side: Math.random() > 0.5 ? "B" : "S",
    }));
  }

  useEffect(() => {
    if (!tick) return;
    const newRow = {
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      price: +(basePrice + (Math.random() - 0.5) * 0.3).toFixed(2),
      size: Math.floor(Math.random() * 600 + 100),
      side: (tick.dir === "up" ? "B" : "S") as "B" | "S",
      flash: true,
    };
    rowsRef.current = [newRow, ...rowsRef.current.slice(0, 29)];
  }, [tick]);

  return (
    <div className="overflow-auto border-l border-border">
      <div className="grid grid-cols-4 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border px-3 py-1.5 sticky top-0 bg-surface">
        <span>Time</span><span>Price</span><span>Size</span><span className="text-right">Side</span>
      </div>
      {rowsRef.current.map((r, i) => (
        <div key={i} className={`grid grid-cols-4 text-xs font-mono tabular-nums px-3 py-1 border-b border-border/30 ${i === 0 && r.flash ? "bg-brand/10" : ""}`}>
          <span className="text-muted-foreground">{r.time}</span>
          <span>{r.price.toFixed(2)}</span>
          <span>{r.size}</span>
          <span className={`text-right ${r.side === "B" ? "text-bull" : "text-bear"}`}>{r.side}</span>
        </div>
      ))}
    </div>
  );
}
