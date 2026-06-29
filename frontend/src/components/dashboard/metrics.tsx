import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { TrendingUp, ShieldAlert, Award, Compass } from "lucide-react";
import { num, extractConf } from "../../utils/helpers";

interface MetricsProps {
  report: any;
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-sans select-none">
      
      {/* CARD 1: Session Bias */}
      <Card className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition rounded-xl">
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
      <Card className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition rounded-xl">
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
      <Card className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-5">
          <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Prev High / Low
          </CardTitle>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-zinc-900 text-zinc-400 border-zinc-800 font-mono">
            NQ Levels
          </span>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="text-xl font-bold tracking-tight text-white font-mono truncate">
            {num(ph)} <span className="text-zinc-700 text-xs">/</span> {num(pl)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
            <span>Critical pre-market high and low levels</span>
          </p>
        </CardContent>
      </Card>

      {/* CARD 4: Daily Trend */}
      <Card className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 transition rounded-xl">
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

    </div>
  );
}
