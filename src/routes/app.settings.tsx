import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/app/settings")({ component: () => (
  <div className="p-4 max-w-2xl">
    <h1 className="text-xl font-semibold">Settings</h1>
    <div className="mt-4 space-y-3">
      {["Account", "Notifications", "Broker connections", "API keys (Elite)", "Data subscriptions"].map(s => (
        <div key={s} className="rounded-lg border border-border bg-surface p-4 flex items-center justify-between">
          <span className="text-sm font-medium">{s}</span><span className="text-xs text-muted-foreground">Manage →</span>
        </div>
      ))}
    </div>
  </div>
)});
