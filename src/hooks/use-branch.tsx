/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useRouterState } from "@tanstack/react-router";

import { getBranches } from "@/lib/api";

const BRANCH_STORAGE_KEY = "ensalada:branch";

interface BranchContextValue {
    branchSlug: string | null;
    setBranchSlug: (slug: string | null) => void;
    /** True once we've checked localStorage on the client (SSR has no localStorage). */
    isHydrated: boolean;
}

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
    const [branchSlug, setBranchSlugState] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        try {
            setBranchSlugState(localStorage.getItem(BRANCH_STORAGE_KEY));
        } catch {
            /* storage unavailable */
        }
        setIsHydrated(true);
    }, []);

    const setBranchSlug = useCallback((slug: string | null) => {
        setBranchSlugState(slug);
        try {
            if (slug) {
                localStorage.setItem(BRANCH_STORAGE_KEY, slug);
            } else {
                localStorage.removeItem(BRANCH_STORAGE_KEY);
            }
        } catch {
            /* storage unavailable (private mode) — keep the in-memory choice */
        }
    }, []);

    // A branch saved in localStorage can later be deleted or deactivated. If
    // the saved slug is no longer in the public list, forget it so the pages
    // send the visitor back to the branch picker instead of failing silently.
    const { data: branches } = useQuery({
        queryKey: ["branches"],
        queryFn: getBranches,
        enabled: isHydrated && !!branchSlug,
    });

    useEffect(() => {
        if (branchSlug && branches && !branches.some((b) => b.slug === branchSlug)) {
            setBranchSlug(null);
        }
    }, [branchSlug, branches, setBranchSlug]);

    return (
        <BranchContext.Provider value={{ branchSlug, setBranchSlug, isHydrated }}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const ctx = useContext(BranchContext);
    if (!ctx) throw new Error("useBranch must be used within a BranchProvider");
    return ctx;
}

/**
 * Use on any page that needs a branch to render (menu, home). Redirects to
 * the branch picker if none is selected yet, and back again afterwards.
 */
export function useRequireBranch() {
    const { branchSlug, isHydrated } = useBranch();
    const navigate = useNavigate();
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    useEffect(() => {
        if (isHydrated && !branchSlug) {
            navigate({
                to: "/",
                search: { redirect: pathname },
            });
        }
    }, [isHydrated, branchSlug, pathname, navigate]);

    return { branchSlug, isReady: isHydrated && !!branchSlug };
}