import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BoltIcon,
  MagnifyingGlassIcon,
  PhoneArrowDownLeftIcon,
  SignalIcon
} from "@heroicons/react/24/outline";
import clsx from "clsx";

import { blockSender, fetchCalls, unblockSender } from "../api/queries";
import { CallRead } from "../api/types";
import { MetricCard } from "../components/MetricCard";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { toDateRangeParams } from "../utils/dateRange";

const rangePresets = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 }
] as const;

type RangePreset = (typeof rangePresets)[number];

const numberFormatter = new Intl.NumberFormat();

type CallerAggregateRow = {
  key: string;
  callerId: number | null;
  callerNumber: string | null;
  latestReceiver: string | null;
  latestStartedAt: string | null;
  uniqueReceivers: number;
  averageDurationSeconds: number;
  confidence: number | null;
  verdict: "Clean" | "Spam" | "Blocked";
  callerBlocked: boolean;
};

function aggregateCallsByCaller(calls: CallRead[]): CallerAggregateRow[] {
  const aggregates = new Map<
    string,
    {
      callerId: number | null;
      callerNumber: string | null;
      latestReceiver: string | null;
      latestStartedAt: string | null;
      uniqueReceivers: Set<string>;
      durationTotal: number;
      callCount: number;
      confidenceSum: number;
      confidenceSamples: number;
      spamCount: number;
      blockedCount: number;
      callerBlocked: boolean;
    }
  >();

  for (const call of calls) {
    const key =
      call.caller_id != null
        ? `id-${call.caller_id}`
        : call.caller_number != null
          ? `num-${call.caller_number}`
          : `call-${call.id}`;

    const existing = aggregates.get(key);
    if (!existing) {
      aggregates.set(key, {
        callerId: call.caller_id,
        callerNumber: call.caller_number,
        latestReceiver: call.callee_number,
        latestStartedAt: call.started_at,
        uniqueReceivers: new Set(call.callee_number ? [call.callee_number] : []),
        durationTotal: call.duration_seconds,
        callCount: 1,
        confidenceSum: call.confidence ?? 0,
        confidenceSamples: call.confidence != null ? 1 : 0,
        spamCount: call.is_spam ? 1 : 0,
        blockedCount: call.blocked ? 1 : 0,
        callerBlocked: call.caller_is_blocked
      });
      continue;
    }

    existing.callCount += 1;
    existing.durationTotal += call.duration_seconds;
    if (call.callee_number) {
      existing.uniqueReceivers.add(call.callee_number);
    }
    if (call.confidence != null) {
      existing.confidenceSum += call.confidence;
      existing.confidenceSamples += 1;
    }
    if (
      call.started_at &&
      (!existing.latestStartedAt ||
        new Date(call.started_at).getTime() > new Date(existing.latestStartedAt).getTime())
    ) {
      existing.latestStartedAt = call.started_at;
      existing.latestReceiver = call.callee_number;
    }
    if (call.is_spam) {
      existing.spamCount += 1;
    }
    if (call.blocked) {
      existing.blockedCount += 1;
    }
    existing.callerBlocked = call.caller_is_blocked;
  }

  return Array.from(aggregates.entries())
    .map(([key, value]) => {
      const averageConfidence =
        value.confidenceSamples > 0 ? value.confidenceSum / value.confidenceSamples : null;
      const verdict: CallerAggregateRow["verdict"] =
        value.blockedCount > 0 ? "Blocked" : value.spamCount > 0 ? "Spam" : "Clean";

      return {
        key,
        callerId: value.callerId,
        callerNumber: value.callerNumber,
        latestReceiver: value.latestReceiver ?? null,
        latestStartedAt: value.latestStartedAt,
        uniqueReceivers: value.uniqueReceivers.size,
        averageDurationSeconds:
          value.callCount > 0 ? value.durationTotal / value.callCount : 0,
        confidence: averageConfidence,
        verdict,
        callerBlocked: value.callerBlocked
      };
    })
    .sort((a, b) => {
      const aTime = a.latestStartedAt ? new Date(a.latestStartedAt).getTime() : 0;
      const bTime = b.latestStartedAt ? new Date(b.latestStartedAt).getTime() : 0;
      return bTime - aTime;
    });
}

const formatDateTime = (input: string) =>
  new Date(input).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes === 0) return `${remaining}s`;
  return `${minutes}m ${remaining.toString().padStart(2, "0")}s`;
};

function Calls() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dateParams = toDateRangeParams(startDate, endDate);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calls", dateParams.start_date ?? null, dateParams.end_date ?? null],
    queryFn: () => fetchCalls(dateParams),
    staleTime: 60_000
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ senderId, block }: { senderId: number; block: boolean }) => {
      return block ? blockSender(senderId) : unblockSender(senderId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["calls"] }),
        queryClient.invalidateQueries({ queryKey: ["sms"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] })
      ]);
    }
  });

  const filteredCalls = useMemo(() => {
    if (!data) return [] as CallRead[];
    if (!searchTerm.trim()) return data.recent_calls;
    const lower = searchTerm.toLowerCase();
    return data.recent_calls.filter((call) =>
      [call.caller_number, call.callee_number, call.category]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(lower))
    );
  }, [data, searchTerm]);

  const callerAggregates = useMemo(
    () => aggregateCallsByCaller(filteredCalls),
    [filteredCalls]
  );

  const activePreset = getActivePresetLabel(startDate, endDate);

  const applyPreset = (preset: RangePreset) => {
    const { start, end } = getPresetRange(preset.days);
    setStartDate(start);
    setEndDate(end);
    void refetch();
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    void refetch();
  };

  const callBlockedRate = data && data.stats.total_calls
    ? data.stats.blocked_calls / data.stats.total_calls
    : 0;

  return (
    <section className="space-y-10">
      <header className="space-y-6 rounded-3xl border border-surface-800/60 bg-surface-900/70 p-8 shadow-shell">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-200">
              Voice intelligence
            </span>
            <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">Call Analytics</h1>
            <p className="max-w-3xl text-sm text-slate-300">
              Surface risky callers, monitor deflection rates, and illustrate network resilience when pitching to
              investors.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-teal-500/40 px-4 py-2 text-sm font-medium text-teal-200 transition hover:bg-teal-500/15"
          >
            <BoltIcon className="h-4 w-4" /> Refresh feed
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)]">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={handleClearFilters}
            className="gap-4 border-none bg-transparent p-0"
          />
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <RangePresetButtons active={activePreset} onSelect={applyPreset} />
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Filter by caller, callee, category"
                className="w-full rounded-full border border-surface-800/60 bg-surface-900/70 py-2 pl-10 pr-4 text-sm text-slate-100 transition focus:border-teal-500/40 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>
          </div>
        </div>

        <ActiveFilters searchTerm={searchTerm} onClearSearch={() => setSearchTerm("")} />
      </header>

      {isError ? (
        <p className="rounded-3xl border border-rose-600/40 bg-rose-900/30 p-6 text-sm text-rose-100">
          Unable to load call analytics. Confirm the API is running and try again.
        </p>
      ) : null}

      {isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl bg-surface-800/60" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Calls processed"
              value={numberFormatter.format(data.stats.total_calls)}
              description="Voice sessions analyzed by the platform."
              trend={{ value: `${numberFormatter.format(data.stats.blocked_calls)} blocked`, label: "auto-deflected", direction: "up" }}
              icon={PhoneArrowDownLeftIcon}
            />
            <MetricCard
              label="Unique callers"
              value={numberFormatter.format(data.stats.unique_callers)}
              description="Distinct calling parties analysed."
              trend={{ value: `${Math.round(data.stats.spam_percentage * 100)}% spam mix`, label: "of inbound volume", direction: "up" }}
              icon={SignalIcon}
            />
            <MetricCard
              label="Spam rate"
              value={`${(data.stats.spam_percentage * 100).toFixed(1)}%`}
              description="Percent of calls classified as malicious."
              trend={{ value: formatPercent(callBlockedRate), label: "deflection rate", direction: "up" }}
            />
            <MetricCard
              label="Top caller"
              value={data.stats.top_caller_number ?? "Unknown"}
              description="Highest-risk voice originator."
              trend={{ value: "Watchlist", label: "auto-monitoring enabled", direction: "neutral" }}
            />
          </div>

          <CallsTable
            rows={callerAggregates}
            isLoading={toggleBlockMutation.isPending}
            onToggle={(callerId, shouldBlock) =>
              toggleBlockMutation.mutate({ senderId: callerId, block: shouldBlock })
            }
          />
        </>
      )}
    </section>
  );
}

interface RangePresetButtonsProps {
  active?: string;
  onSelect: (preset: RangePreset) => void;
}

function RangePresetButtons({ active, onSelect }: RangePresetButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-surface-800/60 bg-surface-900/60 p-2 text-xs font-medium text-slate-400">
      {rangePresets.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => onSelect(preset)}
          className={clsx(
            "rounded-full border px-3 py-1.5 transition",
            active === preset.label
              ? "border-teal-500/40 bg-teal-500/15 text-teal-200 shadow-glow"
              : "border-transparent hover:border-teal-500/30 hover:text-slate-100"
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

interface ActiveFiltersProps {
  searchTerm: string;
  onClearSearch: () => void;
}

function ActiveFilters({ searchTerm, onClearSearch }: ActiveFiltersProps) {
  if (!searchTerm) return null;

  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-300">
      <span className="inline-flex items-center gap-2 rounded-full border border-surface-700/70 bg-surface-900/60 px-3 py-1">
        Query: {searchTerm}
        <button
          onClick={onClearSearch}
          className="text-slate-400 transition hover:text-slate-100"
          aria-label="Clear search filter"
        >
          Clear
        </button>
      </span>
    </div>
  );
}

interface CallsTableProps {
  rows: CallerAggregateRow[];
  isLoading: boolean;
  onToggle: (callerId: number, block: boolean) => void;
}

function CallsTable({ rows, isLoading, onToggle }: CallsTableProps) {
  return (
    <div className="rounded-3xl border border-surface-800/60 bg-surface-900/70 shadow-shell">
      <header className="flex items-center justify-between border-b border-surface-800/60 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Recent calls</h2>
          <p className="text-sm text-slate-400">Investigate high-risk callers identified by the models.</p>
        </div>
      </header>
      <div className="max-h-[32rem] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface-900/90 text-xs uppercase text-slate-500 backdrop-blur">
            <tr>
              <th className="px-4 py-3 text-left">Suspect</th>
              <th className="px-4 py-3 text-left"># Call Receivers</th>
              <th className="px-4 py-3 text-left">Avg Duration</th>
              <th className="px-4 py-3 text-left">Confidence</th>
              <th className="px-4 py-3 text-left">Verdict</th>
              <th className="px-4 py-3 text-left">Number</th>
              <th className="px-4 py-3 text-right">Block/Unblock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.key}
                className={clsx(
                  "transition hover:bg-surface-800/60",
                  index % 2 === 0 ? "bg-surface-900/40" : "bg-surface-900/20"
                )}
              >
                <td className="px-4 py-3 text-slate-200">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {row.latestReceiver ? `Target → ${row.latestReceiver}` : "Target unknown"}
                    </span>
                    {row.latestStartedAt ? (
                      <span className="text-xs text-slate-500">
                        {formatDateTime(row.latestStartedAt)}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {numberFormatter.format(row.uniqueReceivers)}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {formatDuration(Math.round(row.averageDurationSeconds))}
                </td>
                <td className="px-4 py-3">
                  <ConfidenceMeter value={row.confidence} />
                </td>
                <td className="px-4 py-3">
                  <VerdictBadge
                    isSpam={row.verdict !== "Clean"}
                    blocked={row.verdict === "Blocked"}
                  />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {row.callerNumber ?? "Unknown"}
                </td>
                <td className="px-4 py-3 text-right text-slate-300">
                  {row.callerId ? (
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                      <StatusPill tone={row.callerBlocked ? "negative" : "positive"}>
                        {row.callerBlocked ? "Blocked" : "Allowed"}
                      </StatusPill>
                      <button
                        type="button"
                        onClick={() => onToggle(row.callerId!, !row.callerBlocked)}
                        disabled={isLoading}
                        className="rounded-full border border-surface-700/70 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-teal-500/40 hover:text-white disabled:cursor-wait disabled:opacity-60"
                      >
                        {row.callerBlocked ? "Unblock" : "Block"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Unavailable</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  No calls match your query.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface StatusPillProps {
  tone: "positive" | "negative" | "neutral";
  children: string;
}

function StatusPill({ tone, children }: StatusPillProps) {
  const classes =
    tone === "positive"
      ? "border-teal-500/30 bg-teal-500/10 text-teal-200"
      : tone === "negative"
        ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
        : "border-surface-700/70 bg-surface-800/70 text-slate-300";

  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", classes)}>
      {children}
    </span>
  );
}

interface ConfidenceMeterProps {
  value: number | null;
}

function ConfidenceMeter({ value }: ConfidenceMeterProps) {
  if (value == null) {
    return <span className="text-slate-500">—</span>;
  }
  const percent = Math.round(value * 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-10 text-right text-slate-400">{percent}%</span>
      <div className="h-2 flex-1 rounded-full bg-surface-800">
        <div className="h-2 rounded-full bg-teal-400" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

interface VerdictBadgeProps {
  isSpam: boolean;
  blocked: boolean;
}

function VerdictBadge({ isSpam, blocked }: VerdictBadgeProps) {
  if (!isSpam) {
    return <StatusPill tone="positive">Clean</StatusPill>;
  }
  return <StatusPill tone={blocked ? "negative" : "neutral"}>{blocked ? "Blocked" : "Spam"}</StatusPill>;
}

function getPresetRange(days: number) {
  const now = new Date();
  const end = toDateInputValue(now);
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  return { start: toDateInputValue(start), end };
}

function getActivePresetLabel(start: string, end: string) {
  if (!start || !end) return undefined;
  const match = rangePresets.find((preset) => {
    const { start: presetStart, end: presetEnd } = getPresetRange(preset.days);
    return presetStart === start && presetEnd === end;
  });
  return match?.label;
}

function toDateInputValue(date: Date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 10);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export default Calls;
