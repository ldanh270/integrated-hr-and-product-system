import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn — Utility for merging Tailwind CSS classes with clsx and tailwind-merge.
 * Handles conditional classes and ensures the latest utility wins.
 * @param {...ClassValue[]} inputs — Array of class values or conditional objects.
 * @returns {string} Merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * formatCurrency — Formats a numeric value into Vietnamese Dong (VND) currency string.
 * @param {number} amount — Numeric value to format.
 * @returns {string} Formatted string (e.g., "1.000.000 ₫").
 */
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

/**
 * minutesToTime — Converts a numeric "minutes since midnight" value into an HH:MM string.
 * @param {number} minutes — Total minutes (e.g., 480).
 * @returns {string} Formatted time string (e.g., "08:00").
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/**
 * timeToMinutes — Converts an HH:MM time string into numeric minutes since midnight.
 * @param {string} time — Time string (e.g., "08:00").
 * @returns {number} Total minutes since 00:00.
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/**
 * formatTime — Formats an ISO datetime string into a local HH:MM time string.
 * @param {string | null} iso — ISO datetime string.
 * @returns {string} Localized time string or placeholder.
 */
export function formatTime(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
}

/**
 * formatDate — Formats an ISO datetime string into a local DD/MM/YYYY date string.
 * @param {string | null} iso — ISO datetime string.
 * @returns {string} Localized date string or placeholder.
 */
export function formatDate(iso?: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("vi-VN")
}
