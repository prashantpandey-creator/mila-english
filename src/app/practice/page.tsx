// The practice room moved to the hidden /voice-lab while it hardens
// (owner directive 2026-07-17: unfinished features never face users).
// Old links and habits land safely on the home page.
import { redirect } from 'next/navigation';

export default function RetiredPracticeRoute() {
  redirect('/');
}
