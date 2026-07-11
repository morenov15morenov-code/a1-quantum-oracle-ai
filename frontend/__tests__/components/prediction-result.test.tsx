import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PredictionResultCard } from "@/components/predictions/prediction-result";

afterEach(() => {
  cleanup();
});

const mockPrediction = {
  id: "test-1",
  input: "What will the weather be tomorrow?",
  result: "Sunny with a chance of clouds.",
  confidence: 0.85,
  reasoning: "Based on current weather patterns.",
  model: "gpt-4o",
  createdAt: new Date("2026-07-08T12:00:00.000Z"),
};

describe("PredictionResultCard", () => {
  it("renders the question", () => {
    render(<PredictionResultCard prediction={mockPrediction} />);
    expect(screen.getByText("What will the weather be tomorrow?")).toBeDefined();
  });

  it("renders the prediction result", () => {
    render(<PredictionResultCard prediction={mockPrediction} />);
    expect(screen.getByText("Sunny with a chance of clouds.")).toBeDefined();
  });

  it("renders the reasoning", () => {
    render(<PredictionResultCard prediction={mockPrediction} />);
    expect(screen.getByText("Based on current weather patterns.")).toBeDefined();
  });

  it("renders the model name", () => {
    render(<PredictionResultCard prediction={mockPrediction} />);
    expect(screen.getByText("gpt-4o")).toBeDefined();
  });

  it("renders confidence percentage", () => {
    render(<PredictionResultCard prediction={mockPrediction} />);
    expect(screen.getByText("85%")).toBeDefined();
  });

  it("renders without reasoning", () => {
    const noReasoning = { ...mockPrediction, reasoning: null };
    render(<PredictionResultCard prediction={noReasoning} />);
    expect(screen.queryByText("Reasoning")).toBeNull();
  });

  it("renders with null confidence", () => {
    const noConfidence = { ...mockPrediction, confidence: null };
    render(<PredictionResultCard prediction={noConfidence} />);
    expect(screen.getByText("N/A")).toBeDefined();
  });
});
