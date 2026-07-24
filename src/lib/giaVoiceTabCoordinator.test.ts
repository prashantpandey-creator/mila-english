import assert from "node:assert/strict";
import test from "node:test";
import { createGiaVoiceTabCoordinator } from "./giaVoiceTabCoordinator";

type Listener = (event: MessageEvent<any>) => void;

function createHarness() {
  const values = new Map<string, string>();
  const storageListeners = new Set<(event: StorageEvent) => void>();
  const channelListeners = new Set<Listener>();
  let now = 1_000;
  let id = 0;

  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
      for (const listener of storageListeners) listener({ key } as StorageEvent);
    },
    removeItem: (key: string) => {
      values.delete(key);
      for (const listener of storageListeners) listener({ key } as StorageEvent);
    },
  };

  const makeRuntime = () => ({
    storage,
    events: {
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        storageListeners.add(listener as (event: StorageEvent) => void);
      },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        storageListeners.delete(listener as (event: StorageEvent) => void);
      },
    },
    channel: {
      addEventListener: (_type: "message", listener: Listener) => channelListeners.add(listener),
      removeEventListener: (_type: "message", listener: Listener) => channelListeners.delete(listener),
      postMessage: (data: any) => {
        for (const listener of channelListeners) listener({ data } as MessageEvent);
      },
      close: () => {},
    },
    now: () => now,
    createId: () => `tab-${++id}`,
    setInterval: (() => 1) as unknown as typeof globalThis.setInterval,
    clearInterval: (() => {}) as typeof globalThis.clearInterval,
    wait: async () => {},
  });

  return {
    makeRuntime,
    advance: (milliseconds: number) => { now += milliseconds; },
  };
}

test("only one Gia tab can own live voice at a time", async () => {
  const harness = createHarness();
  let secondSeesOtherOwner = false;
  const first = createGiaVoiceTabCoordinator({ runtime: harness.makeRuntime() });
  const second = createGiaVoiceTabCoordinator({
    runtime: harness.makeRuntime(),
    onOtherOwnerChange: (active) => { secondSeesOtherOwner = active; },
  });

  assert.equal(await first.claim(), true);
  second.refresh();
  assert.equal(secondSeesOtherOwner, true);
  assert.equal(await second.claim(), false);
  assert.equal(first.isOwner(), true);
  assert.equal(second.isOwner(), false);

  first.release();
  assert.equal(await second.claim(), true);
  assert.equal(second.isOwner(), true);

  first.destroy();
  second.destroy();
});

test("a stale tab lease expires and no longer blocks voice", async () => {
  const harness = createHarness();
  const first = createGiaVoiceTabCoordinator({
    runtime: harness.makeRuntime(),
    leaseMs: 100,
  });
  const second = createGiaVoiceTabCoordinator({
    runtime: harness.makeRuntime(),
    leaseMs: 100,
  });

  assert.equal(await first.claim(), true);
  harness.advance(101);
  assert.equal(await second.claim(), true);
  assert.equal(first.isOwner(), false);
  assert.equal(second.isOwner(), true);

  first.destroy();
  second.destroy();
});

