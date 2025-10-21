import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BeakerIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  HomeIcon,
  PlayCircleIcon,
  PhoneArrowDownLeftIcon,
  ShieldCheckIcon,
  SignalIcon
} from "@heroicons/react/24/outline";
import clsx from "clsx";

const navigation = [
  {
    to: "/",
    label: "Overview",
    description: "Executive readout",
    icon: HomeIcon
  },
  {
    to: "/sms",
    label: "SMS",
    description: "Message telemetry",
    icon: ChatBubbleLeftIcon
  },
  {
    to: "/calls",
    label: "Calls",
    description: "Voice intelligence",
    icon: PhoneArrowDownLeftIcon
  },
  {
    to: "/test",
    label: "Test Lab",
    description: "Scenario sandbox",
    icon: BeakerIcon
  }
];

const demoSteps = [
  {
    route: "/",
    title: "Lead with impact",
    description: "Show automation coverage and confidence from the overview dashboard."
  },
  {
    route: "/sms",
    title: "Highlight messaging intel",
    description: "Filter to recent SMS fraud incidents and showcase deflection."
  },
  {
    route: "/calls",
    title: "Show voice resilience",
    description: "Surface high-risk callers and explain block automation."
  },
  {
    route: "/test",
    title: "Simulate an attack",
    description: "Run a live classification to prove model transparency."
  }
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const activeRoot = location.pathname === "/" ? "/" : `/${location.pathname.split("/")[1]}`;
  const environmentLabel = import.meta.env.VITE_ENV_LABEL ?? "Demo";
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-surface-950 text-slate-100">
      <aside className="app-gradient relative hidden w-72 flex-col border-r border-surface-800/70 bg-surface-900/70 pb-8 backdrop-blur xl:flex">
        <div className="flex items-center gap-3 px-6 pb-8 pt-10">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-200 shadow-glow">
            <ShieldCheckIcon className="h-6 w-6" />
          </span>
          <div className="leading-tight">
            <span className="text-xs uppercase tracking-[0.35em] text-slate-500">AntiSpam</span>
            <p className="text-lg font-semibold text-slate-100">Signal Ops Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          {navigation.map((item) => {
            const isActive = activeRoot === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 transition",
                  isActive
                    ? "bg-brand-500/10 text-white ring-1 ring-inset ring-brand-500/40 shadow-shell"
                    : "text-slate-400 hover:bg-surface-800/80 hover:text-slate-100"
                )}
              >
                <span
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-xl border",
                    isActive
                      ? "border-transparent bg-brand-500/20 text-brand-100"
                      : "border-surface-700 bg-surface-900 text-slate-400 group-hover:border-brand-500/40 group-hover:text-brand-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-slate-500">{item.description}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 mt-6 rounded-2xl border border-surface-800/70 bg-surface-900/80 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
              <SignalIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Environment</p>
              <p className="text-sm font-medium text-slate-100">{environmentLabel} mode</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            API endpoints proxied via <code className="rounded bg-surface-800/60 px-1.5 py-0.5 text-[0.7rem]">{import.meta.env.VITE_API_BASE_URL ?? "not set"}</code>
          </p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-surface-800/70 bg-surface-900/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-lg font-semibold text-slate-100">
                  Fraud interception operations at a glance
                </p>
                <p className="text-xs text-slate-500">
                  Use the guide to walk stakeholders from the executive snapshot into live incident drill-downs.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-2 rounded-full border border-surface-700/70 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-teal-400" aria-hidden />
                  API healthy
                </span>
                <span className="flex items-center gap-2 rounded-full border border-surface-700/70 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                  Model QA pending
                </span>
                <span className="flex items-center gap-2 rounded-full border border-surface-700/70 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                  Demo mode engaged
                </span>
              </div>
            </div>
          </div>
          <nav className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-6 pb-4 xl:hidden">
            {navigation.map((item) => {
              const isActive = activeRoot === item.to;
              return (
                <Link
                  key={`mobile-${item.to}`}
                  to={item.to}
                  className={clsx(
                    "flex min-w-[7rem] flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                    isActive
                      ? "border-brand-500/60 bg-brand-500/20 text-white"
                      : "border-surface-700/80 bg-surface-900/70 text-slate-400 hover:border-brand-500/40 hover:text-slate-100"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main className="relative flex-1">
          <div className="pointer-events-none absolute inset-x-0 -top-20 h-64 bg-hero-gradient opacity-80" aria-hidden />
          <div className="relative mx-auto w-full max-w-6xl px-6 py-10">
            {children}
          </div>
        </main>
        <DemoGuide
          isOpen={isGuideOpen}
          activeRoute={activeRoot}
          onToggle={() => setIsGuideOpen((prev) => !prev)}
        />
      </div>
    </div>
  );
}

interface DemoGuideProps {
  isOpen: boolean;
  activeRoute: string;
  onToggle: () => void;
}

function DemoGuide({ isOpen, activeRoute, onToggle }: DemoGuideProps) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={onToggle}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-brand-500/40 bg-brand-500/20 px-4 py-2 text-xs font-semibold text-brand-50 shadow-glow transition hover:bg-brand-500/30"
      >
        <PlayCircleIcon className={clsx("h-4 w-4 transition", isOpen ? "rotate-0" : "rotate-90")}
        />
        {isOpen ? "Hide demo guide" : "Show demo guide"}
      </button>
      {isOpen ? (
        <div className="pointer-events-auto w-80 rounded-3xl border border-surface-800/60 bg-surface-900/80 p-5 shadow-shell">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Demo walkthrough</p>
              <h3 className="text-sm font-semibold text-slate-100">Suggested investor storyline</h3>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1 rounded-full border border-surface-700/70 px-2 py-1 text-[0.65rem] text-slate-400 transition hover:border-brand-500/40 hover:text-slate-100"
            >
              Collapse <ChevronDownIcon className="h-3 w-3" />
            </button>
          </header>
          <ul className="mt-4 space-y-3 text-xs text-slate-300">
            {demoSteps.map((step) => {
              const isActive = step.route === activeRoute;
              return (
                <li
                  key={step.route}
                  className={clsx(
                    "rounded-2xl border px-3 py-2",
                    isActive
                      ? "border-brand-500/50 bg-brand-500/10 text-slate-100"
                      : "border-surface-800/60 bg-surface-900/70 text-slate-300"
                  )}
                >
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                    {step.title}
                  </p>
                  <p className="mt-1 text-[0.7rem] leading-relaxed text-slate-300">{step.description}</p>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default AppShell;
