import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMarket } from "@/store/market";
import { User, Bell, Palette, CreditCard, Key, Copy, Trash2, Plus, ExternalLink, CheckCircle2, Settings, Briefcase, Loader2, ShieldCheck, AlertTriangle, ExternalLink as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { ErrorBoundary } from "@/components/trade/ErrorBoundary";
import {
  getBrokerStatus,
  saveBrokerCredentials,
  testBrokerConnection,
  clearBrokerCredentials,
} from "@/lib/alpaca.functions";

export const Route = createFileRoute("/app/settings")({ component: SettingsPage });

type Tab = "Brokerage" | "Account" | "Notifications" | "Appearance" | "Subscription" | "API Keys";
const TABS: { key: Tab; icon: any }[] = [
  { key: "Brokerage", icon: Briefcase },
  { key: "Account", icon: User },
  { key: "Notifications", icon: Bell },
  { key: "Appearance", icon: Palette },
  { key: "Subscription", icon: CreditCard },
  { key: "API Keys", icon: Key },
];

const ACCENT_COLORS: { name: string; value: string }[] = [
  { name: "blue", value: "#2D8CFF" },
  { name: "teal", value: "#00D4AA" },
  { name: "purple", value: "#9333EA" },
  { name: "orange", value: "#F59E0B" },
  { name: "red", value: "#EF4444" },
];

const MOCK_INVOICES = [
  { id: "INV-2026-05", date: "May 1, 2026", amount: "$79.00", status: "Paid" },
  { id: "INV-2026-04", date: "Apr 1, 2026", amount: "$79.00", status: "Paid" },
  { id: "INV-2026-03", date: "Mar 1, 2026", amount: "$79.00", status: "Paid" },
];

const MOCK_API_KEYS = [
  { id: "ak1", name: "Production Key", created: "2026-01-15", lastUsed: "2 hours ago", key: "te_live_8x3k...j2pq" },
  { id: "ak2", name: "Dev / Staging", created: "2026-03-01", lastUsed: "5 days ago", key: "te_live_4m9n...wx7z" },
];

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Brokerage");
  const settings = useMarket(s => s.settings);
  const updateSettings = useMarket(s => s.updateSettings);

  function save(msg = "Settings saved") { toast.success(msg); }

  return (
    <ErrorBoundary>
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Sidebar tabs */}
        <aside className="w-52 shrink-0 border-r border-border bg-surface p-2 space-y-0.5">
          <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Settings</div>
          {TABS.map(({ key, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${tab === key ? "bg-brand/15 text-brand" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <Icon className="size-4 shrink-0" />
              {key}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 max-w-2xl">
          {tab === "Brokerage" && <BrokerageTab />}
          {tab === "Account" && <AccountTab settings={settings} onSave={save} updateSettings={updateSettings} />}
          {tab === "Notifications" && <NotificationsTab settings={settings} updateSettings={updateSettings} onSave={save} />}
          {tab === "Appearance" && <AppearanceTab settings={settings} updateSettings={updateSettings} onSave={save} />}
          {tab === "Subscription" && <SubscriptionTab />}
          {tab === "API Keys" && <ApiKeysTab />}
        </div>
      </div>
    </ErrorBoundary>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold mb-4">{children}</h2>;
}

function FormRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/60">
      <div className="flex-1 mr-4">
        <div className="text-sm font-medium">{label}</div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${checked ? "bg-brand" : "bg-muted"}`}>
      <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}

const INPUT = "h-9 px-3 bg-background border border-border rounded-md text-sm focus:ring-2 focus:ring-brand/40 focus:outline-none w-full";

function AccountTab({ settings, onSave, updateSettings }: any) {
  const [displayName, setDisplayName] = useState(settings.displayName);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  function handleSaveProfile() {
    updateSettings({ displayName });
    onSave("Profile updated");
  }

  function handleChangePw() {
    if (!currentPw || !newPw || !confirmPw) { toast.error("Fill all password fields"); return; }
    if (newPw !== confirmPw) { toast.error("New passwords don't match"); return; }
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    onSave("Password changed");
  }

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Profile</SectionTitle>
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="size-16 rounded-full bg-gradient-to-br from-brand to-brand-glow flex items-center justify-center text-2xl font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" title="Click to change">
            {settings.displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-medium">{settings.displayName}</div>
            <div className="text-xs text-muted-foreground">{settings.email}</div>
            <button className="mt-1 text-xs text-brand hover:underline">Change avatar</button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Email</label>
            <input value={settings.email} readOnly className={`${INPUT} opacity-60 cursor-not-allowed`} />
          </div>
          <button onClick={handleSaveProfile} className="h-9 px-4 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-sm font-medium">Save Profile</button>
        </div>
      </div>

      <div>
        <SectionTitle>Change Password</SectionTitle>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Current Password</label>
            <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} className={INPUT} placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">New Password</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className={INPUT} placeholder="••••••••" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Confirm Password</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} className={INPUT} placeholder="••••••••" />
          </div>
          <button onClick={handleChangePw} className="h-9 px-4 rounded-md border border-border hover:bg-accent text-sm">Update Password</button>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({ settings, updateSettings, onSave }: any) {
  const notifRows = [
    { key: "aiSignals", label: "AI Signal Alerts", description: "Push notifications when high-confidence signals are generated" },
    { key: "priceAlerts", label: "Price Alerts", description: "Get notified when your set price targets are hit" },
    { key: "newsAlerts", label: "News Alerts", description: "Breaking news for tickers in your watchlists" },
    { key: "premarketEmail", label: "Pre-market Digest Email", description: "Daily 8:00 AM ET summary of top setups and news" },
    { key: "weeklyEmail", label: "Weekly Summary Email", description: "Weekend recap of your paper trading performance and top signals" },
  ] as const;

  function toggle(key: keyof typeof settings.notifications) {
    updateSettings({ notifications: { ...settings.notifications, [key]: !settings.notifications[key] } });
    onSave("Preferences saved");
  }

  return (
    <div>
      <SectionTitle>Notifications</SectionTitle>
      <div className="rounded-lg border border-border overflow-hidden">
        {notifRows.map(({ key, label, description }) => (
          <FormRow key={key} label={label} description={description}>
            <Toggle checked={settings.notifications[key]} onChange={() => toggle(key as any)} />
          </FormRow>
        ))}
      </div>
    </div>
  );
}

function AppearanceTab({ settings, updateSettings, onSave }: any) {
  const themes = [
    { value: "dark", label: "Dark", preview: "bg-gray-900 border-gray-700" },
    { value: "light", label: "Light", preview: "bg-white border-gray-200" },
    { value: "system", label: "System", preview: "bg-gradient-to-br from-gray-900 to-white border-gray-400" },
  ] as const;

  const fontSizes = ["compact", "default", "comfortable"] as const;

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Theme</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {themes.map(t => (
            <button key={t.value} onClick={() => { updateSettings({ theme: t.value }); onSave("Theme updated"); }}
              className={`rounded-lg border-2 p-3 transition-colors ${settings.theme === t.value ? "border-brand" : "border-border hover:border-brand/40"}`}>
              <div className={`h-16 rounded-md border ${t.preview} mb-2`} />
              <div className="text-xs font-medium capitalize">{t.label}</div>
              {settings.theme === t.value && <CheckCircle2 className="size-3.5 text-brand mx-auto mt-1" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Font Size</SectionTitle>
        <div className="flex gap-2">
          {fontSizes.map(f => (
            <button key={f} onClick={() => { updateSettings({ fontSize: f }); onSave("Font size updated"); }}
              className={`flex-1 py-2 rounded-md border text-sm capitalize transition-colors ${settings.fontSize === f ? "bg-brand/15 border-brand/40 text-brand" : "border-border hover:bg-accent"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Accent Color</SectionTitle>
        <div className="flex gap-3">
          {ACCENT_COLORS.map(({ name, value }) => (
            <button key={name} onClick={() => { updateSettings({ accent: name as any }); onSave("Accent updated"); }}
              className={`size-9 rounded-full border-2 transition-all ${settings.accent === name ? "border-foreground scale-110" : "border-transparent hover:scale-105"}`}
              style={{ backgroundColor: value }} title={name} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SubscriptionTab() {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Current Plan</SectionTitle>
        <div className="rounded-lg border border-brand/40 bg-brand/5 p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold">Pro</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand/20 text-brand border border-brand/30 font-medium">Active</span>
            </div>
            <div className="text-xs text-muted-foreground">$79/month · Billed monthly · Renews Jun 1, 2026</div>
          </div>
          <div className="text-2xl font-bold text-brand">$79<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
        </div>

        {/* Usage meters */}
        <div className="mt-4 space-y-3">
          {[
            { label: "AI Signals Today", used: 8, max: 25 },
            { label: "API Calls (30d)", used: 1247, max: 5000 },
            { label: "Watchlist Slots", used: 3, max: 10 },
          ].map(({ label, used, max }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono">{used} / {max}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${(used / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button className="h-9 px-4 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-sm font-medium">Upgrade to Elite</button>
        <button className="h-9 px-4 rounded-md border border-border hover:bg-accent text-sm">Downgrade to Starter</button>
      </div>

      <div>
        <SectionTitle>Billing History</SectionTitle>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase text-muted-foreground border-b border-border bg-surface/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Invoice</th>
                <th className="text-left px-3 py-2 font-medium">Date</th>
                <th className="text-right px-3 py-2 font-medium">Amount</th>
                <th className="text-right px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_INVOICES.map(inv => (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-accent/40">
                  <td className="px-4 py-2.5 font-mono text-xs">{inv.id}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{inv.date}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs">{inv.amount}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-bull/15 text-bull border border-bull/30 font-medium">{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="mt-3 text-xs text-brand hover:underline flex items-center gap-1">
          Manage Billing <ExternalLink className="size-3" />
        </button>
      </div>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState(MOCK_API_KEYS);

  function generate() {
    const newKey = { id: `ak-${Date.now()}`, name: "New Key", created: "2026-05-12", lastUsed: "Never", key: `te_live_${Math.random().toString(36).slice(2, 8)}...${Math.random().toString(36).slice(2, 6)}` };
    setKeys(k => [...k, newKey]);
    toast.success("API key generated");
  }

  function revoke(id: string) {
    setKeys(k => k.filter(key => key.id !== id));
    toast.success("Key revoked");
  }

  function copyKey(key: string) {
    navigator.clipboard?.writeText(key).catch(() => {});
    toast.success("Key copied to clipboard");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SectionTitle>API Keys</SectionTitle>
        <button onClick={generate} className="h-8 px-3 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-xs font-medium flex items-center gap-1.5">
          <Plus className="size-3.5" /> Generate New Key
        </button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase text-muted-foreground border-b border-border bg-surface/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Created</th>
              <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Last Used</th>
              <th className="text-left px-3 py-2 font-medium">Key</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map(k => (
              <tr key={k.id} className="border-b border-border/50 hover:bg-accent/40">
                <td className="px-4 py-2.5 font-medium text-xs">{k.name}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{k.created}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{k.lastUsed}</td>
                <td className="px-3 py-2.5">
                  <span className="font-mono text-xs bg-background border border-border rounded px-2 py-0.5 text-muted-foreground">{k.key}</span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => copyKey(k.key)} className="size-7 rounded hover:bg-accent flex items-center justify-center text-muted-foreground" title="Copy">
                      <Copy className="size-3.5" />
                    </button>
                    <button onClick={() => revoke(k.id)} className="size-7 rounded hover:bg-bear/20 flex items-center justify-center text-muted-foreground hover:text-bear" title="Revoke">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 rounded-lg bg-warn/10 border border-warn/30">
        <p className="text-xs text-warn font-medium">Security Notice</p>
        <p className="text-xs text-muted-foreground mt-0.5">Never share your API keys publicly. Keys grant full access to your account. Rotate keys every 90 days.</p>
      </div>
    </div>
  );
}
