import { createOpenAI, openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import {
  buildCompanionSystemPrompt,
  applyLocalModelRequestOptions,
  builtInCompanionReply,
  getLocalLlmConfig,
  isSensitiveMemory,
  ollamaHasModel,
  parseMemoryCommand,
  sanitizeVoiceReply,
  voiceEvidenceFallbackLine,
  voiceReplyHasUnsupportedEvidence,
  type CompanionLocale,
  type LanguageMode,
} from '@/lib/companion';
import { splitCompleteSentences } from '@/lib/voiceTurn';
import {
  forgetAllCompanionMemories,
  listCompanionMemories,
  listCompanionMessages,
  rememberCompanionFact,
  saveCompanionTurn,
} from '@/lib/companionStore';
import { readLearnerProfile } from '@/lib/learnerProfile';
import { personaBlock, type PersonaId } from '@/lib/personas';
import { prisma } from '@/lib/prisma';
import { builtinLessonContent, getBuiltinLesson } from '@/lib/builtinLessons';

export const maxDuration = 60;

const LOCAL_HEALTH_TTL_MS = 15_000;
const localHealthCache = new Map<string, { ready: boolean; expiresAt: number }>();

type ChatMessage = { role: 'user' | 'assistant'; content: string };
type ModelChoice = {
  model: ReturnType<ReturnType<typeof createOpenAI>>;
  provider: 'ollama' | 'openrouter' | 'openai';
  modelId: string;
  runtime: 'voice' | 'chat' | 'external';
};

function dataStreamText(text: string, provider = 'built-in') {
  return new Response(`0:${JSON.stringify(text)}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
      'X-Mila-Model-Provider': provider,
    },
  });
}

function normalizeIncomingMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-20)
    .filter((message: unknown): message is ChatMessage => {
      if (!message || typeof message !== 'object') return false;
      const candidate = message as { role?: unknown; content?: unknown };
      return (candidate.role === 'user' || candidate.role === 'assistant') && typeof candidate.content === 'string';
    })
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 4000) }))
    .filter((message) => message.content.length > 0);
}

function safeContextValue(value: string | null | undefined, fallback: string, maxLength = 160): string {
  const cleaned = value?.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function isPersonaId(value: string | null | undefined): value is PersonaId {
  return value === 'teacher' || value === 'friend' || value === 'guide';
}

async function localLlmReady(config: ReturnType<typeof getLocalLlmConfig>): Promise<boolean> {
  const key = `${config.url}|${config.model}`;
  const now = Date.now();
  const cached = localHealthCache.get(key);
  if (cached && cached.expiresAt > now) return cached.ready;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  let ready = false;
  try {
    const response = await fetch(`${config.url}/api/tags`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    ready = response.ok && ollamaHasModel(await response.json(), config.model);
  } catch {
    ready = false;
  } finally {
    clearTimeout(timeout);
  }

  localHealthCache.set(key, { ready, expiresAt: now + LOCAL_HEALTH_TTL_MS });
  if (localHealthCache.size > 4) {
    for (const [cacheKey, entry] of localHealthCache) {
      if (entry.expiresAt <= now) localHealthCache.delete(cacheKey);
    }
  }
  return ready;
}

/** Build an external (cloud) model choice from configured keys, or null.
 *  OpenRouter wins over OpenAI when both exist. Voice picks its own model
 *  envs with a fast multilingual default. */
function externalChoice(voice: boolean): ModelChoice | null {
  const openRouterModel = (voice
    ? process.env.OPENROUTER_VOICE_MODEL?.trim() || 'openai/gpt-4o-mini'
    : process.env.OPENROUTER_CHAT_MODEL?.trim());
  if (process.env.OPENROUTER_API_KEY && openRouterModel) {
    const provider = createOpenAI({
      name: 'openrouter',
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      compatibility: 'compatible',
      headers: {
        'HTTP-Referer': process.env.APP_URL || 'https://mila-english.com',
        'X-Title': 'Mila English',
      },
    });
    return { model: provider(openRouterModel), provider: 'openrouter', modelId: openRouterModel, runtime: 'external' };
  }
  if (process.env.OPENAI_API_KEY) {
    const modelId = (voice ? process.env.OPENAI_VOICE_MODEL : process.env.OPENAI_CHAT_MODEL)?.trim() || 'gpt-4o-mini';
    return { model: openai(modelId), provider: 'openai', modelId, runtime: 'external' };
  }
  return null;
}

async function chooseModel(surface: 'voice' | 'guide' | 'chat', externalFirst = false): Promise<ModelChoice | null> {
  // VOICE_EXTERNAL_FIRST experiment: spoken turns try the fast cloud brain
  // before the local model; the local model remains the always-there fallback
  // (see the spoken branch's pre-first-sentence failover).
  if (externalFirst) {
    const external = externalChoice(surface === 'voice');
    if (external) return external;
  }
  const chat = getLocalLlmConfig(process.env, 'chat');
  const preferred = surface === 'voice' ? getLocalLlmConfig(process.env, 'voice') : chat;
  const localCandidates = [{
    config: preferred,
    runtime: surface === 'voice' ? 'voice' as const : 'chat' as const,
  }];

  for (const candidate of localCandidates) {
    const local = candidate.config;
    if (!await localLlmReady(local)) continue;
    const provider = createOpenAI({
      name: candidate.runtime === 'voice' ? 'mila-local-voice' : 'mila-local',
      baseURL: local.baseURL,
      apiKey: process.env.LOCAL_LLM_API_KEY || 'ollama',
      compatibility: 'compatible',
      fetch: async (input, init) => {
        if (typeof init?.body !== 'string') return globalThis.fetch(input, init);
        try {
          const parsed = JSON.parse(init.body);
          const adjusted = applyLocalModelRequestOptions(
            local.model,
            parsed,
            candidate.runtime === 'voice'
              ? process.env.LOCAL_VOICE_LLM_REASONING_EFFORT || process.env.LOCAL_LLM_REASONING_EFFORT
              : process.env.LOCAL_LLM_REASONING_EFFORT,
          );
          return globalThis.fetch(input, { ...init, body: JSON.stringify(adjusted) });
        } catch {
          return globalThis.fetch(input, init);
        }
      },
    });
    return { model: provider(local.model), provider: 'ollama', modelId: local.model, runtime: candidate.runtime };
  }

  const externalAllowed = /^(?:1|true|yes)$/i.test(process.env.ALLOW_EXTERNAL_CHAT_FALLBACK || '');
  if (!externalAllowed) return null;
  return externalChoice(false);
}

function memoryReply(locale: CompanionLocale, memories: Array<{ content: string }>): string {
  if (!memories.length) return locale === 'ru'
    ? 'У меня пока нет сохранённых фактов. Можешь сказать: «Запомни, что…»'
    : 'I do not have any facts you explicitly asked me to remember yet. You can say, “Remember that…”';

  const heading = locale === 'ru' ? 'Вот что я храню по твоей просьбе:' : 'Here is what you explicitly asked me to remember:';
  return `${heading}\n${memories.map((memory, index) => `${index + 1}. ${memory.content}`).join('\n')}`;
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  const userId = Number(user?.sub);
  if (!user || !Number.isSafeInteger(userId) || userId <= 0) {
    return NextResponse.json({ error: 'Unauthorized. You must be logged in to chat.' }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const incomingMessages = normalizeIncomingMessages(payload?.messages);
  const latestUserMessage = [...incomingMessages].reverse().find((message) => message.role === 'user')?.content;
  if (!latestUserMessage) return NextResponse.json({ error: 'At least one user message is required.' }, { status: 400 });

  const rawPath = typeof payload?.context?.pathname === 'string' ? payload.context.pathname : '/';
  const pathname = /^\/[a-z0-9/_-]*$/i.test(rawPath) ? rawPath.slice(0, 100) : '/';
  const locale: CompanionLocale = payload?.context?.lang === 'ru' ? 'ru' : 'en';
  const surfaceKind = payload?.context?.surface === 'guide'
    ? 'guide'
    : payload?.context?.surface === 'voice'
      ? 'voice'
      : payload?.context?.surface === 'practice'
        ? 'practice'
        : 'chat';
  // Practice is voice-grade end to end: fast spoken model, short replies,
  // sentence-streamed fail-closed guard.
  const spoken = surfaceKind === 'voice' || surfaceKind === 'practice';
  const surface = surfaceKind === 'guide'
    ? 'floating guide'
    : surfaceKind === 'voice'
      ? 'Darshan voice conversation'
      : surfaceKind === 'practice'
        ? 'focused speaking practice'
        : 'full tutor chat';
  const turnContext = { pathname, locale, surface };
  // Speculative voice drafts run against partial transcripts: they must never
  // persist a turn or execute a memory command heard mid-sentence.
  const speculative = surfaceKind === 'voice' && payload?.context?.speculative === true;

  const command = parseMemoryCommand(latestUserMessage);
  if (command && speculative) {
    return dataStreamText('', 'speculative-skip');
  }
  if (command?.kind === 'remember') {
    if (isSensitiveMemory(command.content)) {
      return dataStreamText(locale === 'ru'
        ? 'Я не буду сохранять пароли, PIN-коды, ключи или банковские данные. Можно запомнить учебную цель, интерес или предпочтение.'
        : 'I will not store passwords, PINs, keys, or banking details. I can remember a learning goal, interest, or teaching preference instead.', 'memory-guard');
    }
    await rememberCompanionFact(userId, command.content, locale);
    const reply = locale === 'ru'
      ? `Запомнила: ${command.content}. Ты всегда можешь спросить, что я помню, или попросить всё забыть.`
      : `I’ll remember: ${command.content}. You can always ask what I remember or tell me to forget it all.`;
    await saveCompanionTurn(userId, latestUserMessage, reply, turnContext);
    return dataStreamText(reply, 'memory');
  }

  if (command?.kind === 'list') {
    const memories = await listCompanionMemories(userId);
    const reply = memoryReply(locale, memories);
    await saveCompanionTurn(userId, latestUserMessage, reply, turnContext);
    return dataStreamText(reply, 'memory');
  }

  if (command?.kind === 'forget-all') {
    await forgetAllCompanionMemories(userId);
    const reply = locale === 'ru'
      ? 'Готово — я удалила все факты, сохранённые по твоей просьбе.'
      : 'Done — I deleted every fact you explicitly asked me to remember.';
    await saveCompanionTurn(userId, latestUserMessage, reply, turnContext);
    return dataStreamText(reply, 'memory');
  }

  const [profile, learnerProfile, recentProgress, storedMessages, memories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, level: true, goal: true, tonePreference: true, streakDays: true },
    }),
    readLearnerProfile(userId),
    prisma.progress.findMany({
      where: { userId },
      include: { Lesson: { select: { title: true, category: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    }),
    listCompanionMessages(userId, spoken ? 4 : 18),
    listCompanionMemories(userId),
  ]);

  const learnerSummary = profile
    ? `Learner: ${safeContextValue(profile.name, 'student')}; level: ${safeContextValue(profile.level, 'unknown')}; goal: ${safeContextValue(profile.goal, 'not set')}; streak: ${profile.streakDays}.`
    : 'Learner profile is not available.';
  const recentSummary = recentProgress.length
    ? recentProgress.map((item) => `${safeContextValue(item.Lesson.title, 'Lesson')} (${item.completed ? 'complete' : 'in progress'}, score ${item.score ?? 'not scored'})`).join('; ')
    : 'No recorded lesson progress yet.';
  const persona = personaBlock(isPersonaId(profile?.tonePreference) ? profile.tonePreference : 'friend', learnerProfile);
  const lessonId = pathname.match(/^\/lessons\/([a-z0-9-]+)$/i)?.[1];
  const currentLesson = lessonId ? getBuiltinLesson(lessonId) : null;
  const learningContext = currentLesson
    ? `Current lesson: ${currentLesson.titleEn} / ${currentLesson.titleRu}.\nVocabulary: ${currentLesson.words.join(', ')}.\nExamples:\n${builtinLessonContent(currentLesson)}`
    : undefined;
  // Language-of-instruction axis (orthogonal to persona), matching the owner's
  // rule: the general/front conversation is fun and neutral — mirror whatever
  // language the learner uses, help only if asked. The CLASSROOM lives INSIDE
  // lessons: there a beginner is taught in Russian (introduced simply), everyone
  // else in English. An explicit client value (a future toggle) always wins.
  const levelTag = (profile?.level || '').trim().toUpperCase();
  const beginner = levelTag === '' || levelTag === 'PENDING' || levelTag === 'A1';
  const inLesson = surfaceKind === 'practice' || Boolean(currentLesson);
  const requestedLanguageMode = payload?.context?.languageMode;
  const languageMode: LanguageMode =
    requestedLanguageMode === 'english-first' || requestedLanguageMode === 'mirror' || requestedLanguageMode === 'native-first'
      ? requestedLanguageMode
      : inLesson
        ? (beginner ? 'native-first' : 'english-first')
        : 'mirror';
  const system = buildCompanionSystemPrompt({
    persona,
    pathname,
    locale,
    surface,
    learnerSummary,
    recentSummary,
    memories: (spoken ? memories.slice(-6) : memories)
      .map((memory) => safeContextValue(memory.content, '', spoken ? 160 : 300))
      .filter(Boolean),
    learningContext,
    languageMode,
  });

  const voiceExternalFirst = spoken && /^(?:1|true|yes)$/i.test(process.env.VOICE_EXTERNAL_FIRST || '');
  const choice = await chooseModel(surfaceKind === 'practice' ? 'voice' : surfaceKind, voiceExternalFirst);
  if (!choice) {
    const reply = builtInCompanionReply(latestUserMessage, pathname, locale, profile?.level);
    await saveCompanionTurn(userId, latestUserMessage, reply, turnContext);
    return dataStreamText(reply);
  }

  const messages: ChatMessage[] = [
    ...storedMessages
      .filter((message): message is typeof message & { role: 'user' | 'assistant' } => message.role === 'user' || message.role === 'assistant')
      .map((message) => ({
        role: message.role,
        content: spoken ? message.content.slice(0, 600) : message.content,
      })),
    { role: 'user', content: latestUserMessage },
  ];

  const generationOptions = {
    messages,
    system,
    maxTokens: spoken ? (surfaceKind === 'practice' ? 60 : 50) : 320,
    temperature: spoken ? 0.25 : 0.35,
    abortSignal: request.signal,
    onFinish: spoken ? undefined : async ({ text }: { text: string }) => {
      if (!text.trim()) return;
      try {
        await saveCompanionTurn(userId, latestUserMessage, text, turnContext);
      } catch (error) {
        console.error('Failed to persist Mila companion turn', error);
      }
    },
  };

  const result = await streamText({
    model: choice.model,
    maxRetries: choice.provider === 'ollama' ? 0 : 1,
    ...generationOptions,
  });

  if (spoken) {
    // Sentence-streamed fail-closed guard. Every evidence pattern in
    // voiceReplyHasUnsupportedEvidence is sentence-local ([^.!?] windows), so
    // checking sentence-by-sentence detects exactly what the whole-reply check
    // did — while letting TTS start after the first clean sentence instead of
    // after the full generation.
    const emptyFallback = locale === 'ru'
      ? 'Я могу ответить по тексту, но не буду выдумывать то, чего не слышала или не видела.'
      : 'I can respond to the text, but I will not invent anything I did not hear or see.';
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let emitted = '';
        const emit = (piece: string) => {
          const clean = piece.trim();
          if (!clean) return;
          const chunk = emitted ? ` ${clean}` : clean;
          emitted += chunk;
          controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
        };
        let buffer = '';
        let failedClosed = false;
        const consume = async (source: { textStream: AsyncIterable<string> }) => {
          for await (const delta of source.textStream) {
            buffer += delta;
            const { complete, rest } = splitCompleteSentences(buffer);
            buffer = rest;
            for (const sentence of complete) {
              if (voiceReplyHasUnsupportedEvidence(sentence)) {
                failedClosed = true;
                break;
              }
              emit(sanitizeVoiceReply(sentence));
            }
            if (failedClosed) break;
          }
          // Tail runs only when the stream completed without throwing.
          if (!failedClosed && buffer.trim()) {
            if (voiceReplyHasUnsupportedEvidence(buffer)) failedClosed = true;
            else emit(sanitizeVoiceReply(buffer));
          }
        };
        try {
          await consume(result);
        } catch (error) {
          // An external brain can die before a single word arrives. Fall back
          // to the local model once, transparently — degraded is acceptable,
          // a dead turn is not. (Headers already sent name the first choice.)
          if (!request.signal.aborted && !emitted && choice.runtime === 'external') {
            console.error('External voice model failed before first sentence; retrying locally', error);
            buffer = '';
            failedClosed = false;
            try {
              const fallback = await chooseModel('voice', false);
              if (fallback && fallback.runtime !== 'external') {
                const retry = await streamText({ model: fallback.model, maxRetries: 0, ...generationOptions });
                await consume(retry);
              }
            } catch (retryError) {
              if (!request.signal.aborted) console.error('Local fallback voice stream failed', retryError);
            }
          } else if (!request.signal.aborted) {
            console.error('Voice reply stream failed', error);
          }
        }
        // An unsupported claim with nothing spoken yet → speak the safe line.
        // With clean sentences already spoken → stop silently at the claim.
        if (failedClosed && !emitted) emit(voiceEvidenceFallbackLine(buffer));
        if (!emitted && !request.signal.aborted) emit(emptyFallback);
        if (!speculative && !request.signal.aborted && emitted.trim()) {
          try {
            await saveCompanionTurn(userId, latestUserMessage, emitted.trim(), turnContext);
          } catch (error) {
            console.error('Failed to persist Mila voice turn', error);
          }
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1',
        'X-Mila-Model-Provider': choice.provider,
        'X-Mila-Model': choice.modelId,
        'X-Mila-Model-Runtime': choice.runtime,
        'X-Mila-Voice-Script': 'controlled',
      },
    });
  }

  return result.toDataStreamResponse({
    headers: {
      'X-Mila-Model-Provider': choice.provider,
      'X-Mila-Model': choice.modelId,
      'X-Mila-Model-Runtime': choice.runtime,
    },
  });
}
