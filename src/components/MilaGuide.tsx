// @ts-nocheck
'use client'

import Image from 'next/image'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useChat } from 'ai/react'
import { useI18n } from '@/lib/i18n-provider'
import { announceCompanionHistoryUpdated, useCompanionHistory } from '@/lib/use-companion-history'
import { MASCOT_PITCH, createStreamingTtsSession, spokenLocaleForText, ttsSpeakBrowser } from '@/lib/tts'
import { startLocalTranscription } from '@/lib/localTranscription'
import { streamVoiceReply } from '@/lib/voiceChatStream'
import { parseVoiceCommand } from '@/lib/voiceCommands'
import { endpointSilenceMs, pickBackchannel } from '@/lib/voiceTurn'
import { toSpokenText } from '@/lib/spokenText'

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
  const [voiceMode, setVoiceMode] = useState(false)
  const [voiceCaption, setVoiceCaption] = useState('')
  const pendingSpeakRef = useRef<{ text: string; locale: string } | null>(null)
  const guidePartialRef = useRef<string | null>(null)
  const backchannelIdxRef = useRef<number | null>(null)
  const turnSeedRef = useRef(0)

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
      if (alreadyShown || pathname === '/darshan') return
      sessionStorage.setItem('mila-guide-nudge', '1')
      // On the welcome door, Mila opens herself and greets like a receptionist —
      // the first thing a new (often confused) visitor sees is a friendly hello
      // with tappable options. Inside the app she keeps the lighter nudge so she
      // never interrupts someone mid-task.
      if (pathname === '/') setOpen(true)
      else setNudge(true)
    }, pathname === '/' ? 1500 : 1100)
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

  // ── Hands-free voice mode ─────────────────────────────────────────────────
  // Darshan hands off here on a spoken navigation command ("open lessons"):
  // it minimizes into this mascot, which announces the move and keeps
  // listening on every page. Conversation turns ride the FAST voice model
  // (surface 'voice') with the current pathname, so "what is this?" answers
  // about the page you are on. Spoken commands keep navigating.
  useEffect(() => {
    const onVoiceMode = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.speak) pendingSpeakRef.current = { text: detail.speak, locale: detail.locale || 'en-US' }
      // Consume the reload-safety flag so a later full page load does not
      // re-arm voice mode unexpectedly.
      try { sessionStorage.removeItem('mila-voice-mode') } catch { /* storage unavailable */ }
      setOpen(false)
      setVoiceMode(true)
    }
    window.addEventListener('mila-voice-mode', onVoiceMode)
    try {
      if (sessionStorage.getItem('mila-voice-mode') === '1') {
        sessionStorage.removeItem('mila-voice-mode')
        setVoiceMode(true)
      }
    } catch { /* storage unavailable */ }
    return () => window.removeEventListener('mila-voice-mode', onVoiceMode)
  }, [])

  useEffect(() => {
    if (!voiceMode || isVoiceRoom || !context?.authenticated) return
    let alive = true
    let session: { stop: () => Promise<unknown>; cancel: () => void } | null = null
    let restartTimer: number | null = null
    let fillerPlayedThisTurn = false

    const schedule = (ms: number) => {
      if (!alive) return
      restartTimer = window.setTimeout(() => void listen(), ms)
    }

    const handleVoiceTurn = async (raw: string) => {
      const text = raw.trim()
      session = null
      setListening(false)
      if (!text || !alive) return schedule(500)
      setVoiceCaption(text)
      const command = parseVoiceCommand(text)
      const locale = spokenLocaleForText(text, lang === 'ru' ? 'ru-RU' : 'en-US')
      if (command) {
        const confirmation = command.kind === 'back'
          ? (lang === 'ru' ? 'Возвращаюсь.' : 'Going back.')
          : (lang === 'ru' ? `Открываю: ${command.labelRu}.` : `Opening ${command.labelEn}.`)
        pendingSpeakRef.current = { text: confirmation, locale }
        setVoiceCaption(confirmation)
        if (command.kind === 'back') router.back()
        else router.push(command.route)
        return // pathname change re-runs this effect and resumes listening
      }
      setGuideError('')
      try {
        // The endpoint filler may still be humming — never cancel over it.
        const tts = await createStreamingTtsSession(
          locale, 0.98, () => setSpeaking(true), !fillerPlayedThisTurn, MASCOT_PITCH,
        )
        const { reply } = await streamVoiceReply({
          text,
          lang: lang === 'ru' ? 'ru' : 'en',
          pathname,
          onDelta: (full) => {
            const spoken = toSpokenText(full)
            if (spoken && alive) {
              setVoiceCaption(spoken)
              tts.push(spoken)
            }
          },
        })
        const spoken = toSpokenText(reply)
        if (spoken) {
          announceCompanionHistoryUpdated()
          setVoiceCaption(spoken)
          await tts.finish(spoken, true)
        } else {
          tts.cancel()
        }
      } catch {
        if (alive) setGuideError(lang === 'ru' ? 'Не получилось ответить.' : 'I could not answer that.')
      } finally {
        setSpeaking(false)
      }
      schedule(400)
    }

    const listen = async () => {
      if (!alive) return
      const pending = pendingSpeakRef.current
      pendingSpeakRef.current = null
      if (pending) {
        setVoiceCaption(pending.text)
        await ttsSpeakBrowser(pending.text, pending.locale, 1, MASCOT_PITCH).catch(() => {})
      }
      if (!alive) return
      guidePartialRef.current = null
      fillerPlayedThisTurn = false
      try {
        const started = await startLocalTranscription({
          language: 'auto',
          partialAfterMs: 450,
          getSilenceMs: () => endpointSilenceMs(guidePartialRef.current),
          onPartial: (partial) => {
            guidePartialRef.current = partial.text
            if (alive) setVoiceCaption(partial.text)
          },
          onScoring: () => {
            // End of turn — first sound before transcription finishes, same
            // craft the old voice room had.
            if (!alive || fillerPlayedThisTurn) return
            fillerPlayedThisTurn = true
            turnSeedRef.current += 1
            const fillerLocale = spokenLocaleForText(
              guidePartialRef.current || '',
              lang === 'ru' ? 'ru-RU' : 'en-US',
            )
            const pick = pickBackchannel(
              fillerLocale === 'ru-RU' ? 'ru' : 'en',
              turnSeedRef.current,
              backchannelIdxRef.current,
            )
            backchannelIdxRef.current = pick.index
            void ttsSpeakBrowser(pick.text, fillerLocale, 1, MASCOT_PITCH)
          },
          onAutoStop: (transcript) => void handleVoiceTurn(transcript.text),
          onError: (error) => {
            session = null
            setListening(false)
            if (!alive || error.message === 'cancelled') return
            if (error.message === 'no-speech' || error.message === 'transcribe-empty') return schedule(600)
            setVoiceMode(false)
          },
        })
        if (!alive) return started.cancel()
        session = started
        setListening(true)
      } catch {
        if (alive) setVoiceMode(false)
      }
    }

    void listen()
    return () => {
      alive = false
      if (restartTimer !== null) window.clearTimeout(restartTimer)
      session?.cancel()
      setListening(false)
      setSpeaking(false)
      setVoiceCaption('')
      window.speechSynthesis?.cancel()
    }
  }, [voiceMode, isVoiceRoom, context?.authenticated, pathname, lang, router])

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

  // Guest FAQ chips answer INLINE — no login wall, no empty composer. Canned
  // bilingual replies so "Is it free?" gets answered the instant it's asked;
  // the real LLM chat opens once they start a session.
  const faqAnswer = (question: string, answerEn: string, answerRu: string) => {
    setGuideError('')
    setMessages((prev) => [
      ...prev,
      { id: `faq-q-${Date.now()}`, role: 'user', content: question },
      { id: `faq-a-${Date.now() + 1}`, role: 'assistant', content: lang === 'ru' ? answerRu : answerEn },
    ])
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

  // The mascot speaks in its own character voice — browser engine with the
  // MASCOT_PITCH profile — so the little robot and its voice finally match.
  // (Piper's studio voice stays for lesson/reading audio elsewhere.)
  const speak = async (text: string) => {
    setSpeaking(true)
    try {
      await ttsSpeakBrowser(text, spokenLocaleForText(text, lang === 'ru' ? 'ru-RU' : 'en-US'), 0.95, MASCOT_PITCH)
    } finally {
      setSpeaking(false)
    }
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
                {/* Members get quick-start questions inline; guest FAQ chips live
                    in the always-visible actions row so they survive an answer. */}
                {context?.authenticated && (
                  <div className="mila-guide__chips">
                    {context.continueHref && (
                      <button type="button" onClick={() => router.push(context.continueHref!)}>{continueLabel || (lang === 'ru' ? 'Продолжить' : 'Continue')}</button>
                    )}
                    <button type="button" disabled={isHistoryHydrating} onClick={() => ask(lang === 'ru' ? 'С чего мне лучше начать сегодня?' : 'What should I start with today?')}>{lang === 'ru' ? 'С чего начать?' : 'Where do I start?'}</button>
                    <button type="button" onClick={() => router.push('/assessment')}>{lang === 'ru' ? 'Проверить уровень' : 'Check my level'}</button>
                    <button type="button" onClick={() => { setOpen(false); setVoiceMode(true) }}>{lang === 'ru' ? 'Поговорить голосом' : 'Voice practice'}</button>
                  </div>
                )}
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
            {context?.authenticated ? (
              <>
                <button type="button" disabled={isHistoryHydrating} onClick={() => ask(lang === 'ru' ? 'Объясни, что я могу делать на этой странице.' : 'Explain what I can do on this page.')}><span>?</span>{lang === 'ru' ? 'Объясни страницу' : 'Explain this page'}</button>
                <button type="button" onClick={() => { setOpen(false); setVoiceMode(true) }}><span>◉</span>{lang === 'ru' ? 'Поговорить голосом' : 'Voice practice'}</button>
              </>
            ) : context && (
              // Guest FAQ — always visible so answers don't consume the options.
              <>
                <button type="button" onClick={() => faqAnswer(
                  lang === 'ru' ? 'Что это за приложение?' : 'What is this app?',
                  'Mila is a personal English tutor. She hears every sound you speak, gives gentle feedback, builds lessons around your goals, and you can practise by voice — all in a friendly chat like this.',
                  'Mila — персональная наставница по английскому. Она слышит каждый твой звук, мягко поправляет, собирает уроки под твои цели, и с ней можно говорить голосом — всё в дружеском чате, как этот.',
                )}><span>?</span>{lang === 'ru' ? 'Что это?' : 'What is this?'}</button>
                <button type="button" onClick={() => faqAnswer(
                  lang === 'ru' ? 'Это бесплатно?' : 'Is it free?',
                  'Yes — start free right now, no card needed. Tap “Start free” below.',
                  'Да — начни бесплатно прямо сейчас, без карты. Нажми «Начать бесплатно» ниже.',
                )}><span>₽</span>{lang === 'ru' ? 'Это бесплатно?' : 'Is it free?'}</button>
                <button type="button" onClick={() => router.push('/assessment')}><span>◎</span>{lang === 'ru' ? 'Проверить уровень' : 'Check my level'}</button>
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

      {/* Voice-mode caption — what she heard and what she is saying, floating
          above the mascot while the panel stays closed. */}
      {voiceMode && !open && voiceCaption && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed', right: 18, bottom: 96, maxWidth: 300, zIndex: 60,
            background: 'rgba(22, 17, 30, 0.92)', color: '#fff', borderRadius: 14,
            padding: '10px 14px', fontSize: 13, lineHeight: 1.45, pointerEvents: 'none',
            maxHeight: 130, overflow: 'hidden',
          }}
        >
          {voiceCaption}
        </div>
      )}

      <button
        className="mila-guide__launcher"
        type="button"
        onClick={() => {
          if (voiceMode) { setVoiceMode(false); return }
          setOpen((value) => !value)
        }}
        aria-expanded={open}
        aria-label={voiceMode
          ? (lang === 'ru' ? 'Остановить голосовой режим' : 'Stop voice mode')
          : open
            ? (lang === 'ru' ? 'Свернуть Милу' : 'Collapse Mila')
            : (lang === 'ru' ? 'Открыть помощницу Милу' : 'Open Mila assistant')}
        title={voiceMode ? (lang === 'ru' ? 'Голосовой режим — коснись, чтобы остановить' : 'Voice mode — tap to stop') : undefined}
      >
        <span className="mila-guide__orbit" aria-hidden><i /><i /></span>
        <Image src="/mascot/mila-mascot.png" alt="" width={1254} height={1254} priority />
        <span className="mila-guide__state" aria-hidden />
      </button>
    </aside>
  )
}
