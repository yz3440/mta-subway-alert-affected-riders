import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * MATH UTILS
 */

export function degToRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function isNumber(num: unknown): boolean {
  if (typeof num === "number") {
    return num - num === 0;
  }
  if (typeof num === "string" && num.trim() !== "") {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
}

/**
 * Clamp a number between a minimum and maximum value
 * @param value
 * @param min
 * @param max
 * @returns {number}
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * DATE UTILS
 */

export function differenceInDays(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function formatDate(date: Date): string {
  const utcDate = new Date(date.toUTCString());
  return utcDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatTime(date: Date): string {
  const utcDate = new Date(date.toUTCString());
  return utcDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
