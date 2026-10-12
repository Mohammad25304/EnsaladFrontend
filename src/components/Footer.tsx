/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock, Salad } from "lucide-react";

import { useSiteSettings, useSocialLinks } from "@/hooks/use-menu";
import { useBranch } from "@/hooks/use-branch";
import { SocialLinks } from "@/components/SocialLinks";

export function Footer() {
  const { branchSlug } = useBranch();
  const { data: settings } = useSiteSettings(branchSlug);
  const socialLinks = useSocialLinks(branchSlug);

  // No made-up fallbacks: a row is only shown once the admin has filled it in.
  const address = settings?.contact_address;
  const phone = settings?.contact_phone;
  const email = settings?.contact_email;
  const hoursWeekday = settings?.hours_weekday;
  const hoursWeekend = settings?.hours_weekend;
  const hasHours = !!(hoursWeekday || hoursWeekend);
  const hasContact = !!(address || phone || email);

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/home" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Salad className="h-5 w-5" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight text-foreground">
                ENSALADA
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Fresh, modern salads made with seasonal ingredients and bold flavors. Eat green, feel
              great.
            </p>
          </div>

          {/* Hours */}
          {hasHours && (
            <div>
              <h4 className="font-display text-base font-semibold text-foreground">Hours</h4>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {[hoursWeekday, hoursWeekend].map(
                  (line) =>
                    line && (
                      <li key={line} className="flex items-start gap-3">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{line}</span>
                      </li>
                    ),
                )}
              </ul>
            </div>
          )}

          {/* Contact */}
          {hasContact && (
            <div>
              <h4 className="font-display text-base font-semibold text-foreground">Contact</h4>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                {address && (
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{address}</span>
                  </li>
                )}
                {phone && (
                  <li className="flex items-center gap-3">
                    <Phone className="h-4 w-4 shrink-0 text-primary" />
                    <a
                      href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                      className="transition-colors hover:text-foreground"
                    >
                      {phone}
                    </a>
                  </li>
                )}
                {email && (
                  <li className="flex items-center gap-3">
                    <Mail className="h-4 w-4 shrink-0 text-primary" />
                    <a href={`mailto:${email}`} className="transition-colors hover:text-foreground">
                      {email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Social */}
          {socialLinks.length > 0 && (
            <div>
              <h4 className="font-display text-base font-semibold text-foreground">Follow Us</h4>
              <SocialLinks links={socialLinks} className="mt-4 flex gap-3" />
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} ENSALADA. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/menu" className="transition-colors hover:text-foreground">
              Menu
            </Link>
            <Link to="/contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}