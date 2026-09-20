/* eslint-disable prettier/prettier */
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import type { ApiMenuItem } from "@/lib/api-types";

// interface MenuCardProps {
//   item: ApiMenuItem;
// }

// export function MenuCard({ item }: MenuCardProps) {
//   return (
//     <Card className="group overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
//       <div className="relative aspect-4/3 overflow-hidden">
//         <img
//           src={item.image}
//           alt={item.name.en}
//           loading="lazy"
//           width={800}
//           height={600}
//           className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
//         />
//         <div className="flex items-start justify-between right-3 top-3 rounded-full bg-card/95 px-3 py-1 text-sm font-semibold text-card-foreground shadow-sm backdrop-blur-sm">
//           ${item.price}
//         </div>
//       </div>
//       <CardContent className="p-5">
//         <div className="flex items-start justify-between gap-3">
//           <h3 className="font-display text-xl font-semibold text-foreground">{item.name.en}</h3>
//         </div>
//         <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
//           {item.description.en}
//         </p>
//         {item.tags.length > 0 && (
//           <div className="mt-4 flex flex-wrap gap-2">
//             {item.tags.map((tag) => (
//               <Badge key={tag.id} variant="secondary" className="text-xs font-medium">
//                 {tag.name}
//               </Badge>
//             ))}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

import { Flame, BicepsFlexed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { pickLocale, type ApiMenuItem } from "@/lib/api-types";

interface MenuCardProps {
  item: ApiMenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const name = pickLocale(item.name);
  const description = pickLocale(item.description);
  const price = Number(item.price).toFixed(2);
  const hasNutrition = item.calories != null || item.protein_grams != null;

  return (
    <Card className="group overflow-hidden border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={item.image}
          alt={name}
          loading="lazy"
          width={800}
          height={600}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-foreground">{name}</h3>
          <span className="shrink-0 rounded-full bg-card px-3 py-1 text-sm font-semibold text-card-foreground shadow-sm">
            ${price}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>

        {hasNutrition && (
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
            {item.calories != null && (
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-primary" />
                {item.calories} cal
              </span>
            )}
            {item.protein_grams != null && (
              <span className="flex items-center gap-1.5">
                <BicepsFlexed className="h-3.5 w-3.5 text-primary" />
                {item.protein_grams}g protein
              </span>
            )}
          </div>
        )}

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