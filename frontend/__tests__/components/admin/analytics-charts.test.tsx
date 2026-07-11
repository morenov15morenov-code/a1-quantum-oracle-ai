import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";

afterEach(() => {
  cleanup();
});

const mockUseFetch = vi.fn();

vi.mock("@/lib/use-fetch", () => ({
  useFetch: (...args: unknown[]) => mockUseFetch(...args),
}));

const mockAnalytics = {
  totalUsers: 42,
  totalPredictions: 156,
  activeUsers: 38,
  avgConfidence: 0.72,
  predictionsByDay: [
    { date: "2026-06-01", count: 5 },
    { date: "2026-06-02", count: 8 },
    { date: "2026-06-03", count: 3 },
  ],
  usersByDay: [
    { date: "2026-06-01", count: 2 },
    { date: "2026-06-02", count: 1 },
  ],
  topModels: [
    { model: "gpt-4o", count: 100 },
    { model: "mock", count: 56 },
  ],
  predictionsByUser: [
    { userId: "u1", userName: "Alice", count: 45 },
    { userId: "u2", userName: "Bob", count: 30 },
  ],
};

describe("AnalyticsCharts", () => {
  it("renders stat cards with data", () => {
    mockUseFetch.mockReturnValue({ data: mockAnalytics, loading: false });
    render(<AnalyticsCharts />);

    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("156")).toBeDefined();
    expect(screen.getByText("38")).toBeDefined();
    expect(screen.getByText("72%")).toBeDefined();
  });

  it("renders section titles", () => {
    mockUseFetch.mockReturnValue({ data: mockAnalytics, loading: false });
    render(<AnalyticsCharts />);

    expect(screen.getByText("Total Users")).toBeDefined();
    expect(screen.getByText("Total Predictions")).toBeDefined();
    expect(screen.getByText("Active Users")).toBeDefined();
    expect(screen.getByText("Avg Confidence")).toBeDefined();
    expect(screen.getByText("Predictions (Last 30 Days)")).toBeDefined();
    expect(screen.getByText("New Users (Last 30 Days)")).toBeDefined();
    expect(screen.getByText("Top Models")).toBeDefined();
    expect(screen.getByText("Top Users by Predictions")).toBeDefined();
  });

  it("renders top models", () => {
    mockUseFetch.mockReturnValue({ data: mockAnalytics, loading: false });
    render(<AnalyticsCharts />);

    expect(screen.getByText("gpt-4o")).toBeDefined();
    expect(screen.getByText("mock")).toBeDefined();
    expect(screen.getByText("100")).toBeDefined();
    expect(screen.getByText("56")).toBeDefined();
  });

  it("renders top users", () => {
    mockUseFetch.mockReturnValue({ data: mockAnalytics, loading: false });
    render(<AnalyticsCharts />);

    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("45")).toBeDefined();
    expect(screen.getByText("30")).toBeDefined();
  });

  it("renders loading skeleton", () => {
    mockUseFetch.mockReturnValue({ data: null, loading: true });
    render(<AnalyticsCharts />);
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("shows error state when no data", () => {
    mockUseFetch.mockReturnValue({ data: null, loading: false });
    render(<AnalyticsCharts />);
    expect(screen.getByText("Failed to load analytics")).toBeDefined();
  });

  it("shows empty state for chart sections", () => {
    const emptyAnalytics = {
      ...mockAnalytics,
      predictionsByDay: [],
      usersByDay: [],
      topModels: [],
      predictionsByUser: [],
    };
    mockUseFetch.mockReturnValue({ data: emptyAnalytics, loading: false });
    render(<AnalyticsCharts />);

    const noDataElements = screen.getAllByText("No data yet");
    expect(noDataElements.length).toBe(4);
  });
});
