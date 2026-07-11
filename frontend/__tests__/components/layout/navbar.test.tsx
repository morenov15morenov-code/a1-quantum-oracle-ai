import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Navbar } from "@/components/layout/navbar";

afterEach(() => {
  cleanup();
});

const mockUseSession = vi.fn();
const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: vi.fn(),
}));

describe("Navbar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("renders the app name", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<Navbar />);
    expect(screen.getByText("Atlas Oracle")).toBeDefined();
  });

  it("renders navigation links", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<Navbar />);
    expect(screen.getByText("Predict")).toBeDefined();
    expect(screen.getByText("History")).toBeDefined();
  });

  it("links to correct paths", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<Navbar />);
    expect(screen.getByText("Predict").closest("a")?.getAttribute("href")).toBe("/dashboard");
    expect(screen.getByText("History").closest("a")?.getAttribute("href")).toBe("/history");
  });

  it("shows user name when signed in", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "John Doe", email: "john@test.com" } },
    });
    render(<Navbar />);
    expect(screen.getByText("John Doe")).toBeDefined();
  });

  it("shows user email when name not available", () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: "john@test.com" } },
    });
    render(<Navbar />);
    expect(screen.getByText("john@test.com")).toBeDefined();
  });

  it("shows sign out button when signed in", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "John" } },
    });
    render(<Navbar />);
    expect(screen.getByText("Sign Out")).toBeDefined();
  });

  it("shows admin button for admin users", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Admin", role: "ADMIN" } },
    });
    render(<Navbar />);
    expect(screen.getAllByText("Admin").length).toBe(2);
  });

  it("hides admin button for regular users", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "User", role: "USER" } },
    });
    render(<Navbar />);
    expect(screen.queryByText("Admin")).toBeNull();
  });

  it("hides user info when not signed in", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<Navbar />);
    expect(screen.queryByText("Sign Out")).toBeNull();
  });

  it("highlights active nav link", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<Navbar />);
    const predictLink = screen.getByText("Predict").closest("a");
    expect(predictLink?.className).toContain("font-medium");
  });

  it("does not highlight inactive nav link", () => {
    mockUsePathname.mockReturnValue("/history");
    mockUseSession.mockReturnValue({ data: null });
    render(<Navbar />);
    const predictLink = screen.getByText("Predict").closest("a");
    expect(predictLink?.className).not.toContain("font-medium");
  });
});
