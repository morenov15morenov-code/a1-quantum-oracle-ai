import type { Metadata } from "next";
import { UserTable } from "@/components/admin/user-table";

export const metadata: Metadata = {
  title: "User Management",
};

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          View and manage all platform users.
        </p>
      </div>
      <UserTable />
    </div>
  );
}
