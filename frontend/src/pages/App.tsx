import { Link, Route, Routes, useLocation } from "react-router-dom";

import Calls from "./Calls";
import Home from "./Home";
import Sms from "./Sms";

const tabs = [
  { path: "/", label: "Home" },
  { path: "/sms", label: "SMS" },
  { path: "/calls", label: "Calls" }
];

function App() {
  const location = useLocation();
  const activeTab = location.pathname === "/" ? "/" : `/${location.pathname.split("/")[1]}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-900/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-lg font-semibold tracking-wide text-slate-200">
            AntiSpam Ops Console
          </span>
          <nav className="flex gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`rounded-full px-4 py-2 text-sm transition-colors ${
                  activeTab === tab.path
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sms" element={<Sms />} />
          <Route path="/calls" element={<Calls />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
