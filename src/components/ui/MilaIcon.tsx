import type { CSSProperties, ReactNode } from 'react'

export type MilaIconName =
  | 'level'
  | 'listening'
  | 'vocabulary'
  | 'tutor'
  | 'grammar'
  | 'lessons'
  | 'progress'
  | 'badges'
  | 'phonetics'
  | 'voice'
  | 'lesson'
  | 'time'
  | 'pronunciation'
  | 'practice'
  | 'streak'
  | 'sparkle'
  | 'volume'
  | 'conversation'
  | 'cafe'
  | 'travel'
  | 'flower'
  | 'trophy'
  | 'lock'
  | 'close'
  | 'target'
  | 'arrow'

export default function MilaIcon({
  name,
  size = 24,
  style,
}: {
  name: MilaIconName
  size?: number
  style?: CSSProperties
}) {
  let glyph: ReactNode

  switch (name) {
    case 'level':
      glyph = <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2" /><path className="mila-icon__accent" d="m15.4 7.8 1.7 1.7 3.2-3.4" /></>
      break
    case 'listening':
      glyph = <><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><path d="M4 13.5h2.4v5H5.2A1.2 1.2 0 0 1 4 17.3v-3.8ZM20 13.5h-2.4v5h1.2a1.2 1.2 0 0 0 1.2-1.2v-3.8Z" /><path d="M8.5 12v3M11 10.5v6M13.5 12v3" /><path className="mila-icon__accent" d="M16 11.2v4.6" /></>
      break
    case 'vocabulary':
      glyph = <><path d="M4 5.5c2.9-.8 5.6-.2 8 1.5v12c-2.4-1.7-5.1-2.3-8-1.5v-12ZM20 5.5c-2.9-.8-5.6-.2-8 1.5v12c2.4-1.7 5.1-2.3 8-1.5v-12Z" /><path className="mila-icon__accent" d="M16.5 5.5v6l1.4-1 1.4 1V5.4" /></>
      break
    case 'tutor':
      glyph = <><path d="M20 11.5a8 8 0 1 1-3-6.2M5.7 18.1 4.8 21l3.1-1" /><circle cx="9.4" cy="11.4" r=".65" className="mila-icon__fill" /><circle cx="14.6" cy="11.4" r=".65" className="mila-icon__fill" /><path d="M9.5 15c1.6.9 3.4.9 5 0" /><circle cx="19" cy="5" r="1.5" className="mila-icon__accent-fill" /></>
      break
    case 'grammar':
      glyph = <><path d="M8.5 4H6a2 2 0 0 0-2 2v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h2.5M15.5 4H18a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-2.5" /><path d="M9 8h6M9 12h6M9 16h6" /><circle cx="12" cy="12" r="1.45" className="mila-icon__accent-fill" /></>
      break
    case 'lessons':
      glyph = <><path d="M6 3.5h9l3 3V20.5H6z" /><path d="M15 3.5v3h3M9 10h6M9 13h6M9 16h4" /><path className="mila-icon__accent" d="m8.4 6.8.9.9 1.8-2" /></>
      break
    case 'progress':
      glyph = <><path d="M5 20V12M10 20V8M15 20v-5M20 20V5" /><path className="mila-icon__accent" d="m5 8 5-4 5 4 5-5" /></>
      break
    case 'badges':
      glyph = <><path d="m12 3 6 3.5v7L12 17l-6-3.5v-7z" /><path d="m9.3 19.2 2.7-2 2.7 2v2L12 20l-2.7 1.2z" /><path className="mila-icon__accent" d="m9.7 10.2 1.5 1.5 3.3-3.6" /></>
      break
    case 'phonetics':
      glyph = <><path d="M4 6.5h16v10H9l-4 3v-3H4z" /><path d="M8 11h1M11 9v4M14 7.5v7M17 10v2" /><circle cx="8" cy="11" r=".8" className="mila-icon__accent-fill" /></>
      break
    case 'voice':
      glyph = <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" /><path className="mila-icon__accent" d="M17.7 6.5h2.2M18.8 5.4v2.2" /></>
      break
    case 'lesson':
      glyph = <><path d="M6 3.5h9l3 3V20.5H6z" /><path d="M15 3.5v3h3M9 10h6M9 13h4" /><path className="mila-icon__accent" d="m9 16 1.4 1.4 3-3.2" /></>
      break
    case 'time':
      glyph = <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.3 2" /><path className="mila-icon__accent" d="M17.8 4.7 19.3 3" /></>
      break
    case 'pronunciation':
      glyph = <><path d="M5 9v6M8.5 6.5v11M12 9v6M15.5 5v14M19 8v8" /><circle cx="15.5" cy="5" r="1" className="mila-icon__accent-fill" /></>
      break
    case 'practice':
      glyph = <><circle cx="12" cy="12" r="8" /><path d="M8 12.5 10.5 15l5.5-6" /><path className="mila-icon__accent" d="M12 2.5v2M21.5 12h-2" /></>
      break
    case 'streak':
      glyph = <><path d="M12.5 3.5c.4 3-1.8 4-3.2 5.8-1.8 2.2-1.5 5.2.6 7.1 2.3 2.1 6.2 1.4 7.7-1.2 1.6-2.8.2-6-2.5-7.5.1 2-1 3-2.1 3.5.5-2.7-.1-5.4-.5-7.7Z" /><path className="mila-icon__accent" d="M12.3 12.2c-1.6 1.2-1.9 3.1-.7 4.2 1.1 1 3 .6 3.5-.8.5-1.5-.5-2.7-1.7-3.5" /></>
      break
    case 'sparkle':
      glyph = <><path d="M12 2.8c.4 5.6 2.6 7.8 8.2 8.2-5.6.4-7.8 2.6-8.2 8.2-.4-5.6-2.6-7.8-8.2-8.2 5.6-.4 7.8-2.6 8.2-8.2Z" /><path className="mila-icon__accent" d="M19 2.8c.1 1.7.8 2.4 2.5 2.5-1.7.1-2.4.8-2.5 2.5-.1-1.7-.8-2.4-2.5-2.5 1.7-.1 2.4-.8 2.5-2.5Z" /></>
      break
    case 'volume':
      glyph = <><path d="M4 10h4l4-3.5v11L8 14H4zM15 9.2a4 4 0 0 1 0 5.6M17.5 6.8a7.4 7.4 0 0 1 0 10.4" /><circle cx="19.5" cy="5" r="1" className="mila-icon__accent-fill" /></>
      break
    case 'conversation':
      glyph = <><path d="M4 5.5h11.5v8H9l-3.5 2.7v-2.7H4z" /><path d="M9 16.5h5.8l3.7 2.5v-2.5H20v-7h-2" /><path className="mila-icon__accent" d="M7.5 9h4.7M14.5 12.5h2" /></>
      break
    case 'cafe':
      glyph = <><path d="M5 9h11v5.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" /><path d="M16 11h1.8a2.2 2.2 0 0 1 0 4.4H16M4 21h15" /><path className="mila-icon__accent" d="M8 6.5c-1-1 .8-1.8 0-3M12 6.5c-1-1 .8-1.8 0-3" /></>
      break
    case 'travel':
      glyph = <><path d="m3.5 12 16.8-7-5.7 15-3.2-6-7.9-2Z" /><path d="m11.4 14 8.9-9M11.4 14l-1.2 4" /><circle cx="5.2" cy="5.3" r="1" className="mila-icon__accent-fill" /></>
      break
    case 'flower':
      glyph = <><ellipse cx="12" cy="7.3" rx="3.1" ry="4.4" /><ellipse cx="12" cy="7.3" rx="3.1" ry="4.4" transform="rotate(72 12 12)" /><ellipse cx="12" cy="7.3" rx="3.1" ry="4.4" transform="rotate(144 12 12)" /><ellipse cx="12" cy="7.3" rx="3.1" ry="4.4" transform="rotate(216 12 12)" /><ellipse cx="12" cy="7.3" rx="3.1" ry="4.4" transform="rotate(288 12 12)" /><circle cx="12" cy="12" r="2.4" className="mila-icon__accent-fill" /></>
      break
    case 'trophy':
      glyph = <><path d="M8 4h8v4.5a4 4 0 0 1-8 0zM12 12.5V18M8.5 21h7M10 18h4" /><path d="M8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11" /><path className="mila-icon__accent" d="m10.4 7.6 1.1 1.1 2.2-2.4" /></>
      break
    case 'lock':
      glyph = <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" /><circle cx="12" cy="15" r="1.2" className="mila-icon__accent-fill" /><path d="M12 16.2v1.7" /></>
      break
    case 'close':
      glyph = <><path d="M6 6l12 12M18 6 6 18" /><circle cx="12" cy="12" r="9" className="mila-icon__accent" /></>
      break
    case 'target':
      glyph = <><circle cx="11" cy="13" r="8" /><circle cx="11" cy="13" r="4" /><circle cx="11" cy="13" r="1.2" className="mila-icon__accent-fill" /><path className="mila-icon__accent" d="m14 10 6-6M16.5 4H20v3.5" /></>
      break
    case 'arrow':
      glyph = <><path d="M4 12h15M14 7l5 5-5 5" /><circle cx="5" cy="12" r="1" className="mila-icon__accent-fill" /></>
      break
  }

  return (
    <svg
      aria-hidden="true"
      className="mila-icon"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={style}
    >
      {glyph}
    </svg>
  )
}
