"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listSessions } from "@/lib/api";
import { getMode } from "@/lib/modes";
import type { SessionSummary } from "@/lib/types";

const statusStyles: Record<string, string> = {
  active: "border-[var(--primary)]/30 bg-[var(--primary-soft)] text-[var(--primary)]",
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  evaluating: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSessions() {
    setError(null);
    try {
      const data = await listSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history.");
    }
  }

  useEffect(() => {
    void loadSessions();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Interview sessions
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
              Interview Sessions
            </h1>
            <p className="mt-2 text-base text-[var(--muted-foreground)]">
              Review your previous practice interviews and performance.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href="/">
              <Plus className="h-4 w-4" />
              New Interview
            </Link>
          </Button>
        </div>

        {error ? (
          <div className="mt-6 rounded-[22px] border border-red-200 bg-red-50 p-5 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <FolderOpen className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-800">Unable to load interviews</h2>
                <p className="mt-1 text-sm leading-6 text-red-700">
                  We couldn&apos;t connect to the interview service. Please check your connection and try again.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" className="mt-4" onClick={() => void loadSessions()}>
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : null}

        {!sessions && !error ? (
          <div className="mt-6 rounded-[22px] border border-[var(--border)] bg-[var(--primary-soft)] p-5 text-sm text-[var(--muted-foreground)]">
            Loading interview history…
          </div>
        ) : null}

        {sessions?.length === 0 && !error ? (
          <div className="mt-6 rounded-[26px] border border-dashed border-[var(--border)] bg-[var(--primary-soft)] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--primary)] shadow-sm">
              <FolderOpen className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-[var(--foreground)]">No interviews yet</h2>
            <p className="mt-2 text-[var(--muted-foreground)]">
              Your completed interviews will appear here.
            </p>
            <Button asChild className="mt-5">
              <Link href="/">
                Start your first interview
              </Link>
            </Button>
          </div>
        ) : null}

        {sessions && sessions.length > 0 ? (
          <div className="mt-6 overflow-hidden rounded-[22px] border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)] text-left">
                <thead className="bg-[var(--primary-soft)] text-[var(--muted-foreground)]">
                  <tr>
                    {['Interview Type','Date','Score','Duration','Proctoring','Status'].map((heading) => (
                      <th key={heading} className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] bg-white">
                  {sessions.map((item) => {
                    const mode = getMode(item.mode);
                    const date = new Date(item.created_at).toLocaleString();
                    return (
                      <tr key={item.id} className="transition-colors hover:bg-[var(--primary-soft)]/60">
                        <td className="px-4 py-4">
                          <Link href={`/interview/${item.id}`} className="font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                            {mode?.label ?? item.mode}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">{date}</td>
                        <td className="px-4 py-4">
                          {item.overall_score != null ? (
                            <span className="font-mono text-sm font-semibold text-[var(--foreground)]">
                              {item.overall_score}
                            </span>
                          ) : (
                            <span className="text-sm text-[var(--muted)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-[var(--muted-foreground)]">{item.duration_minutes} min</td>
                        <td className="px-4 py-4">
                          <Badge className={item.proctoring_enabled ? "border-[var(--primary)]/30 bg-[var(--primary-soft)] text-[var(--primary)]" : "border-[var(--border)] bg-slate-100 text-slate-500"}>
                            {item.proctoring_enabled
                              ? item.violation_count > 0
                                ? `${item.violation_count} violation${item.violation_count === 1 ? "" : "s"}`
                                : "Proctored"
                              : "Not Proctored"}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={statusStyles[item.status] ?? "border-[var(--border)] bg-slate-100 text-slate-500"}>
                            {item.status === "complete" ? "Completed" : item.status === "evaluating" ? "In Progress" : "Active"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
