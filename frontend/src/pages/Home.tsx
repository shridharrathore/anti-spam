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
          label="Top spam sender"
          value={data.sms.top_sender_number ?? "—"}
          description="Across the current window"
        />
      </div>

    </section>
  );
}

export default Home;
