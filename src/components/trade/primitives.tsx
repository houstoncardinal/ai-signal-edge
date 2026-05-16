import { useEffect, useRef, useState } from "react";
import { useMarket } from "@/store/market";
import { formatMoney, formatBig } from "@/lib/mock";

export function TickerBadge({ symbol, size = "sm" }: { symbol: string; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-base px-2.5 py-1" : size === "md" ? "text-sm px-2 py-0.5" : "text-xs px-1.5 py-0.5";
  return (
    <span className={`font-mono font-semibold tracking-tight rounded bg-brand/15 text-brand border border-brand/30 ${cls}`}>
      {symbol}
    </span>
  );
}

export function ChangePill({ pct, value }: { pct: number; value?: number }) {
  const up = pct >= 0;
  return (
    <span className={`font-mono text-xs font-medium tabular-nums ${up ? "text-bull" : "text-bear"}`}>
      {up ? "▲" : "▼"} {value !== undefined ? formatMoney(Math.abs(value)) + " " : ""}{up ? "+" : ""}{pct.toFixed(2)}%
    </span>
  );
}

export function LivePrice({ ticker, className = "" }: { ticker: string; className?: string }) {
  const q = useMarket((s) => s.quotes[ticker]);
  const tick = useMarket((s) => s.ticks[ticker]);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const lastTs = useRef(0);
  useEffect(() => {
    if (tick && tick.ts !== lastTs.current && tick.dir !== "flat") {
      lastTs.current = tick.ts;
      setFlash(tick.dir);
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [tick]);
  if (!q) return null;
  return (
    <span className={`font-mono tabular-nums px-1 rounded ${flash === "up" ? "animate-flash-bull" : flash === "down" ? "animate-flash-bear" : ""} ${className}`}>
      {formatMoney(q.price)}
    </span>
  );
}

export function SentimentBadge({ score }: { score: number }) {
  const positive = score >= 0;
  const strong = Math.abs(score) >= 50;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium">
      <span className={`size-1.5 rounded-full ${positive ? "bg-bull" : "bg-bear"} ${strong ? "shadow-[0_0_6px_currentColor]" : ""}`} />
      <span className={positive ? "text-bull" : "text-bear"}>{positive ? "+" : ""}{score}</span>
    </span>
  );
}

export function AIScoreGauge({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const color = score >= 85 ? "var(--bull)" : score >= 75 ? "var(--brand)" : score >= 65 ? "var(--warn)" : "var(--muted-foreground)";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border)" strokeWidth="4" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-semibold text-sm tabular-nums leading-none" style={{ color }}>{score}</span>
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground mt-0.5">AI</span>
      </div>
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "bg-bull/15 text-bull border-bull/30" : score >= 75 ? "bg-brand/15 text-brand border-brand/30" : score >= 65 ? "bg-warn/15 text-warn border-warn/30" : "bg-muted text-muted-foreground border-border";
  return <span className={`inline-flex items-center justify-center font-mono text-xs font-semibold rounded px-1.5 py-0.5 border tabular-nums ${color}`}>{score}</span>;
}

export function MiniSpark({ ticker, color = "var(--brand)" }: { ticker: string; color?: string }) {
  // deterministic from ticker
  const points = useRef<number[] | null>(null);
  if (!points.current) {
    let h = 0; for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) >>> 0;
    const arr: number[] = []; let v = 50;
    for (let i = 0; i < 30; i++) { h = (h * 1103515245 + 12345) >>> 0; v += ((h % 100) - 50) / 14; arr.push(v); }
    points.current = arr;
  }
  const arr = points.current!;
  const min = Math.min(...arr), max = Math.max(...arr);
  const path = arr.map((y, i) => `${i === 0 ? "M" : "L"}${(i / (arr.length - 1)) * 60} ${28 - ((y - min) / (max - min || 1)) * 24}`).join(" ");
  return (
    <svg width={60} height={28} className="overflow-visible">
      <path d={path} stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export { formatMoney, formatBig };
