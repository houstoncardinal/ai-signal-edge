// Mock market data for TradeEdge AI
export type Quote = {
  ticker: string;
  company: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  volume: number;
  relVolume: number;
  float: number;
  marketCap: number;
  rsi: number;
  pattern: string;
  aiScore: number;
  sector: string;
};

const COMPANIES: Record<string, { name: string; sector: string; basePrice: number; float: number; mcap: number }> = {
  AAPL: { name: "Apple Inc.", sector: "Technology", basePrice: 228.45, float: 15_200_000_000, mcap: 3_480_000_000_000 },
  TSLA: { name: "Tesla, Inc.", sector: "Automotive", basePrice: 246.83, float: 2_780_000_000, mcap: 786_000_000_000 },
  AMC: { name: "AMC Entertainment", sector: "Entertainment", basePrice: 4.12, float: 514_000_000, mcap: 2_100_000_000 },
  GME: { name: "GameStop Corp.", sector: "Retail", basePrice: 22.18, float: 305_000_000, mcap: 6_800_000_000 },
  NVDA: { name: "NVIDIA Corp.", sector: "Semiconductors", basePrice: 138.92, float: 24_400_000_000, mcap: 3_400_000_000_000 },
  SOFI: { name: "SoFi Technologies", sector: "Fintech", basePrice: 14.62, float: 1_080_000_000, mcap: 16_100_000_000 },
  PLTR: { name: "Palantir Technologies", sector: "Software", basePrice: 67.84, float: 2_120_000_000, mcap: 154_000_000_000 },
  MARA: { name: "MARA Holdings", sector: "Crypto Mining", basePrice: 18.34, float: 348_000_000, mcap: 6_400_000_000 },
  RIOT: { name: "Riot Platforms", sector: "Crypto Mining", basePrice: 11.92, float: 308_000_000, mcap: 3_700_000_000 },
  SNDL: { name: "SNDL Inc.", sector: "Cannabis", basePrice: 1.82, float: 261_000_000, mcap: 478_000_000 },
  HIMS: { name: "Hims & Hers Health", sector: "Healthcare", basePrice: 27.41, float: 215_000_000, mcap: 6_100_000_000 },
  IONQ: { name: "IonQ Inc.", sector: "Quantum Computing", basePrice: 32.18, float: 192_000_000, mcap: 7_000_000_000 },
  RKLB: { name: "Rocket Lab USA", sector: "Aerospace", basePrice: 22.74, float: 484_000_000, mcap: 11_300_000_000 },
  SMCI: { name: "Super Micro Computer", sector: "Hardware", basePrice: 41.88, float: 555_000_000, mcap: 24_500_000_000 },
  TLRY: { name: "Tilray Brands", sector: "Cannabis", basePrice: 1.34, float: 902_000_000, mcap: 1_210_000_000 },
};

const PATTERNS = ["Bull Flag", "Cup & Handle", "Asc. Triangle", "Breakout", "VWAP Reclaim", "Gap Fill", "Wedge", "—"];

const seeded = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
};

export function buildQuotes(): Quote[] {
  return Object.entries(COMPANIES).map(([ticker, c]) => {
    const r = seeded(ticker);
    const changePct = (r - 0.4) * 18; // -7.2 .. +10.8
    const prevClose = c.basePrice;
    const price = +(prevClose * (1 + changePct / 100)).toFixed(2);
    const change = +(price - prevClose).toFixed(2);
    const volume = Math.floor((0.5 + r * 4) * 1_500_000);
    return {
      ticker,
      company: c.name,
      price,
      prevClose,
      change,
      changePct: +changePct.toFixed(2),
      volume,
      relVolume: +(0.6 + r * 4.2).toFixed(2),
      float: c.float,
      marketCap: c.mcap,
      rsi: Math.floor(28 + r * 60),
      pattern: PATTERNS[Math.floor(r * PATTERNS.length)],
      aiScore: Math.floor(62 + r * 32),
      sector: c.sector,
    };
  });
}

export const INDEXES = [
  { ticker: "SPY", name: "S&P 500", price: 583.21, changePct: 0.42 },
  { ticker: "QQQ", name: "Nasdaq 100", price: 498.74, changePct: 0.81 },
  { ticker: "IWM", name: "Russell 2000", price: 224.18, changePct: -0.27 },
];

export const NEWS: { id: string; ticker: string; headline: string; source: string; sentiment: number; ago: string }[] = [
  { id: "n1", ticker: "NVDA", headline: "NVIDIA secures multi-year hyperscaler deal worth $11B for Blackwell GPUs", source: "Bloomberg", sentiment: 78, ago: "4m" },
  { id: "n2", ticker: "TSLA", headline: "Tesla reports record Q4 deliveries; FSD subscription rate hits new high", source: "Reuters", sentiment: 64, ago: "12m" },
  { id: "n3", ticker: "PLTR", headline: "Palantir wins $480M Army contract for AI battlefield platform", source: "Benzinga", sentiment: 82, ago: "21m" },
  { id: "n4", ticker: "AMC", headline: "AMC Entertainment files mixed shelf offering; shares slide pre-market", source: "SEC EDGAR", sentiment: -54, ago: "33m" },
  { id: "n5", ticker: "SMCI", headline: "Super Micro delays 10-K filing for second time; auditor concerns persist", source: "WSJ", sentiment: -71, ago: "48m" },
  { id: "n6", ticker: "RKLB", headline: "Rocket Lab successfully launches 60th Electron mission with NRO payload", source: "Reuters", sentiment: 58, ago: "1h" },
  { id: "n7", ticker: "HIMS", headline: "Hims & Hers expands GLP-1 weight-loss platform to 12 new states", source: "CNBC", sentiment: 52, ago: "1h" },
  { id: "n8", ticker: "MARA", headline: "MARA Holdings adds 4,144 BTC to treasury, now holds 44,893 coins", source: "CoinDesk", sentiment: 41, ago: "2h" },
  { id: "n9", ticker: "GME", headline: "GameStop reports surprise Q3 profit; cash pile swells to $4.6B", source: "Bloomberg", sentiment: 67, ago: "2h" },
  { id: "n10", ticker: "SOFI", headline: "SoFi receives upgraded loan platform charter; KBW reiterates Outperform", source: "Benzinga", sentiment: 49, ago: "3h" },
  { id: "n11", ticker: "TLRY", headline: "Tilray issues $250M convertible notes; dilution fears weigh on shares", source: "Reuters", sentiment: -62, ago: "3h" },
  { id: "n12", ticker: "IONQ", headline: "IonQ unveils Tempo system targeting 64 algorithmic qubits in 2026", source: "TechCrunch", sentiment: 71, ago: "4h" },
];

export type Signal = {
  id: string;
  ticker: string;
  setup: string;
  timeframe: "Day" | "Swing" | "Scalp";
  aiScore: number;
  entry: [number, number];
  stop: number;
  target: number;
  catalyst: string;
  sentiment: number;
  isNew?: boolean;
  confidence: "High" | "Medium";
};

export const SIGNALS: Signal[] = [
  { id: "s1", ticker: "NVDA", setup: "High Vol Breakout", timeframe: "Day", aiScore: 92, entry: [138.20, 139.10], stop: 136.40, target: 144.80, catalyst: "Hyperscaler contract win + bull flag consolidation above 20-EMA on rising relative volume. Pattern CNN flags 78% historical follow-through within 2 sessions.", sentiment: 78, isNew: true, confidence: "High" },
  { id: "s2", ticker: "PLTR", setup: "Cup & Handle Breakout", timeframe: "Swing", aiScore: 89, entry: [67.40, 68.20], stop: 65.10, target: 74.50, catalyst: "Army contract catalyst aligns with weekly cup & handle completion. Sentiment aggregate +82 over 24h. Volume profile shows thin overhead supply to $74.", sentiment: 82, isNew: true, confidence: "High" },
  { id: "s3", ticker: "RKLB", setup: "VWAP Reclaim", timeframe: "Day", aiScore: 84, entry: [22.55, 22.85], stop: 21.90, target: 24.40, catalyst: "Successful Electron launch + reclaim of pre-market VWAP on 3.2x relative volume. Float rotator behavior with no overhead resistance until $24.40.", sentiment: 58, confidence: "High" },
  { id: "s4", ticker: "HIMS", setup: "Asc. Triangle", timeframe: "Swing", aiScore: 81, entry: [27.20, 27.65], stop: 26.10, target: 31.20, catalyst: "GLP-1 expansion drives multi-week ascending triangle. Forecaster model assigns 67% probability of 31+ test within 8 sessions.", sentiment: 52, confidence: "High" },
  { id: "s5", ticker: "SOFI", setup: "Gap & Go", timeframe: "Day", aiScore: 78, entry: [14.55, 14.78], stop: 14.20, target: 15.60, catalyst: "Charter upgrade catalyst + gap above prior day high. Watch 14.20 as failed-breakout trigger.", sentiment: 49, confidence: "Medium" },
  { id: "s6", ticker: "GME", setup: "Earnings Reversal", timeframe: "Swing", aiScore: 76, entry: [21.90, 22.40], stop: 20.80, target: 25.50, catalyst: "Surprise profit print + $4.6B cash position. Short interest 21.4% creates squeeze potential on continuation.", sentiment: 67, confidence: "Medium" },
  { id: "s7", ticker: "MARA", setup: "Crypto Sympathy", timeframe: "Day", aiScore: 73, entry: [18.20, 18.50], stop: 17.70, target: 19.90, catalyst: "BTC treasury accumulation + spot BTC strength. Beta 3.1 to BTC over rolling 30d window.", sentiment: 41, confidence: "Medium" },
  { id: "s8", ticker: "IONQ", setup: "Breakout Pullback", timeframe: "Swing", aiScore: 71, entry: [31.80, 32.40], stop: 30.50, target: 36.80, catalyst: "Tempo system reveal + pullback to 21-EMA support. Quantum sector rotation accelerating into year-end.", sentiment: 71, confidence: "Medium" },
];

export const formatMoney = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatBig = (n: number) => {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
};
