"use client";

import { useActionState } from "react";
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

async function requestResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = formData.get("email") as string;
  if (!email) {
    return { error: "Email is required" };
  }

  try {
    const res = await fetch("/api/auth/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.error ?? "Failed to request reset" };
    }

    return { success: true, message: data.message };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export function RequestResetForm() {
  const [state, formAction, pending] = useActionState(requestResetAction, {});

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Reset Password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert" aria-live="polite">
              {state.error}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-700">
              {state.message}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@example.com" required />
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Sending..." : "Send Reset Link"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
