// Admin wallet address for TON payments
export const ADMIN_TON_ADDRESS = "UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0";

// Admin Telegram IDs (add yours here)
export const ADMIN_TELEGRAM_IDS = ["admin"]; // will also check isAdmin in DB

export function isAdminTelegramId(telegramId: string): boolean {
  return ADMIN_TELEGRAM_IDS.includes(telegramId);
}
