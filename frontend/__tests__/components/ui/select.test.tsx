import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Select } from "@/components/ui/select";

afterEach(() => {
  cleanup();
});

const mockOptions = [
  { value: "opt1", label: "Option 1" },
  { value: "opt2", label: "Option 2" },
  { value: "opt3", label: "Option 3" },
];

describe("Select", () => {
  it("renders all options", () => {
    render(<Select options={mockOptions} />);
    expect(screen.getByText("Option 1")).toBeDefined();
    expect(screen.getByText("Option 2")).toBeDefined();
    expect(screen.getByText("Option 3")).toBeDefined();
  });

  it("renders as select element", () => {
    render(<Select options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId("select");
    expect(select.tagName).toBe("SELECT");
  });

  it("shows placeholder when provided", () => {
    render(<Select options={mockOptions} placeholder="Choose..." />);
    expect(screen.getByText("Choose...")).toBeDefined();
  });

  it("does not render placeholder when not provided", () => {
    render(<Select options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId("select") as HTMLSelectElement;
    expect(select.options[0].value).toBe("opt1");
  });

  it("fires onChange handler", () => {
    const handleChange = vi.fn();
    render(<Select options={mockOptions} onChange={handleChange} data-testid="select" />);
    fireEvent.change(screen.getByTestId("select"), { target: { value: "opt2" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("sets selected value", () => {
    render(<Select options={mockOptions} value="opt2" data-testid="select" onChange={() => {}} />);
    const select = screen.getByTestId("select") as HTMLSelectElement;
    expect(select.value).toBe("opt2");
  });

  it("can be disabled", () => {
    render(<Select options={mockOptions} disabled data-testid="select" />);
    const select = screen.getByTestId("select") as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it("applies custom className", () => {
    render(<Select options={mockOptions} className="custom-class" data-testid="select" />);
    const cls = screen.getByTestId("select").getAttribute("class") ?? "";
    expect(cls).toContain("custom-class");
  });

  it("handles empty options array", () => {
    render(<Select options={[]} data-testid="select" />);
    expect(screen.getByTestId("select").childElementCount).toBe(0);
  });

  it("sets correct option values", () => {
    render(<Select options={mockOptions} data-testid="select" />);
    const select = screen.getByTestId("select") as HTMLSelectElement;
    expect(select.options[0].value).toBe("opt1");
    expect(select.options[1].value).toBe("opt2");
    expect(select.options[2].value).toBe("opt3");
  });
});
