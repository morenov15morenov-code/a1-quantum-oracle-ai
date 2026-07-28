import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { PredictionFeedback } from "@/components/predictions/prediction-feedback";

vi.mock("@/lib/use-fetch", () => ({
  useFetch: vi.fn().mockReturnValue({ data: null, loading: false }),
}));

afterEach(() => {
  cleanup();
});

describe("PredictionFeedback", () => {
  it("renders rating buttons", () => {
    render(<PredictionFeedback predictionId="pred-1" />);
    expect(screen.getByText("Rate This Prediction")).toBeInTheDocument();
    expect(screen.getByLabelText("Rate 1 out of 5")).toBeInTheDocument();
    expect(screen.getByLabelText("Rate 5 out of 5")).toBeInTheDocument();
  });

  it("renders accuracy buttons", () => {
    render(<PredictionFeedback predictionId="pred-1" />);
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("renders domain selector", () => {
    render(<PredictionFeedback predictionId="pred-1" />);
    expect(screen.getByLabelText("Domain (optional)")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<PredictionFeedback predictionId="pred-1" />);
    expect(screen.getByText("Submit Feedback")).toBeInTheDocument();
  });

  it("disables submit when no rating selected", () => {
    render(<PredictionFeedback predictionId="pred-1" />);
    const submitBtn = screen.getByRole("button", { name: "Submit Feedback" });
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit after rating selected", () => {
    render(<PredictionFeedback predictionId="pred-1" />);
    const ratingButtons = screen.getAllByRole("button", { name: /Rate \d out of 5/ });
    fireEvent.click(ratingButtons[2]);
    const submitBtn = screen.getByRole("button", { name: "Submit Feedback" });
    expect(submitBtn).not.toBeDisabled();
  });

  it("shows saved state when existing feedback provided", () => {
    render(
      <PredictionFeedback
        predictionId="pred-1"
        existingFeedback={{
          id: "fb-1",
          rating: 4,
          wasAccurate: true,
          comment: null,
          domain: "Finance",
        }}
      />
    );
    expect(screen.getByText("Feedback saved. Thank you!")).toBeInTheDocument();
  });
});
