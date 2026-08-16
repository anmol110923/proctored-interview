"use client";

import type { DetectionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function Indicator({
  label,
  ok,
  alert,
  neutral,
}: {
  label: string;
  ok: boolean;
  alert?: boolean;
  neutral?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
        alert
          ? "border-red-200 bg-red-50 text-red-700"
          : ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : neutral
              ? "border-[var(--border)] bg-white text-[var(--muted-foreground)]"
              : "border-[var(--border)] bg-[var(--primary-soft)] text-[var(--primary)]",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          alert ? "bg-red-500" : ok ? "bg-emerald-500" : "bg-[var(--primary)]",
        )}
      />
      {label}
    </span>
  );
}

export default function ProctoringStatusStrip({
  connected,
  status,
}: {
  connected: boolean;
  status: DetectionStatus | null;
}) {
  const faceOk = Boolean(status?.face_present);
  const gazeOk = status?.gaze_direction === "center" || status?.gaze_direction === "unknown" || !status;
  const multiAlert = Boolean(status?.multiple_faces);
  const objectAlert = Boolean(status?.objects_detected);

  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
          Interview monitoring
        </p>
        <Indicator label={connected ? "Live" : "Offline"} ok={connected} alert={!connected} neutral={!connected} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Indicator label={faceOk ? "Face presence • Detected" : "Face presence • Missing"} ok={faceOk} alert={status != null && !faceOk} neutral={!status} />
        <Indicator label={gazeOk ? "Gaze • Normal" : `Gaze • ${status?.gaze_direction ?? "Away"}`} ok={gazeOk} alert={Boolean(status && !gazeOk)} neutral={!status} />
        <Indicator label={multiAlert ? "Additional faces • Detected" : "Additional faces • None"} ok={!multiAlert} alert={multiAlert} neutral={!status} />
        <Indicator label={objectAlert ? "Objects • Flagged" : "Objects • Clear"} ok={!objectAlert} alert={objectAlert} neutral={!status} />
      </div>
    </div>
  );
}
