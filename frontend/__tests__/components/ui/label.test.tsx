import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Label } from "@/components/ui/label";

afterEach(() => {
  cleanup();
});

describe("Label", () => {
  it("renders with text", () => {
    render(<Label>Username</Label>);
    expect(screen.getByText("Username")).toBeDefined();
  });

  it("renders as label element", () => {
    render(<Label data-testid="label">Label</Label>);
    expect(screen.getByTestId("label").tagName).toBe("LABEL");
  });

  it("applies custom className", () => {
    render(<Label className="custom-class" data-testid="label">Label</Label>);
    const cls = screen.getByTestId("label").getAttribute("class") ?? "";
    expect(cls).toContain("custom-class");
  });

  it("has base styling classes", () => {
    render(<Label data-testid="label">Label</Label>);
    const cls = screen.getByTestId("label").getAttribute("class") ?? "";
    expect(cls).toContain("text-sm");
    expect(cls).toContain("font-medium");
  });

  it("associates with input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="email" data-testid="label">Email</Label>
        <input id="email" />
      </>
    );
    expect(screen.getByTestId("label").getAttribute("for")).toBe("email");
  });

  it("renders children", () => {
    render(
      <Label>
        <span data-testid="child">Child</span>
      </Label>
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });
});
