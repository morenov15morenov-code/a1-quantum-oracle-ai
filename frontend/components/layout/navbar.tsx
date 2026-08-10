"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Predict" },
  { href: "/history", label: "History" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="flex h-14 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold" aria-label="A1 Quantum Oracle AI home">
          <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-gradient-to-br from-cosmic-violet to-cosmic-cyan opacity-80" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-white/90 shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]" />
          </span>
          <span className="text-lg text-gradient-gold">A1 Quantum Oracle AI</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-4 text-sm md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === item.href ? "text-foreground font-medium" : "text-foreground/60"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="ml-auto mr-2 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.user.name ?? session.user.email}
              </span>
              {(session.user as { role?: string }).role === "ADMIN" && (
                <Link href="/admin/dashboard">
                  <Button variant="outline" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
                Sign Out
              </Button>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t bg-background px-4 py-2 md:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block py-2 text-sm transition-colors",
                pathname === item.href ? "text-foreground font-medium" : "text-foreground/60"
              )}
            >
              {item.label}
            </Link>
          ))}
          {session?.user && (
            <span className="block py-2 text-sm text-muted-foreground sm:hidden">
              {session.user.name ?? session.user.email}
            </span>
          )}
        </nav>
      )}
    </header>
  );
}
