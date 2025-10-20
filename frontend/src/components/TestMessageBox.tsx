import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";

import { classifyText } from "../api/queries";
import { ClassificationResponse } from "../api/types";

const samplePrompts = [
  "Urgent: your bank account is locked. Verify now at http://secure-bank.example",
  "Reminder: Team sync moved to 2pm tomorrow. Reply if you cannot attend.",
  "This is Revenue Recovery. Final notice before referral to collections."
];

export function TestMessageBox() {
  const [text, setText] = useState("Congratulations! You've won a free cruise. Reply YES to claim.");
  const { mutateAsync, isPending, data, isSuccess, reset } = useMutation({
    mutationKey: ["classify"],
    mutationFn: classifyText
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) return;
    await mutateAsync({ text });
  };

  const handleReset = () => {
    setText("");
    reset();
  };

  const handleSample = (sample: string) => {
    setText(sample);
    reset();
  };

  let result: ClassificationResponse | null = null;
  if (isSuccess && data) {
    result = data;
  }

  const confidencePercent = result ? Math.round(result.confidence * 100) : null;

  return (
    <section className="space-y-6 rounded-3xl border border-surface-800/60 bg-surface-900/70 p-6 shadow-shell">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Test a Message</h2>
          <p className="text-xs text-slate-400">
            Paste prospective spam content and show investors how the classifier responds in real time.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-full border border-surface-700/70 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand-500/40 hover:text-slate-100"
        >
          Clear form
        </button>
      </header>

      <div className="flex flex-wrap gap-2 text-xs text-slate-300">
        {samplePrompts.map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => handleSample(sample)}
            className="rounded-full border border-surface-700/70 bg-surface-900/70 px-3 py-1 transition hover:border-brand-500/40 hover:text-slate-100"
          >
            <span className="max-w-[11rem] truncate text-left">{sample}</span>
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <textarea
          className="h-36 w-full rounded-2xl border border-surface-800/70 bg-surface-950/80 p-4 text-sm text-slate-100 transition focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste an incoming SMS to inspect"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending || text.trim().length < 5}
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-400/90 disabled:cursor-not-allowed disabled:bg-surface-700"
          >
            {isPending ? "Checking" : "Run classification"}
          </button>
          <span className="text-xs text-slate-500">
            Model latency averages 380ms · Responses cached during this demo
          </span>
        </div>
      </form>

      {result ? (
        <div className="space-y-4 rounded-2xl border border-surface-800/60 bg-surface-950/70 p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Spam verdict</p>
              <p className="text-base font-semibold text-slate-100">
                {result.is_spam ? "Malicious" : "Clean"}
              </p>
            </div>
            <span
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                result.is_spam
                  ? "border-rose-500/40 bg-rose-500/15 text-rose-200"
                  : "border-teal-500/40 bg-teal-500/15 text-teal-200"
              )}
            >
              {result.is_spam ? "Spam" : "Not spam"}
            </span>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-slate-500">Confidence</span>
              {confidencePercent != null ? (
                <div className="flex items-center gap-3 text-xs">
                  <span className="w-10 text-right text-slate-400">{confidencePercent}%</span>
                  <div className="h-2 flex-1 rounded-full bg-surface-800">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <span className="text-xs uppercase tracking-wide text-slate-500">Category</span>
              <p className="mt-1 text-sm font-semibold text-slate-100">{result.category}</p>
            </div>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wide text-slate-500">Model rationale</span>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">{result.rationale}</p>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-surface-800/70 bg-surface-900/40 p-4 text-xs text-slate-500">
          Run a classification to capture the live response investors will see during the demo.
        </p>
      )}
    </section>
  );
}
