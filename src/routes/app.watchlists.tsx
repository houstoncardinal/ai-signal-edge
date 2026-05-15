import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMarket, type WatchlistDef } from "@/store/market";
import { TickerBadge, ChangePill, LivePrice, ScoreBadge, MiniSpark, formatBig } from "@/components/trade/primitives";
import { Plus, Bell, Trash2, Pencil, Check, X, Upload, Download, Star, MoreHorizontal, ChevronUp, ChevronDown, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { AlertModal } from "@/components/trade/AlertModal";
import { EmptyState } from "@/components/trade/EmptyState";
import { ErrorBoundary } from "@/components/trade/ErrorBoundary";

export const Route = createFileRoute("/app/watchlists")({ component: WatchlistManager });

function WatchlistManager() {
  const quotes = useMarket(s => s.quotes);
  const watchlists = useMarket(s => s.watchlists);
  const activeWatchlistId = useMarket(s => s.activeWatchlistId);
  const setActiveWatchlist = useMarket(s => s.setActiveWatchlist);
  const createWatchlist = useMarket(s => s.createWatchlist);
  const deleteWatchlist = useMarket(s => s.deleteWatchlist);
  const renameWatchlist = useMarket(s => s.renameWatchlist);
  const removeFromWatchlist = useMarket(s => s.removeFromWatchlist);
  const addToWatchlist = useMarket(s => s.addToWatchlist);
  const reorderWatchlistItem = useMarket(s => s.reorderWatchlistItem);
  const setActiveChartTicker = useMarket(s => s.setActiveChartTicker);
  const navigate = useNavigate();

  const [newListName, setNewListName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [addTickerInput, setAddTickerInput] = useState("");
  const [alertTicker, setAlertTicker] = useState<string | null>(null);
  const [contextTicker, setContextTicker] = useState<string | null>(null);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
  const [alertedTickers, setAlertedTickers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 500); return () => clearTimeout(t); }, []);

  const activeList = watchlists.find(l => l.id === activeWatchlistId);

  function handleCreate() {
    if (!newListName.trim()) return;
    createWatchlist(newListName.trim());
    setNewListName("");
    toast.success(`Watchlist "${newListName.trim()}" created`);
  }

  function handleRename(id: string) {
    if (!editName.trim()) return;
    renameWatchlist(id, editName.trim());
    setEditingId(null);
    toast.success("Watchlist renamed");
  }

  function handleDelete(id: string, name: string) {
    deleteWatchlist(id);
    toast.success(`"${name}" deleted`);
  }

  function handleAddTicker() {
    const t = addTickerInput.trim().toUpperCase();
    if (!t) return;
    if (!quotes[t]) { toast.error(`Ticker "${t}" not found`); return; }
    const added = addToWatchlist(t, activeWatchlistId);
    if (added) toast.success(`${t} added to ${activeList?.name}`);
    else toast.info(`${t} is already in ${activeList?.name}`);
    setAddTickerInput("");
  }

  function handleContextMenu(e: React.MouseEvent, ticker: string) {
    e.preventDefault();
    setContextTicker(ticker);
    setContextPos({ x: e.clientX, y: e.clientY });
  }

  function handleViewChart(ticker: string) {
    setActiveChartTicker(ticker);
    navigate({ to: "/app/charts" });
    setContextTicker(null);
  }

  function handleRemoveTicker(ticker: string) {
    if (!activeList) return;
    removeFromWatchlist(ticker, activeList.id);
    toast.success(`${ticker} removed from ${activeList.name}`);
    setContextTicker(null);
  }

  function toggleAlert(ticker: string) {
    setAlertedTickers(s => { const n = new Set(s); n.has(ticker) ? n.delete(ticker) : n.add(ticker); return n; });
    if (!alertedTickers.has(ticker)) {
      setAlertTicker(ticker);
    }
  }

  return (
    <ErrorBoundary>
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Left: list of watchlists */}
        <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col">
          <div className="h-10 px-3 flex items-center justify-between border-b border-border shrink-0">
            <span className="text-xs uppercase tracking-wider font-medium text-muted-foreground">My Lists</span>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-0.5">
            {watchlists.map(list => (
              <div key={list.id}
                onClick={() => setActiveWatchlist(list.id)}
                className={`group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors ${activeWatchlistId === list.id ? "bg-brand/15 text-brand" : "hover:bg-accent"}`}
              >
                <Star className={`size-3.5 shrink-0 ${activeWatchlistId === list.id ? "fill-brand text-brand" : "text-muted-foreground"}`} />
                {editingId === list.id ? (
                  <div className="flex-1 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleRename(list.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 h-6 px-1 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-brand/40" autoFocus />
                    <button onClick={() => handleRename(list.id)} className="text-bull"><Check className="size-3" /></button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="size-3" /></button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm min-w-0 truncate">{list.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{list.tickers.length}</span>
                    <div className="hidden group-hover:flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditingId(list.id); setEditName(list.name); }} className="size-5 rounded hover:bg-accent flex items-center justify-center text-muted-foreground">
                        <Pencil className="size-3" />
                      </button>
                      {watchlists.length > 1 && (
                        <button onClick={() => handleDelete(list.id, list.name)} className="size-5 rounded hover:bg-bear/20 flex items-center justify-center text-muted-foreground hover:text-bear">
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Create new list */}
          <div className="p-2 border-t border-border shrink-0">
            <div className="flex gap-1.5">
              <input value={newListName} onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                placeholder="New list name..." className="flex-1 h-7 px-2 bg-background border border-border rounded text-xs focus:ring-1 focus:ring-brand/40 focus:outline-none" />
              <button onClick={handleCreate} disabled={!newListName.trim()} className="size-7 rounded bg-brand hover:bg-brand-glow text-primary-foreground flex items-center justify-center disabled:opacity-40">
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Right: tickers in selected watchlist */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="h-12 px-4 border-b border-border bg-surface flex items-center gap-3 shrink-0">
            <h2 className="font-semibold text-sm">{activeList?.name ?? "Watchlist"}</h2>
            <span className="text-xs text-muted-foreground">{activeList?.tickers.length ?? 0} tickers</span>
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              <input value={addTickerInput} onChange={e => setAddTickerInput(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === "Enter") handleAddTicker(); }}
                placeholder="Add ticker..." className="h-8 px-3 w-32 bg-background border border-border rounded text-sm font-mono uppercase focus:ring-2 focus:ring-brand/40 focus:outline-none placeholder:font-sans placeholder:normal-case placeholder:text-muted-foreground" />
              <button onClick={handleAddTicker} className="h-8 px-3 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-xs font-medium">Add</button>
              <button className="h-8 px-2.5 rounded-md border border-border hover:bg-accent text-xs flex items-center gap-1.5 text-muted-foreground">
                <Upload className="size-3.5" /> Import CSV
              </button>
              <button className="h-8 px-2.5 rounded-md border border-border hover:bg-accent text-xs flex items-center gap-1.5 text-muted-foreground">
                <Download className="size-3.5" /> Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
              </div>
            ) : !activeList || activeList.tickers.length === 0 ? (
              <EmptyState icon={ListChecks} title="This watchlist is empty" description="Add tickers using the input above, or drag them in from the scanner." action="Add Ticker" onAction={() => setAddTickerInput(" ")} />
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground z-10">
                  <tr>
                    <th className="text-left font-medium py-2 pl-4 w-10"></th>
                    <th className="text-left font-medium px-3 py-2">Ticker</th>
                    <th className="text-right font-medium px-3">Price</th>
                    <th className="text-right font-medium px-3">Change %</th>
                    <th className="text-right font-medium px-3">Volume</th>
                    <th className="text-right font-medium px-3">Float</th>
                    <th className="text-right font-medium px-3">Sparkline</th>
                    <th className="text-right font-medium px-3 pr-4">Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {activeList.tickers.map((t, idx) => {
                    const q = quotes[t]; if (!q) return null;
                    return (
                      <tr key={t} onContextMenu={e => handleContextMenu(e, t)}
                        className="border-b border-border/50 hover:bg-accent/40 group">
                        {/* Reorder buttons */}
                        <td className="pl-4 py-2">
                          <div className="flex flex-col gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => reorderWatchlistItem(activeList.id, idx, Math.max(0, idx - 1))} disabled={idx === 0} className="hover:text-brand disabled:opacity-30"><ChevronUp className="size-3" /></button>
                            <button onClick={() => reorderWatchlistItem(activeList.id, idx, Math.min(activeList.tickers.length - 1, idx + 1))} disabled={idx === activeList.tickers.length - 1} className="hover:text-brand disabled:opacity-30"><ChevronDown className="size-3" /></button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <TickerBadge symbol={t} />
                            <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[140px]">{q.company}</span>
                          </div>
                        </td>
                        <td className="px-3 text-right"><LivePrice ticker={t} /></td>
                        <td className="px-3 text-right"><ChangePill pct={q.changePct} /></td>
                        <td className="px-3 text-right text-xs font-mono text-muted-foreground tabular-nums">{formatBig(q.volume)}</td>
                        <td className="px-3 text-right text-xs font-mono text-muted-foreground tabular-nums">{formatBig(q.float)}</td>
                        <td className="px-3 text-right"><div className="inline-block"><MiniSpark ticker={t} color={q.changePct >= 0 ? "var(--bull)" : "var(--bear)"} /></div></td>
                        <td className="px-3 pr-4 text-right">
                          <button onClick={() => toggleAlert(t)} className={`size-7 rounded-md flex items-center justify-center ml-auto transition-colors ${alertedTickers.has(t) ? "text-warn bg-warn/10" : "text-muted-foreground hover:text-warn hover:bg-warn/10"}`}>
                            <Bell className={`size-3.5 ${alertedTickers.has(t) ? "fill-warn" : ""}`} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextTicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextTicker(null)} />
          <div className="fixed z-50 w-48 rounded-md border border-border bg-surface shadow-xl py-1" style={{ left: contextPos.x, top: contextPos.y }}>
            {[
              { label: "View Chart", action: () => handleViewChart(contextTicker) },
              { label: "Add to Screener", action: () => { toast.info("Added to screener filter"); setContextTicker(null); } },
              { label: "Set Alert", action: () => { setAlertTicker(contextTicker); setContextTicker(null); } },
              { label: "Remove from List", action: () => handleRemoveTicker(contextTicker), danger: true },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${item.danger ? "text-bear" : ""}`}>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {alertTicker && <AlertModal ticker={alertTicker} onClose={() => setAlertTicker(null)} />}
    </ErrorBoundary>
  );
}
