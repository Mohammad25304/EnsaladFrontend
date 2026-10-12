/* eslint-disable prettier/prettier */
import {
    Facebook,
    Instagram,
    Twitter,
    Youtube,
    Linkedin,
    MessageCircle,
    Link as LinkIcon,
    type LucideIcon,
} from "lucide-react";

import type { SocialLink } from "@/lib/api-types";

// Maps a platform key (from Filament's dropdown) to an icon. Any platform
// not listed here — including brand-new ones an owner adds later — still
// renders correctly using the generic link icon fallback below.
const PLATFORM_ICONS: Record<string, LucideIcon> = {
    instagram: Instagram,
    facebook: Facebook,
    twitter: Twitter,
    youtube: Youtube,
    linkedin: Linkedin,
    whatsapp: MessageCircle,
};

interface SocialLinksProps {
    links: SocialLink[];
    className?: string;
    iconClassName?: string;
}

// Only plain web links are rendered, so a bad value saved in the admin panel
// (e.g. a "javascript:" URL) can never become a clickable link.
const isSafeUrl = (url: string) => /^https?:\/\//i.test(url.trim());

export function SocialLinks({ links: allLinks, className, iconClassName }: SocialLinksProps) {
    const links = allLinks.filter((link) => isSafeUrl(link.url));
    if (links.length === 0) return null;

    return (
        <div className={className ?? "flex gap-3"}>
            {links.map((link, index) => {
                const Icon = PLATFORM_ICONS[link.platform] ?? LinkIcon;
                return (
                    <a
                        key={`${link.platform}-${index}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.platform}
                        className={
                            iconClassName ??
                            "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:border-primary hover:text-primary"
                        }
                    >
                        <Icon className="h-4 w-4" />
                    </a>
                );
            })}
        </div>
    );
} 