import { TestMessageBox } from "../components/TestMessageBox";

function TestLab() {
  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-surface-800/60 bg-surface-900/70 p-6 shadow-shell">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-100">
              Model transparency
            </span>
            <h1 className="text-2xl font-semibold text-slate-50">LLM Test Bench</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Demonstrate how the classifier reasons about real-world messages. Use the curated samples or add investor
              scenarios to showcase explainability.
            </p>
          </div>
          <div className="rounded-2xl border border-surface-800/60 bg-surface-950/60 px-4 py-3 text-xs text-slate-400">
            <p className="font-semibold text-slate-100">Demo prompt controls</p>
            <p>Outputs mirror the production prompt with redaction safeguards applied.</p>
          </div>
        </div>
      </header>
      <TestMessageBox />
    </section>
  );
}

export default TestLab;
