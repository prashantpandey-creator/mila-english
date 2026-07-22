// Where the model's view of "earlier in this conversation" comes from.
//
// Guest learners are ephemeral: their conversation is NEVER persisted
// server-side (see companionStore's guest guards), so on a shared device a
// later visitor who inherits a guest cookie can never read a prior guest's
// saved chat. The trade-off is that a guest's own in-conversation continuity
// has to come from the client-held transcript instead of the database.
// Registered learners keep a durable, isolated stored thread.
//
// Either way the freshly-sent user turn is appended by the caller, so it is
// excluded here to avoid duplicating it.

export type ModelHistoryMessage = { role: 'user' | 'assistant'; content: string };
export type StoredHistoryMessage = { role: string; content: string };

const SPOKEN_TURN_LIMIT = 4;
const TEXT_TURN_LIMIT = 18;
const SPOKEN_CONTENT_LIMIT = 600;

export function selectHistoryForModel(params: {
  isGuest: boolean;
  // The client transcript, with the just-sent user turn as its final element.
  incomingMessages: ModelHistoryMessage[];
  // The learner's durable, server-owned thread (empty for guests by design).
  storedMessages: StoredHistoryMessage[];
  spoken: boolean;
}): ModelHistoryMessage[] {
  const { isGuest, incomingMessages, storedMessages, spoken } = params;
  const limit = spoken ? SPOKEN_TURN_LIMIT : TEXT_TURN_LIMIT;
  const clamp = (content: string) => (spoken ? content.slice(0, SPOKEN_CONTENT_LIMIT) : content);

  if (isGuest) {
    // Drop the trailing user turn (the caller re-adds it), then keep only the
    // most recent turns. Nothing from the database is consulted for a guest.
    return incomingMessages
      .slice(0, -1)
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .slice(-limit)
      .map((message) => ({ role: message.role, content: clamp(message.content) }));
  }

  return storedMessages
    .filter((message): message is ModelHistoryMessage => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({ role: message.role, content: clamp(message.content) }));
}
