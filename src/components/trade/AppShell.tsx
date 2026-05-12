import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Radar, Sparkles, CandlestickChart, ListChecks,
  Newspaper, BookOpen, Beaker, Settings, Bell, Search, ChevronLeft, ChevronRight, Sun, Moon, TrendingUp,
} from "lucide-react";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/scanner", label: "Scanner", icon: Radar },
  { to: "/app/signals", label: "AI Signals", icon: Sparkles },
  { to: "/app/charts", label: "Charts", icon: CandlestickChart },
  { to: "/app/watchlists", label: "Watchlists", icon: ListChecks },
  { to: "/app/news", label: "News", icon: Newspaper },
  { to: "/app/journal", label: "Journal", icon: BookOpen },
  { to: "/app/paper", label: "Paper Trade", icon: Beaker },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [light, setLight] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className={light ? "light" : ""}>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        {/* Sidebar */}
        <aside className={`shrink-0 border-r border-border bg-surface transition-all ${collapsed ? "w-14" : "w-56"}`}>
          <div className="h-12 flex items-center gap-2 px-3 border-b border-border">
            <div className="size-7 rounded-md bg-gradient-to-br from-brand to-brand-glow flex items-center justify-center">
              <TrendingUp className="size-4 text-white" />
            </div>
            {!collapsed && <span className="font-semibold tracking-tight">TradeEdge<span className="text-brand"> AI</span></span>}
          </div>
          <nav className="p-2 space-y-0.5">
            {NAV.map((n) => {
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${active ? "bg-brand/15 text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                  <n.icon className="size-4 shrink-0" />
                  {!collapsed && <span>{n.label}</span>}
                </Link>
              );
            })}
          </nav>
          <button onClick={() => setCollapsed(!collapsed)} className="absolute bottom-3 left-3 size-7 rounded-md border border-border bg-surface hover:bg-accent flex items-center justify-center text-muted-foreground">
            {collapsed ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
          </button>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 shrink-0 border-b border-border bg-surface flex items-center gap-3 px-4">
            <div className="flex-1 max-w-xl relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search ticker, company, or pattern..."
                className="w-full h-8 pl-8 pr-3 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/40 font-mono placeholder:font-sans placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setLight(!light)} className="size-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground" title="Toggle theme">
                {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </button>
              <button className="size-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground relative">
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-bear" />
              </button>
              <div className="size-8 rounded-full bg-gradient-to-br from-brand to-brand-glow flex items-center justify-center text-xs font-semibold text-white">JD</div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
