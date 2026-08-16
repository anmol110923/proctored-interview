import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import SessionSetupForm from "@/components/setup/SessionSetupForm";
import { getMode, isInterviewMode, toModeSetupProps } from "@/lib/modes";

export default async function ModeSetupPage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode: modeId } = await params;
  if (!isInterviewMode(modeId)) notFound();
  const mode = getMode(modeId);
  if (!mode) notFound();

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          All modes
        </Link>
      </div>

      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-soft)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
          Configure your interview
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
          {mode.label}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted-foreground)]">
          {mode.description}
        </p>

        <div className="mt-8">
          <SessionSetupForm mode={toModeSetupProps(mode)} />
        </div>
      </div>
    </main>
  );
}
