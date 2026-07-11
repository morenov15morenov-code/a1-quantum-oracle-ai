import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useFetch } from "@/lib/use-fetch";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useFetch", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in loading state", () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useFetch("/api/test"));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("sets data on successful fetch", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "success" }),
    });
    const { result } = renderHook(() => useFetch("/api/test"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ message: "success" });
    expect(result.current.error).toBeNull();
  });

  it("sets error on failed fetch", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });
    const { result } = renderHook(() => useFetch("/api/test"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Request failed");
  });

  it("sets error on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useFetch("/api/test"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Network error");
  });

  it("cancels request on unmount", async () => {
    let resolvePromise: (v: unknown) => void;
    const promise = new Promise((resolve) => { resolvePromise = resolve; });
    mockFetch.mockReturnValue(promise);

    const { result, unmount } = renderHook(() => useFetch("/api/test"));
    expect(result.current.loading).toBe(true);

    act(() => {
      unmount();
    });

    act(() => {
      resolvePromise!({ ok: true, json: () => Promise.resolve({}) });
    });

    await new Promise((r) => setTimeout(r, 50));
    expect(result.current.loading).toBe(true);
  });

  it("refetches when deps change", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 1 }),
    });
    const { result, rerender } = renderHook(
      ({ id }) => useFetch(`/api/test/${id}`, [id]),
      { initialProps: { id: "1" } }
    );
    await waitFor(() => expect(result.current.data).toEqual({ count: 1 }));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ count: 2 }),
    });
    rerender({ id: "2" });
    await waitFor(() => expect(result.current.data).toEqual({ count: 2 }));
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
