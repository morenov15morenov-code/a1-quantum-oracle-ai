import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { SettingsForm } from "@/components/forms/settings-form";

afterEach(() => {
  cleanup();
});

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { name: "Test User", email: "test@test.com", role: "USER" },
    },
    update: vi.fn(),
  }),
}));

describe("SettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders profile section", () => {
    render(<SettingsForm />);
    expect(screen.getByText("Profile")).toBeDefined();
    expect(screen.getByText("Update your name and email address.")).toBeDefined();
  });

  it("renders password section", () => {
    render(<SettingsForm />);
    const headings = screen.getAllByText("Change Password");
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Update your password to keep your account secure.")).toBeDefined();
  });

  it("pre-fills name and email from session", () => {
    render(<SettingsForm />);
    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;
    expect(nameInput.value).toBe("Test User");
    expect(emailInput.value).toBe("test@test.com");
  });

  it("renders save button for profile", () => {
    render(<SettingsForm />);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDefined();
  });

  it("renders change password button", () => {
    render(<SettingsForm />);
    expect(screen.getByRole("button", { name: /change password/i })).toBeDefined();
  });

  it("renders all password fields", () => {
    render(<SettingsForm />);
    expect(screen.getByLabelText("Current Password")).toBeDefined();
    expect(screen.getByLabelText("New Password")).toBeDefined();
    expect(screen.getByLabelText("Confirm New Password")).toBeDefined();
  });

  it("shows error on invalid profile input", async () => {
    render(<SettingsForm />);
    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "" } });
    const form = nameInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
  });

  it("shows error on mismatched passwords", async () => {
    render(<SettingsForm />);
    fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "oldpass123" } });
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "newpass123" } });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "different" } });
    const form = screen.getByLabelText("Current Password").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
  });

  it("submits profile update on valid input", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<SettingsForm />);
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/user/profile", expect.objectContaining({
        method: "PATCH",
      }));
    });

    vi.restoreAllMocks();
  });

  it("submits password change on valid input", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<SettingsForm />);
    fireEvent.change(screen.getByLabelText("Current Password"), { target: { value: "oldpass123" } });
    fireEvent.change(screen.getByLabelText("New Password"), { target: { value: "newpass123" } });
    fireEvent.change(screen.getByLabelText("Confirm New Password"), { target: { value: "newpass123" } });
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/user/profile", expect.objectContaining({
        method: "PUT",
      }));
    });

    vi.restoreAllMocks();
  });
});
