import {
  Activity,
  History,
  Newspaper,
  Settings,
  HelpCircle,
  ChevronRight,
  Sliders,
  FileText,
  BookOpen,
  Lock,
  TrendingUp
} from "lucide-react";

interface SidebarProps {
  reports: string[];
  activeDate: string;
  currentView: "dashboard" | "history" | "news" | "settings" | "playbook" | "tracker";
  setView: (view: "dashboard" | "history" | "news" | "settings" | "playbook" | "tracker") => void;
  loadReport: (date: string) => void;
  runAnalysis: () => void;
  isLoading: boolean;
  subStatus: string;
  userEmail: string;
  onHelpClick: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  hasPlaybook?: boolean;
}

export default function Sidebar({
  reports,
  activeDate,
  currentView,
  setView,
  loadReport,
  runAnalysis,
  isLoading,
  subStatus,
  userEmail,
  onHelpClick,
  isOpen = false,
  onClose,
  hasPlaybook = false
}: SidebarProps) {
  return (
    <>
      {/* Backdrop overlay for mobile screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 select-none text-zinc-400 font-sans h-screen transition-transform duration-300 md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
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
          onClick={() => setView("tracker")}
          className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
            currentView === "tracker"
              ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
              : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          Accuracy Tracker
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

        <button
          onClick={() => setView("playbook")}
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition ${
            currentView === "playbook"
              ? "bg-zinc-900 text-zinc-100 border border-zinc-800"
              : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Playbook Library</span>
          </div>
          {!hasPlaybook && <Lock className="w-3 h-3 text-zinc-600" />}
        </button>

        <a
          href="/wiki"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
        >
          <div className="flex items-center gap-2.5">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
            <span>Profile Wiki / Glossary</span>
          </div>
          <ChevronRight className="w-3 h-3 opacity-40" />
        </a>
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
        {subStatus !== "active" && (
          <a
            href="https://nqbiasengine.lemonsqueezy.com/checkout/buy/05daaba5-3c34-450e-bd1e-34bef59c6981"
            target="_blank"
            rel="noreferrer"
            className="w-full block text-center py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-bold transition shadow my-2"
          >
            Upgrade to Premium
          </a>
        )}

        <button
          onClick={() => setView("settings")}
          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900/50 rounded-md text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          <Settings className="w-3.5 h-3.5" />
          Settings
        </button>
        <button
          onClick={onHelpClick}
          className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900/50 rounded-md text-xs text-zinc-500 hover:text-zinc-300 transition"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Get Help
        </button>

        {/* Social Media Link Buttons */}
        <div className="flex items-center justify-around py-2 border-t border-zinc-900/60 mt-2">
          <a
            href="https://discord.gg/k65wRtxWfe"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-900/40 rounded-lg transition"
            title="Join Discord"
          >
            <svg className="w-4 h-4" viewBox="0 0 127.14 96.36" fill="currentColor">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1-.73,1.91-1.5,2.78-2.31A74.72,74.72,0,0,0,96.25,78.2c.87.81,1.82,1.58,2.78,2.31a68.43,68.43,0,0,1-10.5,5A77.7,77.7,0,0,0,95.14,96.36a105.73,105.73,0,0,0,31-18.83C129,54.65,123.5,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.9,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96.14,53,91,65.69,84.69,65.69Z"/>
            </svg>
          </a>
          <a
            href="https://x.com/NqBiasEngine"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-900/40 rounded-lg transition"
            title="Follow on X (Twitter)"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a
            href="https://www.instagram.com/nqbiasengine/"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-900/40 rounded-lg transition"
            title="Follow on Instagram"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
        </div>

        {/* User profile card bottom */}
        <div className="pt-2 flex items-center gap-3 border-t border-zinc-900/80 mt-1 px-1">
          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold text-xs uppercase">
            {userEmail ? userEmail[0] : "G"}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-zinc-200 truncate capitalize">
              {userEmail ? userEmail.split("@")[0] : "Guest User"}
            </span>
            <span className="text-[10px] text-zinc-500 truncate">
              {subStatus === "active" ? "Premium Subscriber" : "Free Tier Account"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  </>
  );
}
