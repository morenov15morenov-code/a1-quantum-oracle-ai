"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DeleteAccountForm() {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (confirmText !== "DELETE") {
      setError('Type "DELETE" to confirm account deletion');
      return;
    }
    if (!password) {
      setError("Enter your password to continue");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete account");
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDelete} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="deletePassword">Password</Label>
            <Input
              id="deletePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deleteConfirm">Type DELETE to confirm</Label>
            <Input
              id="deleteConfirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              required
            />
          </div>

          <Button
            type="submit"
            variant="destructive"
            disabled={loading || confirmText !== "DELETE"}
          >
            {loading ? "Deleting..." : "Delete My Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
