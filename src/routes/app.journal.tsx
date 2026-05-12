import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/journal")({ component: () => (
  <div className="p-4">
    <h1 className="text-xl font-semibold">Trade Journal</h1>
    <p className="text-xs text-muted-foreground mt-1">Logged trades, win rate, average R, and P&L history. Available on Pro and Elite.</p>
    <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No journal entries yet. Connect Alpaca or import a CSV to get started.</div>
  </div>
)});
