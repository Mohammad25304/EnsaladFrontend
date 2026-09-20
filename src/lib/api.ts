/* eslint-disable prettier/prettier */
// import type {
//     ApiCategory,
//     ApiMenuItem,
//     ContactFormPayload,
//     SiteSettings,
// } from "@/lib/api-types";

// Set VITE_API_URL in your .env file, e.g. http://localhost:8000/api for local dev,
// or https://api.yourdomain.com/api once deployed.
// const API_URL = import.meta.env["VITE_API_URL"] ?? "https://ensaladabackend-production.up.railway.app/";
// const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000/api";

// class ApiError extends Error {
//     status: number;
//     constructor(message: string, status: number) {
//         super(message);
//         this.status = status;
//     }
// }

// async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
//     const response = await fetch(`${API_URL}${path}`, {
//         ...options,
//         headers: {
//             Accept: "application/json",
//             ...(options?.body ? { "Content-Type": "application/json" } : {}),
//             ...options?.headers,
//         },
//     });

//     if (!response.ok) {
//         const body = await response.json().catch(() => null);
//         throw new ApiError(body?.message ?? "Something went wrong", response.status);
//     }

//     return response.json();
// }

// export function getCategories(): Promise<ApiCategory[]> {
//     return apiFetch<ApiCategory[]>("/categories");
// }

// export interface MenuItemFilters {
//     category?: string; // category slug
//     tag?: string;
//     featured?: boolean;
// }

// export function getMenuItems(filters: MenuItemFilters = {}): Promise<ApiMenuItem[]> {
//     const params = new URLSearchParams();
//     if (filters.category) params.set("category", filters.category);
//     if (filters.tag) params.set("tag", filters.tag);
//     if (filters.featured) params.set("featured", "1");

//     const query = params.toString();
//     return apiFetch<ApiMenuItem[]>(`/menu-items${query ? `?${query}` : ""}`);
// }

// export function getSiteSettings(): Promise<SiteSettings> {
//     return apiFetch<SiteSettings>("/site-settings");
// }

// export function submitContactForm(payload: ContactFormPayload): Promise<{ message: string }> {
//     return apiFetch<{ message: string }>("/contact", {
//         method: "POST",
//         body: JSON.stringify(payload),
//     });
// }

// export { ApiError };

import type {
    ApiBranch,
    ApiCategory,
    ApiMenuItem,
    ContactFormPayload,
    SiteSettings,
} from "./api-types";

const API_URL = import.meta.env["VITE_API_URL"] ?? "http://localhost:8000/api";

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            Accept: "application/json",
            ...(options?.body ? { "Content-Type": "application/json" } : {}),
            ...options?.headers,
        },
    });

    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new ApiError(body?.message ?? "Something went wrong", response.status);
    }

    return response.json();
}

export function getBranches(): Promise<ApiBranch[]> {
    return apiFetch<ApiBranch[]>("/branches");
}

export function getCategories(branchSlug?: string): Promise<ApiCategory[]> {
    const query = branchSlug ? `?branch=${encodeURIComponent(branchSlug)}` : "";
    return apiFetch<ApiCategory[]>(`/categories${query}`);
}

export interface MenuItemFilters {
    category?: string; // category slug
    tag?: string;
    featured?: boolean;
}

export function getMenuItems(branchSlug: string, filters: MenuItemFilters = {}): Promise<ApiMenuItem[]> {
    const params = new URLSearchParams({ branch: branchSlug });
    if (filters.category) params.set("category", filters.category);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.featured) params.set("featured", "1");

    return apiFetch<ApiMenuItem[]>(`/menu-items?${params.toString()}`);
}

export function getSiteSettings(branchSlug: string): Promise<SiteSettings> {
    return apiFetch<SiteSettings>(`/site-settings?branch=${encodeURIComponent(branchSlug)}`);
}

export function submitContactForm(payload: ContactFormPayload): Promise<{ message: string }> {
    return apiFetch<{ message: string }>("/contact", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export { ApiError };