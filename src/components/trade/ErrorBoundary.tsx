import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type Props = { children: ReactNode; label?: string };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[300px]">
          <div className="size-14 rounded-full bg-bear/10 flex items-center justify-center mb-4">
            <AlertTriangle className="size-6 text-bear" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Something went wrong</h3>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-1">
            {this.props.label ?? "This section"} encountered an unexpected error.
          </p>
          <p className="text-[10px] font-mono text-muted-foreground/60 mb-4 max-w-sm truncate">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="h-8 px-4 rounded-md bg-brand hover:bg-brand-glow text-primary-foreground text-xs font-medium flex items-center gap-1.5"
          >
            <RefreshCw className="size-3.5" /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
