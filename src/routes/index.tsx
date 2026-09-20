/* eslint-disable prettier/prettier */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, MapPin, Salad } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";
import { getBranches } from "@/lib/api";
import { useBranch } from "@/hooks/use-branch";

export const Route = createFileRoute("/")({
    validateSearch: (search: Record<string, unknown>) => ({
        redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
    }),
    head: () => ({
        meta: [{ title: "Choose Your Branch — ENSALADA" }],
    }),
    component: BranchesPage,
});

function BranchesPage() {
    const navigate = useNavigate();
    const { redirect } = Route.useSearch();
    const { setBranchSlug } = useBranch();

    const { data: branches, isLoading, isError } = useQuery({
        queryKey: ["branches"],
        queryFn: getBranches,
    });

    function choose(slug: string) {
        setBranchSlug(slug);
        navigate({ to: redirect ?? "/home" });
    }

    // If there's only one branch at all, there's no real choice to make —
    // select it automatically and skip straight past this page, whether
    // someone landed here as the site's entry point or navigated back to
    // it directly (e.g. via the header's branch switcher).
    useEffect(() => {
        if (branches && branches.length === 1) {
            setBranchSlug(branches[0].slug);
            navigate({ to: redirect ?? "/home" });
        }
    }, [branches, redirect, navigate, setBranchSlug]);

    // While we're still checking how many branches exist, or about to
    // auto-redirect for the single-branch case, show nothing rather than
    // flashing a "choose your branch" screen with one card on it.
    if (isLoading || (branches && branches.length === 1)) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading…</p>
            </main>
        );
    }

    return (
        <main className="bg-leaf-pattern min-h-screen py-16 sm:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <SectionHeading
                    eyebrow="Welcome"
                    title="Choose Your Branch"
                    description="Menu and pricing vary by location — pick the one closest to you."
                />

                {isError && (
                    <p className="mt-12 text-center text-destructive">
                        Couldn't load branches. Please refresh and try again.
                    </p>
                )}

                {branches && branches.length === 0 && (
                    <p className="mt-12 text-center text-muted-foreground">
                        No branches are available right now.
                    </p>
                )}

                <div className="mt-12 grid gap-6 sm:grid-cols-2">
                    {branches?.map((branch) => (
                        <button
                            key={branch.id}
                            type="button"
                            onClick={() => choose(branch.slug)}
                            className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-3xl"
                        >
                            <Card className="h-full border-border bg-card transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-xl">
                                <CardContent className="p-8">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                                        <Salad className="h-7 w-7" />
                                    </div>

                                    <h3 className="mt-5 font-display text-2xl font-semibold text-foreground">
                                        {branch.name.en}
                                    </h3>

                                    {branch.address && (
                                        <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                            {branch.address}
                                        </p>
                                    )}

                                    <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                                        Select this branch
                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </span>
                                </CardContent>
                            </Card>
                        </button>
                    ))}
                </div>
            </div>
        </main>
    );
}