import { auth } from "@/lib/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return null;
  }
  const role = (session.user as { role: string })?.role;
  if (role !== "ADMIN") {
    return null;
  }
  return session;
}
