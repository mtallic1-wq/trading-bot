import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  X,
  HelpCircle,
  Lock,
  LogIn
} from "lucide-react";

import InteractiveSpace from "./components/InteractiveSpace";
import FloatingDock from "./components/dashboard/floating-dock";
import Metrics from "./components/dashboard/metrics";
import AreaChart from "./components/dashboard/area-chart";
import StructureTable from "./components/dashboard/structure-table";
import PlaybookTable from "./components/dashboard/playbook-table";
import NewsFeed from "./components/dashboard/news-feed";
import SettingsForm from "./components/dashboard/settings-form";
import PlaybookPremium from "./components/dashboard/playbook-premium";
import BiasTracker from "./components/dashboard/bias-tracker";
import GammaLevelsView from "./components/dashboard/gamma-levels-view";
import LandingView from "./components/dashboard/landing-view";

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
  
  // App views: "landing" | "dashboard" | "history" | "news" | "settings" | "playbook" | "tracker" | "gamma"
  const [currentView, setCurrentView] = useState<"landing" | "dashboard" | "history" | "news" | "settings" | "playbook" | "tracker" | "gamma">("landing");
  const [historyReports, setHistoryReports] = useState<any[]>([]);
  const [liveNewsData, setLiveNewsData] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [subStatus, setSubStatus] = useState<string>("free");
  const [userEmail, setUserEmail] = useState<string>("");
  const [hasNqPlaybook, setHasNqPlaybook] = useState<boolean>(false);
  const [hasEsPlaybook, setHasEsPlaybook] = useState<boolean>(false);
  const [hasPremium, setHasPremium] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Login / Sync Modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>("");

  // Sub-tabs in the bottom section of dashboard
  const [dashboardTab, setDashboardTab] = useState<"playbook" | "structure" | "gamma_levels" | "catalysts" | "ai_analysis">("playbook");

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

  // Load token from URL query params or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let tokenParam = params.get("token") || "";
    
    if (tokenParam) {
      localStorage.setItem("nq_user_token", tokenParam);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      tokenParam = localStorage.getItem("nq_user_token") || "";
    }
    
    setToken(tokenParam);
    if (tokenParam) {
      fetch(`/api/user/settings?token=${tokenParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setSubStatus(data.user.subscription_status || "free");
            setUserEmail(data.user.email || "");
            const isPremium = !!data.user.has_premium || data.user.subscription_status === "active";
            setHasPremium(isPremium);
            setHasNqPlaybook(isPremium || !!data.user.has_nq_playbook);
            setHasEsPlaybook(isPremium || !!data.user.has_es_playbook);
            setCurrentView("dashboard");
            fetchReports();
          } else {
            localStorage.removeItem("nq_user_token");
            setToken("");
            setCurrentView("landing");
          }
        })
        .catch((e) => {
          console.error(e);
          setCurrentView("landing");
        });
    } else {
      setCurrentView("landing");
    }
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
            if (job.result && typeof job.result === "object") {
              renderReport(job.result);
            } else {
              loadReport(job.result);
            }
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail })
      });
      const data = await res.json();
      if (data.success && data.user) {
        const userToken = data.user.token;
        localStorage.setItem("nq_user_token", userToken);
        setToken(userToken);
        setSubStatus(data.user.subscription_status || "free");
        setUserEmail(data.user.email || "");
        const isPremium = !!data.user.has_premium || data.user.subscription_status === "active";
        setHasPremium(isPremium);
        setHasNqPlaybook(isPremium || !!data.user.has_nq_playbook);
        setHasEsPlaybook(isPremium || !!data.user.has_es_playbook);
        setIsLoginModalOpen(false);
        setLoginEmail("");
        fetchReports();
      } else {
        setLoginError(data.error || "Login failed");
      }
    } catch (err: any) {
      setLoginError("Connection failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("nq_user_token");
    setToken("");
    setUserEmail("");
    setSubStatus("free");
    setHasPremium(false);
    setHasNqPlaybook(false);
    setHasEsPlaybook(false);
    setCurrentView("landing");
  };

  const handleExplorePreview = () => {
    setCurrentView("dashboard");
    fetchReports();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x", `${x}px`);
    e.currentTarget.style.setProperty("--y", `${y}px`);
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
        body: JSON.stringify({ token: token }),
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
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-300 relative select-none">
      {/* Background 3D Space Field */}
      <InteractiveSpace bias={activeReport?.side || "NEUTRAL"} />

      {/* Cyber Mesh Grid Overlay & Scanlines */}
      <div className="cyber-grid" />
      <div className="laser-h" />
      <div className="hud-scanline" />

      {/* Top heads-up-display Header */}
      <header className="h-14 border-b border-zinc-900 bg-zinc-950/40 backdrop-blur-md px-6 flex items-center justify-between shrink-0 relative z-20">
        <div className="flex items-center gap-2.5 text-zinc-100 font-sans">
          <img 
            src="/logo.jpg" 
            alt="NQ Bias Engine Logo" 
            className="w-6 h-6 rounded object-cover border border-zinc-800" 
          />
          <span className="font-semibold text-xs tracking-widest uppercase">NQ Bias Engine</span>
          <span className="px-2 py-0.5 rounded text-[9px] bg-purple-950/30 text-purple-400 border border-purple-900/30 font-bold uppercase tracking-wider">
            Cockpit Terminal
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Active Session:</span>
          <span className="text-xs text-zinc-200 font-bold font-mono uppercase">
            {currentView === "dashboard" ? activeDate || "Live Report" : currentView}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            {status.text && (
              <div className={`px-2.5 py-1 rounded text-[10px] border flex items-center gap-1.5 ${
                status.type === "run"
                  ? "bg-zinc-900/40 text-zinc-400 border-zinc-800"
                  : status.type === "done"
                  ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                  : "bg-rose-950/20 text-rose-400 border-rose-900/30"
              }`}>
                <span className={`w-1 h-1 rounded-full ${status.type === "run" ? "bg-zinc-400 animate-ping" : status.type === "done" ? "bg-emerald-400" : "bg-rose-400"}`} />
                <span>{status.text}</span>
              </div>
            )}

            {/* Run Engine Scrape Button */}
            {currentView === "dashboard" && (
              <button
                onClick={runAnalysis}
                disabled={!!activeJob}
                className={`p-1.5 rounded border text-[10px] font-bold uppercase transition flex items-center gap-1.5 ${
                  activeJob 
                    ? "bg-zinc-900/10 border-zinc-900/30 text-zinc-600 cursor-not-allowed" 
                    : "bg-purple-950/20 border-purple-900/30 text-purple-400 hover:bg-purple-950/40 hover:border-purple-800/50"
                }`}
                title="Run AI Analysis Engine Scrape"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Run Engine</span>
              </button>
            )}
          </div>

          {/* Upgrade Banner or Premium badge */}
          {subStatus === "active" ? (
            <div className="px-2.5 py-1 rounded text-[9px] bg-purple-950/30 text-purple-400 border border-purple-900/30 font-bold uppercase tracking-widest">
              Premium Account
            </div>
          ) : (
            <a
              href="https://nqbiasengine.lemonsqueezy.com/checkout/buy/ae27f792-5462-4426-ba19-1192730da6a9"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded text-[9px] bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold uppercase tracking-wider transition"
            >
              Upgrade
            </a>
          )}
        </div>
      </header>

      {/* Central Workspace Scroll Panel */}
      <main className="flex-1 overflow-y-auto px-6 py-6 pb-24 relative z-10 bg-zinc-950/10">
          
          {/* SEO Header - Single H1 Tag */}
          <div className="border-b border-zinc-900 pb-4 select-none">
            <h1 className="text-base md:text-lg font-bold text-zinc-100 tracking-tight">
              NQ Bias Engine — Free Pre-Market Nasdaq Futures Analysis
            </h1>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Daily AI-powered volume profile playbooks and swing levels before the NYSE open.
            </p>
          </div>

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
            ) : currentView === "landing" ? (
              /* PUBLIC LANDING GATE VIEW */
              <motion.div
                key="landing-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LandingView
                  onSyncClick={() => setIsLoginModalOpen(true)}
                  onExploreClick={handleExplorePreview}
                  checkoutUrl="https://nqbiasengine.lemonsqueezy.com/checkout/buy/ae27f792-5462-4426-ba19-1192730da6a9"
                />
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
                    <div className="flex bg-zinc-950/40 border border-white/5 rounded-full p-1 backdrop-blur-md shadow-inner gap-1 flex-wrap">
                      <button
                        onClick={() => setDashboardTab("playbook")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer ${
                          dashboardTab === "playbook" 
                            ? "bg-purple-950/20 border border-purple-500/30 text-purple-400 font-bold" 
                            : "border border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Outline Playbook
                      </button>
                      <button
                        onClick={() => setDashboardTab("structure")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer ${
                          dashboardTab === "structure" 
                            ? "bg-purple-950/20 border border-purple-500/30 text-purple-400 font-bold" 
                            : "border border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Market Structure
                      </button>
                      <button
                        onClick={() => setDashboardTab("catalysts")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer ${
                          dashboardTab === "catalysts" 
                            ? "bg-purple-950/20 border border-purple-500/30 text-purple-400 font-bold" 
                            : "border border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Sentiment Catalysts
                      </button>
                      <button
                        onClick={() => setDashboardTab("ai_analysis")}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition cursor-pointer ${
                          dashboardTab === "ai_analysis" 
                            ? "bg-purple-950/20 border-purple-500/30 text-purple-400 font-bold" 
                            : "border border-transparent text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        AI Prediction Matrix
                      </button>
                    </div>
                  </div>

                  {/* Render active dashboard Tab component */}
                  <div className="transition duration-300">
                    {dashboardTab === "playbook" && (
                      <PlaybookTable playbook={activeReport.playbook} hasNqPlaybook={hasNqPlaybook} setView={setCurrentView} />
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
                      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-6 max-h-[500px] overflow-y-auto relative min-h-[250px] flex flex-col justify-center">
                        {!hasPremium ? (
                          /* Locked AI Prediction Teaser Overlay */
                          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center shadow-inner">
                              <Lock className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                                AI Prediction Matrix Locked
                              </h4>
                              <p className="text-[11px] text-zinc-500 leading-relaxed">
                                Get access to multi-model LLM predictions, pre-market market narrative digests, overnight structural summaries, and target direction forecasts by subscribing to NQ Bias Premium.
                              </p>
                            </div>
                            <button
                              onClick={() => setCurrentView("playbook")}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-100 rounded-xl text-xs font-semibold transition shadow-md"
                            >
                              Upgrade to Premium
                            </button>
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}
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
                  yahooNews={liveNewsData.yahoo?.items || []}
                  tvNews={liveNewsData.tradingview?.news || []}
                  calendar={liveNewsData.tradingview?.economic_calendar || []}
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
                <div 
                  onMouseMove={handleMouseMove}
                  className="spotlight-card relative overflow-hidden p-5"
                >
                  <div className="border-b border-zinc-900 pb-4 relative z-10 mb-4">
                    <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                      Saved Signal Forecasts History
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[10px] tracking-wider bg-transparent">
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
                            className="hover:bg-zinc-900/20 cursor-pointer transition"
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
                                  : "bg-zinc-900/40 text-zinc-400 border-zinc-800/40"
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
            ) : currentView === "playbook" ? (
              
              /* PREMIUM PLAYBOOK WINDOW */
              <motion.div
                key="playbook-premium-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-5xl mx-auto"
              >
                <PlaybookPremium hasPremium={hasPremium} hasNqPlaybook={hasNqPlaybook} hasEsPlaybook={hasEsPlaybook} userEmail={userEmail} />
              </motion.div>
            ) : currentView === "tracker" ? (
              
              /* ACCURACY PERFORMANCE TRACKER */
              <motion.div
                key="tracker-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-5xl mx-auto"
              >
                <BiasTracker loadReport={loadReport} setView={setCurrentView} />
              </motion.div>
            ) : currentView === "gamma" ? (
              
              /* S&P 500 OPTIONS GAMMA LEVELS (FREE TAB) */
              <motion.div
                key="gamma-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-5xl mx-auto"
              >
                <GammaLevelsView setView={setCurrentView} hasEsPlaybook={hasEsPlaybook} token={token} />
              </motion.div>
            ) : (
              <div className="text-center text-zinc-600 text-xs py-8">
                No active view selected.
              </div>
            )}

          </AnimatePresence>
        </main>

        {/* Floating Bottom Navigation dock */}
        <FloatingDock
          currentView={currentView}
          setView={(v) => {
            if (v === "news") runNews();
            else if (v === "history") loadHistoryView();
            else {
              setCurrentView(v);
              if (v === "dashboard" && reports.length === 0) {
                fetchReports();
              }
            }
          }}
          userEmail={userEmail}
          hasPremium={hasPremium}
          subStatus={subStatus}
          onSyncClick={() => setIsLoginModalOpen(true)}
          onLogoutClick={handleLogout}
          onHelpClick={() => setIsHelpOpen(true)}
        />

      {/* Login / Account Sync Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsLoginModalOpen(false)} 
          />
          <div className="bg-zinc-950 border border-zinc-850 rounded-xl max-w-sm w-full p-6 relative font-sans shadow-2xl z-10 space-y-4">
            
            {/* Close Button */}
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <LogIn className="w-5 h-5 text-purple-400" />
            </div>

            <div className="space-y-1 text-center">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                Sync Premium Access
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed max-w-xs mx-auto">
                Enter the email address you registered or used on Lemon Squeezy to immediately unlock your subscription features.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3 pt-2">
              <div className="flex flex-col gap-1.5">
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-zinc-700 transition"
                />
              </div>
              
              {loginError && (
                <p className="text-[10px] text-rose-400 font-semibold">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-100 rounded-lg text-xs font-semibold transition shadow-md disabled:opacity-50"
              >
                {isLoggingIn ? "Syncing Account..." : "Sync Access"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Support & Help Center Modal */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950/80 border-beam-active rounded-xl max-w-md w-full p-6 relative font-sans shadow-2xl backdrop-blur-xl"
            >
              <button
                onClick={() => setIsHelpOpen(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
                <HelpCircle className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
                  Support & Help Center
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-zinc-300">📧 Email Support</h4>
                  <p className="text-zinc-500">Contact us directly at:</p>
                  <a href="mailto:support@nqbiasengine.qzz.io" className="text-zinc-200 hover:underline block font-mono">
                    support@nqbiasengine.qzz.io
                  </a>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-semibold text-zinc-300 font-sans">🔑 Activating Premium</h4>
                  <p className="text-zinc-500 leading-relaxed">
                    After subscribing via Lemon Squeezy, check your email for your unique access link. Use that link to configure your email alerts and timezone preferences.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-semibold text-zinc-300">📊 Report Schedule</h4>
                  <p className="text-zinc-500 leading-relaxed">
                    Market forecasts are updated daily. Alerts are sent out automatically relative to your configured timezone before the session opens.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsHelpOpen(false)}
                className="w-full mt-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
