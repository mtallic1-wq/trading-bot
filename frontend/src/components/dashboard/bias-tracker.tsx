import { useEffect, useState } from "react";
import { TrendingUp, Award, Flame, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";

function formatReportDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${months[monthIdx]} ${day}, ${year}`;
    }
  }
  return dateStr;
}


interface BiasTrackerProps {
  loadReport: (date: string) => void;
  setView: (view: "dashboard" | "history" | "news" | "settings" | "playbook" | "tracker") => void;
}

export default function BiasTracker({ loadReport, setView }: BiasTrackerProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bias/win-rate");
      if (!res.ok) throw new Error("Failed to load win rate statistics");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || "Unknown error occurred");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 max-w-sm mx-auto font-sans select-none">
        <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin mb-4" />
        <span className="text-xs text-zinc-500 font-mono">Analyzing report history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-zinc-950 border border-red-950/30 rounded-xl p-6 text-center text-red-400 font-sans max-w-md mx-auto flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
        <div className="text-left">
          <h4 className="text-sm font-semibold mb-1">Failed to Load Metrics</h4>
          <p className="text-xs text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.total_evaluated === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-center text-zinc-500 font-sans max-w-md mx-auto">
        Historical bias data unavailable. Populate your database with closed trading reports to see win rate statistics.
      </div>
    );
  }

  const { win_rate, total_evaluated, correct_predictions, streak_count, streak_type, details } = data;
  const totalLosses = total_evaluated - correct_predictions;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <span>Directional Bias Accuracy Tracker</span>
          </h2>
          <span className="text-xs text-zinc-500 mt-1 block">
            Real-time statistics calculated from historical pre-market forecasts vs. market closes.
          </span>
        </div>
        <button
          onClick={fetchData}
          className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition"
          title="Refresh statistics"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Win Rate */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl -mr-6 -mt-6" />
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">WIN RATE</span>
            <h3 className="text-2xl font-extrabold text-cyan-400 font-mono">{win_rate}%</h3>
            <span className="text-[10px] text-zinc-500 block">Overall accuracy</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-950/20 border border-cyan-900/30 flex items-center justify-center">
            <Award className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        {/* Total Wins */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">SUCCESSFUL FORECASTS</span>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-mono">{correct_predictions}</h3>
            <span className="text-[10px] text-zinc-500 block">Confluent target days reached</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Total Losses */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">INCORRECT FORECASTS</span>
            <h3 className="text-2xl font-extrabold text-rose-400 font-mono">{totalLosses}</h3>
            <span className="text-[10px] text-zinc-500 block">Opposing trend or range days</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-950/20 border border-rose-900/30 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-rose-400" />
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">CURRENT STREAK</span>
            <h3 className={`text-2xl font-extrabold font-mono ${streak_type === "WIN" ? "text-emerald-400" : "text-rose-400"}`}>
              {streak_count} {streak_type === "WIN" ? "Wins" : "Losses"}
            </h3>
            <span className="text-[10px] text-zinc-500 block">Recent performance streak</span>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            streak_type === "WIN"
              ? "bg-emerald-950/20 border-emerald-900/30"
              : "bg-rose-950/20 border-rose-900/30"
          }`}>
            <Flame className={`w-5 h-5 ${streak_type === "WIN" ? "text-emerald-400 animate-pulse" : "text-rose-400"}`} />
          </div>
        </div>

      </div>

      {/* History Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-900">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Detailed Forecast Ledger ({details.length} Days Tracked)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[10px] tracking-wider bg-zinc-950">
                <th className="px-6 py-3.5 font-semibold">Trade Date</th>
                <th className="px-6 py-3.5 text-center font-semibold">Forecasted NQ Bias</th>
                <th className="px-6 py-3.5 text-center font-semibold">Actual Close State</th>
                <th className="px-6 py-3.5 text-right font-semibold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              {details.map((row: any) => (
                <tr
                  key={row.date}
                  onClick={() => {
                    loadReport(row.date);
                    setView("dashboard");
                  }}
                  className="hover:bg-zinc-900/40 cursor-pointer transition"
                  title="Click to view detailed daily analysis report"
                >
                  <td className="px-6 py-4 font-mono font-bold text-zinc-200 text-sm">
                    {formatReportDate(row.date)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      row.predicted === "BULLISH"
                        ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                        : "bg-rose-950/20 text-rose-400 border-rose-900/30"
                    }`}>
                      {row.predicted}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      row.actual === "BULLISH"
                        ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30"
                        : "bg-rose-950/20 text-rose-400 border-rose-900/30"
                    }`}>
                      {row.actual}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${
                      row.result === "WIN"
                        ? "bg-emerald-950 text-emerald-400"
                        : "bg-rose-950 text-rose-400"
                    }`}>
                      {row.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
