import { TrendingUp, ShieldAlert, Award, Compass } from "lucide-react";
import { num, extractConf } from "../../utils/helpers";
import Gauge from "./gauge";
import RollingNumber from "./rolling-number";

interface MetricsProps {
  report: any;
}

function calculateMacroSentiment(report: any): { score: number; label: string } {
  if (!report || !report.macro) return { score: 50, label: "NEUTRAL" };
  
  let score = 50;
  const macro = report.macro;
  
  // DXY (Dollar Index) - Inverse relationship with equity
  const dxy = macro["DXY (Dollar Index)"] || macro["DXY"];
  if (dxy) {
    const dxy5d = dxy["5d_chg"] || dxy["day_chg"] || 0;
    score -= dxy5d * 10;
  }
  
  // VIX (Fear Index) - Inverse relationship
  const vix = macro["VIX (Fear Index)"] || macro["VIX"];
  if (vix) {
    const vix5d = vix["5d_chg"] || vix["day_chg"] || 0;
    score -= vix5d * 0.8;
  }
  
  // 10Y Treasury Yield - Inverse relationship with Nasdaq (highly rate sensitive)
  const yield10y = macro["10Y Treasury Yield"] || macro["10Y Yield"];
  if (yield10y) {
    const yield5d = yield10y["5d_chg"] || yield10y["day_chg"] || 0;
    score -= yield5d * 5;
  }
  
  score = Math.max(10, Math.min(90, Math.round(score)));
  
  let label = "NEUTRAL";
  if (score > 60) label = "BULLISH";
  else if (score < 40) label = "BEARISH";
  
  return { score, label };
}

export default function Metrics({ report }: MetricsProps) {
  if (!report) return null;

  const side = report.side || "NEUTRAL";
  const conf = extractConf(report.analysis?.analysis || report.analysis);
  
  // High / Low
  const ph = report.nq?.prev_day_high || "?";
  const pl = report.nq?.prev_day_low || "?";
  const trend = report.nq?.trend || "SIDEWAYS";

  // Trend styling
  const trendColor = 
    trend === "UP" ? "text-emerald-400 bg-emerald-955/20 border-emerald-900/30" : 
    trend === "DOWN" ? "text-rose-400 bg-rose-955/20 border-rose-900/30" : 
    "text-amber-400 bg-amber-955/20 border-amber-900/30";

  const sentiment = calculateMacroSentiment(report);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x", `${x}px`);
    e.currentTarget.style.setProperty("--y", `${y}px`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 font-sans select-none">
      
      {/* CARD 1: Session Bias */}
      <div 
        onMouseMove={handleMouseMove}
        className="spotlight-card relative p-5 flex flex-col justify-between"
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            NYSE Bias Prediction
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border relative z-10 ${
            side.includes("BUY") || side.includes("BULL") 
              ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" 
              : side.includes("SELL") || side.includes("BEAR")
              ? "bg-rose-950/20 text-rose-400 border-rose-900/30" 
              : "bg-zinc-900 text-zinc-400 border-zinc-800"
          }`}>
            {side.includes("BUY") || side.includes("BULL") ? "BUY SIDE" : side.includes("SELL") || side.includes("BEAR") ? "SELL SIDE" : "NEUTRAL"}
          </span>
        </div>
        <div className="mt-3 relative z-10">
          <div className="text-2xl font-black tracking-tight text-white uppercase font-sans">
            {side}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Targeting the market session bias</span>
          </p>
        </div>
      </div>

      {/* CARD 2: Confidence Score */}
      <div 
        onMouseMove={handleMouseMove}
        className="spotlight-card relative p-5 flex flex-col justify-between"
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Model Confidence
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border relative z-10 ${
            conf && conf >= 70
              ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" 
              : conf && conf >= 45
              ? "bg-amber-950/20 text-amber-400 border-amber-900/30"
              : "bg-zinc-900 text-zinc-400 border-zinc-800"
          }`}>
            {conf ? `${conf}%` : "Rule Mode"}
          </span>
        </div>
        <div className="mt-3 relative z-10">
          <div className="text-2xl font-black tracking-tight text-white font-mono flex items-center">
            {conf ? (
              <>
                <RollingNumber value={conf} />
                <span>%</span>
              </>
            ) : (
              <RollingNumber value="100%" />
            )}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-zinc-500" />
            <span>LLaMA 3.3 Sentiment score</span>
          </p>
        </div>
      </div>

      {/* CARD 3: Key Levels */}
      <div 
        onMouseMove={handleMouseMove}
        className="spotlight-card relative p-5 flex flex-col justify-between"
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Prev High / Low
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-zinc-900 text-zinc-400 border-zinc-800 font-mono relative z-10">
            NQ Levels
          </span>
        </div>
        <div className="mt-3 relative z-10">
          <div className="text-[15px] font-bold tracking-tight text-white font-mono flex items-center gap-1.5 whitespace-nowrap">
            <RollingNumber value={num(ph)} />
            <span className="text-zinc-700 text-xs">/</span>
            <RollingNumber value={num(pl)} />
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
            <span>Critical pre-market high/low boundaries</span>
          </p>
        </div>
      </div>

      {/* CARD 4: Daily Trend */}
      <div 
        onMouseMove={handleMouseMove}
        className="spotlight-card relative p-5 flex flex-col justify-between"
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Daily Trend Direction
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border relative z-10 ${trendColor}`}>
            {trend}
          </span>
        </div>
        <div className="mt-3 relative z-10">
          <div className="text-2xl font-black tracking-tight text-white font-sans uppercase">
            {trend}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-zinc-500" />
            <span>Linear regression trend slope</span>
          </p>
        </div>
      </div>

      {/* CARD 5: Macro Sentiment Gauge */}
      <div 
        onMouseMove={handleMouseMove}
        className="spotlight-card relative p-5 flex flex-col justify-between"
      >
        <div className="flex flex-row items-center justify-between pb-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Macro Sentiment
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border relative z-10 ${
            sentiment.label === "BULLISH"
              ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
              : sentiment.label === "BEARISH"
              ? "bg-rose-950/20 text-rose-400 border-rose-900/30"
              : "bg-zinc-900 text-zinc-400 border-zinc-800"
          }`}>
            {sentiment.label}
          </span>
        </div>
        <div className="mt-3 flex flex-col items-center justify-center flex-1 relative z-10">
          <Gauge score={sentiment.score} label={`${sentiment.label} BIAS`} />
        </div>
      </div>

    </div>
  );
}
