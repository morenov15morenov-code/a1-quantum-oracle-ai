"use client";

import { useState } from "react";
import { useFetch } from "@/lib/use-fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { UserProfile } from "@/types";

export function UserTable() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data, loading } = useFetch<{ users: UserProfile[] }>("/api/admin/users", [refreshKey]);

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, active: !currentStatus }),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
      }
    } catch {
      console.error("Failed to update user");
    }
  }

  async function toggleUserRole(user: UserProfile) {
    const targetRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const ok = window.confirm(
      targetRole === "ADMIN"
        ? `Grant ADMIN (unlimited predictions) to ${user.email}?`
        : `Revoke ADMIN from ${user.email}?`
    );
    if (!ok) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, role: targetRole }),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
      } else {
        const body = await res.json();
        alert(body.error ?? "Failed to update role");
      }
    } catch {
      console.error("Failed to update role");
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const users = data?.users ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Users management table">
            <caption className="sr-only">List of all platform users</caption>
            <thead>
              <tr className="border-b text-left">
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Name</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Email</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Role</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Status</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Joined</th>
                <th scope="col" className="pb-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="py-3">{user.name}</td>
                  <td className="py-3 text-muted-foreground">{user.email}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`inline-block h-2 w-2 rounded-full ${user.active ? "bg-green-500" : "bg-red-500"}`} aria-hidden="true" />
                    <span className="ml-1.5 text-xs">{user.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`${user.active ? "Deactivate" : "Activate"} ${user.name}`}
                        onClick={() => toggleUserStatus(user.id, user.active)}
                      >
                        {user.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant={user.role === "ADMIN" ? "outline" : "default"}
                        size="sm"
                        aria-label={`${user.role === "ADMIN" ? "Revoke admin from" : "Make admin"} ${user.name}`}
                        onClick={() => toggleUserRole(user)}
                      >
                        {user.role === "ADMIN" ? "Revoke Admin" : "Make Admin"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
