import { useState, useEffect, useMemo } from "react";
import { Zap, Shield, RefreshCw, AlertTriangle, HelpCircle, BookOpen, ExternalLink, Sparkles, Cpu, BarChart3, Activity, Table } from "lucide-react";
import { parseAnalysis } from "../../utils/helpers";

export default function GammaLevelsView({ setView, hasEsPlaybook, hasNqPlaybook, token }: { 
  setView?: (view: any) => void;
  hasEsPlaybook: boolean;
  hasNqPlaybook: boolean;
  token: string;
}) {
  const [symbol, setSymbol] = useState<"ES" | "NQ">("ES");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [chartTab, setChartTab] = useState<"gex" | "liquidity" | "table">("gex");

  const [aiPlan, setAiPlan] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");
  const [staleWarning, setStaleWarning] = useState<string>("");

  useEffect(() => {
    setAiPlan("");
    if (data && data.ai_plan) {
      setAiPlan(data.ai_plan);
    }
  }, [data, symbol]);

  const generateAiPlan = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const planEndpoint = symbol === "NQ" ? "/api/gamma/nq/plan" : "/api/gamma/es/plan";
      const res = await fetch(`${planEndpoint}?token=${token}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setAiPlan(json.plan);
      } else {
        setAiError(json.error || "Failed to generate AI premarket plan.");
      }
    } catch (e: any) {
      setAiError(e.message || "Network error generating plan.");
    } finally {
      setAiLoading(false);
    }
  };

  const fetchLevels = async (isRef = false, targetSymbol = symbol) => {
    if (isRef) setRefreshing(true);
    else setLoading(true);
    setError("");
    setStaleWarning("");
    try {
      const queryParams = new URLSearchParams();
      if (token) queryParams.set("token", token);
      if (isRef) queryParams.set("bypass_cache", "true");
      
      const endpoint = targetSymbol === "NQ" ? "/api/gamma/nq" : "/api/gamma/es";
      const url = `${endpoint}?${queryParams.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.levels) {
        setData(json);
        if (json.warning) {
          setStaleWarning(json.warning);
        }
      } else if (data) {
        setStaleWarning(json.error || "API temporarily unavailable. Showing most recent cached data.");
      } else {
        setError(json.error || `Failed to load ${targetSymbol} Gamma Levels.`);
      }
    } catch (e: any) {
      if (data) {
        setStaleWarning("Network error. Showing most recent cached data.");
      } else {
        setError(e.message || "Network error loading levels.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setData(null);
    fetchLevels(false, symbol);
  }, [symbol]);

  // Derived maximums for visualization bars
  const ladder = data?.ladder || [];
  const maxGexAbs = useMemo(() => {
    if (!ladder.length) return 1;
    return Math.max(...ladder.map((r: any) => Math.max(Math.abs(r.call_gex || 0), Math.abs(r.put_gex || 0))), 1);
  }, [ladder]);

  const maxOI = useMemo(() => {
    if (!ladder.length) return 1;
    return Math.max(...ladder.map((r: any) => r.total_oi || 0), 1);
  }, [ladder]);

  const maxVol = useMemo(() => {
    if (!ladder.length) return 1;
    return Math.max(...ladder.map((r: any) => r.total_vol || 0), 1);
  }, [ladder]);

  if (loading) {
    return (
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 min-h-[450px]">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs text-zinc-500 font-mono tracking-wider">Fetching live {symbol === "NQ" ? "Nasdaq-100 (NDX)" : "S&P 500 (SPX)"} Cboe 0DTE exposure...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 text-center min-h-[450px]">
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 font-mono text-[10px] mb-2">
          <button
            onClick={() => setSymbol("ES")}
            className={`px-2 py-1 rounded transition-colors ${
              symbol === "ES" 
                ? "bg-purple-950/40 text-purple-400 font-bold border border-purple-900/30" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            ES
          </button>
          <button
            onClick={() => setSymbol("NQ")}
            className={`px-2 py-1 rounded transition-colors ${
              symbol === "NQ" 
                ? "bg-purple-950/40 text-purple-400 font-bold border border-purple-900/30" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            NQ
          </button>
        </div>
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <h4 className="text-zinc-200 text-sm font-semibold uppercase tracking-wider">{symbol} Gamma Engine Offline</h4>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
          {error || `Unable to establish connection with the ${symbol} Cboe options exposure feed.`}
        </p>
        <button
          onClick={() => fetchLevels()}
          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs rounded-xl font-medium transition shadow-md"
        >
          Re-initialize Connection
        </button>
      </div>
    );
  }

  const spot = data.underlying_price || 0;
  const levels = data.levels || {};
  const flip = levels.gamma_flip;
  const callWall = levels.call_wall;
  const putWall = levels.put_wall;
  const magnet = levels.vol_call_magnet || levels.zero_dte_magnet || "None";
  const maxPain = levels.max_pain || spot;
  const totalNetGex = data.total_net_gex_m ?? 0;
  const isPositive = totalNetGex >= 0;

  // Calculate percentage spot sits between Put Wall and Call Wall (capped 0-100)
  const rangeWidth = Math.max(1, callWall - putWall);
  const spotPercent = Math.min(100, Math.max(0, ((spot - putWall) / rangeWidth) * 100));

  const isUnlocked = symbol === "NQ" ? hasNqPlaybook : hasEsPlaybook;

  return (
    <div className="space-y-6 select-none font-sans pb-10">
      
      {/* Top Banner / Tab Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>{symbol === "NQ" ? "Nasdaq-100" : "S&P 500"} Options Gamma Boundaries ({symbol})</span>
            </h2>
            
            {/* Symbol Toggle Selector */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 font-mono text-[10px]">
              <button
                onClick={() => setSymbol("ES")}
                className={`px-2 py-1 rounded transition-colors ${
                  symbol === "ES" 
                    ? "bg-purple-950/40 text-purple-400 font-bold border border-purple-900/30" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                ES (SPX)
              </button>
              <button
                onClick={() => setSymbol("NQ")}
                className={`px-2 py-1 rounded transition-colors ${
                  symbol === "NQ" 
                    ? "bg-purple-950/40 text-purple-400 font-bold border border-purple-900/30" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                NQ (NDX)
              </button>
            </div>
          </div>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Official Cboe 0DTE delayed options quote feed • Structural dealer hedging levels & liquidity profile.
          </span>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <a
            href={`/api/gamma/dashboard_html?symbol=${symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-[10px] font-semibold transition shadow-md whitespace-nowrap"
          >
            <BarChart3 className="w-3 h-3 text-cyan-400" />
            <span>Plotly Studio</span>
            <ExternalLink className="w-2.5 h-2.5 text-zinc-500" />
          </a>
          <button
            onClick={() => setView && setView("playbook")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-100 rounded-xl text-[10px] font-semibold transition shadow-md whitespace-nowrap"
          >
            <BookOpen className="w-3 h-3 text-purple-200" />
            <span>Unlock Playbook ($5)</span>
          </button>
          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-3 py-1 rounded-md border border-zinc-800">
            {data.as_of ? new Date(data.as_of).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live"}
          </span>
          <button
            onClick={() => fetchLevels(true)}
            disabled={refreshing}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
            title="Refresh Levels"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stale data warning banner */}
      {staleWarning && (
        <div className="flex items-center gap-2 p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-amber-400 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{staleWarning}</span>
        </div>
      )}

      {/* Spot Price & Active Volatility Regime Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Spot Price Widget */}
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl -z-10" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">{symbol} Reference Spot</span>
            <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              {data.cboe_target || (symbol === "NQ" ? "_NDX" : "_SPX")}
            </span>
          </div>
          <span className="text-3xl font-extrabold text-zinc-100 font-mono tracking-tight mt-2">
            {spot.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[9.5px] text-zinc-600 mt-1 font-mono">Official Cboe Verified CDN</span>
        </div>

        {/* Volatility Regime Status Card */}
        <div className={`col-span-2 border rounded-2xl p-6 flex items-start justify-between relative overflow-hidden ${
          isPositive 
            ? "bg-emerald-950/10 border-emerald-900/30 text-emerald-400" 
            : "bg-red-950/10 border-red-900/30 text-red-400"
        }`}>
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">Volatility Regime State</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isPositive 
                  ? "bg-emerald-900/40 border-emerald-700/50 text-emerald-300" 
                  : "bg-red-900/40 border-red-700/50 text-red-300"
              }`}>
                {isPositive ? `+${totalNetGex.toFixed(1)}M Net GEX` : `-${Math.abs(totalNetGex).toFixed(1)}M Net GEX`}
              </span>
            </div>
            <h4 className="text-lg font-bold tracking-wide uppercase flex items-center gap-2">
              {isPositive ? "⚡ Positive Gamma (+GEX) • Mean-Reversion" : "⚠️ Negative Gamma (-GEX) • Trend Expansion"}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              {isPositive 
                ? "Dealers hedge counter-cyclically (buying dips & selling rips), creating natural price absorption and volatility dampening. Favour mean-reversion setups fading boundary walls back towards the Flip pivot."
                : "Dealers hedge pro-cyclically (selling breakdowns & buying rallies), amplifying volatility and initiating fast directional momentum runs. Support walls are fragile; trade breakout momentum."
              }
            </p>
          </div>
          <Shield className={`w-12 h-12 opacity-25 shrink-0 hidden sm:block ${isPositive ? "text-emerald-400" : "text-red-400"}`} />
        </div>
      </div>

      {/* 5 Levels Cards Grid (Flip, Call Wall, Put Wall, VEX Magnet, Max Pain) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Zero Flip</span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
          <div className="text-lg font-bold text-cyan-400 font-mono tracking-tight">
            {flip ? Math.round(flip).toLocaleString() : "N/A"}
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-normal">Pivot separating high & low volatility regimes.</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">0DTE Call Wall</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono tracking-tight">
            {callWall ? Math.round(callWall).toLocaleString() : "N/A"}
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-normal">Largest positive call GEX. Primary ceiling resistance.</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">0DTE Put Wall</span>
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          </div>
          <div className="text-lg font-bold text-red-400 font-mono tracking-tight">
            {putWall ? Math.round(putWall).toLocaleString() : "N/A"}
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-normal">Largest put GEX strike. Primary floor airbag.</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">0DTE VEX Magnet</span>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          </div>
          <div className="text-lg font-bold text-purple-400 font-mono tracking-tight">
            {magnet !== "None" ? Math.round(Number(magnet)).toLocaleString() : "None"}
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-normal">Peak intraday volume gamma. Hot money pull magnet.</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 space-y-1.5 shadow-md col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Max Pain Strike</span>
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
          </div>
          <div className="text-lg font-bold text-pink-400 font-mono tracking-tight">
            {maxPain ? Math.round(maxPain).toLocaleString() : "N/A"}
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-normal">Strike minimizing total expiring options value.</p>
        </div>

      </div>

      {/* Visual Alignment Track Slider (Detailed) */}
      <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-2xl space-y-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 select-none">
          <span className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase">Put Wall Floor</span>
            <span className="text-sm font-bold text-red-400">{Math.round(putWall).toLocaleString()}</span>
          </span>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
            Spot Alignment Slider
          </span>
          <span className="flex flex-col text-right">
            <span className="text-[10px] text-zinc-500 uppercase">Call Wall Ceiling</span>
            <span className="text-sm font-bold text-emerald-400">{Math.round(callWall).toLocaleString()}</span>
          </span>
        </div>
        
        <div className="relative h-3 bg-zinc-900 rounded-full border border-zinc-800">
          {/* Active Spot Indicator Pin */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-400 border-2 border-zinc-950 shadow-lg flex items-center justify-center transition-all duration-500 z-10"
            style={{ left: `${spotPercent}%` }}
          >
            <div className="w-2 h-2 rounded-full bg-zinc-950" />
          </div>
          
          {/* Flip Level marker */}
          {flip && flip >= putWall && flip <= callWall && (
            <div 
              className="absolute top-0 bottom-0 w-1 bg-cyan-400/50"
              style={{ left: `${((flip - putWall) / rangeWidth) * 100}%` }}
              title={`Zero-Gamma Flip: ${Math.round(flip)}`}
            />
          )}

          {/* Max Pain marker */}
          {maxPain && maxPain >= putWall && maxPain <= callWall && (
            <div 
              className="absolute top-0 bottom-0 w-1 bg-pink-400/50"
              style={{ left: `${((maxPain - putWall) / rangeWidth) * 100}%` }}
              title={`Max Pain: ${Math.round(maxPain)}`}
            />
          )}
        </div>
        
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>Oversold / Floor Zone</span>
          {flip && (
            <span>
              Flip Pivot ({Math.round(flip).toLocaleString()})
            </span>
          )}
          <span>Overbought / Ceiling Zone</span>
        </div>
      </div>

      {/* ── CBOE 0DTE GEX PROFILE & LIQUIDITY MAP VISUALIZER ── */}
      {ladder.length > 0 && (
        <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-2xl space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>0DTE Strike Ladder & Dealer Hedging Profile</span>
              </h4>
              <span className="text-[10px] text-zinc-500 block">
                Calculated strike-by-strike dollar gamma exposure ($M) and contract open interest.
              </span>
            </div>

            {/* View Selector Tabs */}
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 font-mono text-[10px]">
              <button
                onClick={() => setChartTab("gex")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                  chartTab === "gex" 
                    ? "bg-zinc-800 text-cyan-400 font-bold" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>GEX Profile ($M)</span>
              </button>
              <button
                onClick={() => setChartTab("liquidity")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                  chartTab === "liquidity" 
                    ? "bg-zinc-800 text-purple-400 font-bold" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>Liquidity (OI & Vol)</span>
              </button>
              <button
                onClick={() => setChartTab("table")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                  chartTab === "table" 
                    ? "bg-zinc-800 text-zinc-200 font-bold" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Table className="w-3 h-3" />
                <span>Data Table</span>
              </button>
            </div>
          </div>

          {/* GEX Profile Mode */}
          {chartTab === "gex" && (
            <div className="space-y-1.5 font-mono text-xs max-h-[500px] overflow-y-auto pr-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-900 pb-2 px-2">
                <span className="w-24">Strike</span>
                <span className="flex-1 text-center">Dealer Net Gamma Profile (Put GEX ← | → Call GEX)</span>
                <span className="w-24 text-right">Net GEX ($M)</span>
              </div>
              {ladder.map((row: any, idx: number) => {
                const strike = row.strike;
                const isSpotNearest = Math.abs(strike - spot) <= (symbol === "NQ" ? 15 : 5);
                const isCallWall = strike === callWall;
                const isPutWall = strike === putWall;
                const isFlip = strike === flip;
                const isPain = strike === maxPain;
                const isMag = Math.round(strike) === Math.round(Number(magnet));

                const callPct = Math.min(100, (Math.max(0, row.call_gex || 0) / maxGexAbs) * 100);
                const putPct = Math.min(100, (Math.abs(row.put_gex || 0) / maxGexAbs) * 100);

                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                      isSpotNearest 
                        ? "bg-cyan-950/30 border border-cyan-800/40" 
                        : isCallWall 
                        ? "bg-emerald-950/20 border border-emerald-900/30" 
                        : isPutWall 
                        ? "bg-red-950/20 border border-red-900/30" 
                        : "hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="w-24 flex items-center gap-1.5 shrink-0">
                      <span className={`font-bold ${isSpotNearest ? "text-cyan-400" : isCallWall ? "text-emerald-400" : isPutWall ? "text-red-400" : "text-zinc-300"}`}>
                        {Math.round(strike).toLocaleString()}
                      </span>
                      {isSpotNearest && <span className="text-[8px] bg-cyan-900 text-cyan-200 px-1 rounded font-bold">SPOT</span>}
                      {isCallWall && <span className="text-[8px] bg-emerald-900 text-emerald-200 px-1 rounded font-bold">CW</span>}
                      {isPutWall && <span className="text-[8px] bg-red-900 text-red-200 px-1 rounded font-bold">PW</span>}
                      {isFlip && <span className="text-[8px] bg-blue-900 text-blue-200 px-1 rounded font-bold">FLIP</span>}
                      {isPain && <span className="text-[8px] bg-pink-900 text-pink-200 px-1 rounded font-bold">PAIN</span>}
                      {isMag && <span className="text-[8px] bg-purple-900 text-purple-200 px-1 rounded font-bold">MAG</span>}
                    </div>

                    {/* Centered bidirectional bar */}
                    <div className="flex-1 flex items-center h-4 mx-3 bg-zinc-900/80 rounded overflow-hidden relative">
                      <div className="w-1/2 flex justify-end h-full">
                        <div 
                          className="bg-red-500/80 h-full rounded-l transition-all"
                          style={{ width: `${putPct}%` }}
                          title={`Put GEX: -$${Math.abs(row.put_gex).toFixed(1)}M`}
                        />
                      </div>
                      <div className="w-0.5 h-full bg-zinc-700 z-10" />
                      <div className="w-1/2 flex justify-start h-full">
                        <div 
                          className="bg-emerald-500/80 h-full rounded-r transition-all"
                          style={{ width: `${callPct}%` }}
                          title={`Call GEX: +$${row.call_gex.toFixed(1)}M`}
                        />
                      </div>
                    </div>

                    <div className={`w-24 text-right shrink-0 font-bold ${row.net_gex >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {row.net_gex >= 0 ? `+$${row.net_gex.toFixed(1)}M` : `-$${Math.abs(row.net_gex).toFixed(1)}M`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Liquidity (OI & Volume) Mode */}
          {chartTab === "liquidity" && (
            <div className="space-y-1.5 font-mono text-xs max-h-[500px] overflow-y-auto pr-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-900 pb-2 px-2">
                <span className="w-24">Strike</span>
                <span className="flex-1 text-center">Contracts Distribution (Purple: OI | Orange: 0DTE Vol)</span>
                <span className="w-28 text-right">OI / Vol</span>
              </div>
              {ladder.map((row: any, idx: number) => {
                const strike = row.strike;
                const isSpotNearest = Math.abs(strike - spot) <= (symbol === "NQ" ? 15 : 5);
                const oiPct = Math.min(100, (row.total_oi / maxOI) * 100);
                const volPct = Math.min(100, (row.total_vol / maxVol) * 100);

                return (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
                      isSpotNearest 
                        ? "bg-cyan-950/30 border border-cyan-800/40" 
                        : "hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="w-24 flex items-center gap-1 shrink-0">
                      <span className={`font-bold ${isSpotNearest ? "text-cyan-400" : "text-zinc-300"}`}>
                        {Math.round(strike).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-0.5 mx-3">
                      <div className="h-2 bg-zinc-900 rounded overflow-hidden">
                        <div 
                          className="bg-purple-500/80 h-full rounded transition-all"
                          style={{ width: `${oiPct}%` }}
                          title={`OI: ${row.total_oi.toLocaleString()} contracts`}
                        />
                      </div>
                      <div className="h-2 bg-zinc-900 rounded overflow-hidden">
                        <div 
                          className="bg-amber-500/80 h-full rounded transition-all"
                          style={{ width: `${volPct}%` }}
                          title={`Volume: ${row.total_vol.toLocaleString()} contracts`}
                        />
                      </div>
                    </div>

                    <div className="w-28 text-right shrink-0 text-[11px] text-zinc-400">
                      <span className="text-purple-300 font-semibold">{row.total_oi.toLocaleString()}</span>
                      <span className="text-zinc-600"> / </span>
                      <span className="text-amber-300 font-semibold">{row.total_vol.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table Mode */}
          {chartTab === "table" && (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto font-mono text-xs">
              <table className="w-full text-left text-zinc-300 border-collapse">
                <thead className="sticky top-0 bg-zinc-900 text-[10px] text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-3">Strike</th>
                    <th className="py-2.5 px-3 text-right">Call GEX ($M)</th>
                    <th className="py-2.5 px-3 text-right">Put GEX ($M)</th>
                    <th className="py-2.5 px-3 text-right">Net GEX ($M)</th>
                    <th className="py-2.5 px-3 text-right">Call OI</th>
                    <th className="py-2.5 px-3 text-right">Put OI</th>
                    <th className="py-2.5 px-3 text-right">0DTE Vol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {ladder.map((row: any, idx: number) => {
                    const isSpotNearest = Math.abs(row.strike - spot) <= (symbol === "NQ" ? 15 : 5);
                    return (
                      <tr 
                        key={idx}
                        className={`hover:bg-zinc-900/50 ${isSpotNearest ? "bg-cyan-950/20 font-bold" : ""}`}
                      >
                        <td className="py-2 px-3 text-cyan-300">{Math.round(row.strike).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-emerald-400">+${row.call_gex.toFixed(1)}M</td>
                        <td className="py-2 px-3 text-right text-red-400">-${Math.abs(row.put_gex).toFixed(1)}M</td>
                        <td className={`py-2 px-3 text-right font-bold ${row.net_gex >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {row.net_gex >= 0 ? `+$${row.net_gex.toFixed(1)}M` : `-$${Math.abs(row.net_gex).toFixed(1)}M`}
                        </td>
                        <td className="py-2 px-3 text-right text-zinc-400">{row.oi_call.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-zinc-400">{row.oi_put.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-amber-400">{row.total_vol.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Premium CTA banner card */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-900/30 bg-gradient-to-r from-purple-950/20 to-zinc-950 p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md select-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-10" />
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-xs font-bold text-zinc-100 flex items-center justify-center md:justify-start gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Unlock the Complete {symbol} Options Gamma Playbook Manual</span>
          </h4>
          <p className="text-[11px] text-zinc-400 max-w-xl leading-relaxed">
            Get structural trade setups, rules-based entries, targets, and exit parameters for all Gamma wall interactions. Completely optimized for prop-firm risk management.
          </p>
        </div>
        <button
          onClick={() => setView && setView("playbook")}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl text-[11px] font-semibold transition shrink-0 shadow-md w-full md:w-auto justify-center"
        >
          <span>Get Premium Playbook — $5</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* DETAILED REGIME PLAYBOOK QUICK REFERENCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
        
        {/* Left: Positive Gamma Rules */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Positive Gamma Playbook Rules (+GEX)
            </h4>
          </div>
          
          <ul className="space-y-3 text-xs text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span><b>Dampened Volatility</b>: Expect clean, slow rotations and mean-reverting price action. Avoid playing breakouts.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span><b>Wall Bounces</b>: The Call Wall acts as solid resistance. Put Wall acts as solid support. Fade both boundaries on tests.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span><b>Preferred Strategies</b>: Range Fades (G1 setup), Credit Spreads, Iron Condors, and short strangles. Target POC / Flip.</span>
            </li>
          </ul>
        </div>

        {/* Right: Negative Gamma Rules */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              Negative Gamma Playbook Rules (-GEX)
            </h4>
          </div>
          
          <ul className="space-y-3 text-xs text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <span><b>Amplified Volatility</b>: Expect fast, violent moves. Stop-loss ranges must be widened to account for higher ATR.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <span><b>Wall Failures</b>: Options support levels (like Put Walls) do not hold easily. Fading them is extremely dangerous.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <span><b>Preferred Strategies</b>: Trend Breakouts (G2 setup), momentum continuation shorting (G3 setup), long straddles / directional puts.</span>
            </li>
          </ul>
        </div>

      </div>

      {/* 4. PREMIUM AI PREMARKET PLANNER */}
      {!isUnlocked ? (
        /* Locked Teaser Card */
        <div className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md select-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-10" />
          <div className="space-y-1.5 text-center md:text-left">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
              <Cpu className="w-4 h-4 text-zinc-500" />
              <span>AI Premarket Trade Planner ({symbol})</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 uppercase tracking-widest font-mono">Premium</span>
            </h4>
            <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
              Unlock the **{symbol === "NQ" ? "Volume Profile Playbook" : "ES Gamma Playbook"}** to activate custom AI-generated premarket plans mapped directly to today's Cboe support, resistance, and pinning walls.
            </p>
          </div>
          <button
            onClick={() => setView && setView("playbook")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-xl text-xs font-medium transition shrink-0 w-full md:w-auto justify-center"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Unlock AI Planner</span>
          </button>
        </div>
      ) : (
        /* Unlocked AI Planner Component */
        <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-2xl space-y-4 shadow-lg select-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Premium AI Premarket Trade Planner ({symbol})</span>
              </h4>
              <span className="text-[10px] text-zinc-500 block">
                Generates a tactical trade setup plan around today's active Cboe options boundaries.
              </span>
            </div>
            
            {aiPlan && (
              <button
                onClick={generateAiPlan}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl text-[10px] font-semibold transition"
              >
                <RefreshCw className={`w-3 h-3 ${aiLoading ? "animate-spin" : ""}`} />
                <span>Regenerate Plan</span>
              </button>
            )}
          </div>

          {aiError && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{aiError}</span>
            </div>
          )}

          {!aiPlan && !aiLoading ? (
            /* Request Plan Call To Action */
            <div className="text-center py-8 space-y-4 max-w-md mx-auto">
              <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-purple-400" />
              </div>
              <div className="space-y-1">
                <h5 className="text-xs font-semibold text-zinc-300 uppercase">Generate Today's Action Plan</h5>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Synthesize {symbol === "NQ" ? "Nasdaq-100" : "S&P 500"} options boundaries with playbook trade strategies. AI will map out specific "If/Then" triggers for today's trading session.
                </p>
              </div>
              <button
                onClick={generateAiPlan}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-100 rounded-xl text-xs font-semibold transition shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Trade Plan</span>
              </button>
            </div>
          ) : aiLoading ? (
            /* Loading State */
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
              <span className="text-[10px] text-zinc-500 font-mono tracking-wider animate-pulse">
                Synthesizing GEX structures and playbook setups...
              </span>
            </div>
          ) : (
            /* Display AI Plan */
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-6 overflow-y-auto max-h-[750px] shadow-inner">
              <div
                className="text-zinc-300 leading-relaxed text-xs space-y-4"
                dangerouslySetInnerHTML={{
                  __html: parseAnalysis(aiPlan),
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Guide Card for Beginners */}
      <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl flex gap-3 text-zinc-400 text-xs select-none">
        <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-zinc-200 uppercase tracking-wider text-[11px]">Help / Quick Legend</h4>
          <p className="leading-relaxed">
            The values display daily options hedging triggers pulled directly from Cboe CDN feeds. Market makers adjust their positions dynamically, causing the {symbol === "NQ" ? "Nasdaq-100" : "S&P 500"} spot index to encounter structural friction at the Call/Put Walls, and switch regimes at the Zero-Gamma Flip. Unlocking the <b>{symbol === "NQ" ? "Volume Profile Playbook" : "ES Gamma Playbook"}</b> inside the Playbook Library will provide complete, rules-based entry guides for these triggers.
          </p>
        </div>
      </div>
    </div>
  );
}
