import {
  Activity,
  History,
  Newspaper,
  Settings,
  HelpCircle,
  ChevronRight,
  Sliders,
  FileText
} from "lucide-react";

interface SidebarProps {
  reports: string[];
  activeDate: string;
  currentView: "dashboard" | "history" | "news" | "settings";
  setView: (view: "dashboard" | "history" | "news" | "settings") => void;
  loadReport: (date: string) => void;
  runAnalysis: () => void;
  isLoading: boolean;
}

export default function Sidebar({
  reports,
  activeDate,
  currentView,
  setView,
  loadReport,
  runAnalysis,
  isLoading
}: SidebarProps) {
  return (
    <aside className="relative z-20 w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 select-none text-zinc-400 font-sans h-screen">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-900">
        <div className="flex items-center gap-2 text-zinc-100">
          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <Activity className="w-3.5 h-3.5 text-zinc-200" />
          </div>
          <span className="font-semibold text-sm tracking-tight">NQ Bias Bot</span>
        </div>
      </div>

      {/* Quick Create Action Button */}
      <div className="p-3">
        <button
          onClick={runAnalysis}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 rounded-lg text-xs font-medium transition shadow-sm"
        >
          <span>{isLoading ? "Analyzing..." : "Analyze Today"}</span>
        </button>
      </div>

      {/* Main Navigation menu */}
      <div className="px-2 py-2 space-y-0.5">
        <button
          onClick={() => setView("dashboard")}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            currentView === "dashboard"
              ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
              : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Dashboard
        </button>

        <button
          onClick={() => setView("news")}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            currentView === "news"
              ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
              : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Newspaper className="w-3.5 h-3.5" />
          Live News
        </button>

        <button
          onClick={() => setView("history")}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            currentView === "history"
              ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
              : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <History className="w-3.5 h-3.5" />
          History Logs
        </button>

        <button
          onClick={() => setView("settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            currentView === "settings"
              ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
              : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Alert Setup
        </button>
      </div>

      {/* Reports Header label */}
      <div className="px-5 py-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">
        Saved Reports
      </div>

      {/* Saved Reports scrollable lists */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {reports.length === 0 ? (
          <div className="text-[11px] text-zinc-600 p-4 font-mono">No reports yet</div>
        ) : (
          reports.map((date) => {
            const isActive = date === activeDate && currentView === "dashboard";
            return (
              <button
                key={date}
                onClick={() => loadReport(date)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-left transition-all ${
                  isActive
                    ? "bg-zinc-900 text-zinc-100 border border-zinc-800 font-medium"
                    : "hover:bg-zinc-900/30 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-zinc-600" />
                  <span className="text-xs font-mono">{date}</span>
                </div>
                <ChevronRight className="w-3 h-3 opacity-40" />
              </button>
            );
          })
        )}
      </div>

      {/* Sidebar footer items */}
      <div className="p-3 border-t border-zinc-900 mt-auto space-y-1">
        <button
          onClick={() => setView("settings")}
          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900/50 rounded-md text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
        <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900/50 rounded-md text-xs text-zinc-500 hover:text-zinc-300 transition">
          <HelpCircle className="w-3.5 h-3.5" />
          Get Help
        </button>

        {/* User profile card bottom */}
        <div className="pt-2 flex items-center gap-3 border-t border-zinc-900/80 mt-2 px-1">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold text-xs">
            U
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-200 truncate">Umer</span>
            <span className="text-[10px] text-zinc-500 truncate">subscriber@free.tier</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
