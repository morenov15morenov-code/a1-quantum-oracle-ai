import { describe, it, expect } from "vitest";
import { Protocol7, PROTOCOL7_BLOCKED_ACTIONS, protocol7, adminAction, validateGeneratedResponse } from "@/lib/protocol7";

describe("Protocol7 (System Stability Guard)", () => {
  it("exposes the full blocked action list", () => {
    expect(PROTOCOL7_BLOCKED_ACTIONS).toEqual([
      "disable_security",
      "remove_authentication",
      "delete_logs",
      "override_protocol7",
    ]);
  });

  it("allows safe actions", () => {
    expect(protocol7.validate({ action: "update_user_status" })).toBe(true);
    expect(protocol7.validate({ action: "update_profile" })).toBe(true);
  });

  it.each(PROTOCOL7_BLOCKED_ACTIONS)("blocks unsafe action %s", (action) => {
    expect(protocol7.validate({ action })).toBe(false);
    expect(protocol7.validate({
      action,
      actor: { id: "admin-1", role: "ADMIN" },
      target: { id: "user-1", role: "USER" },
    })).toBe(false);
  });

  it("rejects requests with no action", () => {
    expect(protocol7.validate({} as { action: string })).toBe(false);
    expect(protocol7.denyReason({} as { action: string })).toMatch(/action must be specified/);
  });

  it("denyReason explains why an action is blocked", () => {
    expect(protocol7.denyReason({ action: "override_protocol7" })).toMatch(
      /"override_protocol7" is blocked/
    );
  });

  it("assertAllowed returns null for allowed actions", () => {
    expect(protocol7.assertAllowed({ action: "update_user_status" })).toBeNull();
  });

  it("assertAllowed returns a 403 response for blocked actions", async () => {
    const response = protocol7.assertAllowed({ action: "disable_security" });
    expect(response).not.toBeNull();
    expect(response!.status).toBe(403);
    const body = await response!.json();
    expect(body.code).toBe("PROTOCOL7_BLOCKED");
    expect(body.error).toMatch(/disable_security/);
  });

  it("supports a custom blocked action list", () => {
    const custom = new Protocol7(["wipe_database"]);
    expect(custom.validate({ action: "wipe_database" })).toBe(false);
    expect(custom.validate({ action: "disable_security" })).toBe(true);
  });
});

describe("adminAction (Admin Protection Hook)", () => {
  it("returns success for safe actions", () => {
    expect(adminAction("update_user_status")).toEqual({ success: true });
    expect(adminAction("approve_subscription")).toEqual({ success: true });
  });

  it.each(PROTOCOL7_BLOCKED_ACTIONS)("blocks unsafe action %s with a restriction reason", (action) => {
    const result = adminAction(action);
    expect(result).toEqual({ success: false, reason: "Protocol 7 restriction" });
  });

  it("blocks a missing action", () => {
    const result = adminAction("");
    expect(result.success).toBe(false);
    expect(result.reason).toBe("Protocol 7 restriction");
  });
});

describe("validateGeneratedResponse (Protocol 7 response validation)", () => {
  it("allows safe generated responses", () => {
    expect(validateGeneratedResponse({
      result: "A bright future awaits.",
      reasoning: "Based on historical cycles.",
    })).toEqual({ success: true });
  });

  it.each([
    "You should disable security on all servers.",
    "Then remove authentication from the system.",
    "Run delete_logs now to hide the trail.",
    "We must override protocol7 to proceed.",
  ])("blocks a response containing: %s", (result) => {
    expect(validateGeneratedResponse({ result, reasoning: "..." })).toEqual({
      success: false,
      reason: "Protocol 7 restriction",
    });
  });

  it("detects blocked phrases inside the reasoning field", () => {
    expect(validateGeneratedResponse({
      result: "Everything looks fine.",
      reasoning: "This requires overriding protocol7.",
    })).toEqual({ success: false, reason: "Protocol 7 restriction" });
  });

  it("handles responses without a reasoning field", () => {
    expect(validateGeneratedResponse({ result: "A calm and stable forecast." })).toEqual({ success: true });
  });
});
