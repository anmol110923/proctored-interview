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
    return <p className="text-sm font-medium text-[var(--error)]">{error}</p>;
  }
  if (summary === undefined) {
    return <p className="text-sm text-[var(--muted-foreground)]">Loading discipline summary…</p>;
  }
  if (summary === null) {
    return null;
  }

  const violations = violationIncidents(summary.incidents);
  const readyReport = summary.reports.find((report) => report.status === "ready" && report.path);

  return (
    <section className="space-y-4 rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Session discipline</p>
        <h2 className="mt-2 text-xl font-semibold text-[var(--foreground)]">Proctoring summary</h2>
      </header>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--primary-soft)] p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Violations</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{summary.violation_count}</p>
        </div>
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--primary-soft)] p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Severity total</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{summary.severity_total}</p>
        </div>
        <div className="rounded-[18px] border border-[var(--border)] bg-[var(--primary-soft)] p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">Status</p>
          <p className="mt-2 text-sm font-semibold capitalize text-[var(--foreground)]">{summary.status ?? "n/a"}</p>
        </div>
      </div>
      {Object.keys(summary.counts_by_type).length ? (
        <ul className="flex flex-wrap gap-2 text-xs">
          {Object.entries(summary.counts_by_type).map(([type, count]) => (
            <li key={type} className="rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-2.5 py-1 text-[var(--primary)]">
              {type.replaceAll("_", " ").toLowerCase()}: {count}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--muted-foreground)]">No focus or presence flags were recorded.</p>
      )}
      {readyReport ? (
        <a
          className="inline-block text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
          href={reportDownloadUrl(readyReport.id)}
        >
          Download full proctoring report
        </a>
      ) : null}
      {violations.length ? (
        <ol className="space-y-3">
          {violations.map((incident) => (
            <li key={incident.id} className="border-t border-[var(--border)] pt-3 text-sm">
              <p className="font-medium text-[var(--foreground)]">
                {incident.type.replaceAll("_", " ")}
                <span className="ml-2 text-xs font-normal text-[var(--muted)]">
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
                      className="text-xs underline text-[var(--primary)]"
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
