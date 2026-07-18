// Internal testing surface — reachable only by direct URL, never indexed.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function VoiceLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
