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

export const FILINGS: { id: string; ticker: string; company: string; type: "8-K" | "10-Q" | "S-1" | "13F" | "DEF 14A"; title: string; date: string; impact: "High" | "Medium" | "Low" }[] = [
  { id: "fi1", ticker: "AMC", company: "AMC Entertainment Holdings", type: "8-K", title: "Unregistered Sales of Equity Securities and ATM Offering", date: "2026-05-11", impact: "High" },
  { id: "fi2", ticker: "SMCI", company: "Super Micro Computer Inc.", type: "10-Q", title: "Quarterly Report — Period Ending March 31 2026", date: "2026-05-10", impact: "High" },
  { id: "fi3", ticker: "HIMS", company: "Hims & Hers Health Inc.", type: "8-K", title: "Entry into a Material Definitive Agreement — GLP-1 Manufacturing JV", date: "2026-05-09", impact: "High" },
  { id: "fi4", ticker: "PLTR", company: "Palantir Technologies Inc.", type: "8-K", title: "Results of Operations and Financial Condition — Q1 2026 Beat", date: "2026-05-08", impact: "High" },
  { id: "fi5", ticker: "IONQ", company: "IonQ Inc.", type: "S-1", title: "Registration Statement — Tempo System Commercial Launch", date: "2026-05-07", impact: "Medium" },
  { id: "fi6", ticker: "MARA", company: "MARA Holdings Inc.", type: "8-K", title: "Other Events — Bitcoin Treasury Update 44,893 BTC", date: "2026-05-07", impact: "Medium" },
  { id: "fi7", ticker: "SOFI", company: "SoFi Technologies Inc.", type: "10-Q", title: "Quarterly Report — Member Growth +34% YoY", date: "2026-05-06", impact: "Medium" },
  { id: "fi8", ticker: "RKLB", company: "Rocket Lab USA Inc.", type: "8-K", title: "Other Events — Electron Mission 60 NRO Payload Deployment", date: "2026-05-05", impact: "Low" },
  { id: "fi9", ticker: "GME", company: "GameStop Corp.", type: "10-Q", title: "Quarterly Report — Cash Reserves $4.6B, Surprise Profit", date: "2026-05-04", impact: "High" },
  { id: "fi10", ticker: "TLRY", company: "Tilray Brands Inc.", type: "8-K", title: "Creation of a Direct Financial Obligation — $250M Convert Notes", date: "2026-05-03", impact: "High" },
  { id: "fi11", ticker: "NVDA", company: "NVIDIA Corporation", type: "DEF 14A", title: "Definitive Proxy Statement — 2026 Annual Meeting of Shareholders", date: "2026-05-02", impact: "Low" },
  { id: "fi12", ticker: "TSLA", company: "Tesla Inc.", type: "13F", title: "Quarterly Holdings Report — Q1 2026 Institutional Positions", date: "2026-05-01", impact: "Low" },
];

export type JournalEntry = {
  id: string; date: string; ticker: string; direction: "Long" | "Short";
  entry: number; exit: number; size: number; pnl: number; pnlPct: number;
  rMultiple: number; strategy: string; notes: string;
};

export const JOURNAL_TRADES: JournalEntry[] = [
  { id: "j1", date: "2026-05-09", ticker: "NVDA", direction: "Long", entry: 136.40, exit: 143.20, size: 100, pnl: 680, pnlPct: 4.99, rMultiple: 2.3, strategy: "Breakout", notes: "Clean breakout above $136 resistance with 3.2x volume" },
  { id: "j2", date: "2026-05-08", ticker: "PLTR", direction: "Long", entry: 67.50, exit: 74.20, size: 150, pnl: 1005, pnlPct: 9.93, rMultiple: 3.1, strategy: "Swing", notes: "Army contract catalyst, cup and handle completion" },
  { id: "j3", date: "2026-05-07", ticker: "MARA", direction: "Long", entry: 18.40, exit: 17.80, size: 500, pnl: -300, pnlPct: -3.26, rMultiple: -1.0, strategy: "Momentum", notes: "BTC weakness took out stop, respected level" },
  { id: "j4", date: "2026-05-06", ticker: "RKLB", direction: "Long", entry: 22.60, exit: 24.30, size: 200, pnl: 340, pnlPct: 7.52, rMultiple: 2.1, strategy: "Gap Play", notes: "Launch catalyst, pre-market gap held VWAP" },
  { id: "j5", date: "2026-05-05", ticker: "SOFI", direction: "Long", entry: 14.60, exit: 15.55, size: 300, pnl: 285, pnlPct: 6.51, rMultiple: 1.8, strategy: "Breakout", notes: "Charter upgrade gap, flagged by AI signal" },
  { id: "j6", date: "2026-05-02", ticker: "GME", direction: "Long", entry: 22.10, exit: 21.40, size: 200, pnl: -140, pnlPct: -3.17, rMultiple: -0.8, strategy: "Reversal", notes: "Failed reversal, earnings print faded quickly" },
  { id: "j7", date: "2026-05-01", ticker: "HIMS", direction: "Long", entry: 27.30, exit: 30.10, size: 100, pnl: 280, pnlPct: 10.26, rMultiple: 2.5, strategy: "Swing", notes: "GLP-1 expansion news held ascending triangle" },
  { id: "j8", date: "2026-04-30", ticker: "TSLA", direction: "Short", entry: 248.20, exit: 241.50, size: 50, pnl: 335, pnlPct: 2.70, rMultiple: 1.6, strategy: "Reversal", notes: "Failed breakout above 250 resistance, shorted the retest" },
  { id: "j9", date: "2026-04-29", ticker: "IONQ", direction: "Long", entry: 32.10, exit: 36.40, size: 150, pnl: 645, pnlPct: 13.40, rMultiple: 3.4, strategy: "Breakout", notes: "Tempo system reveal, quantum sector squeeze" },
  { id: "j10", date: "2026-04-28", ticker: "SMCI", direction: "Short", entry: 43.20, exit: 39.80, size: 100, pnl: 340, pnlPct: 7.87, rMultiple: 2.2, strategy: "Momentum", notes: "Delayed 10-K filing breakdown, news catalyst" },
  { id: "j11", date: "2026-04-25", ticker: "NVDA", direction: "Long", entry: 132.80, exit: 135.60, size: 200, pnl: 560, pnlPct: 2.11, rMultiple: 1.4, strategy: "Dip Buy", notes: "21-EMA support bounce on rising AI spend narrative" },
  { id: "j12", date: "2026-04-24", ticker: "AMC", direction: "Short", entry: 4.30, exit: 3.90, size: 1000, pnl: 400, pnlPct: 9.30, rMultiple: 2.0, strategy: "Reversal", notes: "ATM offering dilution, pre-market gap filled" },
];

export type PaperFill = {
  id: string; time: string; ticker: string; side: "Buy" | "Sell"; qty: number; price: number;
};

export const PAPER_FILLS_INITIAL: PaperFill[] = [
  { id: "pf1", time: "09:31:04", ticker: "NVDA", side: "Buy", qty: 100, price: 136.40 },
  { id: "pf2", time: "09:44:12", ticker: "PLTR", side: "Buy", qty: 50, price: 65.20 },
  { id: "pf3", time: "10:02:33", ticker: "RKLB", side: "Buy", qty: 250, price: 21.80 },
  { id: "pf4", time: "10:18:55", ticker: "SOFI", side: "Buy", qty: 300, price: 14.55 },
  { id: "pf5", time: "10:18:57", ticker: "SOFI", side: "Sell", qty: 300, price: 15.40 },
  { id: "pf6", time: "10:51:22", ticker: "MARA", side: "Buy", qty: 200, price: 18.30 },
  { id: "pf7", time: "11:04:10", ticker: "MARA", side: "Sell", qty: 200, price: 17.85 },
];

export const formatMoney = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatBig = (n: number) => {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
};
