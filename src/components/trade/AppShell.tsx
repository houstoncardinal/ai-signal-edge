import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Radar, Sparkles, CandlestickChart, ListChecks,
  Newspaper, BookOpen, Beaker, Settings, Bell, Search, ChevronLeft, ChevronRight, Sun, Moon, TrendingUp, Bot,
} from "lucide-react";
import { TickerSpotlight } from "./TickerSpotlight";
import { ErrorBoundary } from "./ErrorBoundary";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/scanner", label: "Scanner", icon: Radar },
  { to: "/app/signals", label: "AI Signals", icon: Sparkles },
  { to: "/app/charts", label: "Charts", icon: CandlestickChart },
  { to: "/app/watchlists", label: "Watchlists", icon: ListChecks },
  { to: "/app/news", label: "News", icon: Newspaper },
  { to: "/app/journal", label: "Journal", icon: BookOpen },
  { to: "/app/paper", label: "Paper Trade", icon: Beaker },
  { to: "/app/robot", label: "ORB Robot", icon: Bot },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function getStoredCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sidebar-collapsed") === "true";
}

function getStoredTheme(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("theme-light") === "true";
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(getStoredCollapsed);
  const [light, setLight] = useState(getStoredTheme);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  function toggleCollapsed() {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  function toggleLight() {
    setLight(l => {
      const next = !l;
      localStorage.setItem("theme-light", String(next));
      return next;
    });
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSpotlightOpen(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className={light ? "light" : ""}>
      <div className="min-h-screen flex w-full bg-background text-foreground">

        {/* Desktop Sidebar */}
        <aside className={`sidebar-mobile-hidden shrink-0 border-r border-border bg-surface flex flex-col transition-all duration-300 ease-in-out relative ${collapsed ? "w-14" : "w-56"}`}>
          <div className="h-12 flex items-center gap-2 px-3 border-b border-border shrink-0">
            <div className="size-7 rounded-md bg-gradient-to-br from-brand to-brand-glow flex items-center justify-center shrink-0">
              <TrendingUp className="size-4 text-white" />
            </div>
            {!collapsed && <span className="font-semibold tracking-tight whitespace-nowrap overflow-hidden">TradeEdge<span className="text-brand"> AI</span></span>}
          </div>
          <nav className="p-2 space-y-0.5 flex-1">
            {NAV.map((n) => {
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${active ? "bg-brand/15 text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                  <n.icon className="size-4 shrink-0" />
                  {!collapsed && <span className="whitespace-nowrap overflow-hidden">{n.label}</span>}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={toggleCollapsed}
            className="absolute -right-3 bottom-8 size-6 rounded-full border border-border bg-surface hover:bg-accent flex items-center justify-center text-muted-foreground shadow-sm z-10"
          >
            {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
          </button>
        </aside>

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 shrink-0 border-b border-border bg-surface flex items-center gap-3 px-4">
            <div className="flex-1 max-w-xl relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <button
                onClick={() => setSpotlightOpen(true)}
                className="w-full h-8 pl-8 pr-3 text-sm bg-background border border-border rounded-md text-left text-muted-foreground hover:border-brand/40 hover:ring-2 hover:ring-brand/20 transition-colors font-sans flex items-center"
              >
                Search ticker or company...
                <kbd className="ml-auto text-[10px] border border-border rounded px-1 py-0.5 font-mono hidden sm:block">⌘K</kbd>
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={toggleLight} className="size-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground" title="Toggle theme">
                {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </button>
              <button className="size-8 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground relative">
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-bear" />
              </button>
              <div className="size-8 rounded-full bg-gradient-to-br from-brand to-brand-glow flex items-center justify-center text-xs font-semibold text-white cursor-pointer">JD</div>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>

          {/* Mobile bottom tab bar */}
          <nav className="mobile-bottom-tabs hidden border-t border-border bg-surface shrink-0 overflow-x-auto">
            {NAV.slice(0, 6).map((n) => {
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              return (
                <Link key={n.to} to={n.to}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] transition-colors ${active ? "text-brand" : "text-muted-foreground"}`}>
                  <n.icon className="size-5" />
                  <span>{n.label.split(" ")[0]}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {spotlightOpen && <TickerSpotlight onClose={() => setSpotlightOpen(false)} />}
    </div>
  );
}
