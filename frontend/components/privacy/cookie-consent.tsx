"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  return (
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg">
      <div className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          We use essential cookies for authentication and security. No tracking cookies are used.{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Learn more
          </Link>
        </p>
        <button
          onClick={accept}
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
