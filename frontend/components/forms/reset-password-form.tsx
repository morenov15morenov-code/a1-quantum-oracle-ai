"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormState {
  error?: string;
  success?: boolean;
  message?: string;
}

async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match" };
  }

  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: formData.get("token") as string, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Failed to reset password" };
    }

    return { success: true, message: data.message };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, formAction, pending] = useActionState(resetPasswordAction, {});

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Invalid Link</CardTitle>
          <CardDescription>This password reset link is invalid or missing a token.</CardDescription>
        </CardHeader>
          <CardContent>
          <Link href="/request-reset" className="text-primary underline-offset-4 hover:underline">
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Set New Password</CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          {state?.error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert" aria-live="polite">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700">
              {state.message}{" "}
              <Link href="/login" className="underline">Sign in</Link>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
