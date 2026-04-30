"use client";

import { useEffect, useState } from "react";

type Coin = {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
};

export default function PriceBar() {
  const [coins, setCoins] = useState<Coin[]>([]);

  useEffect(() => {
    fetch("/api/prices")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setCoins(data))
      .catch(() => {});

    const interval = setInterval(() => {
      fetch("/api/prices")
        .then((r) => r.json())
        .then((data) => Array.isArray(data) && setCoins(data))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (coins.length === 0) return null;

  const doubled = [...coins, ...coins];

  return (
    <div
      style={{
        background: "var(--bg2)",
        borderBottom: "1px solid var(--border)",
        overflow: "hidden",
        height: 32,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 32,
          animation: "tickerScroll 30s linear infinite",
          whiteSpace: "nowrap",
          padding: "0 16px",
        }}
      >
        {doubled.map((c, i) => (
          <span key={`${c.id}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "var(--text2)", fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}>
              {c.symbol}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              ${c.current_price.toLocaleString()}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: c.price_change_percentage_24h >= 0 ? "var(--yes)" : "var(--no)",
              }}
            >
              {c.price_change_percentage_24h >= 0 ? "+" : ""}
              {c.price_change_percentage_24h?.toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
