import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ApiMenuItem } from "@/lib/api-types";

interface MenuCardProps {
  item: ApiMenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  return (
    <Card className="group overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-4/3 overflow-hidden">
        <img
          src={item.image}
          alt={item.name.en}
          loading="lazy"
          width={800}
          height={600}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3 rounded-full bg-card/95 px-3 py-1 text-sm font-semibold text-card-foreground shadow-sm backdrop-blur-sm">
          ${item.price}
        </div>
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-foreground">{item.name.en}</h3>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {item.description.en}
        </p>
        {item.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs font-medium">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
