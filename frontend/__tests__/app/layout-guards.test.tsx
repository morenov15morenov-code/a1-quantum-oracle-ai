import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

const redirectMock = vi.fn((path: string) => {
  throw new Error(`NEXT_REDIRECT:${path}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/components/layout/navbar", () => ({
  Navbar: () => null,
}));

vi.mock("@/components/layout/sidebar", () => ({
  Sidebar: () => null,
}));

const mockAuth = vi.mocked(await import("@/lib/auth")).auth;

describe("User layout auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children for authenticated users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "USER" } });
    const { default: UserLayout } = await import("@/app/(user)/layout");
    const result = await UserLayout({ children: <div>dashboard</div> });
    expect(result).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to /login", async () => {
    mockAuth.mockResolvedValue(null);
    const { default: UserLayout } = await import("@/app/(user)/layout");
    await expect(UserLayout({ children: <div /> })).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});

describe("Admin layout auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children for admin users", async () => {
    mockAuth.mockResolvedValue({ user: { id: "a1", role: "ADMIN" } });
    const { default: AdminLayout } = await import("@/app/admin/layout");
    const result = await AdminLayout({ children: <div>admin</div> });
    expect(result).toBeDefined();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users to /login", async () => {
    mockAuth.mockResolvedValue(null);
    const { default: AdminLayout } = await import("@/app/admin/layout");
    await expect(AdminLayout({ children: <div /> })).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("redirects non-admin users to /dashboard", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "USER" } });
    const { default: AdminLayout } = await import("@/app/admin/layout");
    await expect(AdminLayout({ children: <div /> })).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });
});
