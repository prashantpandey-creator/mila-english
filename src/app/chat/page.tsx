'use client';

import { useChat } from 'ai/react';
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
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    id: 'mila-full-chat',
    api: '/api/chat',
    body: { context: { pathname: '/chat', lang, surface: 'chat' } },
    onFinish: () => announceCompanionHistoryUpdated(),
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  if (!m) return null;

  return (
    <AppShell className="chat-page" fullHeight>
      <AppHeader
        title={lang==='ru' ? 'Наставница' : 'Tutor & companion'}
        eyebrow={lang==='ru' ? 'Разговор' : 'Conversation'}
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
            <span className="chat-page__empty-icon" aria-hidden="true"><MilaIcon name="conversation" size={24}/></span>
            <div className="chat-page__empty-title">
              {lang==='ru' ? 'Начни разговор!' : 'Start a conversation!'}
            </div>
            <div className="chat-page__empty-copy">
              {lang==='ru'
                ? 'Спроси о чём угодно или начни практику английского. Мила помнит контекст между страницами.'
                : 'Ask about anything or start an English practice. Mila keeps the conversation going when you move around the app.'}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`chat-page__row ${m.role === 'user' ? 'is-user' : 'is-assistant'}`}>
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
