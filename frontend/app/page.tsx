import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MODES } from "@/lib/modes";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-white/80 shadow-[var(--shadow-soft)] backdrop-blur-sm">
        <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-10">
          <div className="flex flex-col justify-center">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
              <Sparkles className="h-3.5 w-3.5" />
              Professional AI interviews
            </p>

            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
              Practice for real interviews with structured, AI-guided feedback.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted-foreground)]">
              You supply the context — case books, resume, role brief, or behavioral prompts. The
              interviewer adapts in real time, and you leave with a scored assessment built for
              professional hiring scenarios.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="px-6">
                <Link href="/modes/pm_cases/setup">
                  Start Interview
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="px-6">
                <Link href="/history">View Sessions</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Interview modes", value: "5" },
                { label: "Live feedback", value: "AI" },
                { label: "Assessment ready", value: "1 click" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--primary-soft)] p-3">
                  <div className="text-xl font-semibold text-[var(--foreground)]">{item.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--muted)]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-[#edf7ff] via-[#f4faff] to-[#dfefff] p-6">
              <div className="absolute -right-12 -top-8 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl" />
              <div className="absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-[#d9edff] blur-2xl" />

              <div className="relative space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3 shadow-sm">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">AI interviewer</div>
                    <div className="mt-1 text-sm font-medium text-[var(--foreground)]">Ready for your turn</div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#cfeaff] bg-[#edf9ff] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                    Online
                  </span>
                </div>

                <div className="relative mx-auto flex h-[280px] w-[220px] items-end justify-center">
                  <div className="absolute bottom-0 h-28 w-28 rounded-[30px] bg-[#10213a] shadow-[0_25px_60px_rgba(16,33,58,0.18)]" />
                  <div className="absolute bottom-12 left-1/2 h-20 w-20 -translate-x-1/2 rounded-[22px] bg-[#112647] shadow-[0_12px_30px_rgba(0,171,228,0.18)]" />
                  <div className="absolute bottom-24 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full border-[10px] border-[#172033] bg-[#eff9ff]" />
                  <div className="absolute bottom-32 left-10 h-3 w-3 rounded-full bg-[var(--primary)]" />
                  <div className="absolute bottom-32 right-10 h-3 w-3 rounded-full bg-[var(--primary)]" />
                  <div className="absolute bottom-20 left-1/2 h-4 w-8 -translate-x-1/2 rounded-full border-2 border-[#00abe4] bg-[#dff7ff]" />
                  <div className="absolute bottom-0 left-1/2 h-24 w-40 -translate-x-1/2 rounded-t-[28px] bg-[#15315d]" />
                  <div className="absolute bottom-0 left-[22%] h-16 w-8 rounded-full bg-[#0c1d32]" />
                  <div className="absolute bottom-0 right-[22%] h-16 w-8 rounded-full bg-[#0c1d32]" />
                  <div className="absolute inset-x-10 bottom-5 flex justify-between">
                    <span className="h-14 w-3 rounded-full bg-[var(--primary)]/70" />
                    <span className="h-14 w-3 rounded-full bg-[var(--primary)]/70" />
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--muted-foreground)] shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-[var(--foreground)]">Mock Interview Engine</span>
                    <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                  </div>
                  <p className="mt-2 leading-6">
                    Structured prompts, voice answers, and evaluation feedback aligned to hiring and
                    assessment workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <Link key={mode.id} href={`/modes/${mode.id}/setup`} className="group block h-full">
              <Card className="h-full border-[var(--border)] bg-white/90 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-[var(--primary)]/60 group-hover:shadow-[0_10px_25px_rgba(0,171,228,0.08)]">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-[var(--primary)]/10">
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-[var(--muted)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" />
                  </div>
                  <CardTitle className="pt-4 text-[var(--foreground)]">{mode.label}</CardTitle>
                  <CardDescription>{mode.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                    Start setup
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
