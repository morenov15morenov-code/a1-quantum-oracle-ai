import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

afterEach(() => {
  cleanup();
});

describe("Card", () => {
  it("renders children", () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText("Card content")).toBeDefined();
  });

  it("applies custom className", () => {
    render(<Card className="custom-class" data-testid="card">Test</Card>);
    const card = screen.getByTestId("card");
    expect(card.getAttribute("class")).toContain("custom-class");
  });

  it("has base card styles", () => {
    render(<Card data-testid="card">Test</Card>);
    const cardClass = screen.getByTestId("card").getAttribute("class") ?? "";
    expect(cardClass).toContain("border");
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader><h3>Header</h3></CardHeader>);
    expect(screen.getByText("Header")).toBeDefined();
  });
});

describe("CardTitle", () => {
  it("renders text", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByText("Title")).toBeDefined();
  });
});

describe("CardDescription", () => {
  it("renders description text", () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText("Description text")).toBeDefined();
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Content here</CardContent>);
    expect(screen.getByText("Content here")).toBeDefined();
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toBeDefined();
  });
});

describe("Card composition", () => {
  it("renders a full card with all subcomponents", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Main content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(screen.getByText("Card Title")).toBeDefined();
    expect(screen.getByText("Card description")).toBeDefined();
    expect(screen.getByText("Main content")).toBeDefined();
    expect(screen.getByText("Footer")).toBeDefined();
  });
});
