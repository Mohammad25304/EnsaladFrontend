/* eslint-disable prettier/prettier */
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Salad, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getBranches } from "@/lib/api";
import { useBranch } from "@/hooks/use-branch";

const navLinks = [
  { to: "/home", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/contact", label: "Contact" },
];

function useCurrentBranch() {
  const { branchSlug } = useBranch();
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: getBranches,
    enabled: !!branchSlug,
  });

  return {
    branchSlug,
    current: branches?.find((b) => b.slug === branchSlug),
  };
}

function BranchSwitcher() {
  const { branchSlug, current } = useCurrentBranch();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!branchSlug) return null;

  return (
    <Link
      to="/"
      search={{ redirect: pathname }}
      className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:flex"
    >
      <MapPin className="h-4 w-4" />
      {current?.name.en ?? "Switch branch"}
    </Link>
  );
}

function MobileBranchSwitcher() {
  const { branchSlug, current } = useCurrentBranch();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!branchSlug) return null;

  return (
    <SheetClose asChild>
      <Link
        to="/"
        search={{ redirect: pathname }}
        className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MapPin className="h-4 w-4" />
        </span>
        <span className="flex flex-col">
          <span className="text-xs font-normal text-muted-foreground">Ordering from</span>
          {current?.name.en ?? "Switch branch"}
        </span>
      </Link>
    </SheetClose>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/home" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Salad className="h-5 w-5" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            ENSALADA
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "relative rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
          <Button asChild size="sm" className="ml-2">
            <Link to="/menu">Order Now</Link>
          </Button>
          <BranchSwitcher />
        </nav>

        {/* Mobile nav */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between">
                <span className="font-display text-xl font-semibold text-foreground">ENSALADA</span>
              </div>
              <div className="mt-6">
                <MobileBranchSwitcher />
              </div>
              <nav className="mt-6 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <SheetClose key={link.to} asChild>
                    <Link
                      to={link.to}
                      className={cn(
                        "rounded-lg px-4 py-3 text-base font-medium transition-colors",
                        pathname === link.to
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto pb-4">
                <Button asChild className="w-full">
                  <Link to="/menu">Order Now</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}