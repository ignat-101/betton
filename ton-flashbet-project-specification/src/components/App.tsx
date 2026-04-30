"use client";

import { useState, useEffect, useCallback } from "react";
import MarketsTab from "./MarketsTab";
import CreateTab from "./CreateTab";
import ProfileTab from "./ProfileTab";
import AdminTab from "./AdminTab";
import PriceBar from "./PriceBar";

export type User = {
  id: number;
  telegramId: string;
  username: string | null;
  displayName: string | null;
  balance: string;
  reputation: number;
  referralCode: string | null;
  tonAddress: string | null;
  isAdmin: boolean;
};

// For dev/demo: simulate a Telegram user
function getSimulatedUser() {
  if (typeof window === "undefined") return null;
  // Check URL params for demo mode
  const params = new URLSearchParams(window.location.search);
  const tgId = params.get("tgId") || "demo_user_1";
  const isAdmin = params.get("admin") === "1";
  return { telegramId: tgId, username: tgId, displayName: tgId, isAdmin };
}

export default function App() {
  const [tab, setTab] = useState<"markets" | "create" | "profile" | "admin">("markets");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const refreshUser = useCallback(async (telegramId: string) => {
    try {
      const res = await fetch(`/api/users?telegramId=${encodeURIComponent(telegramId)}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data as User;
      }
    } catch {
      /* ignore */
    }
    return null;
  }, []);

  useEffect(() => {
    async function init() {
      try {
        // Try Telegram WebApp
        const tg = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { id: number; username?: string; first_name?: string } }; ready?: () => void; expand?: () => void } } }).Telegram?.WebApp;
        let telegramId: string;
        let username: string | undefined;
        let displayName: string | undefined;

        if (tg?.initDataUnsafe?.user) {
          const tgUser = tg.initDataUnsafe.user;
          telegramId = String(tgUser.id);
          username = tgUser.username;
          displayName = tgUser.first_name;
          tg.ready?.();
          tg.expand?.();
        } else {
          const simulated = getSimulatedUser();
          telegramId = simulated?.telegramId ?? "demo_user_1";
          username = simulated?.username;
          displayName = simulated?.displayName;
        }

        // Upsert user
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramId, username, displayName }),
        });
        if (res.ok) {
          const u = await res.json();
          setUser(u);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <div style={{ color: "var(--text2)", fontSize: 13 }}>Loading FlashBet...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 }}>
        <div className="glass" style={{ padding: 32, textAlign: "center", maxWidth: 320 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>TON FlashBet</div>
          <div style={{ color: "var(--text2)", fontSize: 13 }}>Open in Telegram to get started</div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <PriceBar />

      {tab === "markets" && <MarketsTab user={user} showToast={showToast} refreshUser={refreshUser} />}
      {tab === "create" && <CreateTab user={user} showToast={showToast} onCreated={() => setTab("markets")} />}
      {tab === "profile" && <ProfileTab user={user} showToast={showToast} refreshUser={refreshUser} />}
      {tab === "admin" && user.isAdmin && <AdminTab user={user} showToast={showToast} refreshUser={refreshUser} />}

      {/* Bottom Tab Bar */}
      <nav className="tab-bar">
        <button className={`tab-item ${tab === "markets" ? "active" : ""}`} onClick={() => setTab("markets")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Markets
        </button>
        <button className={`tab-item ${tab === "create" ? "active" : ""}`} onClick={() => setTab("create")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          Create
        </button>
        <button className={`tab-item ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </button>
        {user.isAdmin && (
          <button className={`tab-item ${tab === "admin" ? "active" : ""}`} onClick={() => setTab("admin")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Admin
          </button>
        )}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
