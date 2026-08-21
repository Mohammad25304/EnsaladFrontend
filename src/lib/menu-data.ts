export type DietaryTag = "Vegan" | "Vegetarian" | "Gluten-Free" | "High-Protein";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryId;
  image: string;
  tags: DietaryTag[];
  featured?: boolean;
}

export type CategoryId = "signature" | "leafy" | "protein" | "warm" | "sides";

export interface MenuCategory {
  id: CategoryId;
  name: string;
  description: string;
}

export const categories: MenuCategory[] = [
  {
    id: "signature",
    name: "Signature Bowls",
    description: "Our most-loved creations, built to satisfy.",
  },
  {
    id: "leafy",
    name: "Leafy Greens",
    description: "Light, crisp, and endlessly refreshing.",
  },
  {
    id: "protein",
    name: "Protein Salads",
    description: "Fuel up with lean, clean power.",
  },
  {
    id: "warm",
    name: "Warm & Roasted",
    description: "Hearty bowls for when you need a little warmth.",
  },
  {
    id: "sides",
    name: "Sides & Drinks",
    description: "Perfect complements and refreshing sips.",
  },
];

export const menuItems: MenuItem[] = [
  {
    id: "ensalada-bowl",
    name: "Ensalada Bowl",
    description:
      "Mixed greens, creamy avocado, cherry tomatoes, radish coins, toasted seeds, and our bright citrus dressing.",
    price: 14,
    category: "signature",
    image: "/images/hero-salad.jpg",
    tags: ["Vegan", "Gluten-Free"],
    featured: true,
  },
  {
    id: "mediterranean-bowl",
    name: "Mediterranean Bowl",
    description:
      "Fluffy quinoa, roasted chickpeas, cucumber ribbons, kalamata olives, feta crumbles, and lemon-tahini drizzle.",
    price: 15,
    category: "signature",
    image: "/images/salad-signature.jpg",
    tags: ["Vegetarian"],
  },
  {
    id: "garden-classic",
    name: "Garden Classic",
    description:
      "Butter lettuce, peppery arugula, shaved cucumber, fresh herbs, and a delicate lemon vinaigrette.",
    price: 11,
    category: "leafy",
    image: "/images/salad-leafy.jpg",
    tags: ["Vegan", "Gluten-Free"],
  },
  {
    id: "citrus-flower",
    name: "Citrus & Flower Salad",
    description:
      "Mixed greens, seasonal citrus segments, edible flowers, and a champagne-citrus dressing.",
    price: 12,
    category: "leafy",
    image: "/images/salad-leafy.jpg",
    tags: ["Vegan", "Gluten-Free"],
    featured: true,
  },
  {
    id: "chicken-power",
    name: "Chicken Power Salad",
    description:
      "Grilled chicken breast, jammy egg, avocado, cherry tomatoes, mixed greens, and whole-grain mustard dressing.",
    price: 16,
    category: "protein",
    image: "/images/salad-protein.jpg",
    tags: ["Gluten-Free", "High-Protein"],
    featured: true,
  },
  {
    id: "salmon-nicoise",
    name: "Salmon Niçoise",
    description:
      "Seared salmon, tender green beans, olives, baby potatoes, soft herbs, and caper dressing.",
    price: 18,
    category: "protein",
    image: "/images/salad-protein.jpg",
    tags: ["Gluten-Free", "High-Protein"],
  },
  {
    id: "harvest-bowl",
    name: "Harvest Bowl",
    description:
      "Roasted butternut squash, brussels sprouts, farro, pomegranate jewels, and creamy tahini dressing.",
    price: 15,
    category: "warm",
    image: "/images/salad-warm.jpg",
    tags: ["Vegetarian"],
  },
  {
    id: "roasted-roots",
    name: "Roasted Roots & Greens",
    description:
      "Earthy beets, carrots, massaged kale, toasted walnuts, and a tangy balsamic glaze.",
    price: 14,
    category: "warm",
    image: "/images/salad-warm.jpg",
    tags: ["Vegan", "Gluten-Free"],
  },
  {
    id: "berry-goat-cheese",
    name: "Berry & Goat Cheese Side",
    description:
      "Baby spinach, fresh strawberries, crumbled goat cheese, candied walnuts, and poppy-seed dressing.",
    price: 9,
    category: "sides",
    image: "/images/salad-side.jpg",
    tags: ["Vegetarian", "Gluten-Free"],
  },
  {
    id: "green-juice",
    name: "Fresh-Pressed Green Juice",
    description: "Cucumber, celery, green apple, ginger, and kale. Cold-pressed daily.",
    price: 6,
    category: "sides",
    image: "/images/salad-side.jpg",
    tags: ["Vegan", "Gluten-Free"],
  },
  {
    id: "lemonade",
    name: "Homemade Lemonade",
    description: "Freshly squeezed lemons, a touch of agave, and sparkling water.",
    price: 4,
    category: "sides",
    image: "/images/salad-side.jpg",
    tags: ["Vegan", "Gluten-Free"],
  },
];

export const featuredItems = menuItems.filter((item) => item.featured);
