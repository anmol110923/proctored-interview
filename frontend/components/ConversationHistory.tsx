"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Turn } from "@/lib/types";

export default function ConversationHistory({ turns }: { turns: Turn[] }) {
  const [open, setOpen] = useState(false);

  if (turns.length === 0) {
    return (
      <div className="rounded-[22px] border border-[var(--border)] bg-white p-5 text-sm text-[var(--muted-foreground)] shadow-sm">
        No conversation yet.
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-[22px] border border-[var(--border)] bg-white px-4 py-3 text-left text-sm font-medium text-[var(--foreground)] shadow-sm">
        <span>Running transcript ({turns.length} turns)</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
          {turns.map((turn, index) => (
            <li
              key={`${turn.timestamp}-${index}`}
              className={`rounded-[18px] border px-3 py-3 text-sm ${
                turn.role === "interviewer"
                  ? "border-[var(--border)] bg-[var(--primary-soft)] text-[var(--foreground)]"
                  : "border-[var(--border)] bg-white text-[var(--foreground)]"
              }`}
            >
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                {turn.role === "interviewer" ? "Interviewer" : "Candidate"}
              </p>
              <p className="whitespace-pre-wrap leading-7">{turn.content}</p>
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
