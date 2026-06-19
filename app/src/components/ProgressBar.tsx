interface ProgressBarProps {
  progress: number // 0 to 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)))

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1 w-full bg-[var(--border)]"
    >
      <div
        className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
