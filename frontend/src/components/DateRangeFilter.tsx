import clsx from "clsx";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onClear: () => void;
  className?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  className
}: DateRangeFilterProps) {
  return (
    <div
      className={clsx(
        "flex flex-wrap items-end gap-3 rounded-2xl border border-surface-800/60 bg-surface-900/60 p-4",
        className
      )}
    >
      <label className="flex flex-col text-xs text-slate-400">
        <span className="font-medium uppercase tracking-wide text-slate-500">Start date</span>
        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="mt-2 rounded-xl border border-transparent bg-surface-800/70 px-3 py-2 text-sm text-slate-100 transition focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </label>
      <label className="flex flex-col text-xs text-slate-400">
        <span className="font-medium uppercase tracking-wide text-slate-500">End date</span>
        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="mt-2 rounded-xl border border-transparent bg-surface-800/70 px-3 py-2 text-sm text-slate-100 transition focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </label>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full border border-surface-700/70 px-4 py-2 text-xs font-medium text-slate-200 transition hover:border-brand-500/40 hover:text-white"
      >
        Clear
      </button>
    </div>
  );
}
