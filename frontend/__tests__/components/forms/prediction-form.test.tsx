import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { PredictionForm } from "@/components/forms/prediction-form";

afterEach(() => {
  cleanup();
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("PredictionForm", () => {
  const onPredictionCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders the form title", () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    expect(screen.getByText("Consult the Oracle")).toBeDefined();
  });

  it("renders question textarea", () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const textareas = document.querySelectorAll("textarea");
    expect(textareas.length).toBe(2);
  });

  it("renders domain dropdown", () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const select = document.getElementById("domain-category");
    expect(select).toBeDefined();
  });

  it("renders submit button", () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const btn = screen.getByRole("button", { name: /get prediction/i });
    expect(btn).toBeDefined();
  });

  it("shows character count on question", () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    expect(screen.getByText("0/2000")).toBeDefined();
  });

  it("updates character count as user types in question", () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const textarea = document.getElementById("prediction-input")!;
    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(screen.getByText("5/2000")).toBeDefined();
  });

  it("disables button with empty input", () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const btn = screen.getByRole("button", { name: /get prediction/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("enables button with valid input", () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const textarea = document.getElementById("prediction-input")!;
    fireEvent.change(textarea, { target: { value: "What will the stock market do next quarter?" } });
    const btn = screen.getByRole("button", { name: /get prediction/i });
    expect((btn as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows validation error for short input", async () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const textarea = document.getElementById("prediction-input")!;
    fireEvent.change(textarea, { target: { value: "Short" } });
    fireEvent.click(screen.getByRole("button", { name: /get prediction/i }));

    await waitFor(() => {
      expect(screen.getByText("Question must be at least 10 characters")).toBeDefined();
    });
  });

  it("shows error on API failure", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Failed to generate prediction" }),
    });

    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const textarea = document.getElementById("prediction-input")!;
    fireEvent.change(textarea, { target: { value: "What will the stock market do next quarter?" } });
    fireEvent.click(screen.getByRole("button", { name: /get prediction/i }));

    await waitFor(() => {
      expect(screen.getByText("Failed to generate prediction")).toBeDefined();
    });
  });

  it("clears input and calls callback on success", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "pred-1" }),
    });

    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const textarea = document.getElementById("prediction-input")!;
    fireEvent.change(textarea, { target: { value: "What will the stock market do next quarter?" } });
    fireEvent.click(screen.getByRole("button", { name: /get prediction/i }));

    await waitFor(() => {
      expect(onPredictionCreated).toHaveBeenCalledTimes(1);
    });
  });

  it("shows loading state while generating", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const textarea = document.getElementById("prediction-input")!;
    fireEvent.change(textarea, { target: { value: "What will the stock market do next quarter?" } });
    fireEvent.click(screen.getByRole("button", { name: /get prediction/i }));

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /consulting the oracle/i });
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("disables textareas while loading", async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    const textarea = document.getElementById("prediction-input")!;
    fireEvent.change(textarea, { target: { value: "What will the stock market do next quarter?" } });
    fireEvent.click(screen.getByRole("button", { name: /get prediction/i }));

    await waitFor(() => {
      expect((document.getElementById("prediction-input") as HTMLTextAreaElement).disabled).toBe(true);
      expect((document.getElementById("prediction-context") as HTMLTextAreaElement).disabled).toBe(true);
    });
  });

  it("renders card description about context", () => {
    render(<PredictionForm onPredictionCreated={onPredictionCreated} />);
    expect(
      screen.getByText(/Provide as much context as possible/)
    ).toBeDefined();
  });
});
