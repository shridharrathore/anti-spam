import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchSms } from "../api/queries";
import { MessageCategorySummary, MessageRead } from "../api/types";
import { MetricCard } from "../components/MetricCard";
import { DateRangeFilter } from "../components/DateRangeFilter";
import { toDateRangeParams } from "../utils/dateRange";

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
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sms", dateParams.start_date ?? null, dateParams.end_date ?? null],
    queryFn: () => fetchSms(dateParams),
    staleTime: 60_000
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
    return data.categories.filter((category) =>
      category.category.toLowerCase().includes(lower)
    );
  }, [data, searchTerm]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">SMS Insights</h1>
          <p className="text-sm text-slate-400">
            Trend snapshots, unique spam categories, and the latest detected messages.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
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
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Filter by keyword, sender, category"
            className="w-full rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 md:w-72"
          />
          <button
            onClick={() => refetch()}
            className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            Refresh
          </button>
        </div>
      </header>

      {isError ? (
        <p className="rounded-xl border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-200">
          Unable to load SMS analytics. Confirm the API is running and try again.
        </p>
      ) : null}

      {isLoading || !data ? (
        <p className="text-sm text-slate-500">Loading SMS telemetry…</p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard label="Messages" value={data.stats.total_messages.toLocaleString()} />
            <MetricCard label="Blocked" value={data.stats.blocked_messages.toLocaleString()} />
            <MetricCard label="Unique senders" value={data.stats.unique_senders.toLocaleString()} />
            <MetricCard
              label="Spam rate"
              value={`${(data.stats.spam_percentage * 100).toFixed(1)}%`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr,1.5fr]">
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Categories
              </h2>
              <div className="grid gap-3">
                {categories.map((category) => (
                  <article
                    key={category.category}
                    className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <header className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-100">{category.category}</span>
                      <span className="text-xs text-slate-500">{category.total_messages} msgs</span>
                    </header>
                    <p className="mt-3 text-xs text-slate-400">
                      {category.sample_preview}
                    </p>
                    <footer className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{category.unique_messages} unique messages</span>
                      <span>{category.blocked} blocked</span>
                    </footer>
                  </article>
                ))}
                {categories.length === 0 ? (
                  <p className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-500">
                    No categories match your filter.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Recent Messages
              </h2>
              <div className="overflow-hidden rounded-2xl border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-sm">
                  <thead className="bg-slate-900/80 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Sender</th>
                      <th className="px-4 py-3 text-left">Received</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-left">Confidence</th>
                      <th className="px-4 py-3 text-left">Verdict</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredMessages.map((message) => (
                      <tr key={message.id} className="hover:bg-slate-900/60">
                        <td className="px-4 py-3 text-slate-200">
                          <div className="flex flex-col">
                            <span>{message.sender_number ?? "Unknown"}</span>
                            <span className="text-xs text-slate-500">→ {message.receiver_number}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{formatDateTime(message.received_at)}</td>
                        <td className="px-4 py-3 text-slate-400">{message.category ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {message.confidence != null ? `${(message.confidence * 100).toFixed(0)}%` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              message.is_spam
                                ? "bg-red-500/20 text-red-300"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {message.is_spam ? (message.blocked ? "Blocked" : "Spam") : "Clean"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredMessages.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                          No messages match your query.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Sms;
