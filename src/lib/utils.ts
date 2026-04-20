import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(value = 0) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const amount = value / 1024 ** index;
  return `${amount.toFixed(amount >= 100 || index === 0 ? 0 : 2)} ${units[index]}`;
}

export function formatCurrency(value = 0, currency = "CNY", locale = "zh-CN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value / 100);
}

export function formatDate(value?: number | string | null) {
  if (!value) return "未设置";
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatOrderPeriod(value?: string | null) {
  const map: Record<string, string> = {
    month_price: "月付",
    quarter_price: "季付",
    half_year_price: "半年付",
    year_price: "年付",
    two_year_price: "两年付",
    three_year_price: "三年付",
    onetime_price: "一次性",
    reset_price: "重置流量",
    deposit: "余额充值",
  };

  if (!value) return "未知周期";
  return map[value] ?? value;
}

export function parsePlanFeatures(content?: string | null) {
  if (!content) return [];

  try {
    const parsed = JSON.parse(content) as Array<{ feature?: string; support?: boolean }>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        feature: item.feature?.trim() ?? "",
        support: item.support !== false,
      }))
      .filter((item) => item.feature);
  } catch {
    return [];
  }
}

export function toPercent(used = 0, total = 0) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((used / total) * 100)));
}

export function parseYuanToFen(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return Math.round(numeric * 100);
}

export async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}
