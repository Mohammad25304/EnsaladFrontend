/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

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
        setBranchSlugState(localStorage.getItem(BRANCH_STORAGE_KEY));
        setIsHydrated(true);
    }, []);

    function setBranchSlug(slug: string | null) {
        setBranchSlugState(slug);
        if (slug) {
            localStorage.setItem(BRANCH_STORAGE_KEY, slug);
        } else {
            localStorage.removeItem(BRANCH_STORAGE_KEY);
        }
    }

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