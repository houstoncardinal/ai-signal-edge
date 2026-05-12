import { create } from "zustand";
import { buildQuotes, type Quote } from "@/lib/mock";

type Tick = { dir: "up" | "down" | "flat"; ts: number };

type MarketState = {
  quotes: Record<string, Quote>;
  ticks: Record<string, Tick>;
  watchlist: string[];
  toggleWatch: (t: string) => void;
  tick: () => void;
};

const initial = buildQuotes().reduce<Record<string, Quote>>((acc, q) => { acc[q.ticker] = q; return acc; }, {});

export const useMarket = create<MarketState>((set, get) => ({
  quotes: initial,
  ticks: {},
  watchlist: ["NVDA", "TSLA", "PLTR", "AAPL", "RKLB", "HIMS"],
  toggleWatch: (t) => set((s) => ({ watchlist: s.watchlist.includes(t) ? s.watchlist.filter(x => x !== t) : [...s.watchlist, t] })),
  tick: () => {
    const { quotes } = get();
    const next: Record<string, Quote> = {};
    const ticks: Record<string, Tick> = {};
    const ts = Date.now();
    for (const t in quotes) {
      const q = quotes[t];
      const drift = (Math.random() - 0.5) * Math.max(0.02, q.price * 0.0025);
      const np = Math.max(0.01, +(q.price + drift).toFixed(2));
      const nch = +(np - q.prevClose).toFixed(2);
      next[t] = { ...q, price: np, change: nch, changePct: +(nch / q.prevClose * 100).toFixed(2) };
      ticks[t] = { dir: np > q.price ? "up" : np < q.price ? "down" : "flat", ts };
    }
    set({ quotes: next, ticks });
  },
}));

if (typeof window !== "undefined") {
  setInterval(() => useMarket.getState().tick(), 2000);
}
