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
    <div className={clsx("flex flex-wrap items-end gap-3", className)}>
      <label className="flex flex-col text-xs text-slate-400">
        Start date
        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="mt-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <label className="flex flex-col text-xs text-slate-400">
        End date
        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="mt-1 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </label>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
      >
        Clear
      </button>
    </div>
  );
}
