import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { classifyText } from "../api/queries";
import { ClassificationResponse } from "../api/types";

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

  let result: ClassificationResponse | null = null;
  if (isSuccess && data) {
    result = data;
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Test a Message</h2>
          <p className="text-xs text-slate-500">
            Submit sample text to see how the spam heuristics respond in real time.
          </p>
        </div>
      </header>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <textarea
          className="h-32 w-full rounded-xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-100 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Paste an incoming SMS to inspect"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending || text.trim().length < 5}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {isPending ? "Checking..." : "Check spam"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            Reset
          </button>
        </div>
      </form>
      {result ? (
        <div className="mt-6 grid gap-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Spam verdict</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              result.is_spam
                ? "bg-red-500/20 text-red-300"
                : "bg-emerald-500/20 text-emerald-300"
            }`}>
              {result.is_spam ? "Spam" : "Not spam"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Confidence</span>
            <span className="font-medium text-slate-100">{(result.confidence * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Category</span>
            <span className="font-medium text-slate-100 uppercase">{result.category}</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">{result.rationale}</p>
        </div>
      ) : null}
    </section>
  );
}
