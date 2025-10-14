import { useQuery } from "@tanstack/react-query";

import { fetchSummary } from "../api/queries";
import { MetricCard } from "../components/MetricCard";
import { TestMessageBox } from "../components/TestMessageBox";

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function Home() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummary,
    staleTime: 60_000
  });

  if (isError) {
    return (
      <section className="space-y-4">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-100">Overall Summary</h1>
          <button
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </header>
        <p className="text-sm text-red-300">Unable to load summary data. Please ensure the API is running.</p>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-100">Overall Summary</h1>
        <p className="text-sm text-slate-500">Gathering spam detection metrics...</p>
      </section>
    );
  }

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-100">Overall Summary</h1>
        <p className="text-sm text-slate-400">Snapshot for the last seven days across SMS and voice channels.</p>
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

      <TestMessageBox />
    </section>
  );
}

export default Home;
