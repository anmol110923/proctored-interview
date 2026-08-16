"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Check, ScanFace, ShieldCheck, Sparkles, Video, Volume2, Eye, Monitor, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createSession, createSessionWithResume } from "@/lib/api";
import type { ModeSetupProps } from "@/lib/modes";
import type { Difficulty, DurationMinutes } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const DURATIONS: DurationMinutes[] = [15, 30, 45];
const PROCTORING_CAPABILITIES = [
  { label: "Face presence", icon: ScanFace },
  { label: "Gaze monitoring", icon: Eye },
  { label: "Multiple-face detection", icon: Camera },
  { label: "Prohibited-object detection", icon: ShieldCheck },
  { label: "Microphone monitoring", icon: Volume2 },
  { label: "Optional screen monitoring", icon: Monitor },
];

export default function SessionSetupForm({ mode }: { mode: ModeSetupProps }) {
  const router = useRouter();
  const [customPrompt, setCustomPrompt] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [duration, setDuration] = useState<DurationMinutes>(30);
  const [focusAreas, setFocusAreas] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [proctoringEnabled, setProctoringEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isResume = mode.id === "resume_round";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (customPrompt.trim().length < 10) {
      setError("Enter a custom prompt of at least 10 characters.");
      return;
    }
    const tags = focusAreas
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    setLoading(true);
    try {
      if (isResume && (resumeFile || resumeText.trim())) {
        const form = new FormData();
        form.append("custom_prompt", customPrompt.trim());
        form.append("difficulty", difficulty);
        form.append("duration_minutes", String(duration));
        form.append("focus_areas", tags.join(","));
        form.append("resume_text", resumeText.trim());
        form.append("proctoring_enabled", String(proctoringEnabled));
        if (resumeFile) form.append("resume_pdf", resumeFile);
        const session = await createSessionWithResume(form);
        router.push(`/interview/${session.id}`);
        return;
      }
      const session = await createSession({
        mode: mode.id,
        custom_prompt: customPrompt.trim(),
        difficulty,
        duration_minutes: duration,
        focus_areas: tags,
        resume_text: isResume ? resumeText.trim() || null : null,
        proctoring_enabled: proctoringEnabled,
      });
      router.push(`/interview/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start interview.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--foreground)]">{mode.promptLabel}</span>
        <p className="text-sm text-[var(--muted-foreground)]">{mode.setupHint}</p>
        <Textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          rows={8}
          placeholder={mode.promptPlaceholder}
          className="min-h-[180px] rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[15px] text-[var(--foreground)] shadow-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,171,228,0.12)]"
        />
      </label>

      {isResume ? (
        <div className="space-y-4 rounded-[22px] border border-dashed border-[var(--border)] bg-[var(--primary-soft)] p-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Resume PDF (optional)</span>
            <p className="text-xs text-[var(--muted-foreground)]">
              Text-based PDFs only. Scanned images will not extract.
            </p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--foreground)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--foreground)]">Resume text (optional)</span>
            <Textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={6}
              placeholder="Paste resume text if you are not uploading a PDF."
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[15px] text-[var(--foreground)] shadow-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,171,228,0.12)]"
            />
          </label>
        </div>
      ) : null}

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--foreground)]">Focus areas</span>
        <input
          value={focusAreas}
          onChange={(e) => setFocusAreas(e.target.value)}
          placeholder="Comma-separated tags, e.g. metrics, guesstimates"
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--foreground)] shadow-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[rgba(0,171,228,0.12)]"
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--foreground)]">Difficulty</legend>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDifficulty(option)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm capitalize transition-all duration-200",
                difficulty === option
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm"
                  : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-[var(--primary)]/40",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-[var(--foreground)]">Duration</legend>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDuration(option)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-all duration-200",
                duration === option
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm"
                  : "border-[var(--border)] bg-white text-[var(--muted-foreground)] hover:border-[var(--primary)]/40",
              )}
            >
              {option} min
            </button>
          ))}
        </div>
      </fieldset>

      <div className="rounded-[22px] border border-[var(--border)] bg-[var(--primary-soft)] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-[var(--foreground)]">Interview Proctoring</p>
            <p className="mt-1 max-w-lg text-sm leading-6 text-[var(--muted-foreground)]">
              Optional monitoring features designed to simulate a structured interview environment.
            </p>
          </div>
          <button
            type="button"
            aria-label="Toggle proctoring"
            aria-pressed={proctoringEnabled}
            onClick={() => setProctoringEnabled((value) => !value)}
            className={cn(
              "relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200",
              proctoringEnabled ? "bg-[var(--primary)]" : "bg-slate-300",
            )}
          >
            <span
              className={cn(
                "absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                proctoringEnabled ? "translate-x-6" : "translate-x-1",
              )}
            />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PROCTORING_CAPABILITIES.map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white px-3 py-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm text-[var(--foreground)]">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--muted-foreground)]">
          <Sparkles className="h-4 w-4 text-[var(--primary)]" />
          Proctoring is optional and will only activate when you choose it for the session.
        </div>
      </div>

      {error ? <p className="text-sm font-medium text-[var(--error)]">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Starting interview…" : "Start Interview"}
      </Button>
    </form>
  );
}
