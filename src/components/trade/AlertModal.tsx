import { useState } from "react";
import { X, Bell } from "lucide-react";
import { toast } from "sonner";

type Props = { ticker: string; onClose: () => void };

export function AlertModal({ ticker, onClose }: Props) {
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [price, setPrice] = useState("");
  const [alertType, setAlertType] = useState<"price" | "volume" | "pattern">("price");
  const [channels, setChannels] = useState({ inApp: true, email: false, sms: false });

  function toggle(k: keyof typeof channels) {
    setChannels(c => ({ ...c, [k]: !c[k] }));
  }

  function submit() {
    if (!price) return;
    toast.success(`Alert set for ${ticker}`, {
      description: `Notify when price goes ${direction} $${price}`,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-brand" />
            <h2 className="text-sm font-semibold">Set Alert · {ticker}</h2>
          </div>
          <button onClick={onClose} className="size-6 rounded hover:bg-accent flex items-center justify-center">
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Direction + Price */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Price Target</label>
            <div className="mt-1.5 flex gap-2">
              <div className="flex rounded-md border border-border overflow-hidden text-xs">
                {(["above", "below"] as const).map(d => (
                  <button key={d} onClick={() => setDirection(d)}
                    className={`px-3 py-1.5 capitalize transition-colors ${direction === d ? "bg-brand text-primary-foreground" : "bg-background hover:bg-accent"}`}>
                    {d}
                  </button>
                ))}
              </div>
              <input
                type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)}
                className="flex-1 h-8 px-3 bg-background border border-border rounded text-sm font-mono focus:ring-2 focus:ring-brand/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Alert type */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Alert Type</label>
            <div className="mt-1.5 flex gap-2">
              {(["price", "volume", "pattern"] as const).map(t => (
                <button key={t} onClick={() => setAlertType(t)}
                  className={`flex-1 py-1.5 rounded-md border text-xs capitalize transition-colors ${alertType === t ? "bg-brand/15 border-brand/40 text-brand" : "border-border bg-background hover:bg-accent"}`}>
                  {t === "volume" ? "Vol Spike" : t === "pattern" ? "Pattern" : "Price"}
                </button>
              ))}
            </div>
          </div>

          {/* Notification channels */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Notify Via</label>
            <div className="mt-1.5 space-y-1.5">
              {([["inApp", "In-App"], ["email", "Email"], ["sms", "SMS"]] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                  <button onClick={() => toggle(key)}
                    className={`relative inline-flex h-4 w-7 rounded-full transition-colors ${channels[key] ? "bg-brand" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 size-3 rounded-full bg-white transition-transform ${channels[key] ? "translate-x-3.5" : "translate-x-0.5"}`} />
                  </button>
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={submit} className="flex-1 h-9 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-sm font-medium transition-colors">
              Set Alert
            </button>
            <button onClick={onClose} className="flex-1 h-9 rounded-md border border-border hover:bg-accent text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
