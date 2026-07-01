import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { TrendingUp, ShieldAlert, Award, Compass } from "lucide-react";
import { num, extractConf } from "../../utils/helpers";
import Gauge from "./gauge";

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
    trend === "UP" ? "text-emerald-400 bg-emerald-950/20 border-emerald-900/30" : 
    trend === "DOWN" ? "text-rose-400 bg-rose-950/20 border-rose-900/30" : 
    "text-amber-400 bg-amber-950/20 border-amber-900/30";

  const sentiment = calculateMacroSentiment(report);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 font-sans select-none">
      
      {/* CARD 1: Session Bias */}
      <Card className="bg-zinc-950 border border-zinc-800 hover:border-zinc-800 transition rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
          <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            NYSE Bias Prediction
          </CardTitle>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            side.includes("BUY") || side.includes("BULL") 
              ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" 
              : side.includes("SELL") || side.includes("BEAR")
              ? "bg-rose-950/20 text-rose-400 border-rose-900/30" 
              : "bg-zinc-900 text-zinc-400 border-zinc-800"
          }`}>
            {side.includes("BUY") || side.includes("BULL") ? "BUY SIDE" : side.includes("SELL") || side.includes("BEAR") ? "SELL SIDE" : "NEUTRAL"}
          </span>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className={`text-2xl font-bold tracking-tight text-white uppercase`}>
            {side}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Targeting the market session bias</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 2: Confidence Score */}
      <Card className="bg-zinc-950 border border-zinc-800 hover:border-zinc-800 transition rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
          <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Model Confidence
          </CardTitle>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            conf && conf >= 70
              ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" 
              : conf && conf >= 45
              ? "bg-amber-950/20 text-amber-400 border-amber-900/30"
              : "bg-zinc-900 text-zinc-400 border-zinc-800"
          }`}>
            {conf ? `${conf}%` : "Rule Mode"}
          </span>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="text-2xl font-bold tracking-tight text-white font-mono">
            {conf ? `${conf}%` : "100%"}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-zinc-500" />
            <span>LLaMA 3.3 Versatile Sentiment score</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 3: Key Levels */}
      <Card className="bg-zinc-950 border border-zinc-800 hover:border-zinc-800 transition rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
          <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Prev High / Low
          </CardTitle>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-zinc-900 text-zinc-400 border-zinc-800 font-mono">
            NQ Levels
          </span>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="text-[14px] xl:text-[15px] font-bold tracking-tight text-white font-mono flex items-center gap-1.5 whitespace-nowrap">
            <span>{num(ph)}</span>
            <span className="text-zinc-700 text-xs">/</span>
            <span>{num(pl)}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
            <span>Critical pre-market high and low levels</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 4: Daily Trend */}
      <Card className="bg-zinc-950 border border-zinc-800 hover:border-zinc-800 transition rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
          <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Daily Trend Direction
          </CardTitle>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${trendColor}`}>
            {trend}
          </span>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="text-2xl font-bold tracking-tight text-white">
            {trend}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-zinc-500" />
            <span>Linear regression trend slope direction</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 5: Macro Sentiment Gauge */}
      <Card className="bg-zinc-950 border border-zinc-800 hover:border-zinc-800 transition rounded-xl flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
          <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Macro Sentiment
          </CardTitle>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
            sentiment.label === "BULLISH"
              ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
              : sentiment.label === "BEARISH"
              ? "bg-rose-950/20 text-rose-400 border-rose-900/30"
              : "bg-zinc-900 text-zinc-400 border-zinc-800"
          }`}>
            {sentiment.label}
          </span>
        </CardHeader>
        <CardContent className="px-5 pb-5 flex flex-col items-center justify-center flex-1">
          <Gauge score={sentiment.score} label={`${sentiment.label} BIAS`} />
        </CardContent>
      </Card>

    </div>
  );
}
