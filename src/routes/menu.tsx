/* eslint-disable prettier/prettier */
import { createFileRoute } from "@tanstack/react-router";

import { SectionHeading } from "@/components/SectionHeading";
import { MenuCard } from "@/components/MenuCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import type { ApiCategory } from "@/lib/api-types";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — ENSALADA" },
      {
        name: "description",
        content:
          "Explore the ENSALADA menu: signature bowls, leafy greens, protein salads, warm roasted bowls, and refreshing sides.",
      },
      { property: "og:title", content: "Menu — ENSALADA" },
      {
        property: "og:description",
        content:
          "Explore the ENSALADA menu: signature bowls, leafy greens, protein salads, warm roasted bowls, and refreshing sides.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ensalada-modern-menu.lovable.app/menu" },
      {
        property: "og:image",
        content: "https://ensalada-modern-menu.lovable.app/images/salad-signature.jpg",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Menu — ENSALADA" },
      {
        name: "twitter:description",
        content:
          "Signature bowls, leafy greens, protein salads, warm roasted bowls, and refreshing sides.",
      },
      {
        name: "twitter:image",
        content: "https://ensalada-modern-menu.lovable.app/images/salad-signature.jpg",
      },
    ],
    links: [{ rel: "canonical", href: "https://ensalada-modern-menu.lovable.app/menu" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Menu",
          name: "ENSALADA Menu",
          url: "https://ensalada-modern-menu.lovable.app/menu",
        }),
      },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const { data: categories, isLoading: categoriesLoading, isError: categoriesError } =
    useCategories();
  const { data: items, isLoading: itemsLoading } = useMenuItems();

  return (
    <main className="min-h-screen py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Discover"
          title="Our Menu"
          description="Organized by craving. Pick a category and find your next favorite bowl."
        />

        <div className="mt-12">
          {categoriesLoading || itemsLoading ? (
            <MenuSkeleton />
          ) : categoriesError || !categories?.length ? (
            <p className="text-center text-muted-foreground">
              We couldn't load the menu right now. Please try again shortly.
            </p>
          ) : (
            <Tabs defaultValue={categories[0]!.slug} className="w-full">
              <div className="sticky top-16 z-30 -mx-4 bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-secondary/60 p-2">
                  {categories.map((category: ApiCategory) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.slug}
                      className="rounded-xl px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {category.name.en}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categories.map((category: ApiCategory) => {
                const categoryItems = (items ?? []).filter(
                  (item) => item.category?.slug === category.slug,
                );
                return (
                  <TabsContent
                    key={category.id}
                    value={category.slug}
                    className="mt-8 focus-visible:outline-none"
                  >
                    <div className="mb-8 max-w-2xl">
                      <h3 className="font-display text-2xl font-semibold text-foreground">
                        {category.name.en}
                      </h3>
                      {category.description && (
                        <p className="mt-2 text-muted-foreground">{category.description.en}</p>
                      )}
                    </div>
                    {categoryItems.length === 0 ? (
                      <p className="text-muted-foreground">
                        No items in this category yet — check back soon.
                      </p>
                    ) : (
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {categoryItems.map((item) => (
                          <MenuCard key={item.id} item={item} />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      </div>
    </main>
  );
}

function MenuSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-border">
          <div className="aspect-[4/3] bg-muted" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}