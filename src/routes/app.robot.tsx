import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useRobot } from "@/store/robot";
import { useMarket } from "@/store/market";
import { ErrorBoundary } from "@/components/trade/ErrorBoundary";
import {
  Bot, Play, Pause, Square, Plus, X, ChevronDown, Activity,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info,
  ShieldAlert, Cpu, Zap,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/robot")({ component: OrbRobotPage });

// ─── simulation engine ────────────────────────────────────────────────────────

function useOrbSimulation() {
  const robot = useRobot();
  const quotes = useMarket(s => s.quotes);
  const loopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  function clearLoop() {
    if (loopRef.current) { clearTimeout(loopRef.current); loopRef.current = null; }
  }

  function delay(ms: number) {
    return new Promise<void>(resolve => {
      loopRef.current = setTimeout(resolve, ms);
    });
  }

  async function runCycle() {
    const st = useRobot.getState();
    if (!activeRef.current || st.status === "idle" || st.status === "paused") return;

    const { config, _addLog, _setStatus, _setOrbRanges, _enterTrade, _updateRsi, _closeTrade, _setScanningTicker } = st;
    const tickers = config.tickers;

    // ── Phase 1: analyzing → establish ORB ranges ──────────────────────────
    _setStatus("analyzing");
    _addLog("info", `Scanning ${tickers.length} tickers for opening range (${config.orbMinutes}m window)...`);

    await delay(1800);
    if (!activeRef.current) return;

    const ranges = tickers.map(ticker => {
      const q = quotes[ticker];
      const base = q?.price ?? 100;
      const spread = base * (0.005 + Math.random() * 0.015);
      const high = base + spread / 2;
      const low = base - spread / 2;
      return { ticker, high: +high.toFixed(2), low: +low.toFixed(2), rangePct: +((spread / base) * 100).toFixed(2), established: true };
    });
    _setOrbRanges(ranges);
    _addLog("info", `ORB ranges established for: ${tickers.join(", ")}`);

    // ── Phase 2: scanning for breakout ─────────────────────────────────────
    _setStatus("scanning");

    for (const ticker of tickers) {
      if (!activeRef.current || useRobot.getState().status === "paused") return;

      const range = ranges.find(r => r.ticker === ticker)!;
      _setScanningTicker(ticker);
      _addLog("info", `[${ticker}] Watching breakout — Range $${range.low.toFixed(2)}–$${range.high.toFixed(2)} (${range.rangePct.toFixed(2)}%)`);
      await delay(900);

      if (!activeRef.current) return;

      // random breakout decision (70% chance of a setup forming)
      const hasBreakout = Math.random() < 0.70;
      if (!hasBreakout) {
        _addLog("warn", `[${ticker}] No clean breakout — skipping`);
        continue;
      }

      const direction: "Long" | "Short" = Math.random() > 0.35 ? "Long" : "Short";
      const entry = direction === "Long" ? +(range.high + 0.05).toFixed(2) : +(range.low - 0.05).toFixed(2);
      const stop = direction === "Long" ? +(entry * (1 - config.stopPct / 100)).toFixed(2) : +(entry * (1 + config.stopPct / 100)).toFixed(2);
      const tp = direction === "Long" ? +(entry * 1.025).toFixed(2) : +(entry * 0.975).toFixed(2);
      const qty = Math.floor(config.sizePerTrade / entry);

      _addLog("info", `[${ticker}] Breakout detected! ${direction} above $${range.high.toFixed(2)} — preparing entry`);
      await delay(600);
      if (!activeRef.current) return;

      const trade = {
        id: Math.random().toString(36).slice(2, 9),
        ticker, direction, entry, stop, tp, qty, status: "open" as const,
        entryTime: new Date().toLocaleTimeString("en-US", { hour12: false }),
        currentRsi: 38 + Math.round(Math.random() * 12),
      };
      _enterTrade(trade);

      // ── Phase 3: RSI climb simulation ──────────────────────────────────
      let rsi = trade.currentRsi;
      let hitStop = false;

      for (let step = 0; step < 12; step++) {
        await delay(1200);
        if (!activeRef.current) return;

        const currentTrade = useRobot.getState().openTrades.find(t => t.id === trade.id);
        if (!currentTrade) break;

        // price drift: can go up or down
        const drift = (Math.random() - 0.38) * 3.5;
        rsi = Math.min(100, Math.max(20, rsi + drift));
        _updateRsi(trade.id, Math.round(rsi));
        _addLog("rsi", `[${ticker}] RSI: ${Math.round(rsi).toString().padStart(3)} ${rsi >= 65 ? "↑↑" : rsi >= 50 ? "↑" : "→"}`);

        // stop loss check (simulate price moving to stop)
        if (Math.random() < 0.06) {
          _closeTrade(trade.id, stop, "stop_loss");
          hitStop = true;
          break;
        }

        // RSI ≥ 75 → take profit
        if (rsi >= config.rsiTp) {
          const exitPrice = direction === "Long"
            ? +(entry * (1 + 0.018 + Math.random() * 0.012)).toFixed(2)
            : +(entry * (1 - 0.018 - Math.random() * 0.012)).toFixed(2);
          _closeTrade(trade.id, exitPrice, "take_profit");
          _addLog("success", `[${ticker}] RSI target hit (${Math.round(rsi)}) → position exited`);
          break;
        }
      }

      // if still open after loop, close at small gain/loss
      const stillOpen = useRobot.getState().openTrades.find(t => t.id === trade.id);
      if (stillOpen && !hitStop) {
        const exitPrice = +(entry * (1 + (Math.random() - 0.4) * 0.015)).toFixed(2);
        _closeTrade(trade.id, exitPrice, "manual");
        _addLog("info", `[${ticker}] Time exit — position closed`);
      }

      if (!activeRef.current) return;
      await delay(500);
    }

    _setScanningTicker(null);
    _addLog("system", "─── Scan cycle complete — restarting ───");

    // recurse for next cycle
    if (activeRef.current) {
      await delay(2000);
      if (activeRef.current) runCycle();
    }
  }

  function start() {
    activeRef.current = true;
    runCycle();
  }

  function stop() {
    activeRef.current = false;
    clearLoop();
  }

  return { start, stop };
}

// ─── page ─────────────────────────────────────────────────────────────────────

function OrbRobotPage() {
  const status = useRobot(s => s.status);
  const config = useRobot(s => s.config);
  const log = useRobot(s => s.log);
  const orbRanges = useRobot(s => s.orbRanges);
  const openTrades = useRobot(s => s.openTrades);
  const closedTrades = useRobot(s => s.closedTrades);
  const sessionPnl = useRobot(s => s.sessionPnl);
  const sessionWins = useRobot(s => s.sessionWins);
  const sessionLosses = useRobot(s => s.sessionLosses);
  const scanningTicker = useRobot(s => s.scanningTicker);

  const startAgent = useRobot(s => s.startAgent);
  const stopAgent = useRobot(s => s.stopAgent);
  const pauseResume = useRobot(s => s.pauseResume);
  const setOrbMinutes = useRobot(s => s.setOrbMinutes);
  const addTicker = useRobot(s => s.addTicker);
  const removeTicker = useRobot(s => s.removeTicker);
  const setSizePerTrade = useRobot(s => s.setSizePerTrade);

  const [tickerInput, setTickerInput] = useState("");
  const quotes = useMarket(s => s.quotes);
  const logRef = useRef<HTMLDivElement>(null);
  const sim = useOrbSimulation();

  const isRunning = status !== "idle";

  function handleStart() {
    startAgent();
    sim.start();
    toast.success("ORB Robot Agent started", { description: `${config.orbMinutes}m ORB | 1% stop | RSI 75 TP` });
  }

  function handleStop() {
    sim.stop();
    stopAgent();
    toast.info("Agent stopped — session complete");
  }

  function handlePause() {
    pauseResume();
    if (status === "paused") toast.success("Agent resumed");
    else toast.info("Agent paused");
  }

  function handleAddTicker() {
    const t = tickerInput.trim().toUpperCase();
    if (!t) return;
    if (!quotes[t]) { toast.error(`"${t}" not found`); return; }
    addTicker(t);
    setTickerInput("");
    toast.success(`${t} added to watchlist`);
  }

  // auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = 0;
  }, [log]);

  const winRate = sessionWins + sessionLosses > 0
    ? ((sessionWins / (sessionWins + sessionLosses)) * 100).toFixed(0)
    : "—";

  const statusColor = {
    idle: "text-muted-foreground",
    analyzing: "text-warn",
    scanning: "text-brand",
    in_trade: "text-bull",
    paused: "text-warn",
  }[status];

  const statusLabel = {
    idle: "Idle",
    analyzing: "Analyzing Ranges",
    scanning: "Scanning Breakouts",
    in_trade: "In Trade",
    paused: "Paused",
  }[status];

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[calc(100vh-3rem)]">

        {/* ── Header bar ── */}
        <div className="h-14 px-4 border-b border-border bg-surface flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center">
              <Bot className="size-4 text-brand" />
            </div>
            <div>
              <div className="text-sm font-semibold">ORB Robot Agent</div>
              <div className="text-[10px] text-muted-foreground">Opening Range Breakout · 1% Stop · RSI 75 TP</div>
            </div>
          </div>

          {/* Status pill */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${isRunning ? "border-brand/30 bg-brand/10" : "border-border bg-background"}`}>
            <span className={`size-1.5 rounded-full inline-block ${status === "in_trade" ? "bg-bull animate-pulse" : status === "idle" || status === "paused" ? "bg-muted-foreground" : "bg-brand animate-pulse"}`} />
            <span className={statusColor}>{statusLabel}</span>
            {scanningTicker && status === "scanning" && (
              <span className="text-muted-foreground">— {scanningTicker}</span>
            )}
          </div>

          <div className="flex-1" />

          {/* Session stats */}
          <div className="hidden sm:flex items-center gap-5 text-xs">
            <StatChip label="Session P&L" value={`${sessionPnl >= 0 ? "+" : ""}$${sessionPnl.toFixed(0)}`} color={sessionPnl >= 0 ? "text-bull" : "text-bear"} />
            <StatChip label="Win Rate" value={`${winRate}%`} />
            <StatChip label="Trades" value={`${sessionWins}W / ${sessionLosses}L`} />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button onClick={handleStart}
                className="h-8 px-4 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors">
                <Play className="size-3.5 fill-current" /> Start Agent
              </button>
            ) : (
              <>
                <button onClick={handlePause}
                  className="h-8 px-3 rounded-md border border-border hover:bg-accent text-xs font-medium flex items-center gap-1.5 transition-colors">
                  {status === "paused" ? <><Play className="size-3.5" /> Resume</> : <><Pause className="size-3.5" /> Pause</>}
                </button>
                <button onClick={handleStop}
                  className="h-8 px-3 rounded-md border border-bear/50 text-bear hover:bg-bear/10 text-xs font-medium flex items-center gap-1.5 transition-colors">
                  <Square className="size-3.5 fill-current" /> Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">

          {/* ── Left: config + log (320px) ── */}
          <aside className="w-80 shrink-0 border-r border-border bg-surface flex flex-col">

            {/* Config */}
            <div className="p-4 border-b border-border space-y-4">
              <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Strategy Config</h3>

              {/* ORB window */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Opening Range Window</label>
                <div className="mt-1.5 flex rounded-md border border-border overflow-hidden h-8 text-xs font-medium">
                  {([5, 15, 30] as const).map(m => (
                    <button key={m} disabled={isRunning} onClick={() => setOrbMinutes(m)}
                      className={`flex-1 transition-colors disabled:opacity-50 ${config.orbMinutes === m ? "bg-brand text-primary-foreground" : "bg-background hover:bg-accent"}`}>
                      {m}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Fixed params display */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-background p-2.5">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Stop Loss</div>
                  <div className="text-sm font-semibold text-bear font-mono">1.00%</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Fixed · Always</div>
                </div>
                <div className="rounded-lg border border-border bg-background p-2.5">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Take Profit</div>
                  <div className="text-sm font-semibold text-bull font-mono">RSI ≥ 75</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Momentum exit</div>
                </div>
              </div>

              {/* Size per trade */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Size per Trade ($)</label>
                <select disabled={isRunning} value={config.sizePerTrade}
                  onChange={e => setSizePerTrade(Number(e.target.value))}
                  className="mt-1 w-full h-8 px-2 bg-background border border-border rounded text-sm focus:outline-none disabled:opacity-50">
                  {[1000, 2000, 5000, 10000].map(v => <option key={v} value={v}>${v.toLocaleString()}</option>)}
                </select>
              </div>

              {/* Ticker watchlist */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Ticker Watchlist</label>
                <div className="mt-1.5 flex flex-wrap gap-1 min-h-8">
                  {config.tickers.map(t => (
                    <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-colors ${scanningTicker === t ? "bg-brand/15 border-brand/40 text-brand" : "bg-background border-border text-foreground"}`}>
                      {t}
                      <button onClick={() => removeTicker(t)} disabled={isRunning || config.tickers.length <= 1}
                        className="hover:text-bear disabled:opacity-30 transition-colors">
                        <X className="size-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <input value={tickerInput} onChange={e => setTickerInput(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === "Enter") handleAddTicker(); }}
                    disabled={isRunning}
                    placeholder="Add ticker..." maxLength={6}
                    className="flex-1 h-7 px-2 bg-background border border-border rounded text-xs font-mono uppercase focus:ring-1 focus:ring-brand/40 focus:outline-none disabled:opacity-50 placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground" />
                  <button onClick={handleAddTicker} disabled={isRunning || !tickerInput.trim()}
                    className="size-7 rounded bg-brand/20 hover:bg-brand/30 text-brand flex items-center justify-center disabled:opacity-30 transition-colors">
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Agent log console */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="h-8 px-3 border-b border-border flex items-center justify-between shrink-0">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Agent Log</span>
                <span className="text-[10px] text-muted-foreground">{log.length} entries</span>
              </div>
              <div ref={logRef} className="flex-1 overflow-auto p-2 space-y-0.5 font-mono text-[10px]">
                {log.length === 0 ? (
                  <p className="text-muted-foreground p-2 text-center">Log will appear here once started.</p>
                ) : log.map(entry => (
                  <div key={entry.id} className="flex gap-2 leading-relaxed">
                    <span className="text-muted-foreground shrink-0 tabular-nums">{entry.ts}</span>
                    <LogIcon type={entry.type} />
                    <span className={logColor(entry.type)}>{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Right: ORB ranges + trades ── */}
          <div className="flex-1 flex flex-col min-h-0 overflow-auto">

            {/* ORB Range Visualizer */}
            <section className="p-4 border-b border-border shrink-0">
              <h3 className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">ORB Range Visualizer</h3>
              {orbRanges.length === 0 ? (
                <div className="h-28 flex items-center justify-center rounded-lg border border-dashed border-border">
                  <p className="text-xs text-muted-foreground">{isRunning ? "Establishing ranges..." : "Start agent to see ORB ranges"}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {orbRanges.map(r => {
                    const q = quotes[r.ticker];
                    const price = q?.price ?? r.high;
                    const rangeMid = (r.high + r.low) / 2;
                    const aboveHigh = price > r.high;
                    const belowLow = price < r.low;
                    const inRange = !aboveHigh && !belowLow;
                    const pricePct = Math.max(0, Math.min(100, ((price - r.low) / (r.high - r.low)) * 100));
                    const openTrade = openTrades.find(t => t.ticker === r.ticker);

                    return (
                      <div key={r.ticker} className={`rounded-lg border p-3 ${openTrade ? "border-bull/40 bg-bull/5" : scanningTicker === r.ticker ? "border-brand/40 bg-brand/5" : "border-border bg-background"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">{r.ticker}</span>
                          {openTrade
                            ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-bull/15 text-bull border border-bull/30 font-semibold">LIVE</span>
                            : aboveHigh
                              ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-bull/15 text-bull border border-bull/30 font-semibold">↑ ABOVE</span>
                              : belowLow
                                ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-bear/15 text-bear border border-bear/30 font-semibold">↓ BELOW</span>
                                : <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">IN RANGE</span>
                          }
                        </div>

                        {/* Price bar */}
                        <div className="relative h-16 flex items-center">
                          <div className="absolute inset-x-0 flex flex-col justify-between h-full py-1 text-[8px] text-muted-foreground font-mono">
                            <span className="text-bull">${r.high.toFixed(2)}</span>
                            <span>${(rangeMid).toFixed(2)}</span>
                            <span className="text-bear">${r.low.toFixed(2)}</span>
                          </div>
                          <div className="absolute right-0 w-3 h-full flex flex-col">
                            {/* Range bar */}
                            <div className="relative flex-1 ml-1">
                              <div className="absolute inset-0 rounded-full bg-border/60 w-1.5 mx-auto" />
                              {/* ORB band */}
                              <div className="absolute w-1.5 mx-auto rounded bg-brand/20 border-y border-brand/40 inset-x-0"
                                style={{ top: "0%", bottom: "0%" }} />
                              {/* Current price marker */}
                              <div className="absolute w-3 h-0.5 rounded-full -left-0.5 transition-all"
                                style={{ bottom: `${pricePct}%`, backgroundColor: aboveHigh ? "var(--bull)" : belowLow ? "var(--bear)" : "var(--brand)" }} />
                            </div>
                          </div>
                        </div>

                        <div className="mt-1 text-[9px] text-muted-foreground font-mono">
                          Range: {r.rangePct.toFixed(2)}%
                        </div>
                        {openTrade && (
                          <div className="mt-1 text-[9px] font-semibold text-bull">
                            RSI: {openTrade.currentRsi}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Open Trades */}
            <section className="shrink-0">
              <div className="h-9 px-4 border-b border-border flex items-center gap-2 bg-surface">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Open Trades</span>
                <span className="text-[10px] text-muted-foreground">{openTrades.length} active</span>
              </div>
              {openTrades.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">No open trades — agent will enter on next breakout</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase text-muted-foreground border-b border-border bg-surface">
                    <tr>
                      <th className="text-left px-4 py-1.5 font-medium">Ticker</th>
                      <th className="text-left px-3 font-medium">Dir</th>
                      <th className="text-right px-3 font-medium">Entry</th>
                      <th className="text-right px-3 font-medium">Stop</th>
                      <th className="text-right px-3 font-medium">TP Trigger</th>
                      <th className="text-right px-3 font-medium">RSI</th>
                      <th className="px-4 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openTrades.map(t => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-accent/40">
                        <td className="px-4 py-2.5 font-semibold">{t.ticker}</td>
                        <td className={`px-3 font-semibold ${t.direction === "Long" ? "text-bull" : "text-bear"}`}>{t.direction}</td>
                        <td className="px-3 text-right font-mono tabular-nums">${t.entry.toFixed(2)}</td>
                        <td className="px-3 text-right font-mono tabular-nums text-bear">${t.stop.toFixed(2)}</td>
                        <td className="px-3 text-right font-mono tabular-nums text-bull">RSI 75</td>
                        <td className="px-3 text-right font-mono tabular-nums font-semibold">
                          <span className={t.currentRsi >= 65 ? "text-bull" : t.currentRsi >= 50 ? "text-warn" : "text-muted-foreground"}>
                            {t.currentRsi}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2 min-w-24">
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${t.currentRsi >= 75 ? "bg-bull" : t.currentRsi >= 50 ? "bg-warn" : "bg-brand"}`}
                                style={{ width: `${Math.max(4, Math.min(100, ((t.currentRsi - 20) / 55) * 100))}%` }} />
                            </div>
                            <span className="text-[9px] text-muted-foreground shrink-0">{t.currentRsi}/75</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Completed Trades */}
            <section className="flex-1 min-h-0">
              <div className="h-9 px-4 border-b border-border flex items-center gap-2 bg-surface sticky top-0 z-10">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Completed Trades</span>
                <span className="text-[10px] text-muted-foreground">{closedTrades.length} fills</span>
                {closedTrades.length > 0 && (
                  <span className={`ml-auto text-[10px] font-semibold ${sessionPnl >= 0 ? "text-bull" : "text-bear"}`}>
                    Session: {sessionPnl >= 0 ? "+" : ""}${sessionPnl.toFixed(0)}
                  </span>
                )}
              </div>
              {closedTrades.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-muted-foreground">Completed trades will appear here</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="text-[10px] uppercase text-muted-foreground border-b border-border bg-surface sticky top-9 z-10">
                    <tr>
                      <th className="text-left px-4 py-1.5 font-medium">Time</th>
                      <th className="text-left px-3 font-medium">Ticker</th>
                      <th className="text-left px-3 font-medium">Dir</th>
                      <th className="text-right px-3 font-medium">Entry</th>
                      <th className="text-right px-3 font-medium">Exit</th>
                      <th className="text-right px-3 font-medium">P&L</th>
                      <th className="text-right px-4 font-medium">Exit Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedTrades.map(t => (
                      <tr key={t.id} className="border-b border-border/50 hover:bg-accent/40">
                        <td className="px-4 py-2 font-mono text-muted-foreground tabular-nums">{t.entryTime}</td>
                        <td className="px-3 font-semibold">{t.ticker}</td>
                        <td className={`px-3 font-semibold ${t.direction === "Long" ? "text-bull" : "text-bear"}`}>{t.direction}</td>
                        <td className="px-3 text-right font-mono tabular-nums">${t.entry.toFixed(2)}</td>
                        <td className="px-3 text-right font-mono tabular-nums">${t.exitPrice?.toFixed(2) ?? "—"}</td>
                        <td className={`px-3 text-right font-mono tabular-nums font-semibold ${(t.pnl ?? 0) >= 0 ? "text-bull" : "text-bear"}`}>
                          {(t.pnl ?? 0) >= 0 ? "+" : ""}${(t.pnl ?? 0).toFixed(0)}
                          <span className="text-[9px] ml-1">({(t.pnlPct ?? 0).toFixed(2)}%)</span>
                        </td>
                        <td className="px-4 text-right">
                          <ExitBadge reason={t.exitReason} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function StatChip({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`font-mono font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function LogIcon({ type }: { type: string }) {
  const cls = "size-2.5 shrink-0 mt-0.5";
  switch (type) {
    case "buy": return <TrendingUp className={`${cls} text-bull`} />;
    case "sell": return <TrendingDown className={`${cls} text-bear`} />;
    case "success": return <CheckCircle2 className={`${cls} text-bull`} />;
    case "warn": return <AlertTriangle className={`${cls} text-warn`} />;
    case "rsi": return <Activity className={`${cls} text-brand`} />;
    case "system": return <Cpu className={`${cls} text-muted-foreground`} />;
    default: return <Info className={`${cls} text-muted-foreground`} />;
  }
}

function logColor(type: string) {
  switch (type) {
    case "buy": return "text-bull";
    case "sell": return "text-bear";
    case "success": return "text-bull";
    case "warn": return "text-warn";
    case "rsi": return "text-brand";
    case "system": return "text-muted-foreground";
    default: return "text-foreground";
  }
}

function ExitBadge({ reason }: { reason?: string }) {
  if (reason === "take_profit") return <span className="text-[9px] px-1.5 py-0.5 rounded border border-bull/30 bg-bull/10 text-bull font-semibold">RSI TP</span>;
  if (reason === "stop_loss") return <span className="text-[9px] px-1.5 py-0.5 rounded border border-bear/30 bg-bear/10 text-bear font-semibold">STOP</span>;
  return <span className="text-[9px] px-1.5 py-0.5 rounded border border-border bg-muted text-muted-foreground">Manual</span>;
}
