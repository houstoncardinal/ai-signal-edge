import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMarket } from "@/store/market";
import { TickerBadge, LivePrice, ChangePill, formatBig } from "@/components/trade/primitives";
import { TrendingUp, TrendingDown, Beaker } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/trade/EmptyState";
import { ErrorBoundary } from "@/components/trade/ErrorBoundary";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/app/paper")({ component: PaperTradingPage });

const QUICK_SIZES = [500, 1000, 2500, 5000];
const ORDER_TYPES = ["Market", "Limit", "Stop"] as const;

function PaperTradingPage() {
  const quotes = useMarket(s => s.quotes);
  const paperPositions = useMarket(s => s.paperPositions);
  const paperFills = useMarket(s => s.paperFills);
  const paperCash = useMarket(s => s.paperCash);
  const submitPaperOrder = useMarket(s => s.submitPaperOrder);
  const closePaperPosition = useMarket(s => s.closePaperPosition);

  const [ticker, setTicker] = useState("NVDA");
  const [side, setSide] = useState<"Buy" | "Sell">("Buy");
  const [qty, setQty] = useState("");
  const [orderType, setOrderType] = useState<(typeof ORDER_TYPES)[number]>("Market");
  const [limitPrice, setLimitPrice] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);

  const startValue = 100_000;
  const positionsValue = paperPositions.reduce((acc, p) => {
    const q = quotes[p.ticker];
    return acc + (q ? q.price * p.qty : p.avgCost * p.qty);
  }, 0);
  const accountValue = paperCash + positionsValue;
  const totalReturn = ((accountValue - startValue) / startValue * 100).toFixed(2);
  const dayPnl = paperPositions.reduce((acc, p) => {
    const q = quotes[p.ticker];
    if (!q) return acc;
    return acc + (q.price - q.prevClose) * p.qty * (p.side === "Short" ? -1 : 1);
  }, 0);

  const equityCurveData = useMemo(() => {
    const base = startValue;
    return Array.from({ length: 30 }).map((_, i) => {
      const variation = (Math.sin(i * 0.4) * 2000 + Math.cos(i * 0.3) * 1500 + i * 80);
      return { day: i + 1, value: Math.round(base + variation) };
    });
  }, []);

  function handleQuickSize(dollars: number) {
    const price = quotes[ticker]?.price ?? 0;
    if (!price) return;
    setQty(Math.floor(dollars / price).toString());
  }

  function handleSubmit() {
    const t = ticker.trim().toUpperCase();
    if (!t || !qty || parseInt(qty) <= 0) { toast.error("Enter a valid ticker and quantity"); return; }
    if (!quotes[t]) { toast.error(`Ticker "${t}" not found in mock data`); return; }
    const price = orderType === "Limit" && limitPrice ? parseFloat(limitPrice) : quotes[t]?.price ?? 0;
    submitPaperOrder(t, side, parseInt(qty), price);
    toast.success(`${side} ${qty} ${t} @ $${price.toFixed(2)}`, { description: "Paper order filled" });
    setQty(""); setLimitPrice("");
  }

  const chartStyle = { backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 };

  return (
    <ErrorBoundary>
      <div className="flex h-[calc(100vh-3rem)] flex-col lg:flex-row">
        {/* LEFT: Order Entry + Positions */}
        <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface flex flex-col">
          {/* Order Entry Panel */}
          <div className="p-4 border-b border-border space-y-3">
            <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Order Entry</h3>

            {/* Ticker */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Ticker</label>
              <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())}
                className="mt-1 w-full h-8 px-2 bg-background border border-border rounded text-sm font-mono uppercase focus:ring-2 focus:ring-brand/40 focus:outline-none" />
            </div>

            {/* Side */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Side</label>
              <div className="mt-1 flex rounded-md border border-border overflow-hidden h-9 text-sm font-semibold">
                <button onClick={() => setSide("Buy")} className={`flex-1 transition-colors ${side === "Buy" ? "bg-bull text-background" : "bg-background hover:bg-accent"}`}>Buy</button>
                <button onClick={() => setSide("Sell")} className={`flex-1 transition-colors ${side === "Sell" ? "bg-bear text-white" : "bg-background hover:bg-accent"}`}>Sell</button>
              </div>
            </div>

            {/* Order Type */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Order Type</label>
              <select value={orderType} onChange={e => setOrderType(e.target.value as any)}
                className="mt-1 w-full h-8 px-2 bg-background border border-border rounded text-sm focus:outline-none">
                {ORDER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Limit Price */}
            {orderType !== "Market" && (
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{orderType} Price</label>
                <input type="number" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                  className="mt-1 w-full h-8 px-2 bg-background border border-border rounded text-sm font-mono focus:ring-2 focus:ring-brand/40 focus:outline-none" placeholder="0.00" />
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Quantity (Shares)</label>
              <input type="number" value={qty} onChange={e => setQty(e.target.value)}
                className="mt-1 w-full h-8 px-2 bg-background border border-border rounded text-sm font-mono focus:ring-2 focus:ring-brand/40 focus:outline-none" placeholder="0" />
            </div>

            {/* Quick size buttons */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Quick Size</label>
              <div className="mt-1 grid grid-cols-4 gap-1">
                {QUICK_SIZES.map(s => (
                  <button key={s} onClick={() => handleQuickSize(s)}
                    className="h-7 rounded border border-border bg-background hover:bg-accent text-xs font-medium transition-colors">
                    ${s >= 1000 ? `${s / 1000}k` : s}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit}
              className="w-full h-10 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground font-semibold text-sm transition-colors">
              Submit Order
            </button>
          </div>

          {/* Open Positions */}
          <div className="flex-1 overflow-auto">
            <div className="h-9 px-3 flex items-center border-b border-border">
              <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Open Positions</span>
            </div>
            {loading ? (
              <div className="p-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
              </div>
            ) : paperPositions.length === 0 ? (
              <EmptyState icon={Beaker} title="No open positions" description="Submit a paper order to open a position." />
            ) : (
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-1.5 font-medium">Ticker</th>
                    <th className="text-right px-3 font-medium">Qty</th>
                    <th className="text-right px-3 font-medium">P&L</th>
                    <th className="px-3" />
                  </tr>
                </thead>
                <tbody>
                  {paperPositions.map(p => {
                    const q = quotes[p.ticker];
                    const pnl = q ? (q.price - p.avgCost) * p.qty * (p.side === "Short" ? -1 : 1) : 0;
                    const pct = q ? (q.price - p.avgCost) / p.avgCost * 100 : 0;
                    return (
                      <tr key={p.ticker} className="border-b border-border/50 hover:bg-accent/40">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <TickerBadge symbol={p.ticker} />
                            <span className={`text-[9px] ${p.side === "Long" ? "text-bull" : "text-bear"}`}>{p.side}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">@{p.avgCost.toFixed(2)}</div>
                        </td>
                        <td className="px-3 text-right font-mono tabular-nums">{p.qty}</td>
                        <td className={`px-3 text-right font-mono tabular-nums font-semibold ${pnl >= 0 ? "text-bull" : "text-bear"}`}>
                          {pnl >= 0 ? "+" : ""}{pct.toFixed(1)}%
                        </td>
                        <td className="px-3 text-right">
                          <button onClick={() => { closePaperPosition(p.ticker); toast.success(`${p.ticker} position closed`); }}
                            className="text-[10px] text-bear hover:underline">Close</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* RIGHT: Portfolio + Fills + Equity Curve */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          {/* Portfolio summary cards */}
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-border shrink-0">
            <PortfolioCard label="Account Value" value={`$${accountValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
            <PortfolioCard label="Buying Power" value={`$${(paperCash * 2).toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
            <PortfolioCard label="Day P&L" value={`${dayPnl >= 0 ? "+" : ""}$${dayPnl.toFixed(0)}`} color={dayPnl >= 0 ? "text-bull" : "text-bear"} />
            <PortfolioCard label="Total Return" value={`${parseFloat(totalReturn) >= 0 ? "+" : ""}${totalReturn}%`} color={parseFloat(totalReturn) >= 0 ? "text-bull" : "text-bear"} />
          </div>

          {/* Equity curve */}
          <div className="p-4 border-b border-border shrink-0">
            <h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-3">Equity Curve</h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurveData}>
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(48,54,61,0.5)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} label={{ value: "Session", position: "insideBottom", offset: -2, fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={chartStyle} formatter={(v: number) => [`$${v.toLocaleString()}`, "Value"]} />
                  <Area type="monotone" dataKey="value" stroke="var(--brand)" fill="url(#equityGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Fills History */}
          <div className="flex-1 overflow-auto">
            <div className="h-9 px-4 flex items-center border-b border-border sticky top-0 bg-surface z-10">
              <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Fill History</span>
              <span className="ml-2 text-[10px] text-muted-foreground">{paperFills.length} fills</span>
            </div>
            {paperFills.length === 0 ? (
              <EmptyState icon={Beaker} title="No fills yet" description="Submit an order to see fills here." />
            ) : (
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-muted-foreground border-b border-border sticky top-9 bg-surface z-10">
                  <tr>
                    <th className="text-left px-4 py-1.5 font-medium">Time</th>
                    <th className="text-left px-3 font-medium">Ticker</th>
                    <th className="text-left px-3 font-medium">Side</th>
                    <th className="text-right px-3 font-medium">Qty</th>
                    <th className="text-right px-3 font-medium">Price</th>
                    <th className="text-right px-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {paperFills.map(f => (
                    <tr key={f.id} className="border-b border-border/50 hover:bg-accent/40">
                      <td className="px-4 py-2 font-mono text-muted-foreground tabular-nums">{f.time}</td>
                      <td className="px-3 py-2"><TickerBadge symbol={f.ticker} /></td>
                      <td className={`px-3 py-2 font-semibold ${f.side === "Buy" ? "text-bull" : "text-bear"}`}>{f.side}</td>
                      <td className="px-3 text-right font-mono tabular-nums">{f.qty}</td>
                      <td className="px-3 text-right font-mono tabular-nums">${f.price.toFixed(2)}</td>
                      <td className="px-4 text-right font-mono tabular-nums">${(f.qty * f.price).toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

function PortfolioCard({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono text-lg font-semibold tabular-nums mt-1 ${color}`}>{value}</div>
    </div>
  );
}

const chartStyle = { backgroundColor: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 11 };
