import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { LoginForm } from "@/components/forms/login-form";

afterEach(() => {
  cleanup();
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("callbackUrl=/dashboard"),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form title", () => {
    render(<LoginForm />);
    expect(screen.getAllByText("Sign In").length).toBe(2);
  });

  it("renders email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
  });

  it("renders the sign in button", () => {
    render(<LoginForm />);
    const btn = screen.getByRole("button", { name: /sign in/i });
    expect(btn).toBeDefined();
    expect(btn.getAttribute("type")).toBe("submit");
  });

  it("renders the sign up link", () => {
    render(<LoginForm />);
    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/signup");
  });

  it("shows error state", async () => {
    const { signIn } = await import("next-auth/react");
    vi.mocked(signIn).mockResolvedValue({ error: "Invalid credentials" });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeDefined();
    });
  });

  it("shows generic error on network failure", async () => {
    const { signIn } = await import("next-auth/react");
    vi.mocked(signIn).mockRejectedValue(new Error("Network error"));
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeDefined();
    });
  });

  it("disables button while submitting", async () => {
    const { signIn } = await import("next-auth/react");
    vi.mocked(signIn).mockImplementation(() => new Promise(() => {}));
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      const button = screen.getByRole("button", { name: /signing in/i });
      expect(button).toBeDefined();
      expect((button as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("has required attribute on email field", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Email")).toBeRequired();
  });

  it("has required attribute on password field", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText("Password")).toBeRequired();
  });

  it("renders card description", () => {
    render(<LoginForm />);
    expect(
      screen.getByText("Enter your email and password to access your account")
    ).toBeDefined();
  });
});
