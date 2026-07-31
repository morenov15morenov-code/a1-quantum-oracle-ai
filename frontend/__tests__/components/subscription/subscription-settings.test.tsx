import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { SubscriptionSettings } from "@/components/subscription/subscription-settings";

const mockFetch = vi.fn();
global.fetch = mockFetch;

afterEach(() => {
  cleanup();
});

describe("SubscriptionSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { container } = render(<SubscriptionSettings />);
    const loadingElements = container.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("renders subscription tiers after load", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "sub-1", tier: "FREE", predsUsed: 2, predsLimit: 5, periodStart: new Date().toISOString(), periodEnd: null,
      }),
    });

    render(<SubscriptionSettings />);

    await waitFor(() => {
      expect(screen.getByText("Free")).toBeInTheDocument();
      expect(screen.getByText("Pro")).toBeInTheDocument();
    });
  });

  it("shows usage bar", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "sub-1", tier: "FREE", predsUsed: 3, predsLimit: 5, periodStart: new Date().toISOString(), periodEnd: null,
      }),
    });

    render(<SubscriptionSettings />);

    await waitFor(() => {
      expect(screen.getByText("3 / 5")).toBeInTheDocument();
    });
  });

  it("shows upgrade button for free users", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "sub-1", tier: "FREE", predsUsed: 0, predsLimit: 5, periodStart: new Date().toISOString(), periodEnd: null,
      }),
    });

    render(<SubscriptionSettings />);

    await waitFor(() => {
      expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
    });
  });

  it("shows current plan for pro users", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "sub-1", tier: "PRO", status: "ACTIVE", predsUsed: 10, predsLimit: 100, periodStart: new Date().toISOString(), periodEnd: null,
      }),
    });

    render(<SubscriptionSettings />);

    await waitFor(() => {
      const currentPlans = screen.getAllByText("Current plan");
      expect(currentPlans.length).toBeGreaterThan(0);
    });
  });

  it("shows pending approval notice for pending pro users", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "sub-1", tier: "PRO", status: "PENDING", predsUsed: 0, predsLimit: 5, periodStart: new Date().toISOString(), periodEnd: null,
      }),
    });

    render(<SubscriptionSettings />);

    await waitFor(() => {
      expect(screen.getAllByText(/pending approval/i).length).toBeGreaterThan(0);
      expect(screen.getByText("Cancel Request")).toBeInTheDocument();
    });
  });
});
