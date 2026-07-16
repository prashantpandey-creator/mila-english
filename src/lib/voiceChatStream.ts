// ── voiceChatStream.ts — minimal client for the /api/chat voice data stream ──
// The route replies in Vercel AI data-stream v1 framing: newline-delimited
// `<type>:<json>` parts. Voice only needs text parts (`0:`) and errors (`3:`).
// The parser is pure and unit-tested; streamVoiceReply wraps fetch around it.

export type DataStreamParsed = { texts: string[]; error: string | null };

export type DataStreamParser = { push: (chunk: string) => DataStreamParsed };

export function createDataStreamParser(): DataStreamParser {
  let buffer = '';
  return {
    push(chunk: string): DataStreamParsed {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      const texts: string[] = [];
      let error: string | null = null;
      for (const line of lines) {
        const separator = line.indexOf(':');
        if (separator < 1) continue;
        const type = line.slice(0, separator);
        if (type !== '0' && type !== '3') continue;
        let value: unknown;
        try {
          value = JSON.parse(line.slice(separator + 1));
        } catch {
          continue;
        }
        if (typeof value !== 'string') continue;
        if (type === '0') texts.push(value);
        else error = value;
      }
      return { texts, error };
    },
  };
}

export type VoiceReplyRequest = {
  text: string;
  lang: 'ru' | 'en';
  pathname?: string;
  speculative?: boolean;
  signal?: AbortSignal;
  onDelta?: (fullText: string) => void;
};

export type VoiceReply = { reply: string; controlled: boolean };

/** Stream one voice reply for a single user utterance. Throws on HTTP or stream errors. */
export async function streamVoiceReply(request: VoiceReplyRequest): Promise<VoiceReply> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: request.signal,
    body: JSON.stringify({
      messages: [{ role: 'user', content: request.text }],
      context: {
        pathname: request.pathname ?? '/darshan',
        lang: request.lang,
        surface: 'voice',
        speculative: request.speculative === true,
      },
    }),
  });
  if (!response.ok || !response.body) throw new Error(`chat-failed:${response.status}`);

  const controlled = response.headers.get('X-Mila-Voice-Script') === 'controlled';
  const parser = createDataStreamParser();
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let reply = '';
  for (;;) {
    const { done, value } = await reader.read();
    const parsed = parser.push(done ? decoder.decode() : decoder.decode(value, { stream: true }));
    for (const text of parsed.texts) reply += text;
    if (parsed.error) throw new Error(`chat-stream:${parsed.error}`);
    if (parsed.texts.length > 0) request.onDelta?.(reply);
    if (done) return { reply, controlled };
  }
}
