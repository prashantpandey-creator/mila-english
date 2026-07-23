"use client";

import type { OrbState } from "./MilaOrb";
import { presenceById, type PresenceId } from "@/lib/presences";

const RING: Record<OrbState, string> = {
  resting: "rgba(94, 106, 106, .34)",
  listening: "rgba(69, 106, 96, .9)",
  thinking: "rgba(38, 52, 59, .76)",
  manifesting: "rgba(217, 0, 108, .94)",
};

export function MilaPresence({
  presenceId,
  state = "resting",
  size = 320,
}: {
  presenceId: PresenceId;
  state?: OrbState;
  size?: number;
}) {
  const presence = presenceById(presenceId);
  const ring = RING[state];

  return (
    <span
      className={`mila-portrait-presence mila-portrait-presence--${state}`}
      style={{
        width: size,
        height: size,
        ["--presence-ring" as string]: ring,
      }}
      role="img"
      aria-label={`Mila · ${presence.name.en}, a synthetic AI character`}
    >
      {/* Generated fictional avatar. See docs/design/2026-07-23-mila-avatar-presence-v2.md. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={presence.poster ?? ""}
        alt=""
        width={size}
        height={size}
        draggable={false}
        style={{ objectPosition: presence.objectPosition }}
      />
      <span className="mila-portrait-presence__shade" aria-hidden="true" />
      <span className="mila-portrait-presence__signal" aria-hidden="true" />
    </span>
  );
}
