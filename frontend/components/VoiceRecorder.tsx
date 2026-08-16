"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { transcribeAudio } from "@/lib/api";

type RecorderState = "idle" | "recording" | "transcribing" | "ready";

function preferredRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

export default function VoiceRecorder({
  disabled,
  submitting,
  onRecordingStart,
  onSubmit,
}: {
  disabled: boolean;
  submitting: boolean;
  onRecordingStart?: () => void;
  onSubmit: (transcript: string) => Promise<void>;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function startRecording() {
    setError(null);
    onRecordingStart?.();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredRecorderMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setState("transcribing");
        try {
          const text = await transcribeAudio(blob);
          setTranscript(text);
          setState("ready");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Transcription failed.");
          setState("idle");
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setElapsed(0);
      timerRef.current = window.setInterval(() => setElapsed((value) => value + 1), 1000);
      setState("recording");
    } catch {
      setError("Microphone access is required to record an answer.");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  }

  async function handleSubmit() {
    const text = transcript.trim();
    if (!text) {
      setError("Transcript is empty. Record again, or type your answer in the box above.");
      return;
    }
    await onSubmit(text);
    setTranscript("");
    setState("idle");
    setElapsed(0);
  }

  const statusLabel =
    state === "idle" ? "Listening" :
    state === "recording" ? `Listening • ${String(elapsed).padStart(2, "0")}s` :
    state === "transcribing" ? "Processing your response" :
    "Review transcript, then submit";

  return (
    <div className="space-y-4 rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <Mic className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              Candidate response
            </p>
            <p className="text-sm font-medium text-[var(--foreground)]">{statusLabel}</p>
          </div>
        </div>

        {state === "recording" ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--error)] px-4 py-2 text-sm font-semibold text-white"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || submitting || state === "transcribing"}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009ed6] disabled:opacity-50"
          >
            <Mic className="h-3.5 w-3.5" />
            Record
          </button>
        )}
      </div>

      {(state === "recording" || state === "transcribing") && (
        <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-3 py-2">
          {[0, 1, 2, 3, 4].map((bar) => (
            <span
              key={bar}
              className={`h-3 w-1.5 rounded-full ${
                state === "recording"
                  ? "bg-[var(--primary)] animate-pulse"
                  : "bg-[var(--muted)]"
              }`}
              style={{
                animationDelay: `${bar * 80}ms`,
                opacity: state === "recording" ? 0.3 + bar * 0.15 : 0.5,
              }}
            />
          ))}
        </div>
      )}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--foreground)]">Transcribed answer</span>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={5}
          disabled={disabled || state === "recording" || state === "transcribing"}
          placeholder="Your spoken answer will appear here. You can edit it before submitting."
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-3.5 py-3 text-[15px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,171,228,0.12)] disabled:bg-[var(--primary-soft)]"
        />
      </label>

      {error ? <p className="text-sm font-medium text-[var(--error)]">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || submitting || !transcript.trim()}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#009ed6] disabled:opacity-50"
        >
          <Volume2 className="h-3.5 w-3.5" />
          {submitting ? "Submitting…" : "Submit answer"}
        </button>
      </div>
    </div>
  );
}
