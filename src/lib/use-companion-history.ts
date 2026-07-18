'use client'

import type { Message } from 'ai'
import { useCallback, useEffect, useRef, useState } from 'react'

type SetMessages = (messages: Message[] | ((messages: Message[]) => Message[])) => void

type CompanionHistoryResponse = {
  messages?: Array<{
    id?: string | number
    role?: string
    content?: string
  }>
}

const HISTORY_EVENT = 'mila-companion-history'

function normaliseMessages(payload: CompanionHistoryResponse): Message[] {
  if (!Array.isArray(payload.messages)) return []

  return payload.messages.flatMap((message, index) => {
    if ((message.role !== 'user' && message.role !== 'assistant') || typeof message.content !== 'string') {
      return []
    }

    return [{
      id: String(message.id ?? `persisted-${index}`),
      role: message.role,
      content: message.content,
    }]
  })
}

export function useCompanionHistory({
  limit,
  scope = 'conversation',
  setMessages,
}: {
  limit: number
  scope?: 'all' | 'conversation' | 'practice'
  setMessages: SetMessages
}) {
  const setMessagesRef = useRef(setMessages)
  const requestIdRef = useRef(0)
  const [isHydrating, setIsHydrating] = useState(true)
  const [historyError, setHistoryError] = useState('')

  useEffect(() => {
    setMessagesRef.current = setMessages
  }, [setMessages])

  const refreshHistory = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setIsHydrating(true)
    setHistoryError('')

    try {
      const response = await fetch(`/api/chat/history?limit=${limit}&scope=${scope}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      })

      if (requestId !== requestIdRef.current) return
      if (response.status === 401) {
        setMessagesRef.current([])
        return
      }
      if (!response.ok) throw new Error(`History request failed (${response.status})`)

      const payload = await response.json() as CompanionHistoryResponse
      if (requestId !== requestIdRef.current) return
      setMessagesRef.current(normaliseMessages(payload))
    } catch {
      if (requestId === requestIdRef.current) setHistoryError('history-unavailable')
    } finally {
      if (requestId === requestIdRef.current) setIsHydrating(false)
    }
  }, [limit, scope])

  useEffect(() => {
    void refreshHistory()
  }, [refreshHistory])

  useEffect(() => {
    const syncHistory = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action
      if (action === 'cleared') {
        requestIdRef.current += 1
        setIsHydrating(false)
        setMessagesRef.current([])
      }
      else void refreshHistory()
    }

    window.addEventListener(HISTORY_EVENT, syncHistory)
    return () => window.removeEventListener(HISTORY_EVENT, syncHistory)
  }, [refreshHistory])

  useEffect(() => () => {
    requestIdRef.current += 1
  }, [])

  return { isHydrating, historyError, refreshHistory }
}

export function announceCompanionHistoryCleared() {
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT, { detail: { action: 'cleared' } }))
}

export function announceCompanionHistoryUpdated() {
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT, { detail: { action: 'updated' } }))
}
