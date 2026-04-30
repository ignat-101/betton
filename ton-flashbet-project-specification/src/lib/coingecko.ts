const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

export async function getCoinPrice(coinId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[coinId]?.usd ?? null;
  } catch {
    return null;
  }
}

export async function getTopCoins(): Promise<CoinPrice[]> {
  try {
    const res = await fetch(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=6&page=1&sparkline=false`,
      { next: { revalidate: 120 } }
    );
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function evaluateOracleCondition(
  ticker: string,
  condition: string
): Promise<boolean | null> {
  const price = await getCoinPrice(ticker);
  if (price === null) return null;
  try {
    // condition like "price > 100000" or "price < 50000"
    const expr = condition.replace("price", String(price));
    // Safe evaluation: parse manually
    const match = expr.match(/^([\d.]+)\s*(>|<|>=|<=|==|!=)\s*([\d.]+)$/);
    if (!match) return null;
    const [, left, op, right] = match;
    const l = parseFloat(left);
    const r = parseFloat(right);
    switch (op) {
      case ">": return l > r;
      case "<": return l < r;
      case ">=": return l >= r;
      case "<=": return l <= r;
      case "==": return l === r;
      case "!=": return l !== r;
      default: return null;
    }
  } catch {
    return null;
  }
}
