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
  type CompanionLocale,
} from '@/lib/companion';
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

async function chooseModel(surface: 'voice' | 'guide' | 'chat'): Promise<ModelChoice | null> {
  const chat = getLocalLlmConfig(process.env, 'chat');
  const preferred = surface === 'voice' ? getLocalLlmConfig(process.env, 'voice') : chat;
  const localCandidates = preferred.url === chat.url && preferred.model === chat.model
    ? [{ config: preferred, runtime: surface === 'voice' ? 'voice' as const : 'chat' as const }]
    : [
        { config: preferred, runtime: 'voice' as const },
        { config: chat, runtime: 'chat' as const },
      ];

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

  const openRouterModel = process.env.OPENROUTER_CHAT_MODEL?.trim();
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
    const modelId = process.env.OPENAI_CHAT_MODEL?.trim() || 'gpt-4o-mini';
    return { model: openai(modelId), provider: 'openai', modelId, runtime: 'external' };
  }
  return null;
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
      : 'chat';
  const surface = surfaceKind === 'guide'
    ? 'floating guide'
    : surfaceKind === 'voice'
      ? 'Darshan voice conversation'
      : 'full tutor chat';
  const turnContext = { pathname, locale, surface };

  const command = parseMemoryCommand(latestUserMessage);
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
    listCompanionMessages(userId, surfaceKind === 'voice' ? 4 : 18),
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
  const system = buildCompanionSystemPrompt({
    persona,
    pathname,
    locale,
    surface,
    learnerSummary,
    recentSummary,
    memories: (surfaceKind === 'voice' ? memories.slice(-6) : memories)
      .map((memory) => safeContextValue(memory.content, '', surfaceKind === 'voice' ? 160 : 300))
      .filter(Boolean),
    learningContext,
  });

  const choice = await chooseModel(surfaceKind);
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
        content: surfaceKind === 'voice' ? message.content.slice(0, 600) : message.content,
      })),
    { role: 'user', content: latestUserMessage },
  ];

  const result = await streamText({
    model: choice.model,
    messages,
    system,
    maxTokens: surfaceKind === 'voice' ? 50 : 600,
    temperature: surfaceKind === 'voice' ? 0.45 : 0.65,
    maxRetries: choice.provider === 'ollama' ? 0 : 1,
    onFinish: async ({ text }) => {
      if (!text.trim()) return;
      try {
        await saveCompanionTurn(userId, latestUserMessage, text, turnContext);
      } catch (error) {
        console.error('Failed to persist Mila companion turn', error);
      }
    },
  });

  return result.toDataStreamResponse({
    headers: {
      'X-Mila-Model-Provider': choice.provider,
      'X-Mila-Model': choice.modelId,
      'X-Mila-Model-Runtime': choice.runtime,
    },
  });
}
