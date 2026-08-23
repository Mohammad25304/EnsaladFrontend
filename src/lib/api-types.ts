/* eslint-disable prettier/prettier */
export interface Localized {
  en: string;
  es: string;
}

export interface ApiTag {
  id: number;
  name: string;
}

export interface ApiCategory {
  id: number;
  name: Localized;
  slug: string;
  description: Localized | null;
  sort_order: number;
  is_active: boolean;
}

export interface ApiMenuItem {
  id: number;
  category_id: number;
  category?: ApiCategory;
  name: Localized;
  slug: string;
  description: Localized;
  price: string; // Laravel returns decimals as strings
  image: string;
  is_featured: boolean;
  is_available: boolean;
  sort_order: number;
  tags: ApiTag[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SiteSettings {
  [key: string]: string | null;
}

export interface ContactFormPayload {
  name: string;
  email: string;
  phone?: string;
  message: string;
}