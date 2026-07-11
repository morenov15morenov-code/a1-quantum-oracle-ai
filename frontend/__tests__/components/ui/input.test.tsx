import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Input } from "@/components/ui/input";

afterEach(() => {
  cleanup();
});

describe("Input", () => {
  it("renders with default props", () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId("input");
    expect(input.tagName).toBe("INPUT");
  });

  it("applies custom className", () => {
    render(<Input className="custom-class" data-testid="input" />);
    const cls = screen.getByTestId("input").getAttribute("class") ?? "";
    expect(cls).toContain("custom-class");
  });

  it("handles text input", () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "test value" } });
    expect(input.value).toBe("test value");
  });

  it("renders different types", () => {
    render(<Input type="email" data-testid="email-input" />);
    const input = screen.getByTestId("email-input");
    expect(input.getAttribute("type")).toBe("email");
  });

  it("handles password type", () => {
    render(<Input type="password" data-testid="pw-input" />);
    expect(screen.getByTestId("pw-input").getAttribute("type")).toBe("password");
  });

  it("forwards ref", () => {
    const ref = { current: null as HTMLInputElement | null };
    render(<Input ref={ref} data-testid="input" />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("can be disabled", () => {
    render(<Input disabled data-testid="input" />);
    const input = screen.getByTestId("input") as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it("fires onChange handler", () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} data-testid="input" />);
    fireEvent.change(screen.getByTestId("input"), { target: { value: "new" } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("renders placeholder", () => {
    render(<Input placeholder="Enter text" data-testid="input" />);
    expect(screen.getByTestId("input").getAttribute("placeholder")).toBe("Enter text");
  });

  it("sets aria attributes", () => {
    render(<Input aria-label="Search" data-testid="input" />);
    expect(screen.getByTestId("input").getAttribute("aria-label")).toBe("Search");
  });
});
