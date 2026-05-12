import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/trade/AppShell";

export const Route = createFileRoute("/app")({
  component: AppShell,
  head: () => ({ meta: [{ title: "TradeEdge AI — Terminal" }] }),
});
