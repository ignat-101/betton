"use client";

import { useState } from "react";
import type { User } from "./App";

const CATEGORIES = ["crypto", "sports", "politics", "weather", "other"];

export default function CreateTab({
  user,
  showToast,
  onCreated,
}: {
  user: User;
  showToast: (m: string) => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [closesAt, setClosesAt] = useState("");
  const [useOracle, setUseOracle] = useState(false);
  const [oracleTicker, setOracleTicker] = useState("");
  const [oracleCondition, setOracleCondition] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!title.trim()) return showToast("Title is required");
    if (title.trim().length < 10) return showToast("Title must be at least 10 characters");
    if (useOracle && (!oracleTicker || !oracleCondition)) {
      return showToast("Enter oracle ticker and condition");
    }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        telegramId: user.telegramId,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        closesAt: closesAt || undefined,
      };

      if (useOracle) {
        body.oracleType = "coingecko";
        body.oracleTicker = oracleTicker.toLowerCase().trim();
        body.oracleCondition = oracleCondition.trim();
      }

      const res = await fetch("/api/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) return showToast(data.error || "Failed to create market");

      showToast("✅ Market submitted for review");
      setTitle("");
      setDescription("");
      setCategory("other");
      setClosesAt("");
      setUseOracle(false);
      setOracleTicker("");
      setOracleCondition("");
      setTimeout(onCreated, 500);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Create Market</div>
          <div style={{ fontSize: 11, color: "var(--text3)" }}>Submit for admin review</div>
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Info banner */}
        <div className="glass-sm" style={{ padding: "12px 14px", display: "flex", gap: 10 }}>
          <span>💡</span>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>
            Your market will be reviewed by admins before going live. Keep it clear and answerable with Yes/No.
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 6 }}>
            Question *
          </label>
          <input
            className="input"
            placeholder="Will BTC exceed $150k by end of 2025?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, textAlign: "right" }}>
            {title.length}/200
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 6 }}>
            Description (optional)
          </label>
          <textarea
            className="input"
            placeholder="Add resolution criteria or context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>

        {/* Category */}
        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 6 }}>
            Category
          </label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Close date */}
        <div>
          <label style={{ fontSize: 12, color: "var(--text2)", display: "block", marginBottom: 6 }}>
            Closes at (optional)
          </label>
          <input
            className="input"
            type="datetime-local"
            value={closesAt}
            onChange={(e) => setClosesAt(e.target.value)}
            style={{ colorScheme: "dark" }}
          />
        </div>

        {/* Oracle toggle */}
        <div className="glass-sm" style={{ padding: "14px 16px" }}>
          <div
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
            onClick={() => setUseOracle(!useOracle)}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>🔮 Price Oracle</div>
              <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>
                Auto-resolve based on CoinGecko price
              </div>
            </div>
            <div
              style={{
                width: 40,
                height: 22,
                borderRadius: 11,
                background: useOracle ? "var(--accent)" : "var(--bg3)",
                border: "1px solid var(--border)",
                position: "relative",
                transition: "background 0.2s",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: useOracle ? 20 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.2s",
                }}
              />
            </div>
          </div>

          {useOracle && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--text2)", display: "block", marginBottom: 4 }}>
                  Coin ID (CoinGecko)
                </label>
                <input
                  className="input"
                  placeholder="bitcoin, ethereum, toncoin..."
                  value={oracleTicker}
                  onChange={(e) => setOracleTicker(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--text2)", display: "block", marginBottom: 4 }}>
                  Condition
                </label>
                <input
                  className="input"
                  placeholder="price > 100000"
                  value={oracleCondition}
                  onChange={(e) => setOracleCondition(e.target.value)}
                />
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>
                  Use: price &gt; N, price &lt; N, price &gt;= N
                </div>
              </div>
            </div>
          )}
        </div>

        <button className="btn-primary" onClick={submit} disabled={submitting || !title.trim()}>
          {submitting ? "Submitting..." : "Submit for Review →"}
        </button>

        <div style={{ textAlign: "center", color: "var(--text3)", fontSize: 11 }}>
          Markets are reviewed within 24h
        </div>
      </div>
    </div>
  );
}
