import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  RefreshCw,
  CheckCircle,
  XCircle
} from "lucide-react";

import InteractiveSpace from "./components/InteractiveSpace";
import Sidebar from "./components/dashboard/sidebar";
import Metrics from "./components/dashboard/metrics";
import AreaChart from "./components/dashboard/area-chart";
import StructureTable from "./components/dashboard/structure-table";
import PlaybookTable from "./components/dashboard/playbook-table";
import NewsFeed from "./components/dashboard/news-feed";
import SettingsForm from "./components/dashboard/settings-form";

import {
  badgeCls,
  parseAnalysis
} from "./utils/helpers";

const ANALYSIS_STEPS = [
  "Fetching NQ price data…",
  "Fetching macro data…",
  "Scraping Yahoo Finance…",
  "Scraping World Monitor…",
  "Fetching TradingView news…",
  "Multi-timeframe structure…",
  "Live chart levels…",
  "Running AI analysis…",
];

const NEWS_STEPS = [
  "Scraping Yahoo Finance…",
  "Scraping World Monitor…",
  "Fetching TradingView…",
];

export default function App() {
  const [reports, setReports] = useState<string[]>([]);
  const [activeReport, setActiveReport] = useState<any>(null);
  const [activeDate, setActiveDate] = useState<string>("");
  
  // App views: "dashboard" | "history" | "news" | "settings"
  const [currentView, setCurrentView] = useState<"dashboard" | "history" | "news" | "settings">("dashboard");
  const [historyReports, setHistoryReports] = useState<any[]>([]);
  const [liveNewsData, setLiveNewsData] = useState<any>(null);
  const [token, setToken] = useState<string>("");

  // Sub-tabs in the bottom section of dashboard
  const [dashboardTab, setDashboardTab] = useState<"playbook" | "structure" | "catalysts" | "ai_analysis">("playbook");

  // Status message
  const [status, setStatus] = useState<{ text: string; type: "run" | "done" | "error" | "" }>({
    text: "",
    type: "",
  });

  // Polling / running jobs state
  const [activeJob, setActiveJob] = useState<{
    id: string;
    type: "analysis" | "news";
    step: number;
    steps: string[];
  } | null>(null);

  // Load token from URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token") || "";
    setToken(tokenParam);
  }, []);

  // Load report list on mount
  useEffect(() => {
    fetchReports();
  }, []);

  // Poll job status if a job is active
  useEffect(() => {
    if (!activeJob) return;

    let pollInterval: any;
    
    const checkJob = async () => {
      try {
        const res = await fetch(`/api/job/${activeJob.id}`);
        if (!res.ok) throw new Error("Job not found");
        const job = await res.json();
        
        if (job.status === "done") {
          setActiveJob(null);
          setStatus({ text: "Task completed successfully", type: "done" });
          setTimeout(() => setStatus({ text: "", type: "" }), 3000);
          
          if (activeJob.type === "analysis") {
            fetchReports();
            renderReport(job.result);
          } else {
            setCurrentView("news");
            setLiveNewsData(job.result);
          }
        } else if (job.status === "error") {
          setActiveJob(null);
          setStatus({ text: `Task failed: ${job.error}`, type: "error" });
        } else {
          // Increment step for visual feedback
          setActiveJob((prev) => {
            if (!prev) return null;
            const nextStep = prev.step + 1;
            return {
              ...prev,
              step: nextStep < prev.steps.length ? nextStep : prev.step,
            };
          });
        }
      } catch (err: any) {
        setActiveJob(null);
        setStatus({ text: `Polling error: ${err.message}`, type: "error" });
      }
    };

    pollInterval = setInterval(checkJob, 4000);
    return () => clearInterval(pollInterval);
  }, [activeJob]);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      setReports(data || []);
      
      // Auto load latest report
      if (data && data.length > 0 && !activeReport) {
        loadReport(data[0]);
      }
    } catch (err) {
      console.error("Error loading reports", err);
    }
  };

  const loadReport = async (date: string) => {
    setStatus({ text: `Loading ${date}…`, type: "run" });
    try {
      const url = token ? `/api/report/${date}?token=${token}` : `/api/report/${date}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Report file not found");
      const report = await res.json();
      renderReport(report);
      setStatus({ text: "Loaded successfully", type: "done" });
      setTimeout(() => setStatus({ text: "", type: "" }), 2000);
    } catch (err: any) {
      setStatus({ text: `Failed to load: ${err.message}`, type: "error" });
    }
  };

  const renderReport = (report: any) => {
    setActiveReport(report);
    setActiveDate(report.date);
    setCurrentView("dashboard");
  };

  const runAnalysis = async () => {
    setStatus({ text: "Starting analysis engine…", type: "run" });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.job_id) {
        setActiveJob({
          id: data.job_id,
          type: "analysis",
          step: 0,
          steps: ANALYSIS_STEPS,
        });
      } else {
        throw new Error("No job ID received");
      }
    } catch (err: any) {
      setStatus({ text: `Failed to start analysis: ${err.message}`, type: "error" });
    }
  };

  const runNews = async () => {
    setStatus({ text: "Fetching market news…", type: "run" });
    try {
      const res = await fetch("/api/news");
      const data = await res.json();
      if (data.job_id) {
        setActiveJob({
          id: data.job_id,
          type: "news",
          step: 0,
          steps: NEWS_STEPS,
        });
      } else {
        throw new Error("No job ID received");
      }
    } catch (err: any) {
      setStatus({ text: `Failed to fetch news: ${err.message}`, type: "error" });
    }
  };

  const loadHistoryView = async () => {
    setStatus({ text: "Fetching report history…", type: "run" });
    try {
      const res = await fetch("/api/reports");
      const dates = await res.json();
      
      const loaded = await Promise.all(
        dates.map(async (d: string) => {
          const url = token ? `/api/report/${d}?token=${token}` : `/api/report/${d}`;
          const rRes = await fetch(url);
          return rRes.json();
        })
      );
      setHistoryReports(loaded);
      setCurrentView("history");
      setStatus({ text: "", type: "" });
    } catch (err: any) {
      setStatus({ text: `Failed to fetch history: ${err.message}`, type: "error" });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-300 relative select-none">
      {/* Background 3D Space Field */}
      <InteractiveSpace bias={activeReport?.side || "NEUTRAL"} />

      {/* Sidebar Layout */}
      <Sidebar
        reports={reports}
        activeDate={activeDate}
        currentView={currentView}
        setView={(v) => {
          if (v === "news") runNews();
          else if (v === "history") loadHistoryView();
          else setCurrentView(v);
        }}
        loadReport={loadReport}
        runAnalysis={runAnalysis}
        isLoading={!!activeJob}
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-zinc-950/20">
        
        {/* Top Header Breadcrumbs & Status */}
        <header className="h-14 border-b border-zinc-900 bg-zinc-950/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-medium">Dashboard</span>
            <span className="text-zinc-700 text-xs">/</span>
            <span className="text-xs text-zinc-200 font-semibold uppercase tracking-wider font-mono">
              {currentView === "dashboard" ? activeDate || "Live Report" : currentView}
            </span>
          </div>

          {/* Banner logs */}
          {status.text && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${
                status.type === "run"
                  ? "bg-zinc-900/60 text-zinc-400 border-zinc-800"
                  : status.type === "done"
                  ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                  : "bg-rose-950/20 text-rose-400 border-rose-900/30"
              }`}
            >
              {status.type === "run" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {status.type === "done" && <CheckCircle className="w-3.5 h-3.5" />}
              {status.type === "error" && <XCircle className="w-3.5 h-3.5" />}
              <span>{status.text}</span>
            </motion.div>
          )}
        </header>

        {/* Central Workspace Scroll Panel */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* Scraper Job Loader Screen */}
            {activeJob ? (
              <motion.div
                key="running-job"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center h-full max-w-sm mx-auto"
              >
                <div className="relative w-12 h-12 mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-zinc-800 border-t-zinc-200 animate-spin"></div>
                </div>
                <h3 className="text-xs font-bold text-zinc-200 mb-1 uppercase tracking-widest font-mono">
                  Executing Job Sequence
                </h3>
                <span className="text-[10px] text-zinc-500 mb-6 font-mono">
                  ID: {activeJob.id.toUpperCase()}
                </span>
                
                <div className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-4 space-y-2">
                  {activeJob.steps.map((stepLabel, idx) => {
                    const isDone = idx < activeJob.step;
                    const isActive = idx === activeJob.step;
                    return (
                      <div
                        key={stepLabel}
                        className={`flex items-center gap-2.5 text-xs transition ${
                          isDone ? "text-emerald-400" : isActive ? "text-zinc-200 font-medium" : "text-zinc-600"
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          isDone ? "bg-emerald-400" : isActive ? "bg-zinc-200 animate-pulse" : "bg-zinc-800"
                        }`} />
                        <span>{stepLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : currentView === "dashboard" && activeReport ? (
              
              /* DASHBOARD VIEW */
              <motion.div
                key="dashboard-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 max-w-6xl mx-auto"
              >
                
                {/* 1. Metrics Grid */}
                <Metrics report={activeReport} />

                {/* 2. Large area chart matching visitors styling */}
                <AreaChart candles={activeReport.nq?.recent_candles || []} />

                {/* 3. Bottom Table Tabs Switcher matching user screenshot */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2 select-none">
                    
                    {/* Outline Style Tabs */}
                    <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                      <button
                        onClick={() => setDashboardTab("playbook")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                          dashboardTab === "playbook" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Outline Playbook
                      </button>
                      <button
                        onClick={() => setDashboardTab("structure")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                          dashboardTab === "structure" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Market Structure
                      </button>
                      <button
                        onClick={() => setDashboardTab("catalysts")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                          dashboardTab === "catalysts" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Sentiment Catalysts
                      </button>
                      <button
                        onClick={() => setDashboardTab("ai_analysis")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                          dashboardTab === "ai_analysis" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        AI Prediction Matrix
                      </button>
                    </div>
                  </div>

                  {/* Render active dashboard Tab component */}
                  <div className="transition duration-300">
                    {dashboardTab === "playbook" && (
                      <PlaybookTable playbook={activeReport.playbook} />
                    )}
                    {dashboardTab === "structure" && (
                      <StructureTable priceAction={activeReport.price_action} />
                    )}
                    {dashboardTab === "catalysts" && (
                      <NewsFeed
                        yahooNews={activeReport.yahoo?.items || []}
                        tvNews={activeReport.tradingview?.news || []}
                        calendar={activeReport.tradingview?.economic_calendar || []}
                      />
                    )}
                    {dashboardTab === "ai_analysis" && (
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-6 max-h-[500px] overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
                          <Cpu className="w-4 h-4 text-zinc-400" />
                          <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                            AI Bias Summary Report ({activeReport.analysis?.source?.split(" (")[0] || "AI System"})
                          </h3>
                        </div>
                        <div
                          className="text-zinc-300 leading-relaxed text-sm space-y-4"
                          dangerouslySetInnerHTML={{
                            __html: parseAnalysis(
                              activeReport.analysis?.analysis || activeReport.analysis || ""
                            ),
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            ) : currentView === "news" && liveNewsData ? (
              
              /* NEWS FEED WINDOW */
              <motion.div
                key="news-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-5xl mx-auto"
              >
                <NewsFeed
                  yahooNews={liveNewsData.yahoo || []}
                  tvNews={liveNewsData.tradingview || []}
                  calendar={liveNewsData.calendar || []}
                />
              </motion.div>
            ) : currentView === "history" ? (
              
              /* HISTORY VIEW TABLE */
              <motion.div
                key="history-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4 max-w-5xl mx-auto"
              >
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-zinc-900">
                    <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                      Saved Signal Forecasts History
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[10px] tracking-wider bg-zinc-950">
                          <th className="px-6 py-3 font-semibold">Report Date</th>
                          <th className="px-6 py-3 text-center font-semibold">Bias State</th>
                          <th className="px-6 py-3 text-center font-semibold">Action Direction</th>
                          <th className="px-6 py-3 font-semibold">Model Source</th>
                          <th className="px-6 py-3 font-semibold text-right">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/50">
                        {historyReports.map((r: any) => (
                          <tr
                            key={r.date}
                            onClick={() => renderReport(r)}
                            className="hover:bg-zinc-900/40 cursor-pointer transition"
                          >
                            <td className="px-6 py-4 font-mono font-bold text-zinc-200 text-sm">
                              {r.date}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                                r.bias_nq?.includes("BULL")
                                  ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                                  : r.bias_nq?.includes("BEAR")
                                  ? "bg-rose-950/20 text-rose-400 border-rose-900/30"
                                  : "bg-zinc-900 text-zinc-400 border-zinc-800"
                              }`}>
                                {r.bias_nq || "NEUTRAL"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${badgeCls(r.side)}`}>
                                {r.side?.toUpperCase() || "NEUTRAL"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-400">{r.analysis?.source?.split(" (")[0] || "AI MODEL"}</td>
                            <td className="px-6 py-4 font-mono text-zinc-500 text-right">{r.created?.replace("T", " ").slice(0, 19)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            ) : currentView === "settings" ? (
              
              /* SETTINGS SETUP FORM */
              <motion.div
                key="settings-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-5xl mx-auto"
              >
                <SettingsForm token={token} />
              </motion.div>
            ) : (
              <div className="text-center text-zinc-600 text-xs py-8">
                No active view selected.
              </div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
