import { create } from "zustand";
import { buildQuotes, type Quote, JOURNAL_TRADES, type JournalEntry, PAPER_FILLS_INITIAL, type PaperFill } from "@/lib/mock";

type Tick = { dir: "up" | "down" | "flat"; ts: number };

export type WatchlistDef = { id: string; name: string; tickers: string[] };

export type PaperPosition = {
  ticker: string; side: "Long" | "Short"; qty: number; avgCost: number;
};

export type AppSettings = {
  theme: "dark" | "light" | "system";
  fontSize: "compact" | "default" | "comfortable";
  accent: "blue" | "teal" | "purple" | "orange" | "red";
  displayName: string;
  email: string;
  notifications: {
    aiSignals: boolean; priceAlerts: boolean; newsAlerts: boolean;
    premarketEmail: boolean; weeklyEmail: boolean;
  };
};

type MarketState = {
  quotes: Record<string, Quote>;
  ticks: Record<string, Tick>;

  // Multi-watchlist
  watchlists: WatchlistDef[];
  activeWatchlistId: string;
  watchlist: string[];
  toggleWatch: (t: string) => void;
  addToWatchlist: (t: string, listId?: string) => boolean;
  createWatchlist: (name: string) => void;
  deleteWatchlist: (id: string) => void;
  renameWatchlist: (id: string, name: string) => void;
  removeFromWatchlist: (t: string, listId: string) => void;
  setActiveWatchlist: (id: string) => void;
  reorderWatchlistItem: (listId: string, from: number, to: number) => void;

  // Chart navigation
  activeChartTicker: string;
  setActiveChartTicker: (t: string) => void;

  // Paper trading
  paperPositions: PaperPosition[];
  paperFills: PaperFill[];
  paperCash: number;
  submitPaperOrder: (ticker: string, side: "Buy" | "Sell", qty: number, price: number) => void;
  closePaperPosition: (ticker: string) => void;

  // Trade journal
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, "id">) => void;

  // Settings
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;

  tick: () => void;
};

const INITIAL_WATCHLISTS: WatchlistDef[] = [
  { id: "default", name: "Default", tickers: ["NVDA", "TSLA", "PLTR", "AAPL", "RKLB", "HIMS"] },
  { id: "penny", name: "Penny Movers", tickers: ["AMC", "SNDL", "TLRY", "MARA", "RIOT"] },
  { id: "ai-picks", name: "AI Top Picks", tickers: ["NVDA", "PLTR", "RKLB", "IONQ", "SMCI", "SOFI"] },
];

const INITIAL_POSITIONS: PaperPosition[] = [
  { ticker: "NVDA", side: "Long", qty: 100, avgCost: 136.40 },
  { ticker: "PLTR", side: "Long", qty: 50, avgCost: 65.20 },
  { ticker: "RKLB", side: "Long", qty: 250, avgCost: 21.80 },
];

const initial = buildQuotes().reduce<Record<string, Quote>>((acc, q) => { acc[q.ticker] = q; return acc; }, {});

export const useMarket = create<MarketState>((set, get) => ({
  quotes: initial,
  ticks: {},

  watchlists: INITIAL_WATCHLISTS,
  activeWatchlistId: "default",
  watchlist: INITIAL_WATCHLISTS[0].tickers,

  toggleWatch: (t) => set((s) => {
    const lists = s.watchlists.map(l =>
      l.id === s.activeWatchlistId
        ? { ...l, tickers: l.tickers.includes(t) ? l.tickers.filter(x => x !== t) : [...l.tickers, t] }
        : l
    );
    const active = lists.find(l => l.id === s.activeWatchlistId);
    return { watchlists: lists, watchlist: active?.tickers ?? s.watchlist };
  }),

  addToWatchlist: (t, listId) => {
    const { watchlists, activeWatchlistId } = get();
    const targetId = listId ?? activeWatchlistId;
    const list = watchlists.find(l => l.id === targetId);
    if (!list || list.tickers.includes(t)) return false;
    set((s) => {
      const lists = s.watchlists.map(l =>
        l.id === targetId ? { ...l, tickers: [...l.tickers, t] } : l
      );
      const active = lists.find(l => l.id === s.activeWatchlistId);
      return { watchlists: lists, watchlist: active?.tickers ?? s.watchlist };
    });
    return true;
  },

  createWatchlist: (name) => set((s) => {
    const id = `wl-${Date.now()}`;
    return { watchlists: [...s.watchlists, { id, name, tickers: [] }] };
  }),

  deleteWatchlist: (id) => set((s) => {
    const lists = s.watchlists.filter(l => l.id !== id);
    const newActive = s.activeWatchlistId === id ? (lists[0]?.id ?? "") : s.activeWatchlistId;
    const active = lists.find(l => l.id === newActive);
    return { watchlists: lists, activeWatchlistId: newActive, watchlist: active?.tickers ?? [] };
  }),

  renameWatchlist: (id, name) => set((s) => ({
    watchlists: s.watchlists.map(l => l.id === id ? { ...l, name } : l),
  })),

  removeFromWatchlist: (t, listId) => set((s) => {
    const lists = s.watchlists.map(l =>
      l.id === listId ? { ...l, tickers: l.tickers.filter(x => x !== t) } : l
    );
    const active = lists.find(l => l.id === s.activeWatchlistId);
    return { watchlists: lists, watchlist: active?.tickers ?? s.watchlist };
  }),

  setActiveWatchlist: (id) => set((s) => {
    const active = s.watchlists.find(l => l.id === id);
    return { activeWatchlistId: id, watchlist: active?.tickers ?? s.watchlist };
  }),

  reorderWatchlistItem: (listId, from, to) => set((s) => {
    const lists = s.watchlists.map(l => {
      if (l.id !== listId) return l;
      const tickers = [...l.tickers];
      const [item] = tickers.splice(from, 1);
      tickers.splice(to, 0, item);
      return { ...l, tickers };
    });
    const active = lists.find(l => l.id === s.activeWatchlistId);
    return { watchlists: lists, watchlist: active?.tickers ?? s.watchlist };
  }),

  activeChartTicker: "NVDA",
  setActiveChartTicker: (t) => set({ activeChartTicker: t }),

  paperPositions: INITIAL_POSITIONS,
  paperFills: PAPER_FILLS_INITIAL,
  paperCash: 100_000 - (136.40 * 100 + 65.20 * 50 + 21.80 * 250),

  submitPaperOrder: (ticker, side, qty, price) => set((s) => {
    const fill: PaperFill = {
      id: `pf-${Date.now()}`,
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      ticker, side, qty, price,
    };
    let positions = [...s.paperPositions];
    let cash = s.paperCash;
    if (side === "Buy") {
      cash -= qty * price;
      const existing = positions.find(p => p.ticker === ticker && p.side === "Long");
      if (existing) {
        const totalQty = existing.qty + qty;
        const avgCost = (existing.avgCost * existing.qty + price * qty) / totalQty;
        positions = positions.map(p => p.ticker === ticker ? { ...p, qty: totalQty, avgCost } : p);
      } else {
        positions = [...positions, { ticker, side: "Long", qty, avgCost: price }];
      }
    } else {
      cash += qty * price;
      positions = positions.map(p => p.ticker === ticker ? { ...p, qty: p.qty - qty } : p).filter(p => p.qty > 0);
    }
    return { paperPositions: positions, paperFills: [fill, ...s.paperFills], paperCash: cash };
  }),

  closePaperPosition: (ticker) => {
    const { quotes, paperPositions } = get();
    const pos = paperPositions.find(p => p.ticker === ticker);
    if (!pos) return;
    const price = quotes[ticker]?.price ?? pos.avgCost;
    get().submitPaperOrder(ticker, "Sell", pos.qty, price);
  },

  journalEntries: JOURNAL_TRADES,
  addJournalEntry: (entry) => set((s) => ({
    journalEntries: [{ ...entry, id: `j-${Date.now()}` }, ...s.journalEntries],
  })),

  settings: {
    theme: "dark", fontSize: "default", accent: "blue",
    displayName: "John Doe", email: "john@tradeedge.ai",
    notifications: { aiSignals: true, priceAlerts: true, newsAlerts: false, premarketEmail: true, weeklyEmail: false },
  },
  updateSettings: (s) => set((st) => ({ settings: { ...st.settings, ...s } })),

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
