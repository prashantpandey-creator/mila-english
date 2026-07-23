'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { AppHeader, AppShell } from '@/components/ui/AppShell';
import MilaIcon from '@/components/ui/MilaIcon';
import MilaVoiceMark from '@/components/ui/MilaVoiceMark';
import { useI18n } from '@/lib/i18n-provider';
import { isTargetLanguageId, TARGET_LANGUAGES, type TargetLanguageId } from '@/lib/languages';
import { announceCompanionHistoryCleared, announceCompanionHistoryUpdated, useCompanionHistory } from '@/lib/use-companion-history';

export default function Chat() {
  const { lang } = useI18n();
  const router = useRouter();
  const [conversationStyle, setConversationStyle] = useState<'natural' | 'playful'>('natural');
  const [toneDialogOpen, setToneDialogOpen] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguageId>('auto');
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    id: 'mila-full-chat',
    api: '/api/chat',
    body: { context: { pathname: '/chat', lang, surface: 'chat', conversationStyle, targetLanguage } },
    onFinish: () => announceCompanionHistoryUpdated(),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesViewportRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [m, setM] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState(false);
  const { isHydrating, historyError } = useCompanionHistory({ limit: 40, setMessages });
  const latestMessageContent = messages[messages.length - 1]?.content ?? '';

  useEffect(() => {
    setM(true);
    if (window.localStorage.getItem('mila-chat-style-v1') === 'playful') {
      setConversationStyle('playful');
    }
    const savedLanguage = window.localStorage.getItem('mila-target-language-v1');
    if (isTargetLanguageId(savedLanguage)) setTargetLanguage(savedLanguage);
  }, []);
  useEffect(() => {
    const viewport = messagesViewportRef.current;
    if (!viewport) return;
    const frame = window.requestAnimationFrame(() => {
      viewport.scrollTo({
        top: messages.length === 0 ? 0 : viewport.scrollHeight,
        behavior: isLoading ? 'auto' : 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isLoading, latestMessageContent, messages.length]);

  const clearConversation = async () => {
    if (isLoading || isClearing || messages.length === 0) return;
    const confirmed = window.confirm(lang === 'ru'
      ? 'Начать новый разговор? Текущая переписка будет удалена.'
      : 'Start a new conversation? Your current chat history will be deleted.');
    if (!confirmed) return;

    setIsClearing(true);
    setClearError(false);
    try {
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error(`Clear request failed (${response.status})`);
      setMessages([]);
      announceCompanionHistoryCleared();
    } catch {
      setClearError(true);
    } finally {
      setIsClearing(false);
    }
  };

  const starterPrompts = lang === 'ru'
    ? [
        'Давай просто поговорим',
        targetLanguage === 'auto'
          ? 'Помоги сказать это на другом языке'
          : `Помоги сказать это на ${TARGET_LANGUAGES.find((item) => item.id === targetLanguage)?.ru ?? 'другом языке'}`,
        'Научи меня одной полезной фразе',
      ]
    : [
        'Let’s talk naturally',
        targetLanguage === 'auto'
          ? 'Help me say this in another language'
          : `Help me say this in ${TARGET_LANGUAGES.find((item) => item.id === targetLanguage)?.en ?? 'another language'}`,
        'Teach me one useful phrase',
      ];

  const chooseStarter = (prompt: string) => {
    setInput(prompt);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const toggleConversationStyle = () => {
    if (conversationStyle === 'playful') {
      setConversationStyle('natural');
      window.localStorage.setItem('mila-chat-style-v1', 'natural');
      return;
    }
    setToneDialogOpen(true);
  };

  const enablePlayfulStyle = () => {
    setConversationStyle('playful');
    window.localStorage.setItem('mila-chat-style-v1', 'playful');
    setToneDialogOpen(false);
  };

  const chooseLanguage = (value: string) => {
    if (!isTargetLanguageId(value)) return;
    setTargetLanguage(value);
    window.localStorage.setItem('mila-target-language-v1', value);
  };

  const selectedLanguage = TARGET_LANGUAGES.find((item) => item.id === targetLanguage)
    ?? TARGET_LANGUAGES[0];

  if (!m) return null;

  return (
    <AppShell className="chat-page" fullHeight>
      <AppHeader
        brand="Gia"
        backHref="/"
        title={lang==='ru' ? 'Чат с Джиа' : 'Chat with Gia'}
        eyebrow={lang==='ru' ? 'Текстовый разговор' : 'Text conversation'}
        actions={
          <>
          <label className="chat-page__language">
            <span>{lang === 'ru' ? 'Язык' : 'Language'}</span>
            <select
              value={targetLanguage}
              onChange={(event) => chooseLanguage(event.target.value)}
              aria-label={lang === 'ru' ? 'Язык для изучения' : 'Language to learn'}
            >
              {TARGET_LANGUAGES.map((language) => (
                <option key={language.id} value={language.id}>
                  {language[lang]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={clearConversation}
            disabled={isHydrating || isLoading || isClearing || messages.length === 0}
            aria-label={lang==='ru' ? 'Начать новый разговор' : 'Start a new conversation'}
            title={lang==='ru' ? 'Новый разговор' : 'New conversation'}
            className="app-header__button"
          >
            <MilaIcon name="conversation" size={17} />
          </button>
          <button
            type="button"
            className={`chat-page__tone-toggle${conversationStyle === 'playful' ? ' is-playful' : ''}`}
            onClick={toggleConversationStyle}
            aria-pressed={conversationStyle === 'playful'}
            aria-label={lang === 'ru' ? 'Настроение разговора' : 'Conversation mood'}
            title={lang === 'ru' ? 'Стиль разговора' : 'Conversation style'}
          >
            <MilaIcon name="sparkle" size={17} />
          </button>
          <LangToggle/>
          </>
        }
      />

      {toneDialogOpen && (
        <div className="chat-tone-dialog" role="dialog" aria-modal="true" aria-labelledby="chat-tone-title">
          <button
            type="button"
            className="chat-tone-dialog__backdrop"
            onClick={() => setToneDialogOpen(false)}
            aria-label={lang === 'ru' ? 'Закрыть' : 'Close'}
          />
          <section className="chat-tone-dialog__card">
            <p>{lang === 'ru' ? 'ИГРИВЫЙ РЕЖИМ · 18+' : 'PLAYFUL MODE · 18+'}</p>
            <h2 id="chat-tone-title">{lang === 'ru' ? 'Искра — между строк.' : 'Keep the spark between the lines.'}</h2>
            <div>
              {lang === 'ru'
                ? 'Джиа может шутить смелее, слегка дразнить, естественно ругнуться и поддержать намёк, который вы начали намеренно. Без откровенных ролевых сцен и без притворства, что она человек.'
                : 'Gia can be wittier, tease a little, swear when it feels natural, and mirror suggestive banter you intentionally begin. No explicit role-play, and no pretending she is human.'}
            </div>
            <div className="chat-tone-dialog__actions">
              <button type="button" className="is-primary" onClick={enablePlayfulStyle}>
                {lang === 'ru' ? 'Мне 18+ — добавить искру' : 'I’m 18+ — make it playful'}
              </button>
              <button type="button" onClick={() => setToneDialogOpen(false)}>
                {lang === 'ru' ? 'Оставить естественно' : 'Keep it natural'}
              </button>
            </div>
          </section>
        </div>
      )}

      <main ref={messagesViewportRef} className="chat-page__messages" aria-live="polite">
        <div className="chat-page__stream">
        {isHydrating && messages.length === 0 && (
          <div className="chat-page__status">
            {lang==='ru' ? 'Джиа вспоминает ваш разговор…' : 'Gia is remembering your conversation…'}
          </div>
        )}

        {!isHydrating && messages.length === 0 && (
          <div className="chat-page__empty">
            <div className="chat-page__empty-presence" aria-hidden="true">
              <MilaVoiceMark size={92} />
              <span className="chat-page__status-dot" />
            </div>
            <p className="chat-page__empty-kicker">{lang === 'ru' ? 'Джиа здесь' : 'Gia is here'}</p>
            <h1 className="chat-page__empty-title">
              {lang==='ru' ? 'О чём думаешь?' : 'What’s on your mind?'}
            </h1>
            <p className="chat-page__empty-copy">
              {targetLanguage === 'auto'
                ? (lang === 'ru'
                    ? 'Пиши естественно на любом языке. Джиа поймёт смысл и поможет найти нужные слова, когда тебе это понадобится.'
                    : 'Write naturally in any language. Gia follows your meaning and helps you find the words when you want them.')
                : (lang === 'ru'
                    ? `Пиши как есть. Джиа поможет тебе говорить на ${selectedLanguage.ru.toLowerCase()}, но легко продолжит на любом языке, который ты используешь.`
                    : `Write naturally. Gia can help you speak ${selectedLanguage.en}, or follow whatever language you use.`)}
            </p>
            <div className="chat-page__starters" aria-label={lang === 'ru' ? 'Начать с подсказки' : 'Start with a prompt'}>
              {starterPrompts.map((prompt) => (
                <button type="button" key={prompt} onClick={() => chooseStarter(prompt)}>
                  <span>{prompt}</span><MilaIcon name="arrow" size={16} />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`chat-page__row ${m.role === 'user' ? 'is-user' : 'is-assistant'}`}>
            {m.role !== 'user' ? (
              <span className="chat-page__mila-avatar" aria-label="Gia">
                <MilaVoiceMark size={29} />
              </span>
            ) : null}
            <div className="chat-page__bubble">
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-page__row is-assistant">
            <div className="chat-page__bubble chat-page__bubble--typing">
              {lang==='ru' ? 'Джиа печатает...' : 'Gia is typing...'}
            </div>
          </div>
        )}
        {(historyError || clearError) && (
          <div role="status" className="chat-page__error">
            {lang==='ru'
              ? 'История сейчас недоступна, но можно продолжить разговор.'
              : 'History is unavailable right now, but you can keep chatting.'}
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="chat-page__composer">
        <form onSubmit={handleSubmit} className="chat-page__form">
          <button
            type="button"
            className="chat-page__voice-button"
            onClick={() => router.push('/darshan')}
            aria-label={lang==='ru' ? 'Начать голосовой разговор' : 'Start a voice conversation'}
            title={lang==='ru' ? 'Говорить с Джиа' : 'Talk with Gia'}
          >
            <MilaIcon name="voice" size={19}/>
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder={lang==='ru' ? 'Спроси Джиа или начни разговор…' : 'Ask Gia anything or start a conversation…'}
            disabled={isLoading || isHydrating || isClearing}
            aria-label={lang==='ru' ? 'Сообщение для Джиа' : 'Message Gia'}
          />
          <button className="chat-page__send-button" type="submit" disabled={isLoading || isHydrating || isClearing || !input.trim()} aria-label={lang==='ru' ? 'Отправить' : 'Send'}>
            <MilaIcon name="arrow" size={18}/>
          </button>
        </form>
        <div className="chat-page__hint">
          {lang==='ru' ? 'Скажи «Запомни, что…», чтобы сохранить важную деталь' : 'Say “Remember that…” to save an important detail'}
        </div>
      </footer>
    </AppShell>
  );
}
