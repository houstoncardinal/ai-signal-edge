import { create } from "zustand";
import { useMarket } from "./market";

export type AgentStatus = "idle" | "analyzing" | "scanning" | "in_trade" | "paused";
export type LogType = "system" | "info" | "buy" | "sell" | "warn" | "success" | "rsi";

export interface LogEntry {
  id: string;
  ts: string;
  type: LogType;
  message: string;
}

export interface OrbRange {
  ticker: string;
  high: number;
  low: number;
  rangePct: number;
  established: boolean;
}

export interface RobotTrade {
  id: string;
  ticker: string;
  direction: "Long" | "Short";
  entry: number;
  stop: number;
  tp: number;
  qty: number;
  status: "open" | "closed";
  entryTime: string;
  currentRsi: number;
  exitPrice?: number;
  exitTime?: string;
  exitReason?: "stop_loss" | "take_profit" | "manual";
  pnl?: number;
  pnlPct?: number;
}

export interface RobotConfig {
  orbMinutes: 5 | 15 | 30;
  stopPct: number;  // always 1.0
  rsiTp: number;   // always 75
  tickers: string[];
  maxConcurrentTrades: number;
  sizePerTrade: number;
}

interface RobotState {
  status: AgentStatus;
  config: RobotConfig;
  orbRanges: OrbRange[];
  openTrades: RobotTrade[];
  closedTrades: RobotTrade[];
  log: LogEntry[];
  sessionPnl: number;
  sessionWins: number;
  sessionLosses: number;
  scanningTicker: string | null;

  startAgent: () => void;
  stopAgent: () => void;
  pauseResume: () => void;
  setOrbMinutes: (m: 5 | 15 | 30) => void;
  addTicker: (t: string) => void;
  removeTicker: (t: string) => void;
  setSizePerTrade: (n: number) => void;
  _addLog: (type: LogType, message: string) => void;
  _setStatus: (s: AgentStatus) => void;
  _setOrbRanges: (ranges: OrbRange[]) => void;
  _enterTrade: (trade: RobotTrade) => void;
  _updateRsi: (id: string, rsi: number) => void;
  _closeTrade: (id: string, exitPrice: number, reason: RobotTrade["exitReason"]) => void;
  _setScanningTicker: (t: string | null) => void;
}

function nowTs() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export const useRobot = create<RobotState>((set, get) => ({
  status: "idle",
  config: {
    orbMinutes: 15,
    stopPct: 1.0,
    rsiTp: 75,
    tickers: ["NVDA", "TSLA", "AAPL", "MSFT", "AMD"],
    maxConcurrentTrades: 2,
    sizePerTrade: 2000,
  },
  orbRanges: [],
  openTrades: [],
  closedTrades: [],
  log: [],
  sessionPnl: 0,
  sessionWins: 0,
  sessionLosses: 0,
  scanningTicker: null,

  startAgent: () => {
    const { _addLog, _setStatus, config } = get();
    _setStatus("analyzing");
    _addLog("system", `ORB Agent started. Strategy: ${config.orbMinutes}m ORB | Stop: ${config.stopPct}% | TP: RSI ≥ ${config.rsiTp}`);
    _addLog("info", `Watchlist: ${config.tickers.join(", ")}`);
    _addLog("info", `Establishing ${config.orbMinutes}-minute opening ranges...`);
  },

  stopAgent: () => {
    const { _addLog, openTrades, _closeTrade } = get();
    openTrades.forEach(t => {
      const quotes = useMarket.getState().quotes;
      const price = quotes[t.ticker]?.price ?? t.entry;
      _closeTrade(t.id, price, "manual");
    });
    _addLog("system", "Agent stopped. All positions closed.");
    set({ status: "idle", orbRanges: [], scanningTicker: null });
  },

  pauseResume: () => {
    const { status, _addLog, _setStatus } = get();
    if (status === "paused") {
      _setStatus("scanning");
      _addLog("system", "Agent resumed.");
    } else {
      _setStatus("paused");
      _addLog("warn", "Agent paused — no new entries will be taken.");
    }
  },

  setOrbMinutes: (m) => set(s => ({ config: { ...s.config, orbMinutes: m } })),
  addTicker: (t) => set(s => ({
    config: { ...s.config, tickers: s.config.tickers.includes(t) ? s.config.tickers : [...s.config.tickers, t] }
  })),
  removeTicker: (t) => set(s => ({
    config: { ...s.config, tickers: s.config.tickers.filter(x => x !== t) }
  })),
  setSizePerTrade: (n) => set(s => ({ config: { ...s.config, sizePerTrade: n } })),

  _addLog: (type, message) => set(s => ({
    log: [{ id: uid(), ts: nowTs(), type, message }, ...s.log].slice(0, 200),
  })),

  _setStatus: (status) => set({ status }),

  _setOrbRanges: (orbRanges) => set({ orbRanges }),

  _enterTrade: (trade) => {
    const { _addLog } = get();
    _addLog("buy", `ENTRY ${trade.direction.toUpperCase()} ${trade.ticker} @ $${trade.entry.toFixed(2)} | Stop $${trade.stop.toFixed(2)} | TP RSI≥75`);
    set(s => ({ openTrades: [...s.openTrades, trade], status: "in_trade" }));
  },

  _updateRsi: (id, rsi) => set(s => ({
    openTrades: s.openTrades.map(t => t.id === id ? { ...t, currentRsi: rsi } : t),
  })),

  _closeTrade: (id, exitPrice, reason) => {
    const { _addLog } = get();
    set(s => {
      const trade = s.openTrades.find(t => t.id === id);
      if (!trade) return {};
      const multiplier = trade.direction === "Long" ? 1 : -1;
      const pnlPct = ((exitPrice - trade.entry) / trade.entry) * 100 * multiplier;
      const pnl = (pnlPct / 100) * trade.entry * trade.qty;
      const closed: RobotTrade = {
        ...trade, status: "closed", exitPrice, exitTime: nowTs(), exitReason: reason, pnl, pnlPct,
      };
      const wins = pnl > 0 ? s.sessionWins + 1 : s.sessionWins;
      const losses = pnl <= 0 ? s.sessionLosses + 1 : s.sessionLosses;

      const label = reason === "take_profit" ? "TAKE PROFIT" : reason === "stop_loss" ? "STOP LOSS" : "MANUAL";
      _addLog(
        reason === "take_profit" ? "success" : reason === "stop_loss" ? "warn" : "sell",
        `${label} ${trade.ticker} @ $${exitPrice.toFixed(2)} | P&L: ${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)} (${pnlPct.toFixed(2)}%)`
      );

      return {
        openTrades: s.openTrades.filter(t => t.id !== id),
        closedTrades: [closed, ...s.closedTrades],
        sessionPnl: s.sessionPnl + pnl,
        sessionWins: wins,
        sessionLosses: losses,
        status: s.openTrades.length <= 1 ? "scanning" : s.status,
      };
    });
  },

  _setScanningTicker: (t) => set({ scanningTicker: t }),
}));
