import { useState, useEffect } from "react";
import { Zap, Shield, RefreshCw, AlertTriangle, HelpCircle, BookOpen, ExternalLink, Sparkles, Cpu } from "lucide-react";

export default function GammaLevelsView({ setView, hasEsPlaybook, token }: { 
  setView?: (view: any) => void;
  hasEsPlaybook: boolean;
  token: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [aiPlan, setAiPlan] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>("");

  useEffect(() => {
    if (data && data.ai_plan) {
      setAiPlan(data.ai_plan);
    }
  }, [data]);

  const generateAiPlan = async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch(`/api/gamma/es/plan?token=${token}`);
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

  const [staleWarning, setStaleWarning] = useState<string>("");

  const fetchLevels = async (isRef = false) => {
    if (isRef) setRefreshing(true);
    else setLoading(true);
    setError("");
    setStaleWarning("");
    try {
      const res = await fetch("/api/gamma/es");
      const json = await res.json();
      if (res.ok && json.levels) {
        setData(json);
      } else if (data) {
        // We already have previous data — show it with a warning instead of error screen
        setStaleWarning(json.error || "API temporarily unavailable. Showing most recent cached data.");
      } else {
        setError(json.error || "Failed to load ES Gamma Levels.");
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
    fetchLevels();
  }, []);

  if (loading) {
    return (
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 min-h-[450px]">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <span className="text-xs text-zinc-500 font-mono tracking-wider">Fetching live S&P 500 options boundaries...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 text-center min-h-[450px]">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <h4 className="text-zinc-200 text-sm font-semibold uppercase tracking-wider">ES Gamma Engine Offline</h4>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
          {error || "Unable to establish connection with the options exposure analyzer. Make sure your API key is correctly configured."}
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

  const spot = data.underlying_price;
  const levels = data.levels;
  const flip = levels.gamma_flip;
  const callWall = levels.call_wall;
  const putWall = levels.put_wall;
  const magnet = levels.zero_dte_magnet || "None";
  const isPositive = spot > flip;

  // Calculate percentage spot sits between Put Wall and Call Wall (capped 0-100)
  const rangeWidth = Math.max(1, callWall - putWall);
  const spotPercent = Math.min(100, Math.max(0, ((spot - putWall) / rangeWidth) * 100));

  return (
    <div className="space-y-6 select-none font-sans pb-10">
      
      {/* Top Banner / Tab Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>S&P 500 Options Gamma Boundaries (ES)</span>
          </h2>
          <span className="text-[11px] text-zinc-500 mt-1 block">
            Real-time mechanical support, resistance, and pinning thresholds derived from options open interest.
          </span>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            onClick={() => setView && setView("playbook")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-100 rounded-xl text-[10px] font-semibold transition shadow-md whitespace-nowrap"
          >
            <BookOpen className="w-3 h-3 text-purple-200" />
            <span>Unlock Playbook ($5)</span>
          </button>
          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-3 py-1 rounded-md border border-zinc-800">
            As of: {data.as_of ? new Date(data.as_of).toLocaleTimeString() : "Live"}
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
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">ES Spot Price</span>
          <span className="text-3xl font-extrabold text-zinc-100 font-mono tracking-tight mt-2">
            {spot.toFixed(2)}
          </span>
          <span className="text-[9.5px] text-zinc-600 mt-1 font-mono">Updated via CME raw feed</span>
        </div>

        {/* Volatility Regime Status Card */}
        <div className={`col-span-2 border rounded-2xl p-6 flex items-start justify-between relative overflow-hidden ${
          isPositive 
            ? "bg-emerald-950/10 border-emerald-900/30 text-emerald-400" 
            : "bg-red-950/10 border-red-900/30 text-red-400"
        }`}>
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">Volatility Regime State</span>
            <h4 className="text-lg font-bold tracking-wide uppercase flex items-center gap-2">
              {isPositive ? "⚡ Positive Gamma (+GEX)" : "⚠️ Negative Gamma (-GEX)"}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
              {isPositive 
                ? "Market makers hedge counter-cyclically. They buy when index price falls and sell when index price rises, acting as a massive stabilizer. Realized volatility is heavily dampened, favoring range fades and mean reversion."
                : "Market makers hedge pro-cyclically. They sell as price falls and buy as price rises, creating an amplifying feedback loop. Volatility expands, causing sharp liquidations and rapid trend runs."
              }
            </p>
          </div>
          <Shield className={`w-12 h-12 opacity-25 shrink-0 hidden sm:block ${isPositive ? "text-emerald-400" : "text-red-400"}`} />
        </div>
      </div>

      {/* Levels Table / Value Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Zero-Gamma Flip</span>
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono tracking-tight">
            {flip ? Math.round(flip) : "N/A"}
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">The absolute pivot strike separating high and low vol regimes.</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Call Wall</span>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          </div>
          <div className="text-xl font-bold text-zinc-200 font-mono tracking-tight">
            {callWall ? Math.round(callWall) : "N/A"}
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">Strike with highest call gamma. Overhead resistance ceiling.</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Put Wall</span>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
          </div>
          <div className="text-xl font-bold text-zinc-200 font-mono tracking-tight">
            {putWall ? Math.round(putWall) : "N/A"}
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">Strike with highest put gamma. Primary floor in positive gamma.</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-1.5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">0DTE Magnet</span>
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold text-purple-400 font-mono tracking-tight">
            {magnet !== "None" ? Math.round(Number(magnet)) : "None"}
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal">Same-day expiration pinning strike for the afternoon session.</p>
        </div>

      </div>

      {/* Visual Alignment Track Slider (Detailed) */}
      <div className="border border-zinc-900 bg-zinc-950 p-6 rounded-2xl space-y-4 shadow-lg">
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400 select-none">
          <span className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase">Put Wall Strike</span>
            <span className="text-sm font-bold text-zinc-300">{Math.round(putWall)}</span>
          </span>
          <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded border border-zinc-800">
            Spot Alignment Slider
          </span>
          <span className="flex flex-col text-right">
            <span className="text-[10px] text-zinc-500 uppercase">Call Wall Strike</span>
            <span className="text-sm font-bold text-zinc-300">{Math.round(callWall)}</span>
          </span>
        </div>
        
        <div className="relative h-3 bg-zinc-900 rounded-full border border-zinc-800">
          {/* Active Spot Indicator Pin */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-cyan-400 border-2 border-zinc-950 shadow-lg flex items-center justify-center transition-all duration-500"
            style={{ left: `${spotPercent}%` }}
          >
            <div className="w-2 h-2 rounded-full bg-zinc-950" />
          </div>
          
          {/* Flip Level marker */}
          {flip && flip > putWall && flip < callWall && (
            <div 
              className="absolute top-0 bottom-0 w-1 bg-cyan-400/30"
              style={{ left: `${((flip - putWall) / rangeWidth) * 100}%` }}
              title={`Zero-Gamma Flip: ${Math.round(flip)}`}
            />
          )}
        </div>
        
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>Oversold / Floor Zone</span>
          {flip && (
            <span style={{ marginLeft: `${Math.max(5, Math.min(85, ((flip - putWall) / rangeWidth) * 100))}%` }}>
              Flip Pivot ({Math.round(flip)})
            </span>
          )}
          <span>Overbought / Ceiling Zone</span>
        </div>
      </div>

      {/* Premium CTA banner card */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-900/30 bg-gradient-to-r from-purple-950/20 to-zinc-950 p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md select-none">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-10" />
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-xs font-bold text-zinc-100 flex items-center justify-center md:justify-start gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Unlock the Complete ES Options Gamma Playbook Manual</span>
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
      {!hasEsPlaybook ? (
        /* Locked Teaser Card */
        <div className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md select-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl -z-10" />
          <div className="space-y-1.5 text-center md:text-left">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-center md:justify-start gap-1.5">
              <Cpu className="w-4 h-4 text-zinc-500" />
              <span>AI Premarket Trade Planner</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 uppercase tracking-widest font-mono">Premium</span>
            </h4>
            <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
              Unlock the **ES Gamma Playbook** to activate custom AI-generated premarket plans mapped directly to today's support, resistance, and pinning walls.
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
                <span>Premium AI Premarket Trade Planner</span>
              </h4>
              <span className="text-[10px] text-zinc-500 block">
                Generates a tactical trade setup plan around today's active options boundaries.
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
                  Synthesize S&P 500 options boundaries with playbook trade strategies. AI will map out specific "If/Then" triggers for today's trading session.
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
            <div className="bg-zinc-900/10 border border-zinc-900/40 rounded-xl p-5 overflow-y-auto max-h-[500px]">
              <div className="prose prose-invert prose-xs text-xs text-zinc-400 space-y-3 leading-relaxed whitespace-pre-wrap">
                {aiPlan}
              </div>
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
            The values display daily options hedging triggers. Market makers adjust their positions dynamically, causing the S&P 500 spot index to encounter structural friction at the Call/Put Walls, and switch regimes at the Zero-Gamma Flip. Unlocking the <b>ES Gamma Playbook</b> inside the Playbook Library will provide complete, rules-based entry guides for these triggers.
          </p>
        </div>
      </div>

    </div>
  );
}
