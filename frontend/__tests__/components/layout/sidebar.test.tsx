import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

afterEach(() => {
  cleanup();
});

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/admin/dashboard");
  });

  it("renders admin panel heading", () => {
    render(<Sidebar />);
    expect(screen.getByText("Admin Panel")).toBeDefined();
  });

  it("renders all navigation items", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Projection")).toBeDefined();
    expect(screen.getByText("Users")).toBeDefined();
    expect(screen.getByText("Predictions")).toBeDefined();
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("links to correct admin paths", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard").closest("a")?.getAttribute("href")).toBe("/admin/dashboard");
    expect(screen.getByText("Projection").closest("a")?.getAttribute("href")).toBe("/admin/projection");
    expect(screen.getByText("Users").closest("a")?.getAttribute("href")).toBe("/admin/users");
    expect(screen.getByText("Predictions").closest("a")?.getAttribute("href")).toBe("/admin/predictions");
    expect(screen.getByText("Settings").closest("a")?.getAttribute("href")).toBe("/admin/settings");
  });

  it("highlights active sidebar item", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).toContain("bg-primary");
  });

  it("does not highlight inactive items", () => {
    render(<Sidebar />);
    const usersLink = screen.getByText("Users").closest("a");
    expect(usersLink?.className).toContain("text-muted-foreground");
  });

  it("renders back to app button", () => {
    render(<Sidebar />);
    const backBtn = screen.getByText("Back to App");
    expect(backBtn).toBeDefined();
    expect(backBtn.closest("a")?.getAttribute("href")).toBe("/dashboard");
  });

  it("renders sign out button", () => {
    render(<Sidebar />);
    expect(screen.getByText("Sign Out")).toBeDefined();
  });

  it("renders SVG icons for each nav item", () => {
    render(<Sidebar />);
    const navLinks = screen.getByRole("navigation", { name: "Admin navigation" });
    const svgs = navLinks.querySelectorAll("svg");
    expect(svgs.length).toBe(4);
  });
});
