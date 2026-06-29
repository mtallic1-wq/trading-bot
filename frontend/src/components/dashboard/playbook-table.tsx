import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import { GripVertical, X, Info } from "lucide-react";

interface PlaybookTableProps {
  playbook: any;
}

export default function PlaybookTable({ playbook }: PlaybookTableProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);
  if (!playbook || playbook.error) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 text-center text-zinc-500 font-sans">
        Volume profile playbook strategy mapping unavailable.
      </div>
    );
  }

  const dayType = playbook.day_type || "RANGE";
  const confidence = playbook.day_confidence || "MEDIUM";
  const strategies = playbook.active_strategies || [];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-sans select-none">
      <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
            Volume Profile Playbook Selection
          </h3>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            Aligned strategies for a {dayType.toLowerCase()} day type ({confidence.toLowerCase()} confidence)
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono uppercase">
          {dayType}
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-zinc-900 hover:bg-transparent">
              <TableHead className="w-10 px-4"></TableHead>
              <TableHead className="w-6 px-0"></TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3">Code</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3">Strategy Name</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3 text-center">Direction</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3 text-center">Win%</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3 text-center">R:R</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3">Entry Setup</TableHead>
              <TableHead className="w-10 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-900/50">
            {strategies.length > 0 ? (
              strategies.map((strat: any) => {
                const isBull = strat.direction === "BUY";
                const isBear = strat.direction === "SELL";
                
                const dirBadge = isBull ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/20 text-emerald-400 border border-emerald-900/30">
                    BUY
                  </span>
                ) : isBear ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/20 text-rose-400 border border-rose-900/30">
                    SELL
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
                    BOTH
                  </span>
                );

                return (
                  <TableRow
                    key={strat.key}
                    onClick={() => setSelectedStrategy(strat)}
                    className="border-b border-zinc-900/40 hover:bg-zinc-900/20 transition cursor-pointer select-none"
                  >
                    <TableCell className="px-4 py-3.5 text-zinc-700" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-zinc-800 bg-zinc-950 accent-zinc-200 cursor-pointer w-3.5 h-3.5" />
                    </TableCell>
                    <TableCell className="px-0 py-3.5 text-zinc-700" onClick={(e) => e.stopPropagation()}>
                      <GripVertical className="w-3.5 h-3.5 opacity-40 cursor-grab" />
                    </TableCell>
                    
                    <TableCell className="font-semibold text-zinc-200 py-3.5 font-mono">{strat.key}</TableCell>
                    <TableCell className="font-semibold text-zinc-300 py-3.5 text-xs">{strat.name}</TableCell>
                    <TableCell className="text-center py-3.5">{dirBadge}</TableCell>
                    <TableCell className="text-center text-zinc-400 font-mono py-3.5 text-xs">{strat.win_rate}</TableCell>
                    <TableCell className="text-center text-zinc-400 font-mono py-3.5 text-xs">{strat.rr}</TableCell>
                    <TableCell className="text-zinc-400 text-xs py-3.5 max-w-xs truncate" title={strat.entry}>
                      {strat.entry}
                    </TableCell>
                    
                    <TableCell className="text-right py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedStrategy(strat)}
                        className="text-zinc-650 hover:text-zinc-300 transition p-1 hover:bg-zinc-900/50 rounded"
                        title="View strategy details"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="px-5 py-6 text-center text-zinc-600">
                  No active strategies matched for this profile.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Strategy Detail Modal popup */}
      {selectedStrategy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div 
            className="fixed inset-0" 
            onClick={() => setSelectedStrategy(null)} 
          />
          <div className="bg-zinc-950 border border-zinc-850 rounded-xl max-w-xl w-full p-6 relative font-sans shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedStrategy(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Header */}
            <div className="flex items-start gap-3 border-b border-zinc-900 pb-4 mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  Strategy Profile · {selectedStrategy.key}
                </span>
                <h3 className="text-base font-bold text-zinc-200">
                  {selectedStrategy.name}
                </h3>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="bg-zinc-900/40 border border-zinc-850/40 p-2.5 rounded-lg text-center">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Direction</span>
                <span className="text-xs font-bold text-zinc-200 mt-1 block">
                  {selectedStrategy.direction}
                </span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-850/40 p-2.5 rounded-lg text-center">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Win Rate</span>
                <span className="text-xs font-bold text-zinc-200 mt-1 block font-mono">
                  {selectedStrategy.win_rate}
                </span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-850/40 p-2.5 rounded-lg text-center">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">R:R Ratio</span>
                <span className="text-xs font-bold text-zinc-200 mt-1 block font-mono">
                  {selectedStrategy.rr}
                </span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-850/40 p-2.5 rounded-lg text-center">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Stop Loss</span>
                <span className="text-xs font-bold text-zinc-200 mt-1 block font-mono">
                  {selectedStrategy.stop || "N/A"}
                </span>
              </div>
            </div>

            {/* Detailed sections */}
            <div className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <h4 className="font-semibold text-zinc-400">Trigger Setup</h4>
                <p className="text-zinc-300 bg-zinc-900/20 border border-zinc-900 p-2.5 rounded-lg leading-relaxed">
                  {selectedStrategy.setup}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-emerald-400">🟢 Bullish Entry Rule</h4>
                  <p className="text-zinc-300 bg-emerald-950/5 border border-emerald-900/10 p-2.5 rounded-lg leading-relaxed">
                    {selectedStrategy.bull_entry || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-rose-400">🔴 Bearish Entry Rule</h4>
                  <p className="text-zinc-300 bg-rose-950/5 border border-rose-900/10 p-2.5 rounded-lg leading-relaxed">
                    {selectedStrategy.bear_entry || "N/A"}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-semibold text-amber-500">⚠️ Invalidation & Kill Switch</h4>
                <p className="text-zinc-300 bg-amber-950/5 border border-amber-900/10 p-2.5 rounded-lg leading-relaxed">
                  {selectedStrategy.kill_switch || "No explicit invalidation trigger."}
                </p>
              </div>

              {selectedStrategy.note && (
                <div className="space-y-1 border-t border-zinc-900 pt-3">
                  <h4 className="font-semibold text-zinc-500 font-mono text-[10px] uppercase">Strategic Note</h4>
                  <p className="text-zinc-400 italic">
                    "{selectedStrategy.note}"
                  </p>
                </div>
              )}

            </div>

            {/* Footer */}
            <button
              onClick={() => setSelectedStrategy(null)}
              className="w-full mt-6 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-lg text-xs transition"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
