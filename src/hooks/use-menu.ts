/* eslint-disable prettier/prettier */
import { useMutation, useQuery } from "@tanstack/react-query";

import {
    getCategories,
    getMenuItems,
    getSiteSettings,
    submitContactForm,
    type MenuItemFilters,
} from "@/lib/api";
import type { ContactFormPayload } from "@/lib/api-types";

export function useCategories() {
    return useQuery({
        queryKey: ["categories"],
        queryFn: getCategories,
        staleTime: 5 * 60 * 1000, // 5 minutes — categories rarely change
    });
}

export function useMenuItems(filters: MenuItemFilters = {}) {
    return useQuery({
        queryKey: ["menu-items", filters],
        queryFn: () => getMenuItems(filters),
        staleTime: 5 * 60 * 1000,
    });
}

export function useFeaturedItems() {
    return useMenuItems({ featured: true });
}

export function useSiteSettings() {
    return useQuery({
        queryKey: ["site-settings"],
        queryFn: getSiteSettings,
        staleTime: 10 * 60 * 1000,
    });
}

export function useSubmitContactForm() {
    return useMutation({
        mutationFn: (payload: ContactFormPayload) => submitContactForm(payload),
    });
}
