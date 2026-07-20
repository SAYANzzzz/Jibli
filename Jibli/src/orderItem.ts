import type { QuickOrderPriceResult, QuickOrderShop } from "./api";

export const SHOP_LABELS: Record<QuickOrderShop, string> = {
  aliexpress: "AliExpress",
  shein: "Shein",
  temu: "Temu",
};

export const SHOP_LOGOS: Partial<Record<QuickOrderShop, string>> = {
  aliexpress: "/aliexpress-logo.png",
  shein: "/shein-logo.png",
};

export const SHEIN_FRANCE_URL = "https://fr.shein.com";

export type ExtraOption = { id: string; label: string; value: string };

export type ItemSnapshot = {
  link: string;
  shop: QuickOrderShop | null;
  productName: string;
  size: string;
  color: string;
  model: string;
  quantity: number;
  extraOptions: { label: string; value: string }[];
  priceResult: QuickOrderPriceResult | null;
};

export function detectShop(link: string): QuickOrderShop | null {
  const normalized = link.toLowerCase();

  if (normalized.includes("aliexpress")) return "aliexpress";
  if (normalized.includes("shein")) return "shein";
  if (normalized.includes("temu")) return "temu";

  return null;
}

export function isSheinFranceLink(link: string): boolean {
  const normalized = link.toLowerCase();

  return normalized.includes("fr.shein.com");
}

export function normalizeLink(link: string) {
  const trimmed = link.trim();

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;

  return `https://${trimmed}`;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
