/* eslint-disable prettier/prettier */
/**
 * ENSALADA chatbot brain — rule-based, zero cost, no network calls.
 *
 * Everything it says comes from data the site already loads (branches,
 * menu items, categories, site settings), so editing something in the
 * Filament admin changes the bot's answers automatically.
 *
 * Pure functions only: `getReply(message, context)` → reply object.
 */
import type { ApiBranch, ApiCategory, ApiMenuItem, SiteSettings } from "../api-types";
import { pickLocale } from "../api-types";

/* ───────────────────────── types ───────────────────────── */

export interface BotContext {
    branch?: ApiBranch | undefined;
    branches: ApiBranch[];
    categories: ApiCategory[];
    items: ApiMenuItem[];
    settings: SiteSettings;
}

export type BotAction =
    | { kind: "link"; label: string; to: "/menu" | "/contact" | "/home" }
    | { kind: "branch"; label: string; slug: string }
    | { kind: "href"; label: string; href: string };

export interface BotReply {
    text: string;
    itemIds?: number[] | undefined;
    actions?: BotAction[] | undefined;
    chips?: string[] | undefined;
    /** Render the live starter chips under this message. */
    starters?: boolean | undefined;
    isFallback?: boolean | undefined;
}

/* ───────────────────── defaults (same as the site) ───────────────────── */

const DEFAULTS = {
    address: "123 Green Leaf Avenue, Beirut, Lebanon",
    phone: "+961 1 123 456",
    email: "hello@ensalada.com",
    hoursWeekday: "Mon – Fri: 10am – 9pm",
    hoursWeekend: "Sat – Sun: 11am – 10pm",
    about: "ENSALADA is a modern salad restaurant serving fresh, colorful bowls made daily.",
};

const MAX_CARDS = 4;

/* ───────────────────────── text utils ───────────────────────── */

function normalize(raw: string): string {
    return raw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/['’`]/g, "")
        .replace(/</g, " under ")
        .replace(/>/g, " over ")
        .replace(/[^a-z0-9$.\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function stem(w: string): string {
    return w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
}

function words(s: string): string[] {
    return normalize(s)
        .split(/[^a-z0-9]+/)
        .filter(Boolean)
        .map(stem);
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const phrase = (t: string, p: string) => new RegExp(`\\b${esc(p)}\\b`).test(t);
const hasAll = (msg: Set<string>, ws: string[]) => ws.length > 0 && ws.every((w) => msg.has(w));
const money = (v: string | number) => `$${Number(v).toFixed(2)}`;

const GENERIC = new Set([
    "salad", "bowl", "with", "and", "the", "of", "a", "an", "in", "on",
    "fresh", "plate", "our", "your", "to", "for", "is", "are", "do", "you", "have",
]);

const TAG_SYNONYMS: Record<string, string[]> = {
    vegan: ["plant based", "plantbased"],
    vegetarian: ["veggie", "veggies", "meatless", "meat free", "no meat", "without meat"],
    "gluten free": ["gluten", "celiac", "coeliac"],
    "dairy free": ["lactose", "no dairy"],
    "high protein": ["protein rich"],
    spicy: ["spice"],
    keto: ["low carb"],
};

/* ───────────────────────── data helpers ───────────────────────── */

const branchName = (b?: ApiBranch) => (b ? pickLocale(b.name) : "");
const at = (ctx: BotContext) => (ctx.branch ? ` at ${branchName(ctx.branch)}` : "");

function setting(ctx: BotContext, key: string, fallback: string): string {
    const v = ctx.settings?.[key];
    return v && v.trim() ? v : fallback;
}

function uniqueTags(items: ApiMenuItem[]): string[] {
    const seen = new Map<string, string>();
    for (const it of items) {
        for (const tag of it.tags ?? []) {
            const key = words(tag.name).join(" ");
            if (key && !seen.has(key)) seen.set(key, tag.name);
        }
    }
    return [...seen.values()];
}

function tagMatches(t: string, msg: Set<string>, tagName: string): boolean {
    const key = words(tagName).join(" ");
    if (hasAll(msg, words(tagName))) return true;
    return (TAG_SYNONYMS[key] ?? []).some((p) => phrase(t, p));
}

function socialLinks(ctx: BotContext): { platform: string; url: string }[] {
    const raw = ctx.settings?.["social_links"];
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        const flat = Array.isArray(parsed) ? parsed.flat() : [];
        return flat.filter((l) => l && typeof l.url === "string" && l.url);
    } catch {
        return [];
    }
}

/* ───────────────────────── query parsing ───────────────────────── */

type SortKey = "cal-asc" | "protein-desc" | "price-asc" | "price-desc";

interface MenuQuery {
    tags: string[];
    category?: ApiCategory | undefined;
    calMax?: number | undefined;
    proteinMin?: number | undefined;
    priceMax?: number | undefined;
    sort?: SortKey | undefined;
    featured: boolean;
}

function parseQuery(t: string, msg: Set<string>, ctx: BotContext): MenuQuery {
    const q: MenuQuery = { tags: [], featured: false };

    // tags
    q.tags = uniqueTags(ctx.items).filter((tag) => tagMatches(t, msg, tag));

    // category (the one with the most matching words wins)
    let best = 0;
    for (const c of ctx.categories) {
        const ws = words(pickLocale(c.name));
        if (hasAll(msg, ws) && ws.length > best) {
            q.category = c;
            best = ws.length;
        }
    }

    // numeric limits
    let rest = t;
    const take = (re: RegExp): number | undefined => {
        const m = rest.match(re);
        if (!m) return undefined;
        rest = rest.replace(m[0], " ");
        return Number(m[1] ?? m[2]);
    };

    q.calMax =
        take(/\b(?:under|below|less than|fewer than|lower than|max|maximum|up to|within|at most)\s*(\d{2,4})\s*(?:k?cals?|calories?)\b/) ??
        take(/\b(\d{2,4})\s*(?:k?cals?|calories?)\s*(?:or\s*)?(?:less|fewer|max|under|below)\b/);

    q.proteinMin =
        take(/\b(?:over|above|at least|more than|min|minimum|greater than|higher than)\s*(\d{1,3})\s*(?:g|gr|grams?)?\s*(?:of\s*)?protein\b/) ??
        take(/\bprotein\s*(?:of\s*)?(?:over|above|at least|more than)\s*(\d{1,3})\b/) ??
        take(/\b(\d{1,3})\s*(?:g|gr|grams?)\s*(?:of\s*)?protein\b/);

    const price =
        take(/\b(?:under|below|less than|cheaper than|up to|within|max|maximum|at most)\s*\$?\s*(\d+(?:\.\d+)?)\b/) ??
        take(/\$\s*(\d+(?:\.\d+)?)\s*(?:or\s*)?(?:less|under|max)\b/);
    if (price != null && price > 0 && price <= 200) q.priceMax = price;

    // sorting / intent keywords
    if (/\blow ?(?:er)? ?cal|\blight(?:er|est)?\b|\bdiet\b|\bhealth(?:y|ier|iest)\b|\bfewest cal|\bless cal|\bweight loss|\blose weight/.test(t)) q.sort = "cal-asc";
    else if (/\bprotein\b|\bgym\b|\bmuscle|\bworkout/.test(t)) q.sort = "protein-desc";
    else if (/\bcheap(?:er|est)?\b|\bbudget\b|\baffordable\b|\binexpensive\b|\blowest price|\bleast expensive|\bbest value/.test(t)) q.sort = "price-asc";
    else if (/\bmost expensive|\bpriciest|\bpremium|\bluxur|\bsplurge|\bhighest price/.test(t)) q.sort = "price-desc";

    const wantsFeatured =
        /\brecommend|\bsuggest(?!ion)|\bpopular|\bbest ?sellers?|\bfavou?rites?|\bmust ?try|\bfeatured|\bwhat should i (?:get|order|try|eat|have)|\bsurprise me|\bwhats good|\btop picks?/.test(t);

    // numeric limits imply a natural sort when none was given
    if (!q.sort && q.proteinMin != null) q.sort = "protein-desc";
    if (!q.sort && q.calMax != null) q.sort = "cal-asc";
    if (!q.sort && q.priceMax != null) q.sort = "price-asc";

    q.featured = wantsFeatured && !q.tags.length && !q.category && !q.sort;
    return q;
}

const hasQuery = (q: MenuQuery) =>
    q.tags.length > 0 || !!q.category || q.calMax != null || q.proteinMin != null ||
    q.priceMax != null || !!q.sort || q.featured;

function applyQuery(q: MenuQuery, items: ApiMenuItem[], relaxNumbers = false): ApiMenuItem[] {
    let out = items.filter((it) => {
        if (q.category && it.category_id !== q.category.id) return false;
        if (q.tags.length) {
            const names = new Set((it.tags ?? []).map((x) => words(x.name).join(" ")));
            if (!q.tags.every((tg) => names.has(words(tg).join(" ")))) return false;
        }
        if (!relaxNumbers) {
            if (q.calMax != null && !(it.calories != null && it.calories <= q.calMax)) return false;
            if (q.proteinMin != null && !(it.protein_grams != null && it.protein_grams >= q.proteinMin)) return false;
            if (q.priceMax != null && !(Number(it.price) <= q.priceMax)) return false;
        }
        return true;
    });

    if (q.featured) {
        const featured = out.filter((it) => it.is_featured);
        out = featured.length ? featured : out;
    }

    const num = (v: number | null | undefined, fallback: number) => (v == null ? fallback : v);
    if (q.sort === "cal-asc") out = [...out].sort((a, b) => num(a.calories, 1e9) - num(b.calories, 1e9));
    if (q.sort === "protein-desc") out = [...out].sort((a, b) => num(b.protein_grams, -1) - num(a.protein_grams, -1));
    if (q.sort === "price-asc") out = [...out].sort((a, b) => Number(a.price) - Number(b.price));
    if (q.sort === "price-desc") out = [...out].sort((a, b) => Number(b.price) - Number(a.price));
    return out;
}

const SORT_LABEL: Record<SortKey, string> = {
    "cal-asc": "lightest",
    "protein-desc": "highest-protein",
    "price-asc": "most affordable",
    "price-desc": "premium",
};

function describe(q: MenuQuery): string {
    const bits: string[] = [];
    if (q.tags.length) bits.push(q.tags.map((x) => x.toLowerCase()).join(" & "));
    if (q.category) bits.push(`in ${pickLocale(q.category.name)}`);
    if (q.calMax != null) bits.push(`under ${q.calMax} cal`);
    if (q.proteinMin != null) bits.push(`${q.proteinMin}g+ protein`);
    if (q.priceMax != null) bits.push(`under $${q.priceMax}`);
    return bits.join(", ");
}

/* ───────────────────────── item lookup ───────────────────────── */

function matchItems(t: string, msg: Set<string>, ctx: BotContext) {
    const wordCount = t.split(" ").filter(Boolean).length;
    const blocked = new Set<string>();
    uniqueTags(ctx.items).forEach((tg) => words(tg).forEach((w) => blocked.add(w)));
    ctx.categories.forEach((c) => words(pickLocale(c.name)).forEach((w) => blocked.add(w)));

    const full: ApiMenuItem[] = [];
    const partial: ApiMenuItem[] = [];

    for (const it of ctx.items) {
        const name = pickLocale(it.name);
        const all = words(name);
        const distinct = all.filter((w) => !GENERIC.has(w) && !blocked.has(w));

        if (distinct.length === 0) {
            // Name made only of tag/category/generic words → require the whole name.
            if (phrase(t, normalize(name))) full.push(it);
            continue;
        }
        const hit = distinct.filter((w) => msg.has(w));
        if (hit.length === distinct.length) full.push(it);
        else if (hit.length >= 1 && (hit.length / distinct.length >= 0.5 || wordCount <= 3)) partial.push(it);
    }
    return { full, partial };
}

function itemDetail(item: ApiMenuItem, t: string, ctx: BotContext): BotReply {
    const name = pickLocale(item.name);
    const desc = pickLocale(item.description);
    const price = money(item.price);
    const hasCal = item.calories != null;
    const hasPro = item.protein_grams != null;
    const nutrition = [
        hasCal ? `${item.calories} calories` : null,
        hasPro ? `${item.protein_grams}g of protein` : null,
    ].filter(Boolean).join(" and ");

    const asksNutrition = /\bcal|\bkcal|nutrition|macro|protein/.test(t);
    const asksPrice = /\bprice|\bcost|how much|\bdollar|\$/.test(t);

    const parts: string[] = [];
    if (asksNutrition && nutrition) parts.push(`${name} has ${nutrition}.`);
    else if (asksNutrition) parts.push(`I don't have nutrition info for ${name} yet.`);
    if (asksPrice || !asksNutrition) parts.push(`${name} is ${price}${at(ctx)}.`);
    else parts.push(`It's ${price}${at(ctx)}.`);
    if (desc && !asksPrice && !asksNutrition) parts.push(/[.!?]$/.test(desc.trim()) ? desc.trim() : `${desc.trim()}.`);
    if (!asksNutrition && nutrition) parts.push(`It has ${nutrition}.`);
    if (item.tags?.length) parts.push(`Tags: ${item.tags.map((x) => x.name).join(", ")}.`);

    return {
        text: parts.join(" "),
        itemIds: [item.id],
        chips: ["What do you recommend?", "Show full menu"],
        actions: [{ kind: "link", label: "Open the menu", to: "/menu" }],
    };
}

/* ───────────────────────── reply builders ───────────────────────── */

const reply = (text: string, extra: Partial<BotReply> = {}): BotReply => ({ text, ...extra });

function askBranch(ctx: BotContext): BotReply {
    if (ctx.branches.length === 0) {
        return reply("I can't reach the branch list right now. Please try again in a moment.");
    }
    return reply("Menu, prices and hours vary by location — which branch are you interested in?", {
        actions: ctx.branches.map((b) => ({ kind: "branch", label: branchName(b), slug: b.slug })),
    });
}

function branchesList(ctx: BotContext): BotReply {
    if (ctx.branches.length === 0) return reply("I don't have any branches listed right now.");
    const lines = ctx.branches.map((b) => {
        const bits = [b.address, b.phone].filter(Boolean).join(" · ");
        return `• ${branchName(b)}${bits ? ` — ${bits}` : ""}`;
    });
    const others = ctx.branches.filter((b) => b.slug !== ctx.branch?.slug);
    return reply(`We have ${ctx.branches.length} branch${ctx.branches.length === 1 ? "" : "es"}:\n${lines.join("\n")}`, {
        actions: others.map((b) => ({ kind: "branch", label: `${ctx.branch ? "Switch to" : "Choose"} ${branchName(b)}`, slug: b.slug })),
    });
}

function menuOverview(ctx: BotContext): BotReply {
    if (!ctx.categories.length) {
        return reply("The menu is still loading — try again in a second, or open the menu page.", {
            actions: [{ kind: "link", label: "Open the menu", to: "/menu" }],
        });
    }
    const lines = ctx.categories.map((c) => {
        const n = ctx.items.filter((it) => it.category_id === c.id).length;
        return `• ${pickLocale(c.name)}${n ? ` (${n})` : ""}`;
    });
    return reply(`Here's what we serve${at(ctx)}:\n${lines.join("\n")}\n\nTap a category to see the dishes.`, {
        chips: ctx.categories.slice(0, 4).map((c) => pickLocale(c.name)),
        actions: [{ kind: "link", label: "Open the full menu", to: "/menu" }],
    });
}

function queryReply(q: MenuQuery, ctx: BotContext, t: string): BotReply {
    const results = applyQuery(q, ctx.items);
    const allergyNote = /allerg|intoleran|celiac|coeliac/.test(t)
        ? "\n\nTags are a guide only — please confirm allergies with the team before ordering."
        : "";

    if (results.length === 0) {
        const base = applyQuery(q, ctx.items, true);
        let hint = "";
        if (base.length) {
            if (q.calMax != null) {
                const lightest = [...base].filter((i) => i.calories != null).sort((a, b) => a.calories! - b.calories!)[0];
                if (lightest) hint = ` The lightest I have is ${pickLocale(lightest.name)} at ${lightest.calories} cal.`;
            } else if (q.proteinMin != null) {
                const top = [...base].filter((i) => i.protein_grams != null).sort((a, b) => b.protein_grams! - a.protein_grams!)[0];
                if (top) hint = ` The highest I have is ${pickLocale(top.name)} with ${top.protein_grams}g.`;
            } else if (q.priceMax != null) {
                const cheapest = [...base].sort((a, b) => Number(a.price) - Number(b.price))[0];
                if (cheapest) hint = ` The most affordable is ${pickLocale(cheapest.name)} at ${money(cheapest.price)}.`;
            }
        }
        return reply(
            `I couldn't find anything matching that${describe(q) ? ` (${describe(q)})` : ""}${at(ctx)}.${hint}${allergyNote}`,
            { chips: ["What's on the menu?", "What do you recommend?"], isFallback: false },
        );
    }

    const shown = results.slice(0, MAX_CARDS);
    const n = results.length;
    const desc = describe(q);
    let intro: string;
    if (q.featured) {
        intro = `Here ${shown.length === 1 ? "is our top pick" : "are our top picks"}${at(ctx)}:`;
    } else if (q.sort && !desc) {
        intro = `Here ${shown.length === 1 ? "is the" : `are the ${shown.length}`} ${SORT_LABEL[q.sort]} ${shown.length === 1 ? "dish" : "dishes"}${at(ctx)}:`;
    } else {
        intro = `I found ${n} ${n === 1 ? "dish" : "dishes"}${desc ? ` (${desc})` : ""}${at(ctx)}.` +
            (n > MAX_CARDS ? ` Here are the top ${MAX_CARDS}:` : "");
    }

    return reply(intro + allergyNote, {
        itemIds: shown.map((i) => i.id),
        chips: ["Show full menu", "Opening hours"],
        actions: n > MAX_CARDS ? [{ kind: "link", label: `See all ${n} on the menu`, to: "/menu" }] : undefined,
    });
}

/* ───────────────────────── public API ───────────────────────── */

export function starterChips(ctx: BotContext): string[] {
    const chips = ["What's on the menu?", "What do you recommend?"];
    const tags = uniqueTags(ctx.items).map((x) => x.toLowerCase());
    const vegan = tags.find((x) => x.includes("vegan"));
    if (vegan) chips.push("Vegan options");
    if (ctx.items.some((i) => i.protein_grams != null)) chips.push("High-protein picks");
    if (ctx.items.some((i) => i.calories != null)) chips.push("Low-calorie options");
    chips.push("Opening hours", "Where are you?");
    return chips.slice(0, 6);
}

export function buildWelcome(ctx: BotContext): BotReply {
    if (!ctx.branch) {
        return {
            ...askBranch(ctx),
            text: "Hi, welcome to ENSALADA! Which branch are you interested in? Menu, prices and hours vary by location.",
        };
    }
    return reply(
        `Hi, welcome to ENSALADA ${branchName(ctx.branch)}! I can help with the menu, prices, nutrition, opening hours and how to find us. What are you in the mood for?`,
        { starters: true },
    );
}

export function getReply(input: string, ctx: BotContext, fallbackStreak = 0): BotReply {
    const t = normalize(input);
    const msg = new Set(words(input));
    const wordCount = t.split(" ").filter(Boolean).length;
    const noBranch = !ctx.branch;

    if (!t) return reply("Go ahead — ask me anything about ENSALADA.", { starters: true });

    // ── small talk ──
    const greetRe = /^(?:hi+|hello+|hey+|hola|howdy|yo|sup|marhaba|salam|good (?:morning|afternoon|evening))\b/;
    const afterGreeting = t.replace(greetRe, "").trim();
    if (greetRe.test(t) && /^(?:there|everyone|guys|team|ensalada|friend|bro|all)?$/.test(afterGreeting)) {
        return reply("Hello! How can I help you today?", { starters: true });
    }
    if (/\bhow are you\b|\bhows it going\b/.test(t) && wordCount <= 6) {
        return reply("Doing great, thanks for asking! Hungry for something fresh?", { starters: true });
    }
    if (/\b(?:thanks?|thank you|thx|merci|shukran|gracias|appreciate)\b/.test(t) && wordCount <= 4) {
        return reply("You're very welcome! Anything else I can help with?", { chips: ["What's on the menu?", "Opening hours"] });
    }
    if (/\b(?:bye|goodbye|see you|cya|ttyl)\b/.test(t) && wordCount <= 5) {
        return reply("Goodbye! Hope to see you at ENSALADA soon.");
    }
    if (/^(?:ok|okay|cool|great|nice|perfect|awesome|got it|alright|sure)\b/.test(t) && wordCount <= 3) {
        return reply("Glad to help! Anything else you'd like to know?", { starters: true });
    }
    if (/^(?:help|help me|what can you do|what do you know|how does this work)$/.test(t)) {
        return reply(
            "I can help you with:\n• The menu, categories and prices\n• Calories and protein for each dish\n• Vegan, vegetarian and other dietary picks\n• Opening hours, address and phone\n• Our branches and social links\n\nJust type a question or tap a suggestion.",
            { starters: true },
        );
    }

    // ── a specific dish ──
    const { full, partial } = matchItems(t, msg, ctx);
    const only = full[0];
    if (full.length === 1 && only) return itemDetail(only, t, ctx);
    if (full.length > 1) {
        const shown = full.slice(0, MAX_CARDS);
        return reply(`I found ${full.length} dishes that match:`, {
            itemIds: shown.map((i) => i.id),
            chips: ["Show full menu"],
        });
    }

    // ── branches ──
    if (/\bbranch(?:es)?\b|\boutlets?\b|\ball (?:your )?locations\b|\bhow many (?:locations|places|stores)\b/.test(t)) {
        return branchesList(ctx);
    }

    // ── hours ──
    if (/\b(?:hours?|open(?:s|ing)?|clos(?:e|es|ing)|schedule|timings?|what time|until when|when are you)\b|\bhorario\b/.test(t)) {
        if (noBranch) return askBranch(ctx);
        const wk = setting(ctx, "hours_weekday", DEFAULTS.hoursWeekday);
        const we = setting(ctx, "hours_weekend", DEFAULTS.hoursWeekend);
        return reply(`Our opening hours${at(ctx)}:\n${wk}\n${we}`, { chips: ["Where are you?", "Phone number"] });
    }

    // ── location ──
    if (/\b(?:address|located|location|where (?:are|r) (?:you|u)|where is|where can i find you|find you|directions?|how (?:do i|to) get|map|near me|nearby|come visit)\b/.test(t)) {
        if (noBranch) return branchesList(ctx);
        const addr = setting(ctx, "contact_address", ctx.branch?.address || DEFAULTS.address);
        const more = ctx.branches.length > 1 ? ` We have ${ctx.branches.length} branches — ask for “all branches” to see them.` : "";
        return reply(`${ctx.branch ? `Our ${branchName(ctx.branch)} branch is at` : "You can find us at"} ${addr}.${more}`, {
            actions: [
                { kind: "href", label: "Open in Maps", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}` },
                { kind: "link", label: "Contact page", to: "/contact" },
            ],
            chips: ["Opening hours", "Phone number"],
        });
    }

    // ── phone ──
    if (/\b(?:phone|telephone|whatsapp|hotline|call (?:you|us)|contact number|ring)\b/.test(t)) {
        if (noBranch) return askBranch(ctx);
        const phone = setting(ctx, "contact_phone", ctx.branch?.phone || DEFAULTS.phone);
        return reply(`You can call us${at(ctx)} on ${phone}.`, {
            actions: [{ kind: "href", label: `Call ${phone}`, href: `tel:${phone.replace(/[^\d+]/g, "")}` }],
            chips: ["Opening hours", "Where are you?"],
        });
    }

    // ── email ──
    if (/\be-?mail\b/.test(t)) {
        const email = setting(ctx, "contact_email", DEFAULTS.email);
        return reply(`Our email is ${email}. You can also use the contact form and we'll get back to you.`, {
            actions: [
                { kind: "href", label: `Email ${email}`, href: `mailto:${email}` },
                { kind: "link", label: "Contact form", to: "/contact" },
            ],
        });
    }

    // ── social ──
    if (/\b(?:instagram|facebook|tiktok|twitter|youtube|snapchat|linkedin|social(?: media)?|follow (?:you|us))\b/.test(t)) {
        const links = socialLinks(ctx).slice(0, 4);
        if (!links.length) {
            return reply("You'll find our social links in the footer and on the contact page.", {
                actions: [{ kind: "link", label: "Contact page", to: "/contact" }],
            });
        }
        return reply("Come say hi! Here's where to find us online:", {
            actions: links.map((l) => ({ kind: "href", label: l.platform, href: l.url })),
        });
    }

    // ── orders / reservations / things only a human knows ──
    if (/\b(?:deliver(?:y|ies)?|takeaway|take away|take out|takeout|pick ?up|order(?:ing)?|reserve|reservations?|book(?:ing)? a table|table for)\b/.test(t)) {
        if (noBranch) return askBranch(ctx);
        const phone = setting(ctx, "contact_phone", ctx.branch?.phone || DEFAULTS.phone);
        return reply(
            `I can't place orders or take reservations in this chat, and I don't have delivery details. The team can help directly — call ${phone}${at(ctx)} or send us a message.`,
            {
                actions: [
                    { kind: "href", label: `Call ${phone}`, href: `tel:${phone.replace(/[^\d+]/g, "")}` },
                    { kind: "link", label: "Contact form", to: "/contact" },
                ],
            },
        );
    }
    if (/\b(?:contact|reach|get in touch|speak to|talk to|human|complain|complaint|feedback|catering|parking|wifi|jobs?|careers?|hiring|birthday|payment|pay by|credit card|cash|accessible|wheelchair|kids?)\b/.test(t)) {
        const phone = setting(ctx, "contact_phone", ctx.branch?.phone || DEFAULTS.phone);
        const email = setting(ctx, "contact_email", DEFAULTS.email);
        return reply(
            `For that, the team is the best source. Reach us on ${phone} or ${email}, or use the contact form.`,
            {
                actions: [
                    { kind: "link", label: "Contact form", to: "/contact" },
                    { kind: "href", label: `Call ${phone}`, href: `tel:${phone.replace(/[^\d+]/g, "")}` },
                ],
            },
        );
    }

    // ── about ──
    if (/\b(?:about (?:you|us|ensalada|the restaurant)|your story|who are you|what is ensalada|tell me about)\b/.test(t)) {
        const body = setting(ctx, "about_body_1", DEFAULTS.about);
        return reply(body, { actions: [{ kind: "link", label: "Read more", to: "/home" }], chips: ["What's on the menu?"] });
    }

    // ── menu filters: tags, category, calories, protein, price, sorting ──
    const q = parseQuery(t, msg, ctx);
    if (hasQuery(q)) {
        if (noBranch) return askBranch(ctx);
        return queryReply(q, ctx, t);
    }

    // ── ingredient search: “do you have chicken?”, “with avocado” ──
    const ing = t.match(/\b(?:do you have|have you got|any|with|contains?|containing|includes?|made with|has)\s+(.+)$/);
    if (ing) {
        const terms = words(ing[1] ?? "").filter((w) => !GENERIC.has(w) && w.length > 2);
        if (terms.length) {
            const found = ctx.items.filter((it) => {
                const hay = new Set(words(`${pickLocale(it.name)} ${pickLocale(it.description)}`));
                return terms.every((w) => hay.has(w));
            });
            if (found.length) {
                const shown = found.slice(0, MAX_CARDS);
                return reply(`Yes! ${found.length} dish${found.length === 1 ? "" : "es"} with ${terms.join(" ")}${at(ctx)}:`, {
                    itemIds: shown.map((i) => i.id),
                    chips: ["Show full menu"],
                });
            }
            if (!noBranch && ctx.items.length) {
                return reply(
                    `I couldn't find ${terms.join(" ")} on the menu${at(ctx)}. Want to see what we do serve?`,
                    { chips: ["Show full menu", "What do you recommend?"] },
                );
            }
        }
    }

    // ── partial dish match ──
    if (partial.length) {
        const shown = partial.slice(0, MAX_CARDS);
        return reply("These dishes might be what you're after:", {
            itemIds: shown.map((i) => i.id),
            chips: ["Show full menu"],
        });
    }

    // ── nutrition without a dish ──
    if (/\bcal|\bkcal|nutrition|macro/.test(t)) {
        return reply("Tell me a dish name and I'll share its calories and protein — or ask for low-calorie or high-protein picks.", {
            chips: ["Low-calorie options", "High-protein picks"],
        });
    }

    // ── menu overview ──
    if (/\b(?:menu|categories|category|what do you (?:have|serve|sell|offer)|what (?:food|can i (?:eat|get))|dishes|food|offer|serve)\b/.test(t) || /^show full menu$/.test(t) || (wordCount <= 2 && /\b(?:salads?|bowls?)\b/.test(t))) {
        if (noBranch) return askBranch(ctx);
        return menuOverview(ctx);
    }

    // ── menu-ish question but no branch chosen yet ──
    if (noBranch && /\b(?:menu|vegan|vegetarian|salads?|bowls?|calor|protein|price|prices|cheap|recommend|food|dish|dishes|eat|gluten|healthy|light|popular|sides?)\b/.test(t)) {
        return askBranch(ctx);
    }

    // ── fallback ──
    const phone = setting(ctx, "contact_phone", ctx.branch?.phone || DEFAULTS.phone);
    if (fallbackStreak >= 1) {
        return reply(
            `I'm still not sure about that one. For anything I can't answer, the team will be happy to help — call ${phone} or use the contact form.`,
            {
                isFallback: true,
                actions: [{ kind: "link", label: "Contact form", to: "/contact" }],
                chips: ["What's on the menu?", "Opening hours"],
            },
        );
    }
    return reply(
        "Sorry, I didn't quite get that. I can help with the menu, prices, nutrition, opening hours and our location — try one of these:",
        { isFallback: true, starters: true },
    );
}