import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/history", label: "Sessions" },
  { href: "/", label: "New Interview" },
];

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight text-[var(--primary)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-sm font-black text-white shadow-sm">
            C
          </span>
          CASE_AI
        </Link>

        <nav className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--primary-soft)] p-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={
                item.label === "New Interview"
                  ? "rounded-full bg-[var(--primary)] px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-[#009ed6]"
                  : "rounded-full px-4 py-2 font-medium text-[var(--muted-foreground)] transition-colors hover:bg-white hover:text-[var(--primary)]"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
