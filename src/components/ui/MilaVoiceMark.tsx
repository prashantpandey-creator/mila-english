import type { CSSProperties } from 'react';

type MilaVoiceState = 'idle' | 'thinking' | 'listening' | 'speaking';

export default function MilaVoiceMark({
  size = 56,
  state = 'idle',
  className = '',
}: {
  size?: number;
  state?: MilaVoiceState;
  className?: string;
}) {
  const style = { '--mila-voice-mark-size': `${size}px` } as CSSProperties;

  return (
    <span
      className={`mila-voice-mark ${className}`.trim()}
      data-state={state}
      style={style}
      aria-hidden="true"
    >
      <span className="mila-voice-mark__bars">
        <i /><i /><i /><i /><i /><i /><i />
      </span>
      <span className="mila-voice-mark__dot" />
    </span>
  );
}
