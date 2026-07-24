const GIA_VOICE_OWNER_KEY = "gia-live-voice-owner-v1";
const GIA_VOICE_CHANNEL = "gia-live-voice-tabs-v1";
const DEFAULT_LEASE_MS = 20_000;
const DEFAULT_HEARTBEAT_MS = 5_000;
const DEFAULT_CLAIM_SETTLE_MS = 60;

type VoiceOwnerLease = {
  tabId: string;
  expiresAt: number;
};

type VoiceTabMessage = {
  type: "owner-claimed" | "owner-released";
  tabId: string;
};

type VoiceChannel = {
  addEventListener: (type: "message", listener: (event: MessageEvent<VoiceTabMessage>) => void) => void;
  removeEventListener: (type: "message", listener: (event: MessageEvent<VoiceTabMessage>) => void) => void;
  postMessage: (message: VoiceTabMessage) => void;
  close: () => void;
};

type VoiceTabRuntime = {
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null;
  events: Pick<Window, "addEventListener" | "removeEventListener"> | null;
  channel: VoiceChannel | null;
  now: () => number;
  createId: () => string;
  setInterval: typeof globalThis.setInterval;
  clearInterval: typeof globalThis.clearInterval;
  wait: (milliseconds: number) => Promise<void>;
};

export type GiaVoiceTabCoordinator = {
  claim: () => Promise<boolean>;
  destroy: () => void;
  hasOtherOwner: () => boolean;
  isOwner: () => boolean;
  refresh: () => void;
  release: () => void;
};

export type GiaVoiceTabCoordinatorOptions = {
  onOtherOwnerChange?: (active: boolean) => void;
  onOwnershipLost?: () => void;
  runtime?: VoiceTabRuntime;
  leaseMs?: number;
  heartbeatMs?: number;
  claimSettleMs?: number;
};

function defaultRuntime(): VoiceTabRuntime {
  const storage = (() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  })();
  const channel = typeof BroadcastChannel === "function"
    ? new BroadcastChannel(GIA_VOICE_CHANNEL) as VoiceChannel
    : null;

  return {
    storage,
    events: typeof window === "undefined" ? null : window,
    channel,
    now: () => Date.now(),
    createId: () => typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `gia-tab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
    setInterval: globalThis.setInterval.bind(globalThis),
    clearInterval: globalThis.clearInterval.bind(globalThis),
    wait: (milliseconds) => new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds)),
  };
}

function parseLease(value: string | null): VoiceOwnerLease | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<VoiceOwnerLease>;
    if (
      typeof parsed.tabId === "string"
      && parsed.tabId.length > 0
      && typeof parsed.expiresAt === "number"
      && Number.isFinite(parsed.expiresAt)
    ) {
      return { tabId: parsed.tabId, expiresAt: parsed.expiresAt };
    }
  } catch {
    // A damaged device-local lease is equivalent to no active owner.
  }
  return null;
}

export function createGiaVoiceTabCoordinator(
  options: GiaVoiceTabCoordinatorOptions = {},
): GiaVoiceTabCoordinator {
  const runtime = options.runtime ?? defaultRuntime();
  const leaseMs = options.leaseMs ?? DEFAULT_LEASE_MS;
  const heartbeatMs = options.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
  const claimSettleMs = options.claimSettleMs ?? DEFAULT_CLAIM_SETTLE_MS;
  const tabId = runtime.createId();
  let owner = false;
  let destroyed = false;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let lastOtherOwner: boolean | null = null;

  const readLease = () => {
    try {
      return parseLease(runtime.storage?.getItem(GIA_VOICE_OWNER_KEY) ?? null);
    } catch {
      return null;
    }
  };

  const currentLease = () => {
    const lease = readLease();
    return lease && lease.expiresAt > runtime.now() ? lease : null;
  };

  const writeLease = () => {
    try {
      runtime.storage?.setItem(GIA_VOICE_OWNER_KEY, JSON.stringify({
        tabId,
        expiresAt: runtime.now() + leaseMs,
      } satisfies VoiceOwnerLease));
    } catch {
      // BroadcastChannel still prevents duplicates when storage is unavailable.
    }
  };

  const hasOtherOwner = () => {
    const lease = currentLease();
    return !!lease && lease.tabId !== tabId;
  };

  const announceOtherOwner = () => {
    const next = hasOtherOwner();
    if (next === lastOtherOwner) return;
    lastOtherOwner = next;
    options.onOtherOwnerChange?.(next);
  };

  const stopHeartbeat = () => {
    if (heartbeat === null) return;
    runtime.clearInterval(heartbeat);
    heartbeat = null;
  };

  const loseOwnership = () => {
    if (!owner) {
      announceOtherOwner();
      return;
    }
    owner = false;
    stopHeartbeat();
    options.onOwnershipLost?.();
    announceOtherOwner();
  };

  const refresh = () => {
    if (destroyed) return;
    if (owner && hasOtherOwner()) {
      loseOwnership();
      return;
    }
    announceOtherOwner();
  };

  const heartbeatOwner = () => {
    if (!owner || destroyed) return;
    if (hasOtherOwner()) {
      loseOwnership();
      return;
    }
    writeLease();
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key && event.key !== GIA_VOICE_OWNER_KEY) return;
    refresh();
  };

  const handleMessage = (event: MessageEvent<VoiceTabMessage>) => {
    if (!event.data || event.data.tabId === tabId) return;
    if (event.data.type === "owner-claimed" && owner) {
      // Storage is authoritative when available. Broadcast is the fallback.
      const lease = currentLease();
      if (!runtime.storage || lease?.tabId === event.data.tabId) loseOwnership();
    }
    announceOtherOwner();
  };

  runtime.events?.addEventListener("storage", handleStorage as EventListener);
  runtime.channel?.addEventListener("message", handleMessage);
  announceOtherOwner();

  const claim = async () => {
    if (destroyed) return false;
    const existing = currentLease();
    if (existing && existing.tabId !== tabId) {
      announceOtherOwner();
      return false;
    }

    writeLease();
    await runtime.wait(claimSettleMs);
    if (destroyed) return false;

    const confirmed = currentLease();
    if (runtime.storage && confirmed?.tabId !== tabId) {
      owner = false;
      announceOtherOwner();
      return false;
    }

    owner = true;
    lastOtherOwner = false;
    options.onOtherOwnerChange?.(false);
    runtime.channel?.postMessage({ type: "owner-claimed", tabId });
    stopHeartbeat();
    heartbeat = runtime.setInterval(heartbeatOwner, heartbeatMs);
    return true;
  };

  const release = () => {
    if (!owner) return;
    owner = false;
    stopHeartbeat();
    const lease = readLease();
    if (!lease || lease.tabId === tabId) {
      try {
        runtime.storage?.removeItem(GIA_VOICE_OWNER_KEY);
      } catch {
        // The short lease will expire if storage becomes unavailable.
      }
    }
    runtime.channel?.postMessage({ type: "owner-released", tabId });
    announceOtherOwner();
  };

  const destroy = () => {
    if (destroyed) return;
    release();
    destroyed = true;
    stopHeartbeat();
    runtime.events?.removeEventListener("storage", handleStorage as EventListener);
    runtime.channel?.removeEventListener("message", handleMessage);
    runtime.channel?.close();
  };

  return {
    claim,
    destroy,
    hasOtherOwner,
    isOwner: () => owner,
    refresh,
    release,
  };
}

