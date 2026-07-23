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
      data-presence={presenceId}
      style={{
        width: size,
        height: size,
        ["--presence-ring" as string]: ring,
        ["--presence-size" as string]: `${size}px`,
      }}
      role="img"
      aria-label={`Mila · ${presence.name.en}, a synthetic AI character`}
    >
      <span className="mila-portrait-presence__halo" aria-hidden="true" />
      <span className="mila-portrait-presence__meter" aria-hidden="true">
        {Array.from({ length: 32 }, (_, index) => (
          <span
            key={index}
            style={{
              ["--tick" as string]: index,
              ["--delay" as string]: `${index * -0.042}s`,
            }}
          />
        ))}
      </span>

      <span className="mila-portrait-presence__aperture">
        {/* Generated fictional avatar. See docs/design/2026-07-23-mila-synthetic-presence-v3.md. */}
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
        <span className="mila-portrait-presence__scan" aria-hidden="true" />
      </span>

      <span className="mila-portrait-presence__reticle mila-portrait-presence__reticle--north" aria-hidden="true" />
      <span className="mila-portrait-presence__reticle mila-portrait-presence__reticle--south" aria-hidden="true" />
      <span className="mila-portrait-presence__identity" aria-hidden="true">
        <small>{presence.systemId}</small>
        <strong>{presence.name.en}</strong>
      </span>
      <span className="mila-portrait-presence__signal" aria-hidden="true" />
    </span>
  );
}
