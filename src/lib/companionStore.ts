import { prisma } from '@/lib/prisma';

const PRIMARY_THREAD_KEY = 'primary';
const MAX_STORED_MESSAGES = 80;
const MAX_MEMORIES = 20;

export type CompanionHistoryScope = 'all' | 'conversation' | 'practice';

export type CompanionTurnContext = {
  pathname: string;
  locale: 'en' | 'ru';
  surface: string;
};

async function getOrCreatePrimaryThread(userId: number) {
  return prisma.companionThread.upsert({
    where: { userId_key: { userId, key: PRIMARY_THREAD_KEY } },
    update: {},
    create: { userId, key: PRIMARY_THREAD_KEY },
  });
}

function messageMatchesScope(
  message: { surface: string | null; pathname: string | null },
  scope: CompanionHistoryScope,
  pathname?: string,
) {
  if (scope === 'all') return true;
  const focusedPractice = message.surface === 'focused speaking practice';
  if (scope === 'conversation') return !focusedPractice;
  return focusedPractice && (!pathname || !message.pathname || message.pathname === pathname);
}

export async function listCompanionMessages(
  userId: number,
  limit = 20,
  scope: CompanionHistoryScope = 'all',
  pathname?: string,
) {
  const thread = await prisma.companionThread.findUnique({
    where: { userId_key: { userId, key: PRIMARY_THREAD_KEY } },
    select: { id: true },
  });
  if (!thread) return [];

  const messages = await prisma.companionMessage.findMany({
    where: { threadId: thread.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    // A scoped request may need to look past newer messages from another room.
    take: scope === 'all' ? Math.max(1, Math.min(limit, MAX_STORED_MESSAGES)) : MAX_STORED_MESSAGES,
  });
  const scoped = messages.reverse().filter((message) => messageMatchesScope(message, scope, pathname));
  return scoped.slice(-Math.max(1, Math.min(limit, MAX_STORED_MESSAGES)));
}

export async function saveCompanionTurn(
  userId: number,
  userContent: string,
  assistantContent: string,
  context: CompanionTurnContext,
) {
  const thread = await getOrCreatePrimaryThread(userId);
  const now = new Date();

  await prisma.$transaction([
    prisma.companionMessage.create({
      data: {
        threadId: thread.id,
        role: 'user',
        content: userContent.slice(0, 4000),
        pathname: context.pathname,
        locale: context.locale,
        surface: context.surface,
        createdAt: now,
      },
    }),
    prisma.companionMessage.create({
      data: {
        threadId: thread.id,
        role: 'assistant',
        content: assistantContent.slice(0, 8000),
        pathname: context.pathname,
        locale: context.locale,
        surface: context.surface,
        createdAt: new Date(now.getTime() + 1),
      },
    }),
    prisma.companionThread.update({
      where: { id: thread.id },
      data: { updatedAt: now },
    }),
  ]);

  const stale = await prisma.companionMessage.findMany({
    where: { threadId: thread.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: MAX_STORED_MESSAGES,
    select: { id: true },
  });
  if (stale.length) {
    await prisma.companionMessage.deleteMany({ where: { id: { in: stale.map((message) => message.id) } } });
  }
}

export async function clearCompanionConversation(userId: number) {
  await prisma.companionThread.deleteMany({ where: { userId, key: PRIMARY_THREAD_KEY } });
}

export async function listCompanionMemories(userId: number) {
  const memories = await prisma.companionMemory.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: MAX_MEMORIES,
  });
  return memories.reverse();
}

export async function rememberCompanionFact(userId: number, content: string, locale: 'en' | 'ru') {
  const existing = await listCompanionMemories(userId);
  const normalized = content.trim().toLocaleLowerCase();
  const duplicate = existing.find((memory) => memory.content.trim().toLocaleLowerCase() === normalized);
  if (duplicate) return duplicate;

  const created = await prisma.companionMemory.create({ data: { userId, content, locale } });
  const stale = await prisma.companionMemory.findMany({
    where: { userId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    skip: MAX_MEMORIES,
    select: { id: true },
  });
  if (stale.length) {
    await prisma.companionMemory.deleteMany({ where: { id: { in: stale.map((memory) => memory.id) } } });
  }
  return created;
}

export async function forgetAllCompanionMemories(userId: number) {
  return prisma.companionMemory.deleteMany({ where: { userId } });
}
