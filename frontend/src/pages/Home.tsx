import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis
} from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import {
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon
} from "@heroicons/react/24/outline";

import { fetchSummary } from "../api/queries";
import { MetricCard } from "../components/MetricCard";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { toDateRangeParams } from "../utils/dateRange";

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

const numberFormatter = new Intl.NumberFormat();

type ChartDatum = {
  date: string;
  detected: number;
  blocked: number;
};

type ChartPoint = {
  dateLabel: string;
  detected: number;
  blocked: number;
};

function toChartPoints(data: ChartDatum[]): ChartPoint[] {
  return data.map((entry) => ({
    dateLabel: formatDateLabel(entry.date),
    detected: entry.detected,
    blocked: entry.blocked
  }));
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
      <section className="space-y-8">
        <div className="rounded-3xl border border-rose-600/40 bg-rose-950/40 p-8 shadow-shell">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold text-rose-100">Unable to reach the API</h1>
            <p className="text-sm text-rose-200/80">
              We could not fetch the summary dataset. Confirm the backend is running and then try again.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full border border-rose-500/50 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/10"
                onClick={() => refetch()}
              >
                Retry now
              </button>
              <button
                className="rounded-full border border-surface-700/70 px-4 py-2 text-sm text-slate-300 transition hover:border-brand-500/40 hover:text-white"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (isLoading || !data) {
    return (
      <section className="space-y-8">
        <div className="animate-pulse rounded-3xl border border-surface-800/60 bg-surface-900/60 p-10">
          <div className="h-6 w-48 rounded bg-surface-800/80" />
          <div className="mt-4 h-10 w-80 rounded bg-surface-800/80" />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 rounded-3xl bg-surface-800/70" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const totalEvents = data.sms.total_messages + data.calls.total_calls;
  const smsBlockRate = data.sms.total_messages
    ? data.sms.blocked_messages / data.sms.total_messages
    : 0;
  const callBlockRate = data.calls.total_calls
    ? data.calls.blocked_calls / data.calls.total_calls
    : 0;
  const templateBlockRate = data.sms_unique_spam_messages
    ? data.sms_unique_blocked_messages / data.sms_unique_spam_messages
    : 0;

  const smsChartData = toChartPoints(data.sms_daily);
  const callChartData = toChartPoints(data.calls_daily);

  return (
    <section className="space-y-12">
      <header className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr),minmax(0,1fr)]">
        <div className="relative overflow-hidden rounded-3xl border border-surface-800/60 bg-surface-900/75 shadow-shell">
          <div className="pointer-events-none absolute inset-0 bg-hero-gradient opacity-60" aria-hidden />
          <div className="relative flex h-full flex-col gap-6 p-8">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-100 backdrop-blur">
              Live intercept network
            </span>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold text-slate-50 md:text-4xl">
                Stop fraud before it reaches the customer.
              </h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Our classifiers neutralise malicious SMS and voice campaigns in real time. Use the controls below to
                inspect performance over any lookback window before the investor walkthrough.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-300">
              <StatChip
                label="SMS blocked"
                value={`${numberFormatter.format(data.sms.blocked_messages)} / ${numberFormatter.format(data.sms.total_messages)}`}
                accent={formatPercent(smsBlockRate)}
              />
              <StatChip
                label="Calls deflected"
                value={`${numberFormatter.format(data.calls.blocked_calls)} / ${numberFormatter.format(data.calls.total_calls)}`}
                accent={formatPercent(callBlockRate)}
              />
              <StatChip
                label="Unique spam templates"
                value={numberFormatter.format(data.sms_unique_spam_messages)}
                accent={`${numberFormatter.format(data.sms_unique_blocked_messages)} blocked`}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <DateRangeFilter
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onClear={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="gap-4 sm:gap-6"
              />
              <button
                onClick={() => refetch()}
                className="inline-flex items-center justify-center rounded-full border border-brand-500/40 px-4 py-2 text-sm font-medium text-brand-100 transition hover:bg-brand-500/15"
              >
                Refresh snapshot
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-surface-800/60 bg-surface-900/70 p-6 shadow-shell">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Investor highlights</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li>• Automation neutralises {formatPercent(data.overall_block_rate)} of fraudulent traffic.</li>
              <li>• Classifiers operate at {formatPercent(data.avg_confidence)} confidence across channels.</li>
              <li>
                • {numberFormatter.format(data.calls_unique_blocked_calls)} high-risk callers removed from the network this
                period.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border border-brand-500/30 bg-brand-500/10 p-6 text-sm text-brand-50 shadow-glow">
            <p className="text-xs uppercase tracking-wide text-brand-100">Demo tip</p>
            <p className="mt-2">
              Lead with results: highlight the automation coverage, then drill into the SMS histogram to show daily
              resilience.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Automation coverage"
          value={formatPercent(data.overall_block_rate)}
          description="Spam events blocked automatically across SMS and voice."
          trend={{
            value: `${numberFormatter.format(totalEvents)} events`,
            label: "inspected this period",
            direction: "neutral"
          }}
          icon={ShieldCheckIcon}
        />
        <MetricCard
          label="Model confidence"
          value={formatPercent(data.avg_confidence)}
          description="Median classifier certainty across the portfolio."
          trend={{
            value: "Stable",
            label: "vs last offline evaluation",
            direction: "neutral"
          }}
          icon={SparklesIcon}
        />
        <MetricCard
          label="Unique spam senders"
          value={numberFormatter.format(data.sms.unique_senders)}
          description="Distinct SMS numbers flagged by automation."
          trend={{
            value: formatPercent(smsBlockRate),
            label: "blocked share",
            direction: "up"
          }}
          icon={UsersIcon}
        />
        <MetricCard
          label="Spam callers"
          value={numberFormatter.format(data.calls_unique_spam_calls)}
          description="Unique voice fraud attempts observed."
          trend={{
            value: formatPercent(callBlockRate),
            label: "deflection rate",
            direction: "up"
          }}
          icon={ArrowTrendingUpIcon}
        />
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <article className="flex h-full flex-col gap-6 rounded-3xl border border-surface-800/60 bg-surface-900/70 p-6 shadow-shell">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-100">Unique Fraud SMS</h2>
            <p className="text-sm text-slate-400">Deduplicated by template across the selected window.</p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Detected"
              value={numberFormatter.format(data.sms_unique_spam_messages)}
              trend={{
                value: `${numberFormatter.format(data.sms_unique_blocked_messages)} blocked`,
                label: "auto-rejected",
                direction: "up"
              }}
            />
            <MetricCard
              label="Blocked"
              value={numberFormatter.format(data.sms.blocked_messages)}
              description="Total SMS prevents delivered."
              trend={{
                value: formatPercent(smsBlockRate),
                label: "block rate",
                direction: "up"
              }}
            />
          </div>
          <TimelineList
            title="Template velocity"
            emptyCopy="No SMS activity in this range."
            data={data.sms_daily}
          />
        </article>

        <article className="flex h-full flex-col rounded-3xl border border-surface-800/60 bg-surface-900/70 p-6 shadow-shell">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-100">SMS volume by outcome</h2>
            <p className="text-sm text-slate-400">Compare detected vs blocked traffic each day.</p>
          </header>
          <div className="mt-6 flex-1">
            <VolumeAreaChart data={smsChartData} emptyLabel="No SMS events to chart." />
          </div>
        </article>
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)]">
        <article className="flex h-full flex-col gap-6 rounded-3xl border border-surface-800/60 bg-surface-900/70 p-6 shadow-shell">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-100">Fraud Calls</h2>
            <p className="text-sm text-slate-400">Unique callers originating spam this period.</p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              label="Spam callers"
              value={numberFormatter.format(data.calls_unique_spam_calls)}
              trend={{
                value: `${numberFormatter.format(data.calls_unique_blocked_calls)} intercepted`,
                label: "auto-blocked",
                direction: "up"
              }}
            />
            <MetricCard
              label="Blocked calls"
              value={numberFormatter.format(data.calls.blocked_calls)}
              trend={{
                value: formatPercent(callBlockRate),
                label: "deflection rate",
                direction: "up"
              }}
            />
          </div>
          <TimelineList
            title="Call timeline"
            emptyCopy="No call activity in this range."
            data={data.calls_daily}
          />
        </article>

        <article className="flex h-full flex-col rounded-3xl border border-surface-800/60 bg-surface-900/70 p-6 shadow-shell">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-100">Call volume by outcome</h2>
            <p className="text-sm text-slate-400">Detected vs blocked voice spam per day.</p>
          </header>
          <div className="mt-6 flex-1">
            <VolumeAreaChart data={callChartData} emptyLabel="No call events to chart." detectedColor="#f97316" blockedColor="#fb7185" />
          </div>
        </article>
      </div>
    </section>
  );
}

interface TimelineListProps {
  title: string;
  emptyCopy: string;
  data: { date: string; detected: number; blocked: number }[];
}

function TimelineList({ title, emptyCopy, data }: TimelineListProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="mt-4 max-h-64 flex-1 overflow-y-auto pr-1">
        <ul className="space-y-3">
          {data.length === 0 ? (
            <li className="rounded-2xl border border-surface-800/60 bg-surface-900/60 px-4 py-5 text-sm text-slate-500">
              {emptyCopy}
            </li>
          ) : (
            data.map((entry) => (
              <li
                key={entry.date}
                className="flex items-center justify-between rounded-2xl border border-surface-800/60 bg-surface-900/60 px-4 py-3 text-sm text-slate-300"
              >
                <span className="text-slate-400">{formatDateLabel(entry.date)}</span>
                <span className="font-medium text-slate-200">
                  {numberFormatter.format(entry.detected)} detected · {numberFormatter.format(entry.blocked)} blocked
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

interface VolumeAreaChartProps {
  data: ChartPoint[];
  emptyLabel: string;
  detectedColor?: string;
  blockedColor?: string;
}

function VolumeAreaChart({ data, emptyLabel, detectedColor = "#6366f1", blockedColor = "#2dd4bf" }: VolumeAreaChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="detectedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={detectedColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={detectedColor} stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={blockedColor} stopOpacity={0.4} />
              <stop offset="95%" stopColor={blockedColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.08)" strokeDasharray="3 3" />
          <XAxis dataKey="dateLabel" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={(value: number) => numberFormatter.format(value)}
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />
          <Tooltip content={<VolumeTooltip />} cursor={{ stroke: "rgba(148, 163, 184, 0.2)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="detected"
            stroke={detectedColor}
            fill="url(#detectedGradient)"
            strokeWidth={2}
            name="Detected"
          />
          <Area
            type="monotone"
            dataKey="blocked"
            stroke={blockedColor}
            fill="url(#blockedGradient)"
            strokeWidth={2}
            name="Blocked"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function VolumeTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl border border-surface-800 bg-surface-900/90 px-4 py-3 text-sm shadow-shell">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <ul className="mt-2 space-y-1">
        {payload.map((entry) => (
          <li key={entry.name as string} className="flex items-center justify-between gap-8 text-slate-200">
            <span>{entry.name}</span>
            <span className="font-medium">
              {numberFormatter.format(typeof entry.value === "number" ? entry.value : Number(entry.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface StatChipProps {
  label: string;
  value: string;
  accent?: string;
}

function StatChip({ label, value, accent }: StatChipProps) {
  return (
    <div className="flex flex-col rounded-2xl border border-surface-800/60 bg-surface-900/60 px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-200">{value}</span>
      {accent ? <span className="text-xs text-slate-400">{accent}</span> : null}
    </div>
  );
}

const formatDateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export default Home;
