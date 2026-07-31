"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "loading" | "success" | "error";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const tokenValid = token.length === 64;

  const [status, setStatus] = useState<Status>(tokenValid ? "loading" : "error");
  const [message, setMessage] = useState(
    tokenValid ? "" : "This verification link is invalid or has expired."
  );
  const [resendEmail, setResendEmail] = useState("");
  const [resendMessage, setResendMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!tokenValid) {
      return;
    }
    const controller = new AbortController();
    async function verify() {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(data.message ?? "Email verified successfully");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    }
    verify();
    return () => controller.abort();
  }, [token, tokenValid]);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResending(true);
    setResendMessage("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendMessage(data.message ?? data.error ?? "");
    } catch {
      setResendMessage("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Verify Your Email</CardTitle>
        <CardDescription>
          {status === "success"
            ? "Your email has been verified."
            : status === "error"
              ? "We couldn't verify your email."
              : "Verifying your email address..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-foreground" aria-hidden="true" />
            Please wait...
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400" role="status">
              {message}
            </div>
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Sign In
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert">
              {message}
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your email to receive a new verification link.
            </p>
            <form onSubmit={handleResend} className="space-y-2">
              <Label htmlFor="resendEmail" className="sr-only">
                Email
              </Label>
              <Input
                id="resendEmail"
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              {resendMessage && (
                <p className="text-xs text-muted-foreground" role="status">
                  {resendMessage}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={resending}>
                {resending ? "Sending..." : "Resend Verification Email"}
              </Button>
            </form>
            <Link href="/login" className="block text-center text-sm text-primary underline-offset-4 hover:underline">
              Back to Sign In
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
