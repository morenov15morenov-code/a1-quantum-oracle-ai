import { describe, it, expect, vi, afterEach, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { HiddenAdminTrigger } from "@/components/hidden-admin-trigger";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const mockUseSession = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

const originalLocation = window.location;
const mockLocation: { href: string } = { href: "http://localhost/" };

beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: mockLocation,
    writable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
    writable: true,
  });
});

function clickN(n: number) {
  const trigger = screen.getByTestId("secret-trigger");
  for (let i = 0; i < n; i += 1) {
    fireEvent.click(trigger);
  }
}

describe("HiddenAdminTrigger", () => {
  beforeEach(() => {
    mockLocation.href = "http://localhost/";
  });

  it("renders an invisible trigger element", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<HiddenAdminTrigger />);
    expect(screen.getByTestId("secret-trigger")).toBeDefined();
  });

  it("navigates admins to /admin/dashboard after 6 clicks", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Admin", role: "ADMIN" } },
    });
    render(<HiddenAdminTrigger />);
    clickN(6);
    expect(mockLocation.href).toBe("/admin/dashboard");
  });

  it("sends unauthenticated users to the login gate after 6 clicks", () => {
    mockUseSession.mockReturnValue({ data: null });
    render(<HiddenAdminTrigger />);
    clickN(6);
    expect(mockLocation.href).toBe(`/login?callbackUrl=${encodeURIComponent("/admin/dashboard")}`);
  });

  it("sends regular users to the same silent gate after 6 clicks", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "User", role: "USER" } },
    });
    render(<HiddenAdminTrigger />);
    clickN(6);
    expect(mockLocation.href).toBe(`/login?callbackUrl=${encodeURIComponent("/admin/dashboard")}`);
  });

  it("does nothing before 6 clicks", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Admin", role: "ADMIN" } },
    });
    render(<HiddenAdminTrigger />);
    clickN(5);
    expect(mockLocation.href).toBe("http://localhost/");
  });

  it("resets the counter after 3 seconds of idle clicks", () => {
    mockUseSession.mockReturnValue({
      data: { user: { name: "Admin", role: "ADMIN" } },
    });
    vi.useFakeTimers();
    render(<HiddenAdminTrigger />);
    clickN(5);
    vi.advanceTimersByTime(3000);
    clickN(5);
    expect(mockLocation.href).toBe("http://localhost/");
    clickN(1);
    expect(mockLocation.href).toBe("/admin/dashboard");
  });
});
