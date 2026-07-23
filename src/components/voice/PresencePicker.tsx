"use client";

import { useCallback, useRef, useState } from "react";
import MilaVoiceMark from "@/components/ui/MilaVoiceMark";
import {
  MILA_PRESENCES,
  presenceById,
  type PresenceId,
} from "@/lib/presences";

export function PresencePicker({
  value,
  lang,
  onChange,
}: {
  value: PresenceId;
  lang: "en" | "ru";
  onChange: (presence: PresenceId) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = presenceById(value);
  const closeAndRestoreFocus = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  return (
    <div className={`presence-picker${open ? " is-open" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="presence-picker__trigger"
        aria-expanded={open}
        aria-controls="mila-presence-options"
        onClick={() => setOpen((current) => !current)}
      >
        <span>{lang === "ru" ? "Образ" : "Presence"}</span>
        <strong>{selected.name[lang]}</strong>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>

      {open ? (
        <section
          id="mila-presence-options"
          className="presence-picker__panel"
          aria-label={lang === "ru" ? "Выбрать образ Мии" : "Choose Mia's presence"}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeAndRestoreFocus();
            }
          }}
        >
          <div className="presence-picker__intro">
            <div>
              <p>{lang === "ru" ? "Один разум, разное присутствие" : "One mind, a different presence"}</p>
              <span>
                {lang === "ru"
                  ? "Образ не меняет характер разговора или обработку аудио."
                  : "Appearance does not change conversation style or how audio is handled."}
              </span>
            </div>
            <button
              type="button"
              onClick={closeAndRestoreFocus}
              aria-label={lang === "ru" ? "Закрыть" : "Close"}
            >
              ×
            </button>
          </div>

          <div className="presence-picker__options">
            {MILA_PRESENCES.map((presence) => (
              <button
                key={presence.id}
                type="button"
                aria-pressed={value === presence.id}
                className={value === presence.id ? "is-selected" : ""}
                onClick={() => {
                  onChange(presence.id);
                  closeAndRestoreFocus();
                }}
              >
                <span className="presence-picker__thumb" aria-hidden="true">
                  {presence.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={presence.poster}
                      alt=""
                      style={{ objectPosition: presence.objectPosition }}
                    />
                  ) : (
                    <MilaVoiceMark size={48} />
                  )}
                </span>
                <span className="presence-picker__copy">
                  <strong>{presence.name[lang]}</strong>
                  <small>{presence.description[lang]}</small>
                </span>
                <span className="presence-picker__check" aria-hidden="true">
                  {value === presence.id ? "✓" : ""}
                </span>
              </button>
            ))}
          </div>

          <p className="presence-picker__disclosure">
            {lang === "ru"
              ? "Все образы созданы ИИ; ни один реальный человек не говорит от их имени."
              : "AI-generated synthetic depictions; no real person is speaking."}
          </p>
        </section>
      ) : null}
    </div>
  );
}
