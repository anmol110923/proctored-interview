export default function ProgressBar({ progress }: { progress: number }) {
  const width = Math.min(100, Math.max(0, progress * 100));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[#6ecbf7] transition-all duration-300"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
