import type { Message } from 'ai';

export const GIA_GUEST_VOICE_HANDOFF_KEY_PREFIX = 'gia-guest-voice-handoff-v1';

type BrowserStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type VoiceTurn = {
  user: string;
  assistant: string;
};

type StoredHandoff = {
  version: 1;
  messages: Message[];
};

function storageKey(token: string): string | null {
  return /^[a-zA-Z0-9-]{8,80}$/.test(token)
    ? `${GIA_GUEST_VOICE_HANDOFF_KEY_PREFIX}:${token}`
    : null;
}

export function createGiaGuestVoiceHandoffToken(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

function normaliseMessages(value: unknown): Message[] {
  if (!value || typeof value !== 'object') return [];
  const messages = (value as { messages?: unknown }).messages;
  if (!Array.isArray(messages)) return [];

  return messages.flatMap((message, index) => {
    if (!message || typeof message !== 'object') return [];
    const role = (message as { role?: unknown }).role;
    const content = (message as { content?: unknown }).content;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) return [];
    const normalised: Message = {
      id: `gia-voice-handoff-${index}`,
      role,
      content: content.trim().slice(0, role === 'user' ? 4000 : 8000),
    };
    return [normalised];
  }).slice(-12);
}

export function appendGiaGuestVoiceTurn(storage: BrowserStorage, token: string, turn: VoiceTurn): void {
  const key = storageKey(token);
  const user = turn.user.trim().slice(0, 4000);
  const assistant = turn.assistant.trim().slice(0, 8000);
  if (!key || !user || !assistant) return;

  let existing: Message[] = [];
  try {
    existing = normaliseMessages(JSON.parse(storage.getItem(key) || 'null'));
  } catch {
    existing = [];
  }

  const userMessage: Message = {
    id: `gia-voice-handoff-${existing.length}`,
    role: 'user',
    content: user,
  };
  const assistantMessage: Message = {
    id: `gia-voice-handoff-${existing.length + 1}`,
    role: 'assistant',
    content: assistant,
  };
  const messages: Message[] = [
    ...existing,
    userMessage,
    assistantMessage,
  ].slice(-12);
  const payload: StoredHandoff = { version: 1, messages };

  try {
    storage.setItem(key, JSON.stringify(payload));
  } catch {
    // Voice remains usable when private browsing or quota blocks sessionStorage.
  }
}

export function consumeGiaGuestVoiceHandoff(storage: BrowserStorage, token: string): Message[] {
  const key = storageKey(token);
  if (!key) return [];
  let messages: Message[] = [];
  try {
    messages = normaliseMessages(JSON.parse(storage.getItem(key) || 'null'));
  } catch {
    messages = [];
  }

  try {
    storage.removeItem(key);
  } catch {
    // A read-only storage implementation should not block the text handoff.
  }
  return messages;
}
