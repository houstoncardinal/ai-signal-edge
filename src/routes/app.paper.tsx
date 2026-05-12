import { createFileRoute } from "@tanstack/react-router";
import { useMarket } from "@/store/market";
import { TickerBadge, LivePrice, ChangePill } from "@/components/trade/primitives";
export const Route = createFileRoute("/app/paper")({ component: Page });
function Page() {
  const quotes = useMarket(s => s.quotes);
  const positions = [
    { ticker: "NVDA", qty: 100, entry: 136.40 },
    { ticker: "PLTR", qty: 50, entry: 65.20 },
    { ticker: "RKLB", qty: 250, entry: 21.80 },
  ];
  const equity = 100000 + positions.reduce((a, p) => a + (quotes[p.ticker]?.price - p.entry) * p.qty, 0);
  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Equity" value={`$${equity.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} />
        <Stat label="Buying Power" value="$200,000" />
        <Stat label="Day P&L" value="+$1,284" color="text-bull" />
      </div>
      <section className="rounded-lg border border-border bg-surface">
        <header className="h-9 px-3 border-b border-border"><h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Open Positions</h3></header>
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border"><tr>{["Ticker", "Qty", "Entry", "Last", "P&L"].map((h, i) => <th key={h} className={`px-3 py-2 ${i === 0 ? "text-left" : "text-right"} font-medium`}>{h}</th>)}</tr></thead>
          <tbody>
            {positions.map(p => { const q = quotes[p.ticker]; const pnl = (q.price - p.entry) * p.qty; const pct = (q.price - p.entry) / p.entry * 100; return (
              <tr key={p.ticker} className="border-b border-border/50">
                <td className="px-3 py-2"><TickerBadge symbol={p.ticker} /></td>
                <td className="px-3 text-right font-mono tabular-nums">{p.qty}</td>
                <td className="px-3 text-right font-mono tabular-nums">{p.entry.toFixed(2)}</td>
                <td className="px-3 text-right"><LivePrice ticker={p.ticker} /></td>
                <td className="px-3 text-right"><ChangePill pct={pct} value={pnl} /></td>
              </tr>
            );})}
          </tbody>
        </table>
      </section>
    </div>
  );
}
function Stat({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return <div className="rounded-lg border border-border bg-surface p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div><div className={`font-mono text-2xl font-semibold tabular-nums mt-1 ${color}`}>{value}</div></div>;
}
