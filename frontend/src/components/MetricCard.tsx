import { ComponentType, SVGProps } from "react";
import clsx from "clsx";

type TrendDirection = "up" | "down" | "neutral";

interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
  trend?: {
    value: string;
    label?: string;
    direction?: TrendDirection;
  };
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export function MetricCard({ label, value, description, trend, icon: Icon }: MetricCardProps) {
  const direction: TrendDirection = trend?.direction
    ? trend.direction
    : trend?.value?.trim().startsWith("-")
      ? "down"
      : trend?.value
        ? "up"
        : "neutral";

  const trendColor =
    direction === "up"
      ? "text-teal-300"
      : direction === "down"
        ? "text-rose-300"
        : "text-slate-400";

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-surface-800/60 bg-surface-900/70 p-6 shadow-shell transition duration-300 hover:border-brand-500/40 hover:shadow-glow">
      <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100" aria-hidden>
        <div className="h-full w-full bg-gradient-to-br from-brand-500/10 via-transparent to-transparent" />
      </div>
      <div className="relative flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          {Icon ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-surface-700/70 bg-surface-800/70 text-brand-200">
              <Icon className="h-5 w-5" />
            </span>
          ) : null}
        </div>
        <p className="text-3xl font-semibold text-slate-50">{value}</p>
        {trend ? (
          <div className="flex items-center gap-2 text-xs">
            <span className={clsx("font-semibold", trendColor)}>{trend.value}</span>
            {trend.label ? <span className="text-slate-500">{trend.label}</span> : null}
          </div>
        ) : null}
        {description ? <p className="text-sm text-slate-400">{description}</p> : null}
      </div>
    </article>
  );
}
