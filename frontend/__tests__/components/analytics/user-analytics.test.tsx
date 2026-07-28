import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { UserAnalyticsDashboard } from "@/components/analytics/user-analytics";

vi.mock("@/lib/use-fetch", () => ({
  useFetch: vi.fn(),
}));

import { useFetch } from "@/lib/use-fetch";
const mockUseFetch = vi.mocked(useFetch);

afterEach(() => {
  cleanup();
});

describe("UserAnalyticsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state", () => {
    mockUseFetch.mockReturnValue({ data: null, loading: true });
    const { container } = render(<UserAnalyticsDashboard />);
    const loadingElements = container.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("shows error message when data is null", () => {
    mockUseFetch.mockReturnValue({ data: null, loading: false });
    render(<UserAnalyticsDashboard />);
    expect(screen.getByText("Failed to load analytics")).toBeInTheDocument();
  });

  it("renders stats cards", () => {
    mockUseFetch.mockReturnValue({
      data: {
        totalPredictions: 25,
        totalFeedback: 18,
        avgRating: 4.2,
        accuracyRate: 0.78,
        predictionsByDomain: [],
        ratingsByMonth: [],
        recentPredictions: [],
      },
      loading: false,
    });
    render(<UserAnalyticsDashboard />);
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("4.2/5")).toBeInTheDocument();
    expect(screen.getByText("78%")).toBeInTheDocument();
  });

  it("renders domain breakdown", () => {
    mockUseFetch.mockReturnValue({
      data: {
        totalPredictions: 10,
        totalFeedback: 8,
        avgRating: 4.0,
        accuracyRate: 0.75,
        predictionsByDomain: [
          { domain: "Finance", count: 5 },
          { domain: "Health", count: 3 },
        ],
        ratingsByMonth: [],
        recentPredictions: [],
      },
      loading: false,
    });
    render(<UserAnalyticsDashboard />);
    expect(screen.getByText("Predictions by Domain")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
  });

  it("renders recent rated predictions", () => {
    mockUseFetch.mockReturnValue({
      data: {
        totalPredictions: 5,
        totalFeedback: 3,
        avgRating: 4.0,
        accuracyRate: 1.0,
        predictionsByDomain: [],
        ratingsByMonth: [],
        recentPredictions: [
          {
            id: "pred-1",
            input: "Will it rain tomorrow?",
            confidence: 0.8,
            rating: 5,
            wasAccurate: true,
            domain: "Weather",
            createdAt: new Date().toISOString(),
          },
        ],
      },
      loading: false,
    });
    render(<UserAnalyticsDashboard />);
    expect(screen.getByText("Recent Rated Predictions")).toBeInTheDocument();
    expect(screen.getByText("Will it rain tomorrow?")).toBeInTheDocument();
    expect(screen.getByText("Accurate")).toBeInTheDocument();
  });

  it("renders ratings over time chart", () => {
    mockUseFetch.mockReturnValue({
      data: {
        totalPredictions: 10,
        totalFeedback: 8,
        avgRating: 4.0,
        accuracyRate: 0.75,
        predictionsByDomain: [],
        ratingsByMonth: [
          { month: "2026-06", avgRating: 3.5, count: 4 },
          { month: "2026-07", avgRating: 4.5, count: 4 },
        ],
        recentPredictions: [],
      },
      loading: false,
    });
    render(<UserAnalyticsDashboard />);
    expect(screen.getByText("Ratings Over Time")).toBeInTheDocument();
  });
});
