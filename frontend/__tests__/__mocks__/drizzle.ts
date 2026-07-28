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

  chain.from = vi.fn(() => setTerminal(finalResult));
  chain.where = vi.fn(() => setTerminal(finalResult));
  chain.orderBy = vi.fn(() => setTerminal(finalResult));
  chain.limit = vi.fn(() => setTerminal(finalResult));
  chain.offset = vi.fn(() => setTerminal(finalResult));
  chain.groupBy = vi.fn(() => setTerminal(finalResult));
  chain.innerJoin = vi.fn(() => setTerminal(finalResult));
  chain.leftJoin = vi.fn(() => setTerminal(finalResult));
  chain.values = vi.fn(() => setTerminal(finalResult));
  chain.set = vi.fn(() => setTerminal(finalResult));
  chain.returning = vi.fn(() => setTerminal(finalResult));

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
