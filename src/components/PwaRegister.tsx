'use client'

// Registers the service worker AND owns the "install Mila" affordance.
// Android/Chrome: captures beforeinstallprompt and offers a one-tap install chip.
// iOS Safari (no install event): shows a one-time hint for Share → Add to Home
// Screen. Dismissal is remembered; the chip never nags. Mounted OUTSIDE
// I18nProvider, so language comes straight from the same storage the provider
// uses (getLangFromStorage) rather than the hook.
import { useEffect, useState } from 'react'
import { getLangFromStorage } from '@/lib/i18n'
import { isGiaHostname, isMiaHostname } from '@/lib/productHosts'

const DISMISS_KEY = 'mila_install_dismissed'

function isIOS() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const classic = /iPad|iPhone|iPod/.test(ua)
  const iPadOS13 = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return classic || iPadOS13
}

function isStandalone() {
  if (typeof window === 'undefined') return true
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (navigator as any).standalone === true
}

export default function PwaRegister() {
  const [installEvent, setInstallEvent] = useState<any>(null)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [lang, setLang] = useState<'ru' | 'en'>('ru')
  const [productName, setProductName] = useState<'Mila' | 'Gia' | 'Mia'>('Mila')

  useEffect(() => {
    // Production only: dev chunks have STABLE names (layout.js), so the SW's
    // cache-first would pin stale code during development. Prod chunks are
    // content-hashed, so cache-first is safe there.
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installability is an enhancement; the learner journeys remain usable.
      })
    }

    setLang(getLangFromStorage())
    setProductName(
      isGiaHostname(window.location.hostname)
        ? 'Gia'
        : isMiaHostname(window.location.hostname)
          ? 'Mia'
          : 'Mila',
    )
    if (localStorage.getItem(DISMISS_KEY) || isStandalone()) return

    // Android/Chrome path: the browser tells us installation is possible.
    // Re-check dismissal here too — Chrome can re-fire this event later in the
    // same session, and a dismissed chip must never nag again.
    const onPrompt = (e: Event) => {
      e.preventDefault()
      if (localStorage.getItem(DISMISS_KEY)) return
      setInstallEvent(e)
    }
    const onInstalled = () => {
      setInstallEvent(null)
      localStorage.setItem(DISMISS_KEY, '1')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    // iOS path: no event exists — show a gentle one-time hint after a beat.
    let iosTimer: ReturnType<typeof setTimeout> | undefined
    if (isIOS()) {
      iosTimer = setTimeout(() => setShowIOSHint(true), 12_000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (iosTimer) clearTimeout(iosTimer)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setInstallEvent(null)
    setShowIOSHint(false)
  }

  const install = async () => {
    if (!installEvent) return
    installEvent.prompt()
    try { await installEvent.userChoice } catch { /* user closed the sheet */ }
    dismiss()
  }

  if (!installEvent && !showIOSHint) return null

  const ru = lang === 'ru'

  return (
    <div
      role="dialog"
      aria-label={ru ? 'Установка приложения' : 'Install the app'}
      style={{
        position: 'fixed', left: '50%', bottom: 88, transform: 'translateX(-50%)',
        zIndex: 60, display: 'flex', alignItems: 'center', gap: 10,
        maxWidth: 'min(92vw, 420px)', padding: '10px 12px 10px 16px',
        background: 'var(--mila-panel, #ffffff)', border: '1px solid var(--mila-line, #f0c7da)',
        borderRadius: 14, boxShadow: '0 10px 34px rgba(111,42,53,0.14)',
        color: 'var(--mila-ink, #26131f)', fontSize: '0.85rem', lineHeight: 1.45,
      }}
    >
      <span style={{ flex: 1 }}>
        {installEvent
          ? (ru ? `Установить ${productName} на телефон — как обычное приложение` : `Install ${productName} on your phone — like a real app`)
          : (ru ? `Добавь ${productName} на экран: Поделиться → «На экран “Домой”»` : `Add ${productName} to your home screen: Share → “Add to Home Screen”`)}
      </span>
      {installEvent && (
        <button
          onClick={install}
          style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 10, border: 'none',
            background: 'var(--mila-action, #d9006c)', color: 'var(--mila-action-ink, #ffffff)',
            fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
          }}
        >
          {ru ? 'Установить' : 'Install'}
        </button>
      )}
      <button
        onClick={dismiss}
        aria-label={ru ? 'Скрыть' : 'Dismiss'}
        style={{
          flexShrink: 0, width: 28, height: 28, borderRadius: 8,
          border: '1px solid var(--mila-line, #f0c7da)', background: 'transparent',
          color: 'var(--mila-muted, #65535f)', fontSize: '0.9rem', cursor: 'pointer', lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  )
}
