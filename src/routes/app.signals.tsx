import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SIGNALS, type Signal } from "@/lib/mock";
import { TickerBadge, AIScoreGauge, SentimentBadge, MiniSpark, LivePrice, ChangePill } from "@/components/trade/primitives";
import { useMarket } from "@/store/market";
import { Star, LineChart, Sparkles, Plus } from "lucide-react";

export const Route = createFileRoute("/app/signals")({ component: SignalsPage });

const FILTERS = ["All Signals", "Day Trade", "Swing", "High Confidence", "New Today"] as const;

function SignalsPage() {
  const [f, setF] = useState<(typeof FILTERS)[number]>("All Signals");
  let rows = [...SIGNALS].sort((a, b) => b.aiScore - a.aiScore);
  if (f === "Day Trade") rows = rows.filter(s => s.timeframe === "Day");
  else if (f === "Swing") rows = rows.filter(s => s.timeframe === "Swing");
  else if (f === "High Confidence") rows = rows.filter(s => s.confidence === "High");
  else if (f === "New Today") rows = rows.filter(s => s.isNew);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="size-5 text-brand" /> AI Signal Feed</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Fine-tuned model · ranked by setup quality · regenerated every 60 seconds</p>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-md border border-border bg-surface">
          {FILTERS.map(x => (
            <button key={x} onClick={() => setF(x)}
              className={`h-7 px-3 rounded text-xs transition-colors ${f === x ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {x}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {rows.map(s => <SignalCard key={s.id} s={s} />)}
      </div>
    </div>
  );
}

function SignalCard({ s }: { s: Signal }) {
  const q = useMarket(st => st.quotes[s.ticker]);
  return (
    <article className="rounded-lg border border-border bg-surface hover:border-brand/40 transition-colors overflow-hidden group">
      <header className="px-4 py-3 border-b border-border flex items-center gap-3">
        <TickerBadge symbol={s.ticker} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{s.setup}</h3>
            {s.isNew && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-bull/15 text-bull border border-bull/30 font-medium">New</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">{s.timeframe}</span>
            <span className="text-[10px] text-muted-foreground">Confidence: <span className={s.confidence === "High" ? "text-bull" : "text-warn"}>{s.confidence}</span></span>
          </div>
        </div>
        <AIScoreGauge score={s.aiScore} />
      </header>

      <div className="px-4 py-3 grid grid-cols-3 gap-2 border-b border-border bg-background/40">
        <PriceCell label="Entry" value={`${s.entry[0]}–${s.entry[1]}`} color="text-brand" />
        <PriceCell label="Stop" value={s.stop.toFixed(2)} color="text-bear" />
        <PriceCell label="Target" value={s.target.toFixed(2)} color="text-bull" />
      </div>

      <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
        {q && (
          <>
            <div className="text-xs text-muted-foreground">Last</div>
            <LivePrice ticker={s.ticker} className="text-sm font-semibold" />
            <ChangePill pct={q.changePct} />
          </>
        )}
        <div className="ml-auto"><MiniSpark ticker={s.ticker} color={(q?.changePct ?? 0) >= 0 ? "var(--bull)" : "var(--bear)"} /></div>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground italic">"{s.catalyst}"</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Sentiment</span>
              <SentimentBadge score={s.sentiment} />
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${s.sentiment >= 0 ? "bg-bull" : "bg-bear"}`} style={{ width: `${Math.min(100, Math.abs(s.sentiment))}%` }} />
            </div>
          </div>
        </div>
      </div>

      <footer className="px-4 py-3 border-t border-border flex gap-2">
        <button className="flex-1 h-8 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5">
          <LineChart className="size-3.5" /> View Chart
        </button>
        <button className="flex-1 h-8 rounded-md border border-border hover:bg-accent text-xs flex items-center justify-center gap-1.5">
          <Plus className="size-3.5" /> Add to Watchlist
        </button>
        <button className="size-8 rounded-md border border-border hover:bg-accent flex items-center justify-center text-muted-foreground"><Star className="size-3.5" /></button>
      </footer>
    </article>
  );
}

function PriceCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-mono text-sm tabular-nums mt-0.5 font-medium ${color}`}>{value}</div>
    </div>
  );
}
