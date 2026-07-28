import { describe, it, expect } from "vitest";
import { loginSchema, signupSchema, predictionSchema, updateProfileSchema, changePasswordSchema } from "@/lib/validations";

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "invalid", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = loginSchema.safeParse({ email: "test@example.com" });
    expect(result.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts valid input", () => {
    const result = signupSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = signupSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = signupSchema.safeParse({
      name: "A",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("predictionSchema", () => {
  it("accepts valid input", () => {
    const result = predictionSchema.safeParse({ input: "What will the weather be tomorrow?" });
    expect(result.success).toBe(true);
  });

  it("rejects short input", () => {
    const result = predictionSchema.safeParse({ input: "Hi" });
    expect(result.success).toBe(false);
  });

  it("rejects empty input", () => {
    const result = predictionSchema.safeParse({ input: "" });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts valid input", () => {
    const result = updateProfileSchema.safeParse({ name: "Test User", email: "test@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = updateProfileSchema.safeParse({ name: "Test User", email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = updateProfileSchema.safeParse({ name: "A", email: "test@example.com" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = updateProfileSchema.safeParse({ name: "Test User" });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts valid input", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass123",
      newPassword: "newpass123",
      confirmPassword: "newpass123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass123",
      newPassword: "newpass123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass123",
      newPassword: "123",
      confirmPassword: "123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "oldpass123",
    });
    expect(result.success).toBe(false);
  });
});
