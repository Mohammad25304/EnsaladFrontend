import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shown when a menu image URL is broken or missing. */
export const FALLBACK_IMAGE = "/images/salad-signature.jpg";

/** <img onError> handler: swap in the fallback once (no infinite loop). */
export function swapToFallbackImage(e: { currentTarget: HTMLImageElement }) {
  const img = e.currentTarget;
  if (!img.src.endsWith(FALLBACK_IMAGE)) {
    img.src = FALLBACK_IMAGE;
  }
}


export function branchMapUrl(b: { map_url?: string | null; address?: string | null }) {
  if (b.map_url) return b.map_url;
  if (b.address)
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
  return null;
}