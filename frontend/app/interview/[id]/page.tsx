"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ShieldCheck } from "lucide-react";
import ConversationHistory from "@/components/ConversationHistory";
import DebugPanel from "@/components/DebugPanel";
import DisciplineSummary from "@/components/DisciplineSummary";
import EvaluationReport from "@/components/EvaluationReport";
import InterviewTimer from "@/components/InterviewTimer";
import ProgressBar from "@/components/ProgressBar";
import ProctoringStatusStrip from "@/components/ProctoringStatusStrip";
import QuestionDisplay from "@/components/QuestionDisplay";
import VoiceRecorder from "@/components/VoiceRecorder";
import { Button } from "@/components/ui/button";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import { useProctoringEvents } from "@/hooks/useProctoringEvents";
import { useQuestionSpeech } from "@/hooks/useQuestionSpeech";
import { startProctoring } from "@/lib/api";
import { getMode } from "@/lib/modes";

const SHOW_DEBUG = process.env.NEXT_PUBLIC_DEBUG === "true";
const AUTO_READ_KEY = "case-ai-auto-read-questions";

export default function InterviewPage() {
  const params = useParams<{ id: string }>();
  const { session, error, submitting, ending, remainingSeconds, handleEnd, handleSubmit } =
    useInterviewSession(params.id);
  const { speak, cancel, isSpeaking, supported } = useQuestionSpeech();
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [autoSpeakReady, setAutoSpeakReady] = useState(false);
  const [proctoringError, setProctoringError] = useState<string | null>(null);
  const startedProctoring = useRef(false);
  const proctoringLive = Boolean(session?.proctoring_enabled && session.status === "active");
  const { connected, status: detectionStatus } = useProctoringEvents(params.id, proctoringLive);

  useEffect(() => {
    if (!session?.proctoring_enabled || session.status !== "active" || startedProctoring.current) return;
    startedProctoring.current = true;
    startProctoring(session.id).catch((err) => {
      startedProctoring.current = false;
      setProctoringError(err instanceof Error ? err.message : "Could not start proctoring.");
    });
  }, [session?.id, session?.proctoring_enabled, session?.status]);

  useEffect(() => {
    const stored = window.localStorage.getItem(AUTO_READ_KEY);
    if (stored === "false") setAutoSpeak(false);
    setAutoSpeakReady(true);
  }, []);

  useEffect(() => {
    if (!session || session.status !== "active" || !autoSpeakReady) return;
    if (!autoSpeak) {
      cancel();
      return;
    }
    speak(session.current_question);
  }, [session?.current_question, session?.status, autoSpeak, autoSpeakReady, speak, cancel]);

  useEffect(() => {
    if (session && session.status !== "active") cancel();
  }, [session?.status, cancel]);

  function handleAutoSpeakChange(value: boolean) {
    setAutoSpeak(value);
    window.localStorage.setItem(AUTO_READ_KEY, String(value));
  }

  if (error && !session) {
    return <p className="p-8 text-sm font-medium text-[var(--error)]">{error}</p>;
  }

  if (!session) {
    return <p className="p-8 text-sm text-[var(--muted-foreground)]">Loading interview…</p>;
  }

  const mode = getMode(session.mode);
  const totalSeconds = session.duration_minutes * 60;
  const remaining = remainingSeconds ?? totalSeconds;
  const progress = 1 - remaining / totalSeconds;
  const isComplete = session.status === "complete" && session.evaluation;
  const isEvaluating = session.status === "evaluating" || ending;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            {mode?.label ?? session.mode}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
            Interview Session
          </h1>
        </div>

        {!isComplete ? (
          <Button type="button" variant="outline" size="sm" onClick={handleEnd} disabled={ending}>
            {ending ? "Ending…" : "End interview"}
          </Button>
        ) : (
          <Link href="/" className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline">
            New interview
          </Link>
        )}
      </div>

      <ProgressBar progress={isComplete ? 1 : progress} />

      {error ? <p className="mt-4 text-sm font-medium text-[var(--error)]">{error}</p> : null}
      {proctoringError ? (
        <p className="mt-4 text-sm font-medium text-[var(--error)]">{proctoringError}</p>
      ) : null}

      {isEvaluating && !isComplete ? (
        <div className="mt-4 rounded-[18px] border border-[var(--border)] bg-[var(--primary-soft)] px-4 py-3 text-sm text-[var(--muted-foreground)]">
          Generating evaluation…
        </div>
      ) : null}

      {isComplete && session.evaluation ? (
        <div className="mt-6 space-y-6">
          <EvaluationReport session={session} />
          {session.proctoring_enabled ? <DisciplineSummary sessionId={session.id} /> : null}
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <QuestionDisplay
              question={session.current_question}
              autoSpeak={autoSpeak}
              onAutoSpeakChange={handleAutoSpeakChange}
              isSpeaking={isSpeaking}
              speechSupported={supported}
              onListen={() => speak(session.current_question)}
              onStop={cancel}
            />
            <ConversationHistory turns={session.turns} />
            <VoiceRecorder
              disabled={session.status !== "active" || ending}
              submitting={submitting}
              onRecordingStart={cancel}
              onSubmit={handleSubmit}
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Interview status
                </p>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 space-y-4 text-sm text-[var(--muted-foreground)]">
                <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border)] bg-[var(--primary-soft)] px-3 py-2">
                  <span>Mode</span>
                  <span className="font-medium text-[var(--foreground)]">{mode?.label ?? session.mode}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border)] bg-white px-3 py-2">
                  <span>Status</span>
                  <span className="font-medium text-[var(--foreground)]">{session.status === "active" ? "Active" : session.status}</span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border)] bg-white px-3 py-2">
                  <span>Progress</span>
                  <span className="font-medium text-[var(--foreground)]">{Math.round((1 - progress) * 100)}%</span>
                </div>
              </div>

              <div className="mt-4">
                <InterviewTimer remainingSeconds={isComplete ? 0 : remaining} />
              </div>
            </div>

            {session.proctoring_enabled && session.status === "active" ? (
              <ProctoringStatusStrip connected={connected} status={detectionStatus} />
            ) : null}

            {session.proctoring_enabled && session.status !== "active" ? (
              <div className="rounded-[24px] border border-[var(--border)] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                  <AlertCircle className="h-4 w-4 text-[var(--warning)]" />
                  Proctoring is enabled for this session.
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      )}

      {SHOW_DEBUG ? <DebugPanel sessionId={session.id} /> : null}
    </main>
  );
}
