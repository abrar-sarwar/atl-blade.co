export type RankedRow = {
  label: string;
  value: number;
  /** Right-aligned secondary text (e.g. revenue). */
  meta?: string;
};

/** Ranked rows with an inline proportional bar. Dependency-free. */
export function RankedList({
  rows,
  valueFormat = (v) => String(v),
  emptyText = "No data yet.",
}: {
  rows: RankedRow[];
  valueFormat?: (v: number) => string;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
    );
  }
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <ul className="space-y-3">
      {rows.map((r, i) => (
        <li key={i} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 font-medium">
              {valueFormat(r.value)}
              {r.meta ? (
                <span className="ml-2 text-xs text-muted-foreground">{r.meta}</span>
              ) : null}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full rounded bg-primary/70"
              style={{ width: `${Math.round((r.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
