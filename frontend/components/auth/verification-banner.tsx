"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function VerificationBanner() {
  const { data: session } = useSession();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  if (!session?.user?.email || session.user.emailVerified) {
    return null;
  }

  async function handleResend() {
    setSending(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      });
      const data = await res.json();
      setMessage(data.message ?? data.error ?? "");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-md bg-yellow-500/15 p-4 text-sm" role="status">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-yellow-800 dark:text-yellow-300">
            Your email is not yet verified
          </p>
          <p className="text-yellow-700/80 dark:text-yellow-400/80">
            Verify your email to unlock full account access.
          </p>
          {message && <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">{message}</p>}
        </div>
        <Button variant="outline" onClick={handleResend} disabled={sending} className="shrink-0">
          {sending ? "Sending..." : "Resend Verification Email"}
        </Button>
      </div>
    </div>
  );
}
