import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMarket } from "@/store/market";
import { TickerBadge, ChangePill, LivePrice, ScoreBadge, MiniSpark } from "@/components/trade/primitives";
import { TrendingUp, Sparkles, Radar, Brain, Bell, BookOpen, Bot, Check, ChevronDown, ArrowRight, Github, Twitter } from "lucide-react";
import { NEWS } from "@/lib/mock";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({ meta: [
    { title: "TradeEdge AI — Trade Smarter with Real AI Signals" },
    { name: "description", content: "AI-powered scanner, signal feed, and charts for retail day and swing traders. 14-day free trial — start for $7." },
    { property: "og:title", content: "TradeEdge AI — Real AI Signals for Real Traders" },
    { property: "og:description", content: "Fine-tuned LLM signals, NLP news sentiment, and CNN chart pattern recognition in one terminal." },
  ]}),
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <LiveScannerWidget />
      <Features />
      <Pricing />
      <Testimonials />
      <Faq />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto h-14 px-4 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-gradient-to-br from-brand to-brand-glow flex items-center justify-center"><TrendingUp className="size-4 text-white" /></div>
          <span className="font-semibold tracking-tight">TradeEdge<span className="text-brand"> AI</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#faq" className="hover:text-foreground">FAQ</a>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/app" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">Sign in</Link>
          <Link to="/app" className="h-9 px-4 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-sm font-medium flex items-center gap-1.5">
            Open terminal <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 size-[700px] rounded-full bg-brand/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(45,140,255,0.08),transparent_50%)]" />
      </div>
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs text-muted-foreground">
          <span className="size-1.5 rounded-full bg-bull animate-pulse" /> Live signals trading now · 14,832 tickers scanned
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight leading-[1.05]">
          Trade smarter with<br />
          <span className="bg-gradient-to-r from-brand via-brand-glow to-bull bg-clip-text text-transparent">real AI signals.</span>
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
          Fine-tuned LLM trade narratives. CNN-powered chart pattern recognition. NLP news sentiment scored per ticker. Built for retail traders who want context, not just alerts.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
          <Link to="/app" className="h-11 px-5 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground font-medium flex items-center gap-2 glow-brand">
            14-Day Free Trial — Start for $7 <ArrowRight className="size-4" />
          </Link>
          <a href="#pricing" className="h-11 px-5 rounded-md border border-border bg-surface hover:bg-accent flex items-center gap-2">See pricing</a>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">No credit card upgrades · Cancel anytime · Built on Polygon.io real-time data</p>
      </div>
    </section>
  );
}

function LiveScannerWidget() {
  const quotes = useMarket(s => s.quotes);
  const top = Object.values(quotes).sort((a, b) => b.aiScore - a.aiScore).slice(0, 6);
  return (
    <section className="max-w-7xl mx-auto px-4 pb-20">
      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xl shadow-brand/10">
        <div className="h-10 px-4 flex items-center gap-3 border-b border-border bg-background/50">
          <div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-bear" /><span className="size-2.5 rounded-full bg-warn" /><span className="size-2.5 rounded-full bg-bull" /></div>
          <span className="text-xs text-muted-foreground font-mono">tradeedge.ai/scanner — Live AI Top Picks</span>
          <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-bull animate-pulse" /> Live</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border bg-background/30">
              <tr>{["Ticker", "Company", "Last", "Chg", "Rel Vol", "Pattern", "AI Score", "Trend"].map((h, i) => (
                <th key={h} className={`px-4 py-2.5 ${i === 0 || i === 1 || i === 5 ? "text-left" : "text-right"} font-medium`}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {top.map(q => (
                <tr key={q.ticker} className="border-b border-border/40 last:border-0 hover:bg-accent/30">
                  <td className="px-4 py-2.5"><TickerBadge symbol={q.ticker} /></td>
                  <td className="px-4 text-xs text-muted-foreground truncate">{q.company}</td>
                  <td className="px-4 text-right"><LivePrice ticker={q.ticker} /></td>
                  <td className="px-4 text-right"><ChangePill pct={q.changePct} /></td>
                  <td className="px-4 text-right font-mono text-xs tabular-nums text-warn">{q.relVolume.toFixed(2)}x</td>
                  <td className="px-4 text-xs text-muted-foreground">{q.pattern}</td>
                  <td className="px-4 text-right"><ScoreBadge score={q.aiScore} /></td>
                  <td className="px-4 text-right"><div className="inline-block"><MiniSpark ticker={q.ticker} color={q.changePct >= 0 ? "var(--bull)" : "var(--bear)"} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <NewsTicker />
      </div>
    </section>
  );
}

function NewsTicker() {
  return (
    <div className="border-t border-border bg-background/40 overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap py-2.5">
        {[...NEWS, ...NEWS].map((n, i) => (
          <span key={i} className="inline-flex items-center gap-2 px-6 text-xs">
            <span className={`size-1.5 rounded-full ${n.sentiment >= 0 ? "bg-bull" : "bg-bear"}`} />
            <TickerBadge symbol={n.ticker} />
            <span className="text-muted-foreground">{n.headline}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const FEATURES = [
  { icon: Radar, title: "Multi-Factor Scanner", desc: "15,000+ tickers scanned every minute. Filter by float, volume, RSI, MACD, ATR — 50+ criteria with sub-second latency." },
  { icon: Brain, title: "AI Signal Feed", desc: "Fine-tuned GPT-4o trained on labeled winning setups. Every signal includes a natural-language rationale — why this stock, why now." },
  { icon: Sparkles, title: "Pattern Recognition CNN", desc: "Computer vision model identifies cup-and-handle, bull flag, ascending triangle, and 9 more patterns visually on any chart." },
  { icon: Bot, title: "News Sentiment NLP", desc: "Real-time sentiment scoring of SEC filings, press releases, and headlines. Aggregated -100 to +100 per ticker on a 24h window." },
  { icon: Bell, title: "Smart Alerts", desc: "Price, volume, pattern, and sentiment alerts via email, push, and SMS. Never miss a setup forming on your watchlist." },
  { icon: BookOpen, title: "Trade Journal & Paper", desc: "Log entries with chart attachments. Track win rate, average R, and P&L by strategy. Practice in the paper simulator first." },
];

function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Built for traders, not marketers.</h2>
        <p className="mt-3 text-muted-foreground">A modern terminal that respects your time and your risk. No "AI" buzzwords — every model is documented, scored, and explainable.</p>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {FEATURES.map(f => (
          <div key={f.title} className="rounded-lg border border-border bg-surface p-5 hover:border-brand/40 transition-colors">
            <div className="size-9 rounded-md bg-brand/10 text-brand flex items-center justify-center"><f.icon className="size-4" /></div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const TIERS = [
  { name: "Starter", price: 29, blurb: "Real-time data + preset scanners.", features: ["Real-time L1 quotes", "Preset scanners", "Basic charting + indicators", "3 watchlists", "Email alerts", "Paper trading"] },
  { name: "Pro", price: 79, popular: true, blurb: "Everything in Starter + full AI suite.", features: ["AI Signal Feed", "Custom screener builder", "News sentiment scoring", "Chart pattern recognition", "Unlimited watchlists", "Browser push + email alerts", "L2 data add-on eligible"] },
  { name: "Elite", price: 149, blurb: "Pro + community + broker integration.", features: ["Swing Trade Forecaster", "AI analyst reports", "AI language screener", "Members chatroom + webinars", "Video library", "Broker integration (Alpaca)", "API access · SMS alerts"] },
];

function Pricing() {
  const [annual, setAnnual] = useState(false);
  return (
    <section id="pricing" className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Pricing built for retail.</h2>
        <p className="mt-3 text-muted-foreground">Starter at $29/mo · vs the leading competitor at $179/mo. Scale up only when you need to.</p>
        <div className="mt-6 inline-flex items-center gap-3 p-1 rounded-full border border-border bg-surface text-sm">
          <button onClick={() => setAnnual(false)} className={`px-3 py-1 rounded-full ${!annual ? "bg-brand text-primary-foreground" : "text-muted-foreground"}`}>Monthly</button>
          <button onClick={() => setAnnual(true)} className={`px-3 py-1 rounded-full ${annual ? "bg-brand text-primary-foreground" : "text-muted-foreground"}`}>Annual <span className="text-bull ml-1">−2 mo free</span></button>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map(t => (
          <div key={t.name} className={`relative rounded-xl border ${t.popular ? "border-brand glow-brand" : "border-border"} bg-surface p-6 flex flex-col`}>
            {t.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand text-primary-foreground text-[10px] uppercase tracking-wider font-semibold">Most popular</span>}
            <h3 className="text-lg font-semibold">{t.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t.blurb}</p>
            <div className="mt-5 flex items-baseline gap-1">
              <span className="font-mono text-4xl font-semibold tabular-nums">${annual ? Math.round(t.price * 10 / 12) : t.price}</span>
              <span className="text-muted-foreground text-sm">/mo</span>
            </div>
            {annual && <div className="text-[11px] text-muted-foreground mt-1">Billed ${t.price * 10}/year</div>}
            <ul className="mt-6 space-y-2.5 text-sm flex-1">
              {t.features.map(f => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="size-4 text-bull shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link to="/app" className={`mt-6 h-10 rounded-md flex items-center justify-center text-sm font-medium ${t.popular ? "bg-brand hover:bg-brand-glow text-primary-foreground" : "border border-border hover:bg-accent"}`}>
              Start 14-day trial
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">Add-ons: Level 2 data +$29/mo · Breaking News Chat +$49/mo · SMS alerts +$9/mo</p>
    </section>
  );
}

function Testimonials() {
  const t = [
    { name: "Marcus R.", role: "Day trader · 3 yrs", quote: "Finally a scanner that explains itself. I cut my prep time in half and my win rate is up because I'm only taking setups with real catalysts." },
    { name: "Priya S.", role: "Swing trader", quote: "The pattern CNN catches setups I'd miss visually. Cup & handle on PLTR last week paid for the year." },
    { name: "Devon K.", role: "Penny stock trader", quote: "Float rotators with sentiment context. Other platforms give me tickers — TradeEdge gives me a thesis." },
  ];
  return (
    <section className="max-w-7xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">Traders ship with TradeEdge.</h2>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
        {t.map(x => (
          <figure key={x.name} className="rounded-lg border border-border bg-surface p-5">
            <blockquote className="text-sm leading-relaxed">"{x.quote}"</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <div className="size-8 rounded-full bg-gradient-to-br from-brand to-brand-glow flex items-center justify-center text-xs font-semibold text-white">{x.name[0]}</div>
              <div><div className="text-sm font-medium">{x.name}</div><div className="text-[11px] text-muted-foreground">{x.role}</div></div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Is the AI actually fine-tuned, or just rule-based?", a: "Both — but the AI parts are real ML. Our signal feed uses a fine-tuned GPT-4o variant trained on labeled winning setups. Pattern detection is a CNN trained on OHLCV chart images. Sentiment uses a BERT-based NLP model trained on financial text." },
  { q: "What market data provider powers the platform?", a: "Polygon.io for real-time L1 quotes and OHLCV across NASDAQ, NYSE, AMEX, and OTC. News from Benzinga and Finnhub. SEC filings via EDGAR full-text RSS." },
  { q: "Can I connect my broker?", a: "Elite includes Alpaca integration for one-click execution from signals. Additional brokers are on the roadmap." },
  { q: "Do you offer a free trial?", a: "Yes — 14 days for $7 on any tier. Cancel anytime, no credit card games." },
  { q: "What's the difference vs StocksToTrade?", a: "Modern stack (React + serverless vs legacy Java/Ruby desktop), real ML signals with explanations, transparent pricing starting at $29 vs $179, and a UI built for traders in 2026." },
];

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="max-w-3xl mx-auto px-4 py-20">
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">Questions, answered.</h2>
      <div className="mt-10 space-y-2">
        {FAQS.map((f, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-accent/40">
              <span className="text-sm font-medium">{f.q}</span>
              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border mt-10">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <div className="flex items-center gap-2"><div className="size-6 rounded-md bg-gradient-to-br from-brand to-brand-glow flex items-center justify-center"><TrendingUp className="size-3.5 text-white" /></div><span className="font-semibold">TradeEdge AI</span></div>
          <p className="mt-3 text-xs text-muted-foreground">Real AI signals for retail traders. Built in 2026.</p>
        </div>
        {[
          { title: "Product", links: ["Scanner", "AI Signals", "Charts", "Pricing"] },
          { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
          { title: "Legal", links: ["Terms", "Privacy", "Disclosures", "Risk"] },
        ].map(c => (
          <div key={c.title}>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{c.title}</div>
            <ul className="mt-3 space-y-2 text-muted-foreground">
              {c.links.map(l => <li key={l}><a className="hover:text-foreground" href="#">{l}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 TradeEdge AI · Not investment advice.</span>
          <div className="flex items-center gap-3"><a href="#" className="hover:text-foreground"><Twitter className="size-4" /></a><a href="#" className="hover:text-foreground"><Github className="size-4" /></a></div>
        </div>
      </div>
    </footer>
  );
}
