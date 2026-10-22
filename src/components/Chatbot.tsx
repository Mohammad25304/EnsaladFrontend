/* eslint-disable prettier/prettier */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BicepsFlexed, Flame, MessageCircle, Salad, SendHorizontal, Wheat, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBranch } from "@/hooks/use-branch";
import { ApiError, getBranches, getChatWelcome, sendChatMessage } from "@/lib/api";
import {
    pickLocale,
    type ChatAction,
    type ChatItem,
    type ChatReply,
    type ChatWelcomeMode,
} from "@/lib/api-types";

/* ───────────────────────── types & storage ───────────────────────── */

interface ChatMessage {
    id: string;
    role: "user" | "bot";
    text: string;
    items?: ChatItem[];
    actions?: ChatAction[];
    chips?: string[];
    isFallback?: boolean;
}

const STORAGE_KEY = "ensalada:chat";
const TEASER_KEY = "ensalada:chat:teased";

let counter = 0;
const uid = () => `${Date.now().toString(36)}-${counter++}`;

const botMsg = (r: ChatReply): ChatMessage => ({
    id: uid(),
    role: "bot",
    text: r.text,
    items: r.items,
    actions: r.actions,
    chips: r.chips,
    isFallback: r.is_fallback,
});

const OFFLINE_WELCOME: ChatReply = {
    text: "Hi, welcome to ENSALADA! Ask me about the menu, opening hours or where to find us.",
    items: [],
    actions: [],
    chips: [],
    is_fallback: false,
};

function errorReply(err: unknown): ChatReply {
    const busy = err instanceof ApiError && err.status === 429;
    return {
        text: busy
            ? "You're sending messages a little fast — give me a few seconds and try again."
            : "I can't reach the server right now. Please try again in a moment, or send us a message through the contact form.",
        items: [],
        actions: busy ? [] : [{ kind: "link", label: "Contact form", to: "/contact" }],
        chips: [],
        is_fallback: false,
    };
}

/* ───────────────────────── small pieces ───────────────────────── */

function ItemCard({ item }: { item: ChatItem }) {
    return (
        <div className="flex gap-3 rounded-2xl border border-border bg-card p-2.5 shadow-sm">
            <img
                src={item.image}
                alt={pickLocale(item.name)}
                loading="lazy"
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="font-display text-sm font-semibold leading-tight text-foreground">
                        {pickLocale(item.name)}
                    </p>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                        ${Number(item.price).toFixed(2)}
                    </span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {pickLocale(item.description)}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-muted-foreground">
                    {item.calories != null && (
                        <span className="flex items-center gap-1">
                            <Flame className="h-3 w-3 text-primary" />
                            {item.calories} kcal
                        </span>
                    )}
                    {item.protein_grams != null && (
                        <span className="flex items-center gap-1">
                            <BicepsFlexed className="h-3 w-3 text-primary" />
                            {item.protein_grams}g
                        </span>
                    )}

                    {item.carbs_grams != null && (
                        <span className="flex items-center gap-1">
                            <Wheat className="h-3 w-3 text-primary" />
                            {item.carbs_grams}g carbs
                        </span>
                    )}
                    {item.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
                            {tag.name}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
}

const chipClass =
    "rounded-full border border-primary/30 bg-card px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const actionClass =
    "inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function ActionButton({
    action,
    onBranch,
    onNavigate,
}: {
    action: ChatAction;
    onBranch: (slug: string) => void;
    onNavigate: () => void;
}) {
    if (action.kind === "branch") {
        return (
            <button type="button" className={actionClass} onClick={() => onBranch(action.slug)}>
                {action.label}
            </button>
        );
    }
    if (action.kind === "link") {
        return (
            <Link to={action.to} className={actionClass} onClick={onNavigate}>
                {action.label}
            </Link>
        );
    }
    const external = action.href.startsWith("http");
    return (
        <a
            href={action.href}
            className={actionClass}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
            {action.label}
        </a>
    );
}

function TypingDots() {
    return (
        <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-secondary px-4 py-3" aria-label="Typing">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground/70 motion-safe:animate-bounce"
                    style={{ animationDelay: `${i * 120}ms` }}
                />
            ))}
        </div>
    );
}

/* ───────────────────────── main widget ───────────────────────── */

export function ChatBot() {
    const { branchSlug, setBranchSlug, isHydrated } = useBranch();

    // Only used for the header subtitle — the bot itself runs on the server.
    const { data: branches } = useQuery({ queryKey: ["branches"], queryFn: getBranches });
    const branch = branches?.find((b) => b.slug === branchSlug);

    const [open, setOpen] = useState(false);
    const [teaser, setTeaser] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [typing, setTyping] = useState(false);
    const [input, setInput] = useState("");

    const endRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastBranch = useRef<string | null | undefined>(undefined);
    const welcoming = useRef(false);
    const sending = useRef(false);
    const mounted = useRef(true);

    // Latest values for async callbacks (avoids stale closures).
    const messagesRef = useRef(messages);
    messagesRef.current = messages;
    const branchRef = useRef(branchSlug);
    branchRef.current = branchSlug;

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    /* restore history (once, client-side) */
    useEffect(() => {
        if (!isHydrated) return;
        try {
            const raw = sessionStorage.getItem(STORAGE_KEY);
            if (raw) setMessages(JSON.parse(raw));
        } catch {
            /* ignore corrupt storage */
        }
        setLoaded(true);
    }, [isHydrated]);

    /* persist history */
    useEffect(() => {
        if (!loaded) return;
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
        } catch {
            /* storage full / unavailable */
        }
    }, [messages, loaded]);

    /* fetch a welcome-style message from the server and append it */
    const appendWelcome = useCallback(async (mode: ChatWelcomeMode) => {
        let reply: ChatReply;
        try {
            reply = await getChatWelcome(branchRef.current, mode);
        } catch {
            reply = OFFLINE_WELCOME;
        }
        if (mounted.current) setMessages((m) => [...m, botMsg(reply)]);
    }, []);

    /* first open → welcome message */
    useEffect(() => {
        if (!open || !loaded || messages.length > 0 || welcoming.current) return;
        welcoming.current = true;
        void appendWelcome("welcome").finally(() => {
            welcoming.current = false;
        });
    }, [open, loaded, messages.length, appendWelcome]);

    /* branch changed (header switcher or chat button) → tell the user */
    useEffect(() => {
        if (!loaded) return;
        if (lastBranch.current === undefined) {
            lastBranch.current = branchSlug;
            return;
        }
        if (lastBranch.current !== branchSlug) {
            const was = lastBranch.current;
            lastBranch.current = branchSlug;
            if (branchSlug && messagesRef.current.length > 0) {
                void appendWelcome(was ? "switched" : "chosen");
            }
        }
    }, [branchSlug, loaded, appendWelcome]);

    /* one-time teaser bubble */
    useEffect(() => {
        if (!isHydrated) return undefined;
        try {
            if (sessionStorage.getItem(TEASER_KEY)) return undefined;
        } catch {
            return undefined;
        }
        const show = window.setTimeout(() => setTeaser(true), 5000);
        const hide = window.setTimeout(() => setTeaser(false), 14000);
        return () => {
            window.clearTimeout(show);
            window.clearTimeout(hide);
        };
    }, [isHydrated]);

    /* scroll + focus */
    useEffect(() => {
        endRef.current?.scrollIntoView({ block: "end" });
    }, [messages, typing, open]);

    useEffect(() => {
        if (!open) return undefined;
        const id = window.setTimeout(() => inputRef.current?.focus(), 60);
        return () => window.clearTimeout(id);
    }, [open]);

    function toggle(next: boolean) {
        setOpen(next);
        if (next) {
            setTeaser(false);
            try {
                sessionStorage.setItem(TEASER_KEY, "1");
            } catch {
                /* ignore */
            }
        }
    }

    const send = useCallback(async (raw: string) => {
        const text = raw.trim();
        if (!text || sending.current) return;
        sending.current = true;

        // consecutive "didn't get that" replies at the end of the thread
        let streak = 0;
        for (let i = messagesRef.current.length - 1; i >= 0; i--) {
            const prev = messagesRef.current[i];
            if (!prev || prev.role === "user") continue;
            if (prev.isFallback) streak++;
            else break;
        }

        setMessages((m) => [...m, { id: uid(), role: "user", text }]);
        setInput("");
        setTyping(true);

        // keep a natural typing rhythm even when the server answers instantly
        const pause = new Promise((r) => window.setTimeout(r, 380 + Math.min(text.length * 10, 420)));

        let reply: ChatReply;
        try {
            [reply] = await Promise.all([
                sendChatMessage({ message: text, branch: branchRef.current, fallbackStreak: streak }),
                pause,
            ]);
        } catch (err) {
            await pause;
            reply = errorReply(err);
        }

        sending.current = false;
        if (!mounted.current) return;
        setMessages((m) => [...m, botMsg(reply)]);
        setTyping(false);
    }, []);

    function closeOnMobile() {
        if (typeof window !== "undefined" && window.innerWidth < 640) setOpen(false);
    }

    const lastBotId = [...messages].reverse().find((m) => m.role === "bot")?.id;
    const subtitle = branch
        ? `Serving ${pickLocale(branch.name)}`
        : "Choose a branch to get started";

    return (
        <>
            {/* teaser */}
            {teaser && !open && (
                <button
                    type="button"
                    onClick={() => toggle(true)}
                    className="fixed bottom-24 right-4 z-40 flex max-w-[16rem] items-center gap-2 rounded-2xl rounded-br-md border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-card-foreground shadow-lg motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2"
                >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                    Hungry? Ask me anything about our menu.
                </button>
            )}

            {/* launcher */}
            <button
                type="button"
                aria-label={open ? "Close chat" : "Open chat assistant"}
                aria-expanded={open}
                onClick={() => toggle(!open)}
                className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100"
            >
                {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
            </button>

            {/* panel */}
            {open && (
                <section
                    role="dialog"
                    aria-label="ENSALADA assistant"
                    onKeyDown={(e) => e.key === "Escape" && toggle(false)}
                    className="fixed bottom-24 right-4 z-50 flex h-[min(34rem,calc(100dvh-7.5rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-200"
                >
                    <header className="flex items-center gap-3 bg-primary px-4 py-3.5 text-primary-foreground">
                        <img src="EnSalada Sage Green Logo.png" alt="Ensalada logo" className="h-10 w-10 shrink-0 rounded-full bg-primary-foreground/15 object-cover" />
                        <div className="min-w-0 flex-1">
                            <p className="font-display text-lg font-semibold leading-tight">ENSALADA</p>
                            <p className="truncate text-xs text-primary-foreground/80">{subtitle}</p>
                        </div>
                        <button
                            type="button"
                            aria-label="Close chat"
                            onClick={() => toggle(false)}
                            className="rounded-full p-1.5 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </header>

                    <div
                        role="log"
                        aria-live="polite"
                        className="flex-1 space-y-4 overflow-y-auto bg-background px-4 py-4"
                    >
                        {messages.map((m) => {
                            if (m.role === "user") {
                                return (
                                    <div
                                        key={m.id}
                                        className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground"
                                    >
                                        {m.text}
                                    </div>
                                );
                            }

                            const cards = m.items ?? [];
                            const chips = m.chips;
                            const isLast = m.id === lastBotId && !typing;

                            return (
                                <div key={m.id} className="max-w-[92%] space-y-2">
                                    <div className="w-fit max-w-full whitespace-pre-line rounded-2xl rounded-bl-md bg-secondary px-3.5 py-2.5 text-sm leading-relaxed text-secondary-foreground">
                                        {m.text}
                                    </div>

                                    {cards.length > 0 && (
                                        <div className="space-y-2">
                                            {cards.map((item) => (
                                                <ItemCard key={item.id} item={item} />
                                            ))}
                                        </div>
                                    )}

                                    {m.actions && m.actions.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {m.actions.map((a, i) => (
                                                <ActionButton
                                                    key={`${a.kind}-${i}`}
                                                    action={a}
                                                    onBranch={setBranchSlug}
                                                    onNavigate={closeOnMobile}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {isLast && chips && chips.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {chips.map((c) => (
                                                <button key={c} type="button" className={chipClass} onClick={() => send(c)}>
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {typing && <TypingDots />}
                        <div ref={endRef} />
                    </div>

                    <form
                        className="flex items-center gap-2 border-t border-border bg-card p-3"
                        onSubmit={(e) => {
                            e.preventDefault();
                            send(input);
                        }}
                    >
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            maxLength={200}
                            placeholder="Ask about the menu, hours…"
                            aria-label="Type your message"
                            autoComplete="off"
                            className="h-10 rounded-full bg-background px-4"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            aria-label="Send message"
                            disabled={!input.trim() || typing}
                            className="h-10 w-10 shrink-0 rounded-full"
                        >
                            <SendHorizontal className="h-4 w-4" />
                        </Button>
                    </form>
                </section>
            )}
        </>
    );
}