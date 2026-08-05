import { NextResponse } from "next/server";

export const PROTOCOL7_BLOCKED_ACTIONS = [
  "disable_security",
  "remove_authentication",
  "delete_logs",
  "override_protocol7",
] as const;

export interface Protocol7Request {
  action: string;
  actor?: { id: string; role: string };
  target?: { id: string; role: string };
}

export interface AdminActionResult {
  success: boolean;
  reason?: string;
}

export class Protocol7 {
  private readonly blockedActions: ReadonlySet<string>;

  constructor(blockedActions: readonly string[] = PROTOCOL7_BLOCKED_ACTIONS) {
    this.blockedActions = new Set(blockedActions);
  }

  validate(request: Protocol7Request): boolean {
    if (!request?.action) return false;
    return !this.blockedActions.has(request.action);
  }

  denyReason(request: Protocol7Request): string | null {
    if (!request?.action) {
      return "Protocol 7 (System Stability Guard): an action must be specified";
    }
    if (this.blockedActions.has(request.action)) {
      return `Protocol 7 (System Stability Guard): action "${request.action}" is blocked as unsafe or destabilizing`;
    }
    return null;
  }

  assertAllowed(request: Protocol7Request): NextResponse | null {
    const reason = this.denyReason(request);
    if (!reason) return null;
    return NextResponse.json(
      { error: reason, code: "PROTOCOL7_BLOCKED" },
      { status: 403 }
    );
  }
}

export const protocol7 = new Protocol7();

export function adminAction(action: string): AdminActionResult {
  const allowed = protocol7.validate({ action });
  if (!allowed) {
    return { success: false, reason: "Protocol 7 restriction" };
  }
  return { success: true };
}

export const PROTOCOL7_RESPONSE_PATTERNS = [
  /\bdisable[_\s-]*security\b/i,
  /\bremove[_\s-]*authentication\b/i,
  /\bdelete[_\s-]*logs\b/i,
  /\boverrid[a-z]*[_\s-]*protocol[_\s-]*7\b/i,
] as const;

export function validateGeneratedResponse(response: {
  result?: string;
  reasoning?: string;
}): AdminActionResult {
  const text = `${response.result ?? ""} ${response.reasoning ?? ""}`;
  const blocked = PROTOCOL7_RESPONSE_PATTERNS.some((pattern) => pattern.test(text));
  if (blocked) {
    return { success: false, reason: "Protocol 7 restriction" };
  }
  return { success: true };
}
