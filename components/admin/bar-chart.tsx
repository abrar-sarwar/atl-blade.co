import { cn } from "@/lib/utils";

export type BarDatum = {
  label: string;
  value: number;
  /** Optional tooltip / secondary text shown on hover. */
  title?: string;
};

/**
 * Minimal dependency-free vertical bar chart. Heights are percentages of the
 * max value, so it renders identically on server and client.
 */
export function BarChart({
  data,
  height = 160,
  valueFormat = (v) => String(v),
}: {
  data: BarDatum[];
  height?: number;
  valueFormat?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="w-full">
      <div
        className="flex items-end gap-1"
        style={{ height }}
        role="img"
        aria-label="Bar chart"
      >
        {data.map((d, i) => {
          const pct = Math.round((d.value / max) * 100);
          return (
            <div
              key={i}
              className="group relative flex flex-1 items-end"
              style={{ height: "100%" }}
              title={d.title ?? `${d.label}: ${valueFormat(d.value)}`}
            >
              <div
                className={cn(
                  "w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary",
                  d.value === 0 && "bg-muted",
                )}
                style={{ height: `${Math.max(pct, d.value > 0 ? 2 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex-1 truncate text-center text-[10px] text-muted-foreground"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
