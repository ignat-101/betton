// AMM-style probability calculation (Constant Product Market Maker)
// Similar to Polymarket's approach

export function calcProbability(yesPool: number, noPool: number): { yes: number; no: number } {
  const total = yesPool + noPool;
  if (total === 0) return { yes: 0.5, no: 0.5 };
  return {
    yes: Math.round((yesPool / total) * 100) / 100,
    no: Math.round((noPool / total) * 100) / 100,
  };
}

export function calcShares(amount: number, sidePool: number, otherPool: number): number {
  // Price = sidePool / (sidePool + otherPool)
  const price = sidePool / (sidePool + otherPool);
  if (price === 0) return amount;
  return amount / price;
}

export function calcPayout(shares: number, totalPool: number, sidePool: number): number {
  if (sidePool === 0) return 0;
  return (shares / sidePool) * totalPool * 0.97; // 3% platform fee
}

export function formatAmount(amount: string | number): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(n)) return "0";
  return n.toFixed(2);
}
