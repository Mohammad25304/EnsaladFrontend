/* eslint-disable prettier/prettier */
import { useMutation, useQuery } from "@tanstack/react-query";

import {
  getCategories,
  getMenuItems,
  getSiteSettings,
  submitContactForm,
  type MenuItemFilters,
} from "@/lib/api";
import type { ContactFormPayload, SocialLink } from "@/lib/api-types";

export function useCategories(branchSlug: string | null | undefined) {
  return useQuery({
    queryKey: ["categories", branchSlug],
    queryFn: () => getCategories(branchSlug as string),
    enabled: !!branchSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes — categories rarely change
  });
}

export function useMenuItems(branchSlug: string | null | undefined, filters: MenuItemFilters = {}) {
  return useQuery({
    queryKey: ["menu-items", branchSlug, filters],
    queryFn: () => getMenuItems(branchSlug as string, filters),
    enabled: !!branchSlug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedItems(branchSlug: string | null | undefined) {
  return useMenuItems(branchSlug, { featured: true });
}

export function useSiteSettings(branchSlug: string | null | undefined) {
  return useQuery({
    queryKey: ["site-settings", branchSlug],
    queryFn: () => getSiteSettings(branchSlug as string),
    enabled: !!branchSlug,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * social_links comes back from the API as a raw JSON string (since every
 * site_settings value is stored as plain text) — this parses it into a
 * usable array, falling back to [] if it's missing or malformed.
 */
export function useSocialLinks(branchSlug: string | null | undefined): SocialLink[][] {
  const { data: settings } = useSiteSettings();

  if (!settings?.social_links) return [];

  try {
    const parsed = JSON.parse(settings.social_links);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useSubmitContactForm() {
  return useMutation({
    mutationFn: (payload: ContactFormPayload) => submitContactForm(payload),
  });
}