import { createFileRoute } from "@tanstack/react-router";
import { NEWS } from "@/lib/mock";
import { TickerBadge, SentimentBadge } from "@/components/trade/primitives";
export const Route = createFileRoute("/app/news")({ component: Page });
function Page() {
  return (
    <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <section className="rounded-lg border border-border bg-surface">
        <header className="h-9 px-3 border-b border-border flex items-center justify-between"><h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Live Headlines</h3></header>
        <div className="divide-y divide-border/60">
          {NEWS.map(n => (
            <article key={n.id} className="p-3 hover:bg-accent/40">
              <div className="flex items-center justify-between mb-1.5"><div className="flex items-center gap-2"><TickerBadge symbol={n.ticker} /><span className="text-[11px] text-muted-foreground">{n.source} · {n.ago}</span></div><SentimentBadge score={n.sentiment} /></div>
              <p className="text-sm leading-snug">{n.headline}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="rounded-lg border border-border bg-surface">
        <header className="h-9 px-3 border-b border-border"><h3 className="text-xs uppercase tracking-wider font-medium text-muted-foreground">SEC Filings · 8-K · S-1 · 10-Q</h3></header>
        <div className="p-6 text-xs text-muted-foreground text-center">Streaming filings from EDGAR · enable Pro to filter by ticker.</div>
      </section>
    </div>
  );
}
