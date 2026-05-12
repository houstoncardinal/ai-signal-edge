import { createFileRoute } from "@tanstack/react-router";
import { useMarket } from "@/store/market";
import { TickerBadge, ChangePill, LivePrice, ScoreBadge, MiniSpark, formatBig } from "@/components/trade/primitives";
import { Plus, Star } from "lucide-react";
export const Route = createFileRoute("/app/watchlists")({ component: Page });
function Page() {
  const quotes = useMarket(s => s.quotes);
  const wl = useMarket(s => s.watchlist);
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Watchlists</h1><p className="text-xs text-muted-foreground mt-0.5">Track tickers across strategies · unlimited lists on Pro</p></div>
        <button className="h-8 px-3 rounded-md bg-brand text-primary-foreground text-sm flex items-center gap-1.5"><Plus className="size-3.5" /> New list</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[{ name: "Default", count: wl.length, active: true }, { name: "Penny Movers", count: 8 }, { name: "AI Top Picks", count: 12 }].map(l => (
          <div key={l.name} className={`rounded-lg border ${l.active ? "border-brand/60 bg-brand/5" : "border-border bg-surface"} p-3 flex items-center gap-3 cursor-pointer`}>
            <Star className={`size-4 ${l.active ? "text-brand fill-brand" : "text-muted-foreground"}`} />
            <div className="flex-1"><div className="text-sm font-medium">{l.name}</div><div className="text-[11px] text-muted-foreground">{l.count} tickers</div></div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>{["Ticker", "Last", "Chg", "Vol", "RSI", "AI", "Trend"].map((h, i) => <th key={h} className={`px-3 py-2 ${i === 0 ? "text-left" : "text-right"} font-medium`}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {wl.map(t => { const q = quotes[t]; if (!q) return null; return (
              <tr key={t} className="border-b border-border/50 hover:bg-accent/40">
                <td className="px-3 py-2"><div className="flex items-center gap-2"><TickerBadge symbol={t} /><span className="text-xs text-muted-foreground">{q.company}</span></div></td>
                <td className="px-3 text-right"><LivePrice ticker={t} /></td>
                <td className="px-3 text-right"><ChangePill pct={q.changePct} /></td>
                <td className="px-3 text-right text-xs font-mono text-muted-foreground tabular-nums">{formatBig(q.volume)}</td>
                <td className="px-3 text-right text-xs font-mono tabular-nums">{q.rsi}</td>
                <td className="px-3 text-right"><ScoreBadge score={q.aiScore} /></td>
                <td className="px-3 text-right"><div className="inline-block"><MiniSpark ticker={t} color={q.changePct >= 0 ? "var(--bull)" : "var(--bear)"} /></div></td>
              </tr>
            ); })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
