import { TestMessageBox } from "../components/TestMessageBox";

function TestLab() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">LLM Test Bench</h1>
        <p className="text-sm text-slate-400">
          Paste sample SMS content to inspect the live classifier response powered by the OpenAI
          integration. This tool mirrors the prompt used in production.
        </p>
      </div>
      <TestMessageBox />
    </section>
  );
}

export default TestLab;
