import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PAPER_BASE = "https://paper-api.alpaca.markets";
const LIVE_BASE = "https://api.alpaca.markets";

function maskKey(k: string | null | undefined) {
  if (!k) return "";
  if (k.length <= 8) return "•".repeat(k.length);
  return `${k.slice(0, 4)}${"•".repeat(Math.max(4, k.length - 8))}${k.slice(-4)}`;
}

async function loadCreds() {
  const { data, error } = await supabaseAdmin
    .from("broker_credentials")
    .select("*")
    .eq("provider", "alpaca")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function alpacaFetch(
  creds: { api_key_id: string; api_secret_key: string; mode: string },
  path: string,
  init: RequestInit = {},
) {
  const base = creds.mode === "live" ? LIVE_BASE : PAPER_BASE;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "APCA-API-KEY-ID": creds.api_key_id,
      "APCA-API-SECRET-KEY": creds.api_secret_key,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = (body as any)?.message ?? text ?? `Alpaca ${res.status}`;
    throw new Error(`Alpaca ${res.status}: ${msg}`);
  }
  return body;
}

export const getBrokerStatus = createServerFn({ method: "GET" }).handler(async () => {
  const creds = await loadCreds();
  if (!creds) {
    return { connected: false as const };
  }
  return {
    connected: true as const,
    mode: creds.mode as "paper" | "live",
    keyMasked: maskKey(creds.api_key_id),
    label: creds.label ?? null,
    updatedAt: creds.updated_at as string,
    dataFeed: creds.data_feed as string,
  };
});

const saveSchema = z.object({
  apiKeyId: z.string().trim().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/),
  apiSecretKey: z.string().trim().min(20).max(256).regex(/^[A-Za-z0-9_/+=-]+$/),
  mode: z.enum(["paper", "live"]),
  label: z.string().trim().max(64).optional().nullable(),
});

export const saveBrokerCredentials = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data }) => {
    // Validate the keys against Alpaca BEFORE persisting.
    const test = await testKeysAgainstAlpaca(data.apiKeyId, data.apiSecretKey, data.mode);
    if (!test.ok) {
      throw new Error(test.error ?? "Alpaca rejected these credentials");
    }

    // Replace any existing rows for this provider (single-user app).
    await supabaseAdmin.from("broker_credentials").delete().eq("provider", "alpaca");
    const { error } = await supabaseAdmin.from("broker_credentials").insert({
      provider: "alpaca",
      api_key_id: data.apiKeyId,
      api_secret_key: data.apiSecretKey,
      mode: data.mode,
      label: data.label ?? null,
    });
    if (error) throw new Error(error.message);

    return {
      ok: true as const,
      account: test.account,
      mode: data.mode,
      keyMasked: maskKey(data.apiKeyId),
    };
  });

export const clearBrokerCredentials = createServerFn({ method: "POST" }).handler(async () => {
  const { error } = await supabaseAdmin.from("broker_credentials").delete().eq("provider", "alpaca");
  if (error) throw new Error(error.message);
  return { ok: true as const };
});

async function testKeysAgainstAlpaca(keyId: string, secret: string, mode: "paper" | "live") {
  try {
    const account = (await alpacaFetch(
      { api_key_id: keyId, api_secret_key: secret, mode },
      "/v2/account",
    )) as Record<string, unknown>;
    return {
      ok: true as const,
      account: {
        id: account.id,
        accountNumber: account.account_number,
        status: account.status,
        cash: account.cash,
        equity: account.equity,
        buyingPower: account.buying_power,
        currency: account.currency,
        patternDayTrader: account.pattern_day_trader,
      },
    };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

export const testBrokerConnection = createServerFn({ method: "POST" }).handler(async () => {
  const creds = await loadCreds();
  if (!creds) return { ok: false as const, error: "No credentials saved" };
  return testKeysAgainstAlpaca(creds.api_key_id, creds.api_secret_key, creds.mode as "paper" | "live");
});

export const getAlpacaAccount = createServerFn({ method: "GET" }).handler(async () => {
  const creds = await loadCreds();
  if (!creds) return { connected: false as const };
  const account = (await alpacaFetch(creds, "/v2/account")) as Record<string, any>;
  return {
    connected: true as const,
    mode: creds.mode as "paper" | "live",
    account: {
      equity: Number(account.equity),
      lastEquity: Number(account.last_equity),
      cash: Number(account.cash),
      buyingPower: Number(account.buying_power),
      portfolioValue: Number(account.portfolio_value),
      status: account.status as string,
      currency: account.currency as string,
      patternDayTrader: Boolean(account.pattern_day_trader),
      daytradeCount: Number(account.daytrade_count ?? 0),
    },
  };
});

export const getAlpacaPositions = createServerFn({ method: "GET" }).handler(async () => {
  const creds = await loadCreds();
  if (!creds) return { connected: false as const, positions: [] };
  const positions = (await alpacaFetch(creds, "/v2/positions")) as any[];
  return {
    connected: true as const,
    positions: positions.map((p) => ({
      symbol: p.symbol as string,
      qty: Number(p.qty),
      side: p.side as "long" | "short",
      avgEntryPrice: Number(p.avg_entry_price),
      marketValue: Number(p.market_value),
      currentPrice: Number(p.current_price),
      unrealizedPl: Number(p.unrealized_pl),
      unrealizedPlpc: Number(p.unrealized_plpc),
      changeToday: Number(p.change_today),
    })),
  };
});