"use client";

import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function QuestionDisplay({
  question,
  autoSpeak,
  onAutoSpeakChange,
  isSpeaking,
  speechSupported,
  onListen,
  onStop,
}: {
  question: string | null;
  autoSpeak: boolean;
  onAutoSpeakChange: (value: boolean) => void;
  isSpeaking: boolean;
  speechSupported: boolean;
  onListen: () => void;
  onStop: () => void;
}) {
  return (
    <section className="rounded-[24px] border border-[var(--border)] bg-white p-6 shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            AI Interviewer
          </p>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Current question</p>
        </div>

        {speechSupported ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onListen} disabled={!question}>
              <Volume2 className="h-3.5 w-3.5" />
              {isSpeaking ? "Replay" : "Listen"}
            </Button>
            {isSpeaking ? (
              <Button type="button" variant="outline" size="sm" onClick={onStop}>
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
            ) : null}
            <label className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-2.5 py-1.5 text-xs text-[var(--muted-foreground)]">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(event) => onAutoSpeakChange(event.target.checked)}
                className="h-3.5 w-3.5 rounded border-[var(--border)] accent-[var(--primary)]"
              />
              Auto-read
            </label>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted-foreground)]">Speech is not supported in this browser.</p>
        )}
      </div>

      <div className="rounded-[20px] border border-[var(--border)] bg-[var(--primary-soft)] p-4">
        <p className="text-[15px] leading-8 text-[var(--foreground)] sm:text-lg">
          {question ?? "Waiting for the interviewer…"}
        </p>
      </div>

      {speechSupported ? (
        <div className="mt-4 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-2.5 py-1.5">
            <span
              className={`h-2 w-2 rounded-full ${isSpeaking ? "bg-[var(--primary)] animate-pulse" : "bg-[var(--muted)]"}`}
            />
            {isSpeaking ? "Interviewer is speaking" : autoSpeak ? "Auto-read enabled" : "Auto-read disabled"}
          </span>
        </div>
      ) : null}
    </section>
  );
}
