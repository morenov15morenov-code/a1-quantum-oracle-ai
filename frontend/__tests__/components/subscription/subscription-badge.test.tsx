import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { SubscriptionBadge } from "@/components/subscription/subscription-badge";

vi.mock("@/lib/use-fetch", () => ({
  useFetch: vi.fn(),
}));

import { useFetch } from "@/lib/use-fetch";
const mockUseFetch = vi.mocked(useFetch);

afterEach(() => {
  cleanup();
});

describe("SubscriptionBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when no data", () => {
    mockUseFetch.mockReturnValue({ data: null, loading: false });
    const { container } = render(<SubscriptionBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("renders free tier badge", () => {
    mockUseFetch.mockReturnValue({
      data: { id: "sub-1", tier: "FREE", predsUsed: 3, predsLimit: 5, periodStart: new Date(), periodEnd: null },
      loading: false,
    });
    render(<SubscriptionBadge />);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("3/5 predictions")).toBeInTheDocument();
  });

  it("renders pro tier badge", () => {
    mockUseFetch.mockReturnValue({
      data: { id: "sub-1", tier: "PRO", predsUsed: 20, predsLimit: 100, periodStart: new Date(), periodEnd: null },
      loading: false,
    });
    render(<SubscriptionBadge />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("20/100 predictions")).toBeInTheDocument();
  });

  it("shows warning when almost full", () => {
    mockUseFetch.mockReturnValue({
      data: { id: "sub-1", tier: "FREE", predsUsed: 4, predsLimit: 5, periodStart: new Date(), periodEnd: null },
      loading: false,
    });
    render(<SubscriptionBadge />);
    expect(screen.getByText("Almost full")).toBeInTheDocument();
  });

  it("renders unlimited badge for admins", () => {
    mockUseFetch.mockReturnValue({
      data: { id: "sub-1", tier: "PRO", predsUsed: 0, predsLimit: 0, periodStart: new Date(), periodEnd: null, unlimited: true },
      loading: false,
    });
    render(<SubscriptionBadge />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Unlimited predictions")).toBeInTheDocument();
  });
});
