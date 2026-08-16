import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary)]",
        className,
      )}
      {...props}
    />
  );
}
