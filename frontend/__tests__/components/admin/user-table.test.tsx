import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { UserTable } from "@/components/admin/user-table";

afterEach(() => {
  cleanup();
});

const mockUseFetch = vi.fn();

vi.mock("@/lib/use-fetch", () => ({
  useFetch: (...args: unknown[]) => mockUseFetch(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockUsers = {
  users: [
    { id: "1", name: "Alice", email: "alice@test.com", role: "ADMIN", active: true, createdAt: "2026-01-15T12:00:00.000Z" },
    { id: "2", name: "Bob", email: "bob@test.com", role: "USER", active: true, createdAt: "2026-03-20T12:00:00.000Z" },
    { id: "3", name: "Charlie", email: "charlie@test.com", role: "USER", active: false, createdAt: "2026-06-10T12:00:00.000Z" },
  ],
};

describe("UserTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockUseFetch.mockReturnValue({ data: mockUsers, loading: false, error: null });
  });

  it("renders user count in title", () => {
    render(<UserTable />);
    expect(screen.getByText("Users (3)")).toBeDefined();
  });

  it("renders all user names", () => {
    render(<UserTable />);
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Charlie")).toBeDefined();
  });

  it("renders user emails", () => {
    render(<UserTable />);
    expect(screen.getByText("alice@test.com")).toBeDefined();
    expect(screen.getByText("bob@test.com")).toBeDefined();
    expect(screen.getByText("charlie@test.com")).toBeDefined();
  });

  it("renders column headers", () => {
    render(<UserTable />);
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
    expect(screen.getByText("Role")).toBeDefined();
    expect(screen.getByText("Status")).toBeDefined();
    expect(screen.getByText("Joined")).toBeDefined();
    expect(screen.getByText("Actions")).toBeDefined();
  });

  it("shows active status indicator", () => {
    render(<UserTable />);
    expect(screen.getAllByText("Active").length).toBe(2);
    expect(screen.getByText("Inactive")).toBeDefined();
  });

  it("shows role badges", () => {
    render(<UserTable />);
    expect(screen.getByText("ADMIN")).toBeDefined();
    expect(screen.getAllByText("USER")).toHaveLength(2);
  });

  it("shows deactivate/activate buttons", () => {
    render(<UserTable />);
    expect(screen.getAllByText("Deactivate").length).toBe(2);
    expect(screen.getByText("Activate")).toBeDefined();
  });

  it("renders loading skeleton", () => {
    mockUseFetch.mockReturnValue({ data: null, loading: true, error: null });
    render(<UserTable />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(5);
  });

  it("shows empty state when no users", () => {
    mockUseFetch.mockReturnValue({ data: { users: [] }, loading: false, error: null });
    render(<UserTable />);
    expect(screen.getByText("Users (0)")).toBeDefined();
  });

  it("renders formatted dates", () => {
    render(<UserTable />);
    expect(screen.getAllByText(/2026/).length).toBe(3);
  });
});
