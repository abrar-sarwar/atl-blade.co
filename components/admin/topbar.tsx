"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, LogOut } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type TopbarProps = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
};

export function Topbar({ email, fullName, avatarUrl }: TopbarProps) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((i) =>
    i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href),
  );
  const initials = (fullName ?? email ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        {/* Mobile nav */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-sm uppercase tracking-[0.2em] text-primary">
                ATL Blade Co.
              </SheetTitle>
            </SheetHeader>
            <nav className="space-y-1 p-3">
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/60",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold">{current?.label ?? "Admin"}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">
            {fullName ?? "Admin"}
          </p>
          <p className="text-xs text-muted-foreground leading-tight">{email}</p>
        </div>
        <Avatar className="size-8">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName ?? email} /> : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <form action="/auth/signout" method="post">
          <Button variant="ghost" size="icon" type="submit" title="Sign out">
            <LogOut className="size-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
