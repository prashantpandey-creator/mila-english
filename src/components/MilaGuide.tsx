// @ts-nocheck
'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useChat } from 'ai/react'
import { useI18n } from '@/lib/i18n-provider'
import { announceCompanionHistoryUpdated, useCompanionHistory } from '@/lib/use-companion-history'

type GuideContext = {
  authenticated: boolean
  name?: string
  level?: string | null
  streakDays?: number
  continueHref?: string
  continueTitle?: string
  continueTitleRu?: string
}

const PAGE_LABELS: Record<string, { en: string; ru: string }> = {
  '/': { en: 'Welcome', ru: 'Главная' },
  '/dashboard': { en: 'Learning home', ru: 'Главная обучения' },
  '/assessment': { en: 'Level check', ru: 'Проверка уровня' },
  '/lessons': { en: 'Lessons', ru: 'Уроки' },
  '/listen': { en: 'Listening', ru: 'Аудирование' },
  '/vocabulary': { en: 'Vocabulary', ru: 'Слова' },
  '/grammar': { en: 'Grammar', ru: 'Грамматика' },
  '/phonetics': { en: 'Phonetics', ru: 'Фонетика' },
  '/progress': { en: 'Progress', ru: 'Прогресс' },
  '/achievements': { en: 'Achievements', ru: 'Достижения' },
  '/chat': { en: 'Tutor chat', ru: 'Чат с наставницей' },
  '/darshan': { en: 'Voice room', ru: 'Голосовая комната' },
}

function pageKey(pathname: string) {
  if (pathname.startsWith('/lessons/')) return '/lessons'
  return PAGE_LABELS[pathname] ? pathname : '/dashboard'
}

export default function MilaGuide() {
  const { lang } = useI18n()
  const pathname = usePathname() || '/'
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [context, setContext] = useState<GuideContext | null>(null)
  const [guideError, setGuideError] = useState('')

  const {
    messages,
    input,
    setInput,
    setMessages,
    handleInputChange,
    handleSubmit,
    append,
    isLoading,
  } = useChat({
    id: 'mila-floating-guide',
    api: '/api/chat',
    body: { context: { pathname, lang, surface: 'guide' } },
    onError: () => setGuideError(lang === 'ru' ? 'Не получилось ответить. Попробуем ещё раз?' : 'I could not answer that. Shall we try again?'),
    onFinish: () => announceCompanionHistoryUpdated(),
  })
  const { isHydrating: isHistoryHydrating, refreshHistory } = useCompanionHistory({ limit: 12, setMessages })

  const page = PAGE_LABELS[pageKey(pathname)]
  const agentState = listening ? 'listening' : isLoading ? 'thinking' : speaking ? 'speaking' : 'idle'
  const isVoiceRoom = pathname.startsWith('/darshan')

  const welcome = useMemo(() => {
    if (pathname === '/') return lang === 'ru'
      ? 'Привет! Я Мила. Покажу, как всё устроено, и помогу начать.'
      : "Hi! I'm Mila. I can show you around and help you begin."
    if (pathname.startsWith('/lessons/')) return lang === 'ru'
      ? 'Я рядом. Спроси про фразу, правило или произношение из этого урока.'
      : 'I’m here. Ask me about any phrase, rule, or sound in this lesson.'
    if (pathname === '/dashboard') return lang === 'ru'
      ? 'Давай выберем лучший следующий шаг — или немного поговорим по-английски.'
      : 'Let’s choose your best next step—or practise a little English.'
    return lang === 'ru'
      ? `Ты в разделе «${page.ru}». Я могу объяснить его или предложить следующий шаг.`
      : `You’re in ${page.en}. I can explain this page or suggest what to do next.`
  }, [lang, page.en, page.ru, pathname])

  useEffect(() => {
    setMounted(true)
    setSpeechSupported(Boolean(window.speechSynthesis && (window.SpeechRecognition || window.webkitSpeechRecognition)))

    const timer = window.setTimeout(() => {
      const alreadyShown = sessionStorage.getItem('mila-guide-nudge')
      if (!alreadyShown && pathname !== '/darshan') {
        setNudge(true)
        sessionStorage.setItem('mila-guide-nudge', '1')
      }
    }, 1100)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!mounted) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, mounted])

  useEffect(() => {
    if (open && context?.authenticated) void refreshHistory()
  }, [context?.authenticated, open, refreshHistory])

  useEffect(() => {
    let cancelled = false
    fetch('/api/guide/context')
      .then(async (response) => {
        if (response.status === 401) return { authenticated: false }
        return response.ok ? response.json() : { authenticated: false }
      })
      .then((value) => { if (!cancelled) setContext(value) })
      .catch(() => { if (!cancelled) setContext({ authenticated: false }) })
    return () => { cancelled = true }
  }, [pathname])

  useEffect(() => {
    if (!open) return
    setNudge(false)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 120)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const ask = async (prompt: string) => {
    if (!context?.authenticated || isLoading || isHistoryHydrating) return
    setGuideError('')
    await append({ role: 'user', content: prompt })
  }

  const startGuest = async () => {
    setGuideError('')
    const response = await fetch('/api/auth/guest', { method: 'POST' }).catch(() => null)
    if (!response?.ok) {
      setGuideError(lang === 'ru' ? 'Не удалось начать. Попробуй ещё раз.' : 'I could not start a session. Please try again.')
      return
    }
    router.push('/dashboard')
    router.refresh()
    setContext(null)
  }

  const startListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition || listening) return
    const recognition = new Recognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript
      if (transcript) setInput(transcript)
    }
    recognition.start()
  }

  const speak = (text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.92
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (isHistoryHydrating) {
      event.preventDefault()
      return
    }
    setGuideError('')
    handleSubmit(event)
  }

  if (!mounted || isVoiceRoom) return null

  const continueLabel = lang === 'ru' ? context?.continueTitleRu : context?.continueTitle
  const status = agentState === 'thinking'
    ? (lang === 'ru' ? 'Думаю…' : 'Thinking…')
    : agentState === 'listening'
      ? (lang === 'ru' ? 'Слушаю…' : 'Listening…')
      : agentState === 'speaking'
        ? (lang === 'ru' ? 'Говорю…' : 'Speaking…')
        : (lang === 'ru' ? 'Готова помочь' : 'Ready to help')

  return (
    <aside className={`mila-guide ${pathname === '/' ? 'is-home' : ''} ${open ? 'is-open' : ''}`} data-state={agentState} aria-label={lang === 'ru' ? 'Помощница Мила' : 'Mila assistant'}>
      {open && (
        <section className="mila-guide__panel" role="dialog" aria-modal="false" aria-label={lang === 'ru' ? 'Чат с Милой' : 'Chat with Mila'}>
          <header className="mila-guide__header">
            <div className="mila-guide__portrait" aria-hidden>
              <Image src="/mascot/mila-mascot.png" alt="" width={1254} height={1254} priority />
              <i />
            </div>
            <div className="mila-guide__identity">
              <strong>Mila</strong>
              <span><i />{status}</span>
            </div>
            <span className="mila-guide__page">{lang === 'ru' ? page.ru : page.en}</span>
            <button className="mila-guide__close" type="button" onClick={() => setOpen(false)} aria-label={lang === 'ru' ? 'Закрыть' : 'Close'}>×</button>
          </header>

          <div className="mila-guide__messages" aria-live="polite">
            {isHistoryHydrating && messages.length === 0 && context?.authenticated && (
              <div className="mila-guide__welcome">
                <p>{lang === 'ru' ? 'Вспоминаю наш разговор…' : 'Remembering our conversation…'}</p>
              </div>
            )}

            {!isHistoryHydrating && messages.length === 0 && (
              <div className="mila-guide__welcome">
                <p>{welcome}</p>
                {context?.name && <small>{lang === 'ru' ? `Рада видеть тебя, ${context.name}.` : `Good to see you, ${context.name}.`}</small>}
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`mila-guide__message is-${message.role}`}>
                <p>{message.content}</p>
                {message.role === 'assistant' && (
                  <button type="button" onClick={() => speak(message.content)} aria-label={lang === 'ru' ? 'Озвучить ответ' : 'Read answer aloud'} title={lang === 'ru' ? 'Озвучить' : 'Listen'}>
                    <svg viewBox="0 0 24 24" aria-hidden><path d="M5 14h3l4 4V6L8 10H5zM16 9.5a4 4 0 0 1 0 5M19 7a7 7 0 0 1 0 10" /></svg>
                  </button>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="mila-guide__working" aria-label={status}>
                <span /><span /><span />
              </div>
            )}
            {guideError && <p className="mila-guide__error">{guideError}</p>}
            <div ref={messagesEndRef} />
          </div>

          <div className="mila-guide__actions">
            {context?.authenticated && context.continueHref && (
              <button type="button" onClick={() => router.push(context.continueHref!)}><span>↗</span>{continueLabel}</button>
            )}
            {context?.authenticated && (
              <>
                <button type="button" disabled={isHistoryHydrating} onClick={() => ask(lang === 'ru' ? 'Объясни, что я могу делать на этой странице.' : 'Explain what I can do on this page.')}><span>?</span>{lang === 'ru' ? 'Объясни страницу' : 'Explain this page'}</button>
                <button type="button" onClick={() => router.push('/darshan')}><span>◉</span>{lang === 'ru' ? 'Поговорить голосом' : 'Voice practice'}</button>
              </>
            )}
          </div>

          {context?.authenticated ? (
            <form className="mila-guide__composer" onSubmit={submit}>
              <button className={`mila-guide__mic ${listening ? 'is-listening' : ''}`} type="button" onClick={startListening} disabled={!speechSupported || isLoading || isHistoryHydrating} aria-label={lang === 'ru' ? 'Сказать вопрос' : 'Speak a question'} title={speechSupported ? (lang === 'ru' ? 'Говорить' : 'Speak') : (lang === 'ru' ? 'Голосовой ввод недоступен' : 'Voice input unavailable')}>
                <svg viewBox="0 0 24 24" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>
              </button>
              <input ref={inputRef} value={input} onChange={handleInputChange} disabled={isLoading || isHistoryHydrating} placeholder={lang === 'ru' ? 'Спроси Милу…' : 'Ask Mila…'} aria-label={lang === 'ru' ? 'Сообщение Миле' : 'Message Mila'} />
              <button className="mila-guide__send" type="submit" disabled={isLoading || isHistoryHydrating || !input.trim()} aria-label={lang === 'ru' ? 'Отправить' : 'Send'}>↑</button>
            </form>
          ) : (
            <div className="mila-guide__guest">
              <p>{lang === 'ru' ? 'Начни бесплатную сессию, чтобы я могла запомнить твой прогресс.' : 'Start a free session so I can remember your progress.'}</p>
              <div>
                <button type="button" onClick={startGuest}>{lang === 'ru' ? 'Начать бесплатно' : 'Start free'}</button>
                <button type="button" onClick={() => router.push('/login')}>{lang === 'ru' ? 'Войти' : 'Sign in'}</button>
              </div>
            </div>
          )}
        </section>
      )}

      {!open && nudge && (
        <button className="mila-guide__nudge" type="button" onClick={() => setOpen(true)}>
          <strong>{lang === 'ru' ? 'Мила рядом' : 'Mila is here'}</strong>
          <span>{lang === 'ru' ? 'Спросить или продолжить урок' : 'Ask anything or continue learning'}</span>
        </button>
      )}

      <button className="mila-guide__launcher" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? (lang === 'ru' ? 'Свернуть Милу' : 'Collapse Mila') : (lang === 'ru' ? 'Открыть помощницу Милу' : 'Open Mila assistant')}>
        <span className="mila-guide__orbit" aria-hidden><i /><i /></span>
        <Image src="/mascot/mila-mascot.png" alt="" width={1254} height={1254} priority />
        <span className="mila-guide__state" aria-hidden />
      </button>
    </aside>
  )
}
