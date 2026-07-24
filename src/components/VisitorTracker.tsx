'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function VisitorTracker() {
  const pathname = usePathname()
  const lastPage = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || lastPage.current === pathname) return
    lastPage.current = pathname

    void fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
      credentials: 'same-origin',
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt the learning experience.
    })
  }, [pathname])

  return null
}
