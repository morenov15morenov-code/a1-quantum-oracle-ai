"use client";

import { useRef } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const REQUIRED_CLICKS = 6;
const IDLE_RESET_MS = 3000;

interface HiddenAdminTriggerProps {
  className?: string;
}

export function HiddenAdminTrigger({ className }: HiddenAdminTriggerProps) {
  const { data: session } = useSession();
  const clickCount = useRef(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretClick = () => {
    clickCount.current += 1;

    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
    }
    resetTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, IDLE_RESET_MS);

    if (clickCount.current >= REQUIRED_CLICKS) {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current);
        resetTimer.current = null;
      }
      clickCount.current = 0;
      const role = (session?.user as { role?: string } | undefined)?.role;
      window.location.href =
        role === "ADMIN"
          ? "/admin/dashboard"
          : `/login?callbackUrl=${encodeURIComponent("/admin/dashboard")}`;
    }
  };

  return (
    <div
      aria-hidden
      data-testid="secret-trigger"
      onClick={handleSecretClick}
      className={cn("cursor-default select-none", className)}
    />
  );
}
