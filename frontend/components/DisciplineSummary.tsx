"use client";

import { useEffect, useState } from "react";
import { getCombinedReport, mediaUrl, reportDownloadUrl } from "@/lib/api";
import type { Incident, ProctoringSummary } from "@/lib/types";

function violationIncidents(incidents: Incident[]): Incident[] {
  return incidents.filter((incident) => incident.type !== "SESSION_RECORDING");
}

export default function DisciplineSummary({ sessionId }: { sessionId: string }) {
  const [summary, setSummary] = useState<ProctoringSummary | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCombinedReport(sessionId)
      .then((report) => setSummary(report.proctoring))
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load discipline summary."));
  }, [sessionId]);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (summary === undefined) {
    return <p className="text-sm text-zinc-500">Loading discipline summary…</p>;
  }
  if (summary === null) {
    return null;
  }

  const violations = violationIncidents(summary.incidents);
  const readyReport = summary.reports.find((report) => report.status === "ready" && report.path);

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Session discipline</p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-900">Proctoring summary</h2>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Violations</p>
          <p className="mt-1 text-2xl font-semibold">{summary.violation_count}</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Severity total</p>
          <p className="mt-1 text-2xl font-semibold">{summary.severity_total}</p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          <p className="text-xs text-zinc-500">Status</p>
          <p className="mt-1 text-sm font-medium capitalize">{summary.status ?? "n/a"}</p>
        </div>
      </div>
      {Object.keys(summary.counts_by_type).length ? (
        <ul className="flex flex-wrap gap-2 text-xs">
          {Object.entries(summary.counts_by_type).map(([type, count]) => (
            <li key={type} className="rounded-full border border-zinc-200 px-2.5 py-1">
              {type.replaceAll("_", " ").toLowerCase()}: {count}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-600">No focus or presence flags were recorded.</p>
      )}
      {readyReport ? (
        <a
          className="inline-block text-sm text-zinc-800 underline"
          href={reportDownloadUrl(readyReport.id)}
        >
          Download full proctoring report
        </a>
      ) : null}
      {violations.length ? (
        <ol className="space-y-3">
          {violations.map((incident) => (
            <li key={incident.id} className="border-t border-zinc-100 pt-3 text-sm">
              <p className="font-medium text-zinc-900">
                {incident.type.replaceAll("_", " ")}
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  {new Date(incident.timestamp).toLocaleString()}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {incident.evidence.map((item) =>
                  item.kind === "image" ? (
                    <a key={item.id} href={mediaUrl(item.path)} target="_blank" rel="noreferrer">
                      <img
                        src={mediaUrl(item.path)}
                        alt={incident.type}
                        className="h-16 w-24 rounded-md object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      key={item.id}
                      className="text-xs underline"
                      href={mediaUrl(item.path)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {item.kind}
                    </a>
                  ),
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
