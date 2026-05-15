import { useEffect, useRef, useState } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { useMarket } from "@/store/market";
import { useNavigate } from "@tanstack/react-router";
import { ChangePill } from "./primitives";

const RECENT_DEFAULT = ["NVDA", "PLTR", "TSLA", "RKLB", "HIMS"];

export function TickerSpotlight({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const quotes = useMarket(s => s.quotes);
  const setActiveChartTicker = useMarket(s => s.setActiveChartTicker);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const allTickers = Object.values(quotes);
  const filtered = query.trim()
    ? allTickers.filter(q =>
        q.ticker.includes(query.toUpperCase()) || q.company.toLowerCase().includes(query.toLowerCase())
      )
    : allTickers.filter(q => RECENT_DEFAULT.includes(q.ticker))
        .sort((a, b) => RECENT_DEFAULT.indexOf(a.ticker) - RECENT_DEFAULT.indexOf(b.ticker));

  useEffect(() => { setSelectedIdx(0); }, [query]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && filtered[selectedIdx]) { select(filtered[selectedIdx].ticker); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selectedIdx]);

  function select(ticker: string) {
    setActiveChartTicker(ticker);
    navigate({ to: "/app/charts" });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search ticker or company name..."
            className="flex-1 bg-transparent text-base font-mono placeholder:font-sans placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="size-6 rounded hover:bg-accent flex items-center justify-center">
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
          <kbd className="text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground font-mono">ESC</kbd>
        </div>

        {/* Label */}
        <div className="px-4 pt-2 pb-1 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          {query ? <TrendingUp className="size-3" /> : <Clock className="size-3" />}
          {query ? `${filtered.length} results` : "Recent"}
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-auto pb-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-muted-foreground">No results for "{query}"</div>
          ) : filtered.map((q, i) => (
            <button
              key={q.ticker}
              onClick={() => select(q.ticker)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === selectedIdx ? "bg-brand/10 text-brand" : "hover:bg-accent/60"}`}
            >
              <span className="font-mono font-semibold text-sm w-14 shrink-0">{q.ticker}</span>
              <span className="text-xs text-muted-foreground flex-1 truncate">{q.company}</span>
              <span className="font-mono text-xs tabular-nums">${q.price.toFixed(2)}</span>
              <ChangePill pct={q.changePct} />
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground">
          <span><kbd className="border border-border rounded px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="border border-border rounded px-1 py-0.5 font-mono">↵</kbd> open chart</span>
          <span><kbd className="border border-border rounded px-1 py-0.5 font-mono">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
