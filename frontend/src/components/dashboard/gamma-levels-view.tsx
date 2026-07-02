import { useState, useEffect } from "react";
import { Zap, Shield, Info, RefreshCw, AlertTriangle } from "lucide-react";

export default function GammaLevelsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchLevels = async (isRef = false) => {
    if (isRef) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gamma/es");
      const json = await res.json();
      if (res.ok && json.levels) {
        setData(json);
      } else {
        setError(json.error || "Failed to load ES Gamma Levels.");
      }
    } catch (e: any) {
      setError(e.message || "Network error loading levels.");
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
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 flex flex-col items-center justify-center space-y-3 min-h-[300px]">
        <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
        <span className="text-xs text-zinc-500 font-mono">Fetching S&P 500 GEX levels...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 flex flex-col items-center justify-center space-y-3 text-center min-h-[300px]">
        <AlertTriangle className="w-7 h-7 text-amber-500" />
        <h4 className="text-zinc-200 text-sm font-semibold">ES Gamma Levels Unavailable</h4>
        <p className="text-xs text-zinc-500 max-w-sm">
          {error || "Make sure your FLASHALPHA_API_KEY is configured in your project settings."}
        </p>
        <button
          onClick={() => fetchLevels()}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs rounded-lg font-medium transition"
        >
          Try Again
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
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-6 select-none font-sans">
      
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">
            S&P 500 Options Gamma Boundaries (ES)
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-600 font-mono">
            As of: {data.as_of ? new Date(data.as_of).toLocaleTimeString() : "Live"}
          </span>
          <button
            onClick={() => fetchLevels(true)}
            disabled={refreshing}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
            title="Refresh Levels"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Spot Price & Active Regime Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">ES Spot Price</span>
          <span className="text-2xl font-bold text-zinc-100 font-mono tracking-tight mt-1">
            {spot.toFixed(2)}
          </span>
        </div>

        <div className={`col-span-2 border rounded-xl p-4 flex items-center justify-between ${
          isPositive 
            ? "bg-emerald-950/10 border-emerald-900/30 text-emerald-400" 
            : "bg-red-950/10 border-red-900/30 text-red-400"
        }`}>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-60">Active Volatility Regime</span>
            <h4 className="text-sm font-bold tracking-wide uppercase">
              {isPositive ? "⚡ Positive Gamma (+GEX)" : "⚠️ Negative Gamma (-GEX)"}
            </h4>
            <p className="text-[11px] opacity-80 leading-relaxed max-w-md">
              {isPositive 
                ? "Market makers hedge counter-cyclically (buying dips, selling rallies). Volatility is compressed. Bounces are likely at boundaries."
                : "Market makers hedge pro-cyclically (selling dips, buying rallies). Volatility is amplified. Breakouts run hard; support fails easily."
              }
            </p>
          </div>
          <Shield className={`w-10 h-10 opacity-20 shrink-0 hidden sm:block ${isPositive ? "text-emerald-400" : "text-red-400"}`} />
        </div>
      </div>

      {/* GEX Levels Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-zinc-900/30 border border-zinc-900/60 rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Zero-Gamma Flip</span>
          <div className="text-base font-bold text-cyan-400 font-mono tracking-tight">
            {flip ? Math.round(flip) : "N/A"}
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-tight">Regime change strike pivot.</p>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-900/60 rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Call Wall</span>
          <div className="text-base font-bold text-zinc-200 font-mono tracking-tight">
            {callWall ? Math.round(callWall) : "N/A"}
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-tight">Hard ceiling overhead resistance.</p>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-900/60 rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Put Wall</span>
          <div className="text-base font-bold text-zinc-200 font-mono tracking-tight">
            {putWall ? Math.round(putWall) : "N/A"}
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-tight">Support floor / downside acceleration line.</p>
        </div>

        <div className="bg-zinc-900/30 border border-zinc-900/60 rounded-xl p-4 space-y-1">
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">0DTE Magnet</span>
          <div className="text-base font-bold text-purple-400 font-mono tracking-tight">
            {magnet !== "None" ? Math.round(Number(magnet)) : "None"}
          </div>
          <p className="text-[9.5px] text-zinc-500 leading-tight">Graveyard target strike for end of day.</p>
        </div>

      </div>

      {/* Visual Alignment Track Slider */}
      <div className="border border-zinc-900 bg-zinc-900/10 p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
          <span>Put Wall ({Math.round(putWall)})</span>
          <span className="text-zinc-400 font-semibold">Spot Location Indicator</span>
          <span>Call Wall ({Math.round(callWall)})</span>
        </div>
        
        <div className="relative h-2 bg-zinc-900 rounded-full border border-zinc-800">
          {/* Active Spot Indicator Pin */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-cyan-400 border border-zinc-950 shadow-md flex items-center justify-center transition-all duration-500"
            style={{ left: `${spotPercent}%` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-950 animate-ping" />
          </div>
          
          {/* Flip Level marker */}
          {flip && flip > putWall && flip < callWall && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-zinc-700/60"
              style={{ left: `${((flip - putWall) / rangeWidth) * 100}%` }}
              title={`Zero-Gamma Flip: ${Math.round(flip)}`}
            />
          )}
        </div>
        
        <div className="flex justify-between text-[9px] text-zinc-600 font-mono pt-1">
          <span>Oversold / Floor</span>
          {flip && (
            <span style={{ marginLeft: `${Math.max(10, Math.min(80, ((flip - putWall) / rangeWidth) * 100))}%` }}>
              Flip Pivot ({Math.round(flip)})
            </span>
          )}
          <span>Overbought / Ceiling</span>
        </div>
      </div>

      {/* Explanation Footer Box */}
      <div className="border border-zinc-900 bg-zinc-900/20 p-4 rounded-xl flex gap-3 text-zinc-400 text-xs">
        <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-zinc-300">How to Trade S&P 500 GEX Levels:</h4>
          <p className="leading-relaxed">
            Verify the Spot Price relative to the Call Wall and Put Wall. On <b>Positive Gamma</b> days, fade tests of the boundaries. On <b>Negative Gamma</b> days, wait for breakouts past the walls or flip zones. To study concrete execution rules, open the premium <b>ES Options Playbook</b>.
          </p>
        </div>
      </div>

    </div>
  );
}
