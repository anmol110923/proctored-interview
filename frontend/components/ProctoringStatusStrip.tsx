"use client";

import type { DetectionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function Indicator({
  label,
  ok,
  alert,
}: {
  label: string;
  ok: boolean;
  alert?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]",
        alert
          ? "border-red-300 bg-red-50 text-red-700"
          : ok
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-zinc-200 bg-zinc-50 text-zinc-500",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          alert ? "bg-red-500" : ok ? "bg-emerald-500" : "bg-zinc-400",
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
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2">
      <div className="h-10 w-14 rounded-md bg-zinc-900 text-[9px] font-medium leading-10 text-center text-zinc-300">
        CAM
      </div>
      <Indicator label={connected ? "Live" : "Offline"} ok={connected} alert={!connected} />
      <Indicator label={faceOk ? "Face" : "No face"} ok={faceOk} alert={status != null && !faceOk} />
      <Indicator
        label={gazeOk ? "Gaze ok" : `Gaze ${status?.gaze_direction ?? "away"}`}
        ok={gazeOk}
        alert={Boolean(status && !gazeOk)}
      />
      <Indicator label="Multi-face" ok={!multiAlert} alert={multiAlert} />
      <Indicator label="Objects" ok={!objectAlert} alert={objectAlert} />
    </div>
  );
}
