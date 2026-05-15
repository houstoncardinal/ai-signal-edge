import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NEWS, FILINGS } from "@/lib/mock";
import { useMarket } from "@/store/market";
import { TickerBadge, SentimentBadge } from "@/components/trade/primitives";
import { Search, ChevronDown, ChevronUp, Newspaper, FileText } from "lucide-react";
import { EmptyState } from "@/components/trade/EmptyState";
import { ErrorBoundary } from "@/components/trade/ErrorBoundary";

export const Route = createFileRoute("/app/news")({ component: NewsPage });

const FILTERS = ["All", "Watchlist Only", "High Impact", "Breaking"] as const;
type Filter = (typeof FILTERS)[number];

const SOURCE_COLORS: Record<string, string> = {
  Bloomberg: "bg-red-500", Reuters: "bg-orange-500", Benzinga: "bg-yellow-500", "SEC EDGAR": "bg-blue-600",
  WSJ: "bg-gray-600", CNBC: "bg-brand", CoinDesk: "bg-amber-500", TechCrunch: "bg-green-600",
};

const ARTICLE_SNIPPETS: Record<string, string> = {
  NVDA: "NVIDIA Corporation announced a landmark multi-year supply agreement with leading hyperscalers including Microsoft Azure and Google Cloud, covering next-generation Blackwell B200 GPU clusters. The deal is valued at an estimated $11 billion over three years and marks a significant expansion in AI infrastructure investment...",
  TSLA: "Tesla Inc. reported record quarterly deliveries for Q4, surpassing analyst expectations. Full Self-Driving subscription adoption reached a new high, contributing to recurring software revenue. CEO Elon Musk highlighted ongoing Optimus robot production ramp as a key 2026 initiative...",
  PLTR: "Palantir Technologies secured a major $480 million contract with the U.S. Army to deploy its AI-powered battlefield platform across forward operating bases. The platform integrates live sensor data, satellite imagery, and predictive logistics models to enhance operational awareness...",
  AMC: "AMC Entertainment Holdings filed a mixed shelf offering with the SEC, allowing the company to sell up to $250 million in securities including common stock and debt. Shares declined sharply in pre-market trading as investors anticipated dilution of existing holdings...",
};

function NewsPage() {
  const watchlist = useMarket(s => s.watchlist);
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filingFilter, setFilingFilter] = useState<"All" | "8-K" | "10-Q" | "S-1">("All");
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);

  const filteredNews = NEWS.filter(n => {
    if (filter === "Watchlist Only" && !watchlist.includes(n.ticker)) return false;
    if (filter === "High Impact" && Math.abs(n.sentiment) < 60) return false;
    if (filter === "Breaking" && !["4m", "12m"].includes(n.ago)) return false;
    if (search && !n.ticker.includes(search.toUpperCase()) && !n.headline.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredFilings = FILINGS.filter(f => {
    if (filingFilter !== "All" && f.type !== filingFilter) return false;
    if (search && !f.ticker.includes(search.toUpperCase()) && !f.company.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function sentimentLabel(score: number) {
    if (score >= 50) return { label: "Bullish", cls: "text-bull bg-bull/10 border-bull/30" };
    if (score >= 10) return { label: "Positive", cls: "text-bull bg-bull/10 border-bull/20" };
    if (score <= -50) return { label: "Bearish", cls: "text-bear bg-bear/10 border-bear/30" };
    if (score <= -10) return { label: "Negative", cls: "text-bear bg-bear/10 border-bear/20" };
    return { label: "Neutral", cls: "text-muted-foreground bg-muted border-border" };
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-3rem)]">
        {/* Top bar */}
        <div className="h-12 px-4 border-b border-border bg-surface flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1 p-0.5 rounded-md border border-border bg-background">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`h-7 px-3 rounded text-xs transition-colors ${filter === f ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="size-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ticker or keyword..."
              className="h-8 pl-7 pr-3 w-52 bg-background border border-border rounded text-sm focus:ring-2 focus:ring-brand/40 focus:outline-none" />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left: News feed (60%) */}
          <div className="flex-[3] border-r border-border overflow-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-lg" />)}
              </div>
            ) : filteredNews.length === 0 ? (
              <EmptyState icon={Newspaper} title="No headlines match" description="Try a different filter or clear your search to see all news." />
            ) : filteredNews.map(n => {
              const { label, cls } = sentimentLabel(n.sentiment);
              const srcColor = SOURCE_COLORS[n.source] ?? "bg-muted";
              const expanded = expandedId === n.id;
              return (
                <article key={n.id} className="border-b border-border/60 p-4 hover:bg-accent/30 cursor-pointer" onClick={() => setExpandedId(expanded ? null : n.id)}>
                  <div className="flex items-start gap-3">
                    {/* Source logo placeholder */}
                    <div className={`size-8 rounded-full ${srcColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5`}>
                      {n.source.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <TickerBadge symbol={n.ticker} />
                        <span className="text-[10px] text-muted-foreground">{n.source} · {n.ago} ago</span>
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full border font-medium ${cls}`}>{label}</span>
                      </div>
                      <p className="text-sm leading-snug font-medium">{n.headline}</p>

                      {/* Sentiment bar */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full ${n.sentiment >= 0 ? "bg-bull" : "bg-bear"}`} style={{ width: `${Math.min(100, Math.abs(n.sentiment))}%` }} />
                        </div>
                        <SentimentBadge score={n.sentiment} />
                      </div>

                      {/* Expanded article snippet */}
                      {expanded && (
                        <div className="mt-3 p-3 rounded-md bg-background border border-border">
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {ARTICLE_SNIPPETS[n.ticker] ?? `${n.headline}. Further details are expected to be released in an upcoming investor call. Market participants are monitoring the situation closely for additional catalysts. Analysts have varied opinions on the near-term impact, with price target revisions expected from multiple banks in the coming sessions.`}
                          </p>
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground">Related:</span>
                            <TickerBadge symbol={n.ticker} />
                          </div>
                        </div>
                      )}
                    </div>
                    {expanded ? <ChevronUp className="size-4 text-muted-foreground shrink-0 mt-1" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-1" />}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Right: SEC Filings (40%) */}
          <div className="flex-[2] overflow-auto">
            <div className="h-10 px-4 border-b border-border bg-surface flex items-center justify-between shrink-0 sticky top-0 z-10">
              <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">SEC Filings</span>
              <div className="flex gap-1">
                {(["All", "8-K", "10-Q", "S-1"] as const).map(t => (
                  <button key={t} onClick={() => setFilingFilter(t)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-colors ${filingFilter === t ? "bg-brand text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {filteredFilings.length === 0 ? (
              <EmptyState icon={FileText} title="No filings match" description="Try a different filing type filter." />
            ) : filteredFilings.map(f => {
              const impactCls = f.impact === "High" ? "text-bear bg-bear/10 border-bear/30" : f.impact === "Medium" ? "text-warn bg-warn/10 border-warn/30" : "text-muted-foreground bg-muted border-border";
              return (
                <article key={f.id} className="border-b border-border/60 p-3 hover:bg-accent/30">
                  <div className="flex items-start gap-2">
                    <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <TickerBadge symbol={f.ticker} />
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold uppercase tracking-wider ${f.type === "8-K" ? "text-brand bg-brand/10 border-brand/30" : f.type === "10-Q" ? "text-bull bg-bull/10 border-bull/30" : "text-warn bg-warn/10 border-warn/30"}`}>{f.type}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${impactCls}`}>{f.impact}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">{f.date}</span>
                      </div>
                      <div className="text-[11px] font-medium truncate mb-0.5">{f.company}</div>
                      <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{f.title}</p>
                      <button className="mt-1.5 text-[10px] text-brand hover:underline">Read Filing →</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
