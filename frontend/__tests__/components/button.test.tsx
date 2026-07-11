import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Button } from "@/components/ui/button";

afterEach(() => {
  cleanup();
});

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("applies default variant classes", () => {
    render(<Button>Default</Button>);
    const cls = screen.getByText("Default").getAttribute("class") ?? "";
    expect(cls).toContain("bg-primary");
  });

  it("applies destructive variant classes", () => {
    render(<Button variant="destructive">Delete</Button>);
    const cls2 = screen.getByText("Delete").getAttribute("class") ?? "";
    expect(cls2).toContain("bg-destructive");
  });

  it("applies outline variant classes", () => {
    render(<Button variant="outline">Outline</Button>);
    const cls3 = screen.getByText("Outline").getAttribute("class") ?? "";
    expect(cls3).toContain("border-input");
  });

  it("applies size classes", () => {
    render(<Button size="lg">Large</Button>);
    const cls4 = screen.getByText("Large").getAttribute("class") ?? "";
    expect(cls4).toContain("h-11");
  });

  it("handles click events", () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    screen.getByText("Click").click();
    expect(clicked).toBe(true);
  });

  it("can be disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByText("Disabled") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
