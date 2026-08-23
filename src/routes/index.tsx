/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/SectionHeading";
import { MenuCard } from "@/components/MenuCard";
import { useFeaturedItems, useSiteSettings } from "@/hooks/use-menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ENSALADA — Fresh Salads, Made Modern" },
      {
        name: "description",
        content:
          "ENSALADA serves fresh, modern salads with seasonal ingredients and bold flavors. Explore our menu and visit us in Beirut.",
      },
      {
        property: "og:title",
        content: "ENSALADA — Fresh Salads, Made Modern",
      },
      {
        property: "og:description",
        content: "ENSALADA serves fresh, modern salads with seasonal ingredients and bold flavors.",
      },
      { property: "og:type", content: "website" },
      {
        property: "og:url",
        content: "https://ensalada-modern-menu.lovable.app/",
      },
      {
        property: "og:image",
        content: "https://ensalada-modern-menu.lovable.app/images/hero-salad.jpg",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "ENSALADA — Fresh Salads, Made Modern" },
      {
        name: "twitter:description",
        content: "Seasonal bowls, crisp greens, and bold dressings in the heart of Beirut.",
      },
      {
        name: "twitter:image",
        content: "https://ensalada-modern-menu.lovable.app/images/hero-salad.jpg",
      },
    ],
    links: [{ rel: "canonical", href: "https://ensalada-modern-menu.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: "ENSALADA",
          servesCuisine: "Salads",
          url: "https://ensalada-modern-menu.lovable.app/",
          image: "https://ensalada-modern-menu.lovable.app/images/hero-salad.jpg",
          telephone: "+961 1 123 456",
          email: "hello@ensalada.com",
          priceRange: "$$",
          address: {
            "@type": "PostalAddress",
            streetAddress: "123 Green Leaf Avenue",
            addressLocality: "Beirut",
            addressCountry: "LB",
          },
          openingHours: ["Mo-Fr 10:00-21:00", "Sa-Su 11:00-22:00"],
          hasMenu: "https://ensalada-modern-menu.lovable.app/menu",
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: featuredItems, isLoading } = useFeaturedItems();
  const { data: settings } = useSiteSettings();

  // Fallbacks keep the page looking correct on first load, before the
  // settings request resolves, or if a value hasn't been set yet in Filament.
  const heroBadge = settings?.hero_badge ?? "Now Open in Beirut";
  const heroTitle = settings?.hero_title ?? "Fresh Salads, Made Modern.";
  const heroSubtitle =
    settings?.hero_subtitle ??
    "Seasonal bowls, crisp greens, and bold dressings — built for the way you eat today.";
  const aboutTitle = settings?.about_title ?? "About ENSALADA";
  const aboutBody1 =
    settings?.about_body_1 ??
    "ENSALADA was born from a simple belief: salad should never be boring. We combine farm-fresh produce, house-made dressings, and globally inspired flavors into bowls that are as nourishing as they are delicious.";
  const aboutBody2 =
    settings?.about_body_2 ??
    "Every ingredient is chosen with care — from crisp local greens to ripe seasonal toppings — so every bite feels like a fresh start.";
  const stat1Value = settings?.stat_1_value ?? "100%";
  const stat1Label = settings?.stat_1_label ?? "Fresh Daily";
  const stat2Value = settings?.stat_2_value ?? "20+";
  const stat2Label = settings?.stat_2_label ?? "Signature Bowls";
  const stat3Value = settings?.stat_3_value ?? "0";
  const stat3Label = settings?.stat_3_label ?? "Boring Salads";

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-salad.jpg"
            alt="Vibrant mixed green salad bowl"
            width={1600}
            height={1000}
            loading="eager"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/30" />
        </div>

        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl py-16">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              {heroBadge}
            </span>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.1] text-foreground sm:text-6xl lg:text-7xl">
              {heroTitle}
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              {heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="min-w-[9rem]">
                <Link to="/menu">View Menu</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-[9rem]">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="bg-leaf-pattern py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Fan Favorites"
            title="Featured Menu Items"
            description="Three bowls our guests come back for, again and again."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-2xl border border-border"
                >
                  <div className="aspect-[4/3] bg-muted" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-2/3 rounded bg-muted" />
                    <div className="h-4 w-full rounded bg-muted" />
                  </div>
                </div>
              ))
              : featuredItems?.map((item) => <MenuCard key={item.id} item={item} />)}
          </div>
          <div className="mt-12 text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/menu">See Full Menu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative">
              <div className="absolute -left-4 -top-4 h-full w-full rounded-3xl bg-primary/10" />
              <img
                src="/images/salad-signature.jpg"
                alt="Colorful Ensalada signature bowl"
                width={800}
                height={800}
                loading="lazy"
                className="relative rounded-3xl object-cover shadow-xl"
              />
            </div>
            <div>
              <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-secondary-foreground">
                Our Story
              </span>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                {aboutTitle}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {aboutBody1}
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                {aboutBody2}
              </p>

              <div className="mt-10 grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="font-display text-3xl font-semibold text-primary">
                    {stat1Value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat1Label}</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl font-semibold text-primary">
                    {stat2Value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat2Label}</div>
                </div>
                <div className="text-center">
                  <div className="font-display text-3xl font-semibold text-primary">
                    {stat3Value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat3Label}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 