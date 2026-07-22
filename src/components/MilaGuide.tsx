// @ts-nocheck
'use client'

import Image from 'next/image'
import { FormEvent, KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useChat } from 'ai/react'
import { useI18n } from '@/lib/i18n-provider'
import { announceCompanionHistoryUpdated, useCompanionHistory } from '@/lib/use-companion-history'
import { MASCOT_PITCH, createStreamingTtsSession, prefetchFillerClips, spokenLocaleForText, ttsSpeak, ttsSpeakBrowser, ttsSpeakFiller } from '@/lib/tts'
import { startLocalTranscription } from '@/lib/localTranscription'
import { streamVoiceReply } from '@/lib/voiceChatStream'
import { parseVoiceCommand } from '@/lib/voiceCommands'
import { backchannelTexts, endpointSilenceMs, pickBackchannel } from '@/lib/voiceTurn'
import { toSpokenText } from '@/lib/spokenText'
import { hasActiveSession } from '@/lib/guestSession'
import MilaIcon from '@/components/ui/MilaIcon'

type GuideContext = {
  authenticated: boolean
  name?: string
  level?: string | null
  streakDays?: number
  continueHref?: string
  continueTitle?: string
  continueTitleRu?: string
}

// A short deferral is unavoidable when one pointer target supports both a
// single- and double-click. It prevents the first click of a double-click from
// requesting microphone permission before the text-chat intent is known.
const LAUNCHER_SINGLE_CLICK_DELAY_MS = 360

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
  '/practice': { en: 'Speaking practice', ru: 'Разговорная практика' },
  '/darshan': { en: 'Voice room', ru: 'Голосовая комната' },
}

const COMPANION_INTEGRATED_ROUTES = ['/assessment', '/chat', '/listen', '/phonetics', '/practice', '/voice-lab', '/darshan', '/pia', '/login', '/register', '/privacy', '/support']

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
  const launcherRef = useRef<HTMLButtonElement>(null)
  const dictationRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [context, setContext] = useState<GuideContext | null>(null)
  const [guideError, setGuideError] = useState('')
  const [voiceMode, setVoiceMode] = useState(false)
  const [voicePending, setVoicePending] = useState(false)
  const [voiceCaption, setVoiceCaption] = useState('')
  const pendingSpeakRef = useRef<{ text: string; locale: string } | null>(null)
  const guidePartialRef = useRef<string | null>(null)
  const backchannelIdxRef = useRef<number | null>(null)
  const turnSeedRef = useRef(0)
  const guestTriedRef = useRef(false)
  const launcherClickTimerRef = useRef<number | null>(null)
  const voiceBootTimerRef = useRef<number | null>(null)
  const launcherPointerDownRef = useRef(0)
  const voiceModeRef = useRef(false)

  const clearLauncherClick = useCallback(() => {
    setVoicePending(false)
    if (launcherClickTimerRef.current === null) return
    window.clearTimeout(launcherClickTimerRef.current)
    launcherClickTimerRef.current = null
  }, [])

  const clearVoiceBootTimer = useCallback(() => {
    if (voiceBootTimerRef.current === null) return
    window.clearTimeout(voiceBootTimerRef.current)
    voiceBootTimerRef.current = null
  }, [])

  const closeTextChat = useCallback(() => {
    setOpen(false)
    window.setTimeout(() => launcherRef.current?.focus(), 0)
  }, [])

  const openTextChat = useCallback((notice = '') => {
    clearLauncherClick()
    clearVoiceBootTimer()
    voiceModeRef.current = false
    setVoiceMode(false)
    setVoiceCaption('')
    setNudge(false)
    setGuideError(notice)
    setOpen(true)
  }, [clearLauncherClick, clearVoiceBootTimer])

  const voiceFallbackNotice = useCallback((reason: 'microphone' | 'session' = 'microphone') => {
    if (lang === 'ru') {
      return reason === 'session'
        ? 'Не удалось начать голосовую сессию. Я открыла текстовый чат — можем продолжить здесь.'
        : 'Микрофон сейчас недоступен. Я открыла текстовый чат — напиши мне здесь.'
    }
    return reason === 'session'
      ? "I couldn't start a voice session. I've opened text chat so we can continue here."
      : "I couldn't start the microphone. I've opened text chat—type to me here instead."
  }, [lang])

  const fallBackToTextChat = useCallback((reason: 'microphone' | 'session' = 'microphone') => {
    openTextChat(voiceFallbackNotice(reason))
    if (context?.authenticated) return

    // Text fallback must be a real conversation, including for first-time
    // visitors. Seat the private guest session in the background; if that is
    // unavailable the panel still keeps the explicit free-session controls.
    void hasActiveSession().then(async (seated) => {
      if (!seated) return
      const fresh = await fetch('/api/guide/context')
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null)
      if (fresh?.authenticated) setContext(fresh)
    })
  }, [context?.authenticated, openTextChat, voiceFallbackNotice])

  const startVoiceConversation = useCallback(() => {
    clearLauncherClick()
    setGuideError('')
    setNudge(false)

    const microphoneSupported = Boolean(
      navigator.mediaDevices?.getUserMedia
      && window.MediaRecorder
      && (window.AudioContext || window.webkitAudioContext),
    )
    if (!microphoneSupported) {
      fallBackToTextChat('microphone')
      return
    }

    setOpen(false)
    setVoiceCaption(lang === 'ru' ? 'Подключаю микрофон…' : 'Starting the microphone…')
    voiceModeRef.current = true
    setVoiceMode(true)
    clearVoiceBootTimer()
    voiceBootTimerRef.current = window.setTimeout(() => {
      if (voiceModeRef.current) fallBackToTextChat('session')
    }, 15_000)
  }, [clearLauncherClick, clearVoiceBootTimer, fallBackToTextChat, lang])

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
  const agentState = listening ? 'listening' : isLoading || voicePending ? 'thinking' : speaking ? 'speaking' : 'idle'
  const isVoiceRoom = COMPANION_INTEGRATED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))

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

    let hideTimer: number | undefined
    const timer = window.setTimeout(() => {
      const alreadyShown = sessionStorage.getItem('mila-guide-nudge')
      if (alreadyShown || isVoiceRoom) return
      sessionStorage.setItem('mila-guide-nudge', '1')
      setNudge(true)
      hideTimer = window.setTimeout(() => setNudge(false), 5200)
    }, pathname === '/' ? 1700 : 1100)
    return () => {
      window.clearTimeout(timer)
      if (hideTimer) window.clearTimeout(hideTimer)
    }
  }, [isVoiceRoom, pathname])

  useEffect(() => () => {
    clearLauncherClick()
    clearVoiceBootTimer()
  }, [clearLauncherClick, clearVoiceBootTimer])

  useEffect(() => { voiceModeRef.current = voiceMode }, [voiceMode])

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
      if (event.key === 'Escape') closeTextChat()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [closeTextChat, open])

  useEffect(() => {
    if (open) return
    const recognition = dictationRef.current
    dictationRef.current = null
    try { recognition?.abort?.() } catch {}
  }, [open, pathname])

  useEffect(() => () => {
    const recognition = dictationRef.current
    dictationRef.current = null
    try { recognition?.abort?.() } catch {}
  }, [])

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
      voiceModeRef.current = true
      setVoiceMode(true)
    }
    window.addEventListener('mila-voice-mode', onVoiceMode)
    try {
      if (sessionStorage.getItem('mila-voice-mode') === '1') {
        sessionStorage.removeItem('mila-voice-mode')
        voiceModeRef.current = true
        setVoiceMode(true)
      }
    } catch { /* storage unavailable */ }
    return () => window.removeEventListener('mila-voice-mode', onVoiceMode)
  }, [])

  // Voice mode armed while logged out: never sit silent behind the auth gate —
  // seat a guest session, refresh the guide context, and the loop below starts.
  useEffect(() => {
    if (!voiceMode) {
      guestTriedRef.current = false
      return
    }
    if (isVoiceRoom || !context || context.authenticated || guestTriedRef.current) return
    guestTriedRef.current = true
    let cancelled = false
    void hasActiveSession().then(async (seated) => {
      if (cancelled) return
      if (!seated) {
        if (voiceModeRef.current) fallBackToTextChat('session')
        return
      }
      const fresh = await fetch('/api/guide/context')
        .then((response) => (response.ok ? response.json() : null))
        .catch(() => null)
      if (cancelled) return
      if (fresh?.authenticated) setContext(fresh)
      else if (voiceModeRef.current) fallBackToTextChat('session')
    })
    return () => { cancelled = true }
  }, [voiceMode, isVoiceRoom, context, fallBackToTextChat])

  useEffect(() => {
    if (!voiceMode || isVoiceRoom || !context?.authenticated) return
    clearVoiceBootTimer()
    let alive = true
    void prefetchFillerClips(backchannelTexts('en'))
    let session: { stop: () => Promise<unknown>; cancel: () => void } | null = null
    let restartTimer: number | null = null
    let microphoneStartTimer: number | null = null
    let replyTimeout: number | null = null
    let activeReplyController: AbortController | null = null
    let activeTts: Awaited<ReturnType<typeof createStreamingTtsSession>> | null = null
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
        activeTts = tts
        const replyController = new AbortController()
        activeReplyController = replyController
        replyTimeout = window.setTimeout(() => replyController.abort(), 25_000)
        const { reply } = await streamVoiceReply({
          text,
          lang: lang === 'ru' ? 'ru' : 'en',
          pathname,
          signal: replyController.signal,
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
        activeTts = null
      } catch {
        activeTts?.cancel()
        activeTts = null
        if (alive && voiceModeRef.current) fallBackToTextChat('session')
      } finally {
        if (replyTimeout !== null) window.clearTimeout(replyTimeout)
        replyTimeout = null
        activeReplyController = null
        setSpeaking(false)
      }
      if (alive && voiceModeRef.current) schedule(400)
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
        microphoneStartTimer = window.setTimeout(() => {
          if (alive && !session && voiceModeRef.current) fallBackToTextChat('microphone')
        }, 15_000)
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
            void ttsSpeakFiller(pick.text, fillerLocale, 1)
          },
          onAutoStop: (transcript) => void handleVoiceTurn(transcript.text),
          onError: (error) => {
            session = null
            setListening(false)
            if (!alive || error.message === 'cancelled') return
            if (error.message === 'no-speech' || error.message === 'transcribe-empty') {
              if (voiceModeRef.current) fallBackToTextChat('microphone')
              return
            }
            if (voiceModeRef.current) fallBackToTextChat(error.message === 'auth-required' ? 'session' : 'microphone')
          },
        })
        if (microphoneStartTimer !== null) window.clearTimeout(microphoneStartTimer)
        microphoneStartTimer = null
        if (!alive) return started.cancel()
        session = started
        setListening(true)
      } catch {
        if (microphoneStartTimer !== null) window.clearTimeout(microphoneStartTimer)
        microphoneStartTimer = null
        if (alive && voiceModeRef.current) fallBackToTextChat('microphone')
      }
    }

    void listen()
    return () => {
      alive = false
      if (restartTimer !== null) window.clearTimeout(restartTimer)
      if (microphoneStartTimer !== null) window.clearTimeout(microphoneStartTimer)
      if (replyTimeout !== null) window.clearTimeout(replyTimeout)
      activeReplyController?.abort()
      activeTts?.cancel()
      session?.cancel()
      setListening(false)
      setSpeaking(false)
      setVoiceCaption('')
      window.speechSynthesis?.cancel()
    }
  }, [voiceMode, isVoiceRoom, context?.authenticated, pathname, lang, router, fallBackToTextChat, clearVoiceBootTimer])

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
    if (!Recognition) {
      fallBackToTextChat('microphone')
      return
    }
    if (listening) return
    const recognition = new Recognition()
    dictationRef.current = recognition
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => {
      if (dictationRef.current === recognition) dictationRef.current = null
      setListening(false)
    }
    recognition.onerror = () => {
      if (dictationRef.current === recognition) dictationRef.current = null
      setListening(false)
      fallBackToTextChat('microphone')
    }
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript
      if (transcript) setInput(transcript)
    }
    try {
      recognition.start()
    } catch {
      setListening(false)
      fallBackToTextChat('microphone')
    }
  }

  // The mascot speaks in its own character voice — browser engine with the
  // MASCOT_PITCH profile — so the little robot and its voice finally match.
  // (Piper's studio voice stays for lesson/reading audio elsewhere.)
  const speak = async (text: string) => {
    setSpeaking(true)
    try {
      await ttsSpeak(text, spokenLocaleForText(text, lang === 'ru' ? 'ru-RU' : 'en-US'), 0.95)
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

  const handleLauncherClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    clearLauncherClick()

    if (voiceMode) {
      clearVoiceBootTimer()
      voiceModeRef.current = false
      setVoiceMode(false)
      return
    }
    if (open) {
      closeTextChat()
      return
    }
    if (event.detail >= 2) {
      openTextChat()
      return
    }
    // Enter and Space are handled in keydown below. All click events—including
    // programmatic/assistive clicks with detail 0—use the same short guard so
    // a synthetic double-click can never activate voice on its first click.
    launcherClickTimerRef.current = window.setTimeout(() => {
      launcherClickTimerRef.current = null
      startVoiceConversation()
    }, LAUNCHER_SINGLE_CLICK_DELAY_MS)
    setVoicePending(true)
  }

  const handleLauncherDoubleClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    clearLauncherClick()
    openTextChat()
  }

  const handleLauncherPointerDown = () => {
    const now = window.performance.now()
    if (now - launcherPointerDownRef.current < LAUNCHER_SINGLE_CLICK_DELAY_MS + 120) {
      clearLauncherClick()
    }
    launcherPointerDownRef.current = now
  }

  const handleLauncherKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return
    event.preventDefault()
    clearLauncherClick()
    if (voiceMode) {
      clearVoiceBootTimer()
      voiceModeRef.current = false
      setVoiceMode(false)
    }
    else if (!open) startVoiceConversation()
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
    <aside className={`mila-guide ${pathname === '/' ? 'is-home' : ''} ${open ? 'is-open' : ''}`} data-state={agentState} data-voice={voiceMode ? '1' : '0'} aria-label={lang === 'ru' ? 'Помощница Мила' : 'Mila assistant'}>
      <span
        id="mila-guide-launcher-help"
        style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
      >
        {lang === 'ru'
          ? 'Нажми один раз или Enter, чтобы говорить. Нажми дважды или используй кнопку чата, чтобы писать.'
          : 'Click once or press Enter to talk. Double-click or use the chat button to type.'}
      </span>
      {open && (
        <section id="mila-guide-text-panel" className="mila-guide__panel" data-mila-surface="text-chat" role="dialog" aria-modal="false" aria-label={lang === 'ru' ? 'Чат с Милой' : 'Chat with Mila'}>
          <header className="mila-guide__header">
            <div className="mila-guide__portrait" aria-hidden>
              <Image src="/mascot/mila-mascot-rose.png" alt="" width={1254} height={1254} priority />
              <i />
            </div>
            <div className="mila-guide__identity">
              <strong>Mila</strong>
              <span><i />{status}</span>
            </div>
            <span className="mila-guide__page">{lang === 'ru' ? page.ru : page.en}</span>
            <button className="mila-guide__close" type="button" onClick={closeTextChat} aria-label={lang === 'ru' ? 'Закрыть' : 'Close'}><MilaIcon name="close" size={18}/></button>
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
                    <button type="button" onClick={startVoiceConversation}>{lang === 'ru' ? 'Поговорить голосом' : 'Voice practice'}</button>
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
              <button type="button" onClick={() => router.push(context.continueHref!)}><MilaIcon name="arrow" size={14}/>{continueLabel}</button>
            )}
            {context?.authenticated ? (
              <>
                <button type="button" disabled={isHistoryHydrating} onClick={() => ask(lang === 'ru' ? 'Объясни, что я могу делать на этой странице.' : 'Explain what I can do on this page.')}><MilaIcon name="target" size={14}/>{lang === 'ru' ? 'Объясни страницу' : 'Explain this page'}</button>
                <button type="button" onClick={startVoiceConversation}><MilaIcon name="voice" size={14}/>{lang === 'ru' ? 'Поговорить голосом' : 'Voice practice'}</button>
              </>
            ) : context && (
              // Guest FAQ — always visible so answers don't consume the options.
              <>
                <button type="button" onClick={() => faqAnswer(
                  lang === 'ru' ? 'Что это за приложение?' : 'What is this app?',
                  'Mila is a personal English tutor. She hears every sound you speak, gives gentle feedback, builds lessons around your goals, and you can practise by voice — all in a friendly chat like this.',
                  'Mila — персональная наставница по английскому. Она слышит каждый твой звук, мягко поправляет, собирает уроки под твои цели, и с ней можно говорить голосом — всё в дружеском чате, как этот.',
                )}><MilaIcon name="conversation" size={14}/>{lang === 'ru' ? 'Что это?' : 'What is this?'}</button>
                <button type="button" onClick={() => faqAnswer(
                  lang === 'ru' ? 'Это бесплатно?' : 'Is it free?',
                  'Yes — start free right now, no card needed. Tap “Start free” below.',
                  'Да — начни бесплатно прямо сейчас, без карты. Нажми «Начать бесплатно» ниже.',
                )}><MilaIcon name="sparkle" size={14}/>{lang === 'ru' ? 'Это бесплатно?' : 'Is it free?'}</button>
                <button type="button" onClick={() => router.push('/assessment')}><MilaIcon name="level" size={14}/>{lang === 'ru' ? 'Проверить уровень' : 'Check my level'}</button>
              </>
            )}
          </div>

          {context?.authenticated ? (
            <form className="mila-guide__composer" onSubmit={submit}>
              <button className={`mila-guide__mic ${listening ? 'is-listening' : ''}`} type="button" onClick={startListening} disabled={isLoading || isHistoryHydrating} aria-label={lang === 'ru' ? 'Сказать вопрос' : 'Speak a question'} title={speechSupported ? (lang === 'ru' ? 'Говорить' : 'Speak') : (lang === 'ru' ? 'Голосовой ввод недоступен — можно написать' : 'Voice input unavailable — you can type instead')}>
                <svg viewBox="0 0 24 24" aria-hidden><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/></svg>
              </button>
              <input ref={inputRef} value={input} onChange={handleInputChange} disabled={isLoading || isHistoryHydrating} placeholder={lang === 'ru' ? 'Спроси Милу…' : 'Ask Mila…'} aria-label={lang === 'ru' ? 'Сообщение Миле' : 'Message Mila'} />
              <button className="mila-guide__send" type="submit" disabled={isLoading || isHistoryHydrating || !input.trim()} aria-label={lang === 'ru' ? 'Отправить' : 'Send'}><MilaIcon name="arrow" size={18} style={{transform:'rotate(-90deg)'}}/></button>
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
        <button className="mila-guide__nudge" type="button" onClick={startVoiceConversation}>
          <strong>{lang === 'ru' ? 'Мила рядом' : 'Mila is here'}</strong>
          <span>{lang === 'ru' ? 'Нажми — говорить · чат — писать' : 'Tap to talk · use chat to type'}</span>
        </button>
      )}

      {/* Voice-mode caption — what she heard and what she is saying, floating
          above the mascot while the panel stays closed. */}
      {voiceMode && !open && voiceCaption && (
        <div className="mila-guide__caption" aria-live="polite">{voiceCaption}</div>
      )}
      {voicePending && !voiceMode && !open && (
        <div className="mila-guide__caption" aria-live="polite">{lang === 'ru' ? 'Готовлю голос…' : 'Preparing voice…'}</div>
      )}

      <button
        ref={launcherRef}
        className="mila-guide__launcher"
        data-mila-action={voiceMode ? 'stop-voice' : open ? 'close-text-chat' : 'start-voice'}
        type="button"
        onPointerDown={handleLauncherPointerDown}
        onClick={handleLauncherClick}
        onDoubleClick={handleLauncherDoubleClick}
        onKeyDown={handleLauncherKeyDown}
        aria-expanded={open}
        aria-controls="mila-guide-text-panel"
        aria-describedby="mila-guide-launcher-help"
        aria-keyshortcuts="Enter Space"
        aria-label={voiceMode
          ? (lang === 'ru' ? 'Остановить голосовой режим' : 'Stop voice mode')
          : open
            ? (lang === 'ru' ? 'Свернуть Милу' : 'Collapse Mila')
            : (lang === 'ru' ? 'Начать голосовой разговор с Милой' : 'Start a voice conversation with Mila')}
        title={voiceMode
          ? (lang === 'ru' ? 'Голосовой режим — коснись, чтобы остановить' : 'Voice mode — tap to stop')
          : open
            ? (lang === 'ru' ? 'Свернуть чат' : 'Close text chat')
            : (lang === 'ru' ? 'Один клик — говорить · двойной — писать' : 'Click to talk · double-click to type')}
      >
        <span className="mila-guide__orbit" aria-hidden><i /><i /></span>
        <Image src="/mascot/mila-mascot-rose.png" alt="" width={1254} height={1254} priority />
        <span className="mila-guide__launcher-label" aria-hidden>
          <strong>{voiceMode ? (lang === 'ru' ? 'Стоп' : 'Stop') : (lang === 'ru' ? 'Говорить' : 'Talk')}</strong>
          <small>{voiceMode ? status : (lang === 'ru' ? 'с Милой' : 'with Mila')}</small>
        </span>
        <span className="mila-guide__launcher-wave" aria-hidden><i /><i /><i /></span>
        <span className="mila-guide__state" aria-hidden />
      </button>

      {/* Double-click is a convenience, not the only route to text. Keep one
          explicit chat control for touch, keyboard and assistive input. */}
      {!voiceMode && !open && (
        <button
          className="mila-guide__textchip"
          data-mila-action="open-text-chat"
          type="button"
          onClick={() => openTextChat()}
          aria-controls="mila-guide-text-panel"
          aria-haspopup="dialog"
          aria-label={lang === 'ru' ? 'Открыть текстовый чат с Милой' : 'Open text chat with Mila'}
          title={lang === 'ru' ? 'Написать Миле' : 'Type to Mila'}
        >
          <svg viewBox="0 0 24 24" aria-hidden><path d="M5 5.5h14v10H9l-4 3v-13Z" /><path d="M8 9h8M8 12h5" /></svg>
          <span>{lang === 'ru' ? 'Чат' : 'Chat'}</span>
        </button>
      )}
    </aside>
  )
}
