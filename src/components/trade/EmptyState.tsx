import { type LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="size-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
        <Icon className="size-7 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">{description}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="h-8 px-4 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-xs font-medium transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <div className="skeleton h-4 rounded" style={{ width: i === 0 ? "5rem" : i === 1 ? "9rem" : "4rem" }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-6 w-16 rounded" />
        <div className="skeleton h-4 w-32 rounded flex-1" />
        <div className="skeleton size-12 rounded-full" />
      </div>
      <div className="skeleton h-16 rounded" />
      <div className="skeleton h-8 rounded" />
    </div>
  );
}
