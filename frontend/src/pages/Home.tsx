import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchSummary } from "../api/queries";
import { MetricCard } from "../components/MetricCard";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { toDateRangeParams } from "../utils/dateRange";

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function Home() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const params = useMemo(() => toDateRangeParams(startDate, endDate), [startDate, endDate]);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["summary", params.start_date ?? null, params.end_date ?? null],
    queryFn: () => fetchSummary(params),
    staleTime: 60_000
  });

  if (isError) {
    return (
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-100">Overall Summary</h1>
          <div className="flex items-center gap-3">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onClear={() => {
                setStartDate("");
                setEndDate("");
                void refetch();
              }}
            />
            <button
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        </header>
        <p className="text-sm text-red-300">Unable to load summary data. Please ensure the API is running.</p>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Overall Summary</h1>
            <p className="text-sm text-slate-500">Gathering spam detection metrics...</p>
          </div>
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={() => {
              setStartDate("");
              setEndDate("");
            }}
          />
        </header>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Overall Summary</h1>
          <p className="text-sm text-slate-400">Snapshot based on the selected date range.</p>
        </div>
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={() => {
            setStartDate("");
            setEndDate("");
          }}
        />
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="SMS total" value={data.sms.total_messages.toLocaleString()} />
        <MetricCard label="SMS blocked" value={data.sms.blocked_messages.toLocaleString()} />
        <MetricCard label="Call total" value={data.calls.total_calls.toLocaleString()} />
        <MetricCard label="Call blocked" value={data.calls.blocked_calls.toLocaleString()} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Overall block rate"
          value={formatPercent(data.overall_block_rate)}
          description="Blocked events relative to total traffic"
        />
        <MetricCard
          label="Average classifier confidence"
          value={formatPercent(data.avg_confidence)}
          description="Across SMS and call verdicts"
        />
        <MetricCard
          label="Unique spam senders"
          value={data.sms.unique_senders.toLocaleString()}
          description="Numbers flagged in the selected window"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-100">Unique Fraud SMS</h2>
            <p className="text-xs text-slate-500">
              Deduplicated by message template within the selected range.
            </p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Detected"
              value={data.sms_unique_spam_messages.toLocaleString()}
              description="Unique spam templates"
            />
            <MetricCard
              label="Blocked"
              value={data.sms_unique_blocked_messages.toLocaleString()}
              description="Unique templates stopped"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Timeline
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {data.sms_daily.length === 0 ? (
                <li className="text-slate-500">No SMS activity in this range.</li>
              ) : (
                data.sms_daily.map((entry) => (
                  <li key={entry.date} className="flex items-center justify-between">
                    <span className="text-slate-400">
                      {new Date(entry.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                    <span className="text-slate-200">
                      {entry.detected.toLocaleString()} detected · {entry.blocked.toLocaleString()} blocked
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-100">Daily Histograms</h2>
            <p className="text-xs text-slate-500">
              Compare detected vs blocked spam volume day by day.
            </p>
          </header>
          <Histograms daily={data.sms_daily} />
        </div>
      </div>
    </section>
  );
}

function Histograms({
  daily
}: {
  daily: {
    date: string;
    detected: number;
    blocked: number;
  }[];
}) {
  if (daily.length === 0) {
    return <p className="text-sm text-slate-500">No SMS events to chart.</p>;
  }

  const maxDetected = Math.max(...daily.map((d) => d.detected), 1);
  const maxBlocked = Math.max(...daily.map((d) => d.blocked), 1);

  const labelFor = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const Bar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div className="h-3 flex-1 rounded-full bg-slate-800">
      <div
        className={`h-3 rounded-full ${color}`}
        style={{ width: `${max === 0 ? 0 : (value / max) * 100}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Detected</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {daily.map((entry) => (
            <li key={`detected-${entry.date}`} className="flex items-center gap-3 text-slate-300">
              <span className="w-14 text-xs text-slate-500">{labelFor(entry.date)}</span>
              <Bar value={entry.detected} max={maxDetected} color="bg-primary" />
              <span className="w-10 text-right text-xs text-slate-500">{entry.detected}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Blocked</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {daily.map((entry) => (
            <li key={`blocked-${entry.date}`} className="flex items-center gap-3 text-slate-300">
              <span className="w-14 text-xs text-slate-500">{labelFor(entry.date)}</span>
              <Bar value={entry.blocked} max={maxBlocked} color="bg-emerald-500/80" />
              <span className="w-10 text-right text-xs text-slate-500">{entry.blocked}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Home;
