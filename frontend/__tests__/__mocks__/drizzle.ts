import { vi } from "vitest";

export function createChain(finalResult: unknown = undefined) {
  const chain: Record<string, (...args: unknown[]) => unknown> = {};

  const setTerminal = (val: unknown) => {
    chain.get = vi.fn().mockResolvedValue(val);
    chain.all = vi.fn().mockResolvedValue(
      Array.isArray(val) ? val : val !== undefined ? [val] : []
    );
    chain.run = vi.fn().mockResolvedValue(undefined);
    chain.then = (resolve: (val: unknown) => unknown) => resolve(val);
    return chain;
  };

  chain.from = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.where = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.orderBy = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.limit = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.offset = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.groupBy = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.innerJoin = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.leftJoin = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.values = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.set = vi.fn((...args: unknown[]) => setTerminal(finalResult));
  chain.returning = vi.fn((...args: unknown[]) => setTerminal(finalResult));

  setTerminal(finalResult);
  return chain;
}

export function createDbMock() {
  return {
    select: vi.fn(() => createChain(undefined)),
    insert: vi.fn(() => createChain(undefined)),
    update: vi.fn(() => createChain(undefined)),
    delete: vi.fn(() => createChain(undefined)),
    all: vi.fn().mockResolvedValue([]),
    run: vi.fn().mockResolvedValue(undefined),
  };
}

export type DbMock = ReturnType<typeof createDbMock>;
