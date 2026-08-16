"use client";

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

export default function InterviewTimer({ remainingSeconds }: { remainingSeconds: number }) {
  const urgent = remainingSeconds <= 60;
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
        Time remaining
      </p>
      <p
        className={`mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight ${
          urgent ? "text-[var(--error)]" : "text-[var(--foreground)]"
        }`}
      >
        {formatTime(remainingSeconds)}
      </p>
    </div>
  );
}
