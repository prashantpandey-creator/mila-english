"use client";

import { useEffect, useRef } from "react";
import { presenceById, type PresenceId } from "@/lib/presences";

export function PresencePortraitDialog({
  open,
  presenceId,
  lang,
  canStartLive,
  isFreeLive,
  onClose,
  onStartLive,
}: {
  open: boolean;
  presenceId: PresenceId;
  lang: "en" | "ru";
  canStartLive: boolean;
  isFreeLive: boolean;
  onClose: () => void;
  onStartLive: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const presence = presenceById(presenceId);
  const lookName = presenceId === "signal"
    ? (lang === "ru" ? "Сигнал" : "Signal")
    : presence.name[lang];
  const titleId = `gia-portrait-title-${presenceId}`;
  const descriptionId = `gia-portrait-description-${presenceId}`;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const containFocus = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const first = closeRef.current;
      const last = canStartLive ? startRef.current : closeRef.current;
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", containFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", containFocus);
    };
  }, [canStartLive, onClose, open]);

  if (!open) return null;

  return (
    <div className="presence-portrait-dialog" role="presentation">
      <button
        type="button"
        className="presence-portrait-dialog__backdrop"
        tabIndex={-1}
        onClick={onClose}
        aria-label={lang === "ru" ? "Закрыть портрет" : "Close portrait"}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="presence-portrait-dialog__card"
        data-presence={presenceId}
      >
        <button
          ref={closeRef}
          type="button"
          className="presence-portrait-dialog__close"
          onClick={onClose}
          aria-label={lang === "ru" ? "Закрыть портрет" : "Close portrait"}
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="presence-portrait-dialog__visual">
          {/* AI-generated fictional adult character; source recorded in the design provenance. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={presence.expandedPortrait}
            alt={lang === "ru"
              ? `Джиа, образ ${lookName}: расширенный портрет синтетического взрослого ИИ-персонажа`
              : `Gia, ${lookName}: expanded portrait of a synthetic adult AI character`}
            draggable={false}
            style={{ objectPosition: presence.expandedObjectPosition }}
          />
          <span className="presence-portrait-dialog__scan" aria-hidden="true" />
          <span className="presence-portrait-dialog__index" aria-hidden="true">
            {presence.systemId}
          </span>
        </div>

        <div className="presence-portrait-dialog__copy">
          <p className="presence-portrait-dialog__eyebrow">
            {lang === "ru" ? "Джиа · синтетический образ" : "Gia · synthetic presence"}
          </p>
          <h2 id={titleId}>Gia · {lookName}</h2>
          <p id={descriptionId} className="presence-portrait-dialog__description">
            {lang === "ru"
              ? "Вымышленный взрослый персонаж, созданный ИИ. Меняется только внешний образ — голос и разговор с Джиа остаются прежними."
              : "An AI-generated fictional adult character. Only the visual look changes—Gia’s voice and conversation stay the same."}
          </p>
          <div className="presence-portrait-dialog__meta" aria-label={lang === "ru" ? "Сведения об образе" : "Appearance details"}>
            <span>{presence.systemId}</span>
            <span>{presence.medium[lang]}</span>
            <span>
              {presence.expandedFraming === "upper-body"
                ? (lang === "ru" ? "Портрет по пояс" : "Upper-body portrait")
                : (lang === "ru" ? "Оригинальный портрет" : "Original portrait")}
            </span>
          </div>
          {canStartLive ? (
            <button
              ref={startRef}
              type="button"
              className="presence-portrait-dialog__start"
              onClick={onStartLive}
            >
              <strong>
                {isFreeLive
                  ? (lang === "ru" ? "Начать Gia Live бесплатно" : "Start Gia Live free")
                  : (lang === "ru" ? "Начать Gia Live" : "Start Gia Live")}
              </strong>
              <span aria-hidden="true">↗</span>
            </button>
          ) : (
            <p className="presence-portrait-dialog__unavailable">
              {lang === "ru"
                ? "Войди, чтобы начать Gia Live бесплатно."
                : "Sign in to start Gia Live free."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
