/* eslint-disable prettier/prettier */
// Page URLs for canonical / og:url / og:image tags.
//
// Set VITE_SITE_URL (e.g. https://ensalad-frontend.vercel.app) in your env.
// If it isn't set, these tags are simply left out — better than pointing
// search engines and link previews at the wrong domain.
const SITE_URL = (import.meta.env["VITE_SITE_URL"] as string | undefined)?.replace(/\/+$/, "");

export function absoluteUrl(path: string): string | undefined {
    return SITE_URL ? `${SITE_URL}${path}` : undefined;
}

export function urlMeta(path: string, image?: string): Array<Record<string, string>> {
    const url = absoluteUrl(path);
    if (!url || !SITE_URL) return [];
    const meta: Array<Record<string, string>> = [{ property: "og:url", content: url }];
    if (image) {
        meta.push({ property: "og:image", content: `${SITE_URL}${image}` });
        meta.push({ name: "twitter:image", content: `${SITE_URL}${image}` });
    }
    return meta;
}

export function canonicalLinks(path: string): Array<{ rel: string; href: string }> {
    const url = absoluteUrl(path);
    return url ? [{ rel: "canonical", href: url }] : [];
}
