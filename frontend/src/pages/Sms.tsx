import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdjustmentsHorizontalIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";
import clsx from "clsx";

import { blockSender, fetchSms, unblockSender } from "../api/queries";
import { MessageCategorySummary, MessageRead } from "../api/types";
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

const formatDateTime = (input: string) =>
  new Date(input).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

function Sms() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dateParams = toDateRangeParams(startDate, endDate);
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sms", dateParams.start_date ?? null, dateParams.end_date ?? null],
    queryFn: () => fetchSms(dateParams),
    staleTime: 60_000
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ senderId, block }: { senderId: number; block: boolean }) => {
      return block ? blockSender(senderId) : unblockSender(senderId);
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sms"] }),
        queryClient.invalidateQueries({ queryKey: ["summary"] }),
        queryClient.invalidateQueries({ queryKey: ["calls"] })
      ]);
    }
  });

  const filteredMessages = useMemo(() => {
    if (!data) return [] as MessageRead[];
    if (!searchTerm.trim()) return data.recent_messages;
    const lower = searchTerm.toLowerCase();
    return data.recent_messages.filter((message) =>
      [message.body, message.sender_number, message.category]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(lower))
    );
  }, [data, searchTerm]);

  const categories = useMemo(() => {
    if (!data) return [] as MessageCategorySummary[];
    if (!searchTerm.trim()) return data.categories;
    const lower = searchTerm.toLowerCase();
    return data.categories.filter((category) => category.category.toLowerCase().includes(lower));
  }, [data, searchTerm]);

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

  const smsBlockedRate = data && data.stats.total_messages
    ? data.stats.blocked_messages / data.stats.total_messages
    : 0;

  return (
    <section className="space-y-10">
      <header className="space-y-6 rounded-3xl border border-surface-800/60 bg-surface-900/70 p-8 shadow-shell">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-100">
              SMS interception
            </span>
            <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">SMS Intelligence</h1>
            <p className="max-w-3xl text-sm text-slate-300">
              Trace fraudulent senders, tune blocking policies, and spotlight wins for investors with live telemetry and
              curated incidents.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 px-4 py-2 text-sm font-medium text-brand-100 transition hover:bg-brand-500/15"
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
                placeholder="Filter by keyword, sender, category"
                className="w-full rounded-full border border-surface-800/60 bg-surface-900/70 py-2 pl-10 pr-4 text-sm text-slate-100 transition focus:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
          </div>
        </div>

        <ActiveFilters searchTerm={searchTerm} onClearSearch={() => setSearchTerm("")} />
      </header>

      {isError ? (
        <p className="rounded-3xl border border-rose-600/40 bg-rose-900/30 p-6 text-sm text-rose-100">
          Unable to load SMS analytics. Confirm the API is running and try again.
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
              label="Messages processed"
              value={numberFormatter.format(data.stats.total_messages)}
              description="Total SMS evaluated by the classifiers."
              trend={{ value: `${numberFormatter.format(data.stats.blocked_messages)} blocked`, label: "auto-stopped", direction: "up" }}
              icon={ShieldCheckIcon}
            />
            <MetricCard
              label="Unique senders"
              value={numberFormatter.format(data.stats.unique_senders)}
              description="Distinct sources observed across the period."
              trend={{ value: `${Math.round(data.stats.spam_percentage * 100)}% spam mix`, label: "of inbound volume", direction: "up" }}
              icon={AdjustmentsHorizontalIcon}
            />
            <MetricCard
              label="Spam rate"
              value={`${(data.stats.spam_percentage * 100).toFixed(1)}%`}
              description="Percent of SMS classified as malicious."
              trend={{ value: formatPercent(smsBlockedRate), label: "blocked share", direction: "up" }}
            />
            <MetricCard
              label="Top sender"
              value={data.stats.top_sender_number ?? "Unknown"}
              description="Highest-volume spam originator."
              trend={{ value: "Watchlist", label: "auto-monitoring enabled", direction: "neutral" }}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)]">
            <CategoriesPanel categories={categories} />
            <MessagesTable
              messages={filteredMessages}
              isLoading={toggleBlockMutation.isPending}
              onToggle={(senderId, shouldBlock) =>
                toggleBlockMutation.mutate({ senderId, block: shouldBlock })
              }
            />
          </div>
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
              ? "border-brand-500/50 bg-brand-500/20 text-brand-100 shadow-glow"
              : "border-transparent hover:border-brand-500/30 hover:text-slate-100"
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

interface CategoriesPanelProps {
  categories: MessageCategorySummary[];
}

function CategoriesPanel({ categories }: CategoriesPanelProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-surface-800/60 bg-surface-900/70 p-6 shadow-shell">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Categories</h2>
          <p className="text-sm text-slate-400">What fraud themes are trending right now.</p>
        </div>
      </header>
      <div className="space-y-3">
        {categories.map((category) => {
          const blockedRate = category.total_messages
            ? category.blocked / category.total_messages
            : 0;
          return (
            <article
              key={category.category}
              className="rounded-2xl border border-surface-800/60 bg-surface-900/70 p-4 transition hover:border-brand-500/40"
            >
              <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">{category.category}</h3>
                  <p className="text-xs text-slate-400">{category.sample_preview}</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-xs text-brand-100">
                  {numberFormatter.format(category.total_messages)} msgs
                </span>
              </header>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span>{numberFormatter.format(category.unique_messages)} unique messages</span>
                <span>{numberFormatter.format(category.blocked)} blocked</span>
                <span>{numberFormatter.format(category.unique_senders)} senders</span>
              </div>
              <div className="mt-4 h-2 w-full rounded-full bg-surface-800">
                <div
                  className="h-2 rounded-full bg-brand-500"
                  style={{ width: `${Math.min(100, Math.round(blockedRate * 100))}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">{formatPercent(blockedRate)} blocked automatically</p>
            </article>
          );
        })}
        {categories.length === 0 ? (
          <p className="rounded-2xl border border-surface-800/60 bg-surface-900/60 p-4 text-sm text-slate-500">
            No categories match your filter.
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface MessagesTableProps {
  messages: MessageRead[];
  isLoading: boolean;
  onToggle: (senderId: number, block: boolean) => void;
}

function MessagesTable({ messages, isLoading, onToggle }: MessagesTableProps) {
  return (
    <div className="rounded-3xl border border-surface-800/60 bg-surface-900/70 shadow-shell">
      <header className="flex items-center justify-between border-b border-surface-800/60 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Recent messages</h2>
          <p className="text-sm text-slate-400">Investigate notable messages detected by the classifiers.</p>
        </div>
      </header>
      <div className="max-h-[32rem] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 z-10 bg-surface-900/90 text-xs uppercase text-slate-500 backdrop-blur">
            <tr>
              <th className="px-4 py-3 text-left">Sender</th>
              <th className="px-4 py-3 text-left">Received</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Confidence</th>
              <th className="px-4 py-3 text-left">Verdict</th>
              <th className="px-4 py-3 text-left">Number</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message, index) => (
              <tr
                key={message.id}
                className={clsx(
                  "transition hover:bg-surface-800/60",
                  index % 2 === 0 ? "bg-surface-900/40" : "bg-surface-900/20"
                )}
              >
                <td className="px-4 py-3 text-slate-200">
                  <div className="flex flex-col">
                    <span className="font-medium">{message.sender_number ?? "Unknown"}</span>
                    <span className="text-xs text-slate-500">→ {message.receiver_number}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-400">{formatDateTime(message.received_at)}</td>
                <td className="px-4 py-3 text-slate-400">{message.category ?? "—"}</td>
                <td className="px-4 py-3">
                  <ConfidenceMeter value={message.confidence} />
                </td>
                <td className="px-4 py-3">
                  <VerdictBadge isSpam={message.is_spam} blocked={message.blocked} />
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {message.sender_id ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <StatusPill tone={message.sender_is_blocked ? "negative" : "positive"}>
                        {message.sender_is_blocked ? "Blocked" : "Allowed"}
                      </StatusPill>
                      <button
                        type="button"
                        onClick={() => onToggle(message.sender_id!, !message.sender_is_blocked)}
                        disabled={isLoading}
                        className="rounded-full border border-surface-700/70 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-brand-500/40 hover:text-white disabled:cursor-wait disabled:opacity-60"
                      >
                        {message.sender_is_blocked ? "Unblock" : "Block"}
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-500">N/A</span>
                  )}
                </td>
              </tr>
            ))}
            {messages.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No messages match your query.
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
        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
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

export default Sms;
