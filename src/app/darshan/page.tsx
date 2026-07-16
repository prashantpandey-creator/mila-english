"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// The separate voice room is gone (owner decision 2026-07-17): Mila's voice
// lives in the mascot assistant on every page. This shim keeps every old
// entry working — the landing door, the dashboard card, spoken "voice room"
// commands, bookmarked links — by arming hands-free voice mode and going
// home. The mascot (mounted globally) receives the event immediately; the
// sessionStorage flag covers full-page loads and is consumed by whichever
// reader fires first.
export default function DarshanRedirect() {
  const router = useRouter();
  useEffect(() => {
    try { sessionStorage.setItem("mila-voice-mode", "1"); } catch { /* storage unavailable */ }
    window.dispatchEvent(new CustomEvent("mila-voice-mode", { detail: {} }));
    router.replace("/dashboard");
  }, [router]);
  return null;
}
