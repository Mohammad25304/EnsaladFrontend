/* eslint-disable prettier/prettier */
import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock, Salad } from "lucide-react";

import { useSiteSettings, useSocialLinks } from "@/hooks/use-menu";
import { SocialLinks } from "@/components/SocialLinks";

export function Footer() {
  const { data: settings } = useSiteSettings();
  const socialLinks = useSocialLinks();

  const address = settings?.contact_address ?? "123 Green Leaf Avenue, Beirut, Lebanon";
  const phone = settings?.contact_phone ?? "+961 1 123 456";
  const email = settings?.contact_email ?? "hello@ensalada.com";
  const hoursWeekday = settings?.hours_weekday ?? "Mon – Fri: 10:00 AM – 9:00 PM";
  const hoursWeekend = settings?.hours_weekend ?? "Sat – Sun: 11:00 AM – 10:00 PM";

  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
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
          <div>
            <h4 className="font-display text-base font-semibold text-foreground">Hours</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{hoursWeekday}</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{hoursWeekend}</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-base font-semibold text-foreground">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                  className="transition-colors hover:text-foreground"
                >
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${email}`} className="transition-colors hover:text-foreground">
                  {email}
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display text-base font-semibold text-foreground">Follow Us</h4>
            <SocialLinks links={socialLinks} className="mt-4 flex gap-3" />
          </div>
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