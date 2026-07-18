'use client';

import { useChat } from 'ai/react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import LangToggle from '@/components/LangToggle';
import { AppHeader, AppShell } from '@/components/ui/AppShell';
import MilaIcon from '@/components/ui/MilaIcon';
import { useI18n } from '@/lib/i18n-provider';
import { announceCompanionHistoryCleared, announceCompanionHistoryUpdated, useCompanionHistory } from '@/lib/use-companion-history';

export default function Chat() {
  const { lang } = useI18n();
  const router = useRouter();
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, setInput } = useChat({
    id: 'mila-full-chat',
    api: '/api/chat',
    body: { context: { pathname: '/chat', lang, surface: 'chat' } },
    onFinish: () => announceCompanionHistoryUpdated(),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [m, setM] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState(false);
  const { isHydrating, historyError } = useCompanionHistory({ limit: 40, setMessages });

  useEffect(() => { setM(true); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        'Давай потренируем живой разговор',
        'Помоги сказать это естественно',
        'Мягко объясни мою ошибку',
      ]
    : [
        'Let’s practise a real conversation',
        'Help me say this naturally',
        'Explain my mistake gently',
      ];

  const chooseStarter = (prompt: string) => {
    setInput(prompt);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  if (!m) return null;

  return (
    <AppShell className="chat-page" fullHeight>
      <AppHeader
        title={lang==='ru' ? 'Чат с Милой' : 'Chat with Mila'}
        eyebrow={lang==='ru' ? 'Текстовый разговор' : 'Text conversation'}
        actions={
          <>
          <button
            type="button"
            onClick={clearConversation}
            disabled={isHydrating || isLoading || isClearing || messages.length === 0}
            aria-label={lang==='ru' ? 'Начать новый разговор' : 'Start a new conversation'}
            title={lang==='ru' ? 'Новый разговор' : 'New conversation'}
            className="app-header__button"
          >
            {isClearing ? (lang==='ru' ? 'Очищаю…' : 'Clearing…') : (lang==='ru' ? 'Новый чат' : 'New chat')}
          </button>
          <LangToggle/>
          </>
        }
      />

      <main className="chat-page__messages" aria-live="polite">
        <div className="chat-page__stream">
        {isHydrating && messages.length === 0 && (
          <div className="chat-page__status">
            {lang==='ru' ? 'Мила вспоминает ваш разговор…' : 'Mila is remembering your conversation…'}
          </div>
        )}

        {!isHydrating && messages.length === 0 && (
          <div className="chat-page__empty">
            <div className="chat-page__empty-presence" aria-hidden="true">
              <Image src="/mascot/mila-mascot.png" alt="" width={1254} height={1254} priority />
              <span />
            </div>
            <p className="chat-page__empty-kicker">{lang === 'ru' ? 'Мила здесь' : 'Mila is here'}</p>
            <h1 className="chat-page__empty-title">
              {lang==='ru' ? 'О чём думаешь?' : 'What’s on your mind?'}
            </h1>
            <p className="chat-page__empty-copy">
              {lang==='ru'
                ? 'Пиши как есть — на русском или английском. Я помогу продолжить мысль и, если нужно, подскажу более естественную английскую фразу.'
                : 'Write naturally—in Russian or English. I’ll follow your meaning and, when useful, offer a more natural English phrase.'}
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
              <span className="chat-page__mila-avatar" aria-label="Mila">
                <Image src="/mascot/mila-mascot.png" alt="" width={1254} height={1254} />
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
              {lang==='ru' ? 'Мила печатает...' : 'Mila is typing...'}
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
            title={lang==='ru' ? 'Говорить с Милой' : 'Talk with Mila'}
          >
            <MilaIcon name="voice" size={19}/>
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            placeholder={lang==='ru' ? 'Спроси Милу или попрактикуйся…' : 'Ask Mila anything or practise English…'}
            disabled={isLoading || isHydrating || isClearing}
            aria-label={lang==='ru' ? 'Сообщение для Милы' : 'Message Mila'}
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
