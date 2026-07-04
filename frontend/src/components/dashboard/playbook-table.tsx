import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import { X, Info, Lock } from "lucide-react";

interface PlaybookTableProps {
  playbook: any;
  hasNqPlaybook: boolean;
  setView?: (view: any) => void;
}

export default function PlaybookTable({ playbook, hasNqPlaybook, setView }: PlaybookTableProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<any | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x", `${x}px`);
    e.currentTarget.style.setProperty("--y", `${y}px`);
  };

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
    <div 
      onMouseMove={handleMouseMove}
      className="spotlight-card relative overflow-hidden font-sans select-none p-5"
    >
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
              <TableHead className="text-zinc-500 font-medium text-xs py-3 pl-4">Code</TableHead>
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

                const isHighWin = strat.win_rate && (strat.win_rate.includes("70") || strat.win_rate.includes("80") || strat.win_rate.includes("90"));
                const winBadge = isHighWin ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/20 text-emerald-400 border border-emerald-900/20 font-mono">
                    {strat.win_rate}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900/40 text-zinc-400 border border-zinc-800/40 font-mono">
                    {strat.win_rate}
                  </span>
                );

                const isHighRR = strat.rr && (strat.rr.includes("1:2") || strat.rr.includes("1:3") || strat.rr.includes("1:4") || strat.rr.includes("1:5") || strat.rr.includes("1:6"));
                const rrBadge = isHighRR ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/20 text-purple-400 border border-purple-900/20 font-mono">
                    {strat.rr}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900/40 text-zinc-400 border border-zinc-800/40 font-mono">
                    {strat.rr}
                  </span>
                );

                return (
                  <TableRow
                    key={strat.key}
                    onClick={() => setSelectedStrategy(strat)}
                    className="border-b border-zinc-900/40 hover:bg-zinc-900/20 transition cursor-pointer select-none"
                  >
                    <TableCell className="font-semibold text-zinc-200 py-3.5 font-mono pl-4">{strat.key}</TableCell>
                    <TableCell className="font-semibold text-zinc-300 py-3.5 text-xs">{strat.name}</TableCell>
                    <TableCell className="text-center py-3.5">{dirBadge}</TableCell>
                    <TableCell className="text-center py-3.5">{winBadge}</TableCell>
                    <TableCell className="text-center py-3.5">{rrBadge}</TableCell>
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

      {createPortal(
        <AnimatePresence>
          {selectedStrategy && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto bg-black/55 backdrop-blur-sm p-4 flex justify-center items-start pt-10 md:pt-20"
            >
              <div 
                className="fixed inset-0 -z-10" 
                onClick={() => setSelectedStrategy(null)} 
              />
              {!hasNqPlaybook ? (
                /* Locked Premium Upgrade Card */
                <motion.div 
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  className="bg-zinc-950 border border-zinc-850 rounded-xl max-w-sm w-full p-6 relative font-sans shadow-2xl z-10 text-center space-y-4"
                >
                  <button
                    onClick={() => setSelectedStrategy(null)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-purple-400" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                      Strategy Locked · {selectedStrategy.key}
                    </span>
                    <h3 className="text-sm font-bold text-zinc-200">
                      {selectedStrategy.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 leading-relaxed pt-2">
                      Detailed trigger rules, exact execution zones, stop placements, targets, and invalidation kill switches are locked. Upgrade to **NQ Bias Premium** to unlock this setup and the full playbook library.
                    </p>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      onClick={() => {
                        setSelectedStrategy(null);
                        setView && setView("playbook");
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-100 rounded-lg text-xs font-semibold transition shadow-md"
                    >
                      Upgrade to Premium
                    </button>
                    <button
                      onClick={() => setSelectedStrategy(null)}
                      className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg text-xs transition"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Unlocked Strategy Detail Content */
                <motion.div 
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  className="bg-zinc-950/95 border-beam-active rounded-xl max-w-xl w-full relative font-sans shadow-2xl z-10 backdrop-blur-xl p-6 space-y-5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-zinc-900 pb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Strategy Profile · {selectedStrategy.key}
                      </span>
                      <h3 className="text-base font-bold text-zinc-200">
                        {selectedStrategy.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedStrategy(null)}
                      className="text-zinc-500 hover:text-zinc-300 transition p-1 hover:bg-zinc-900 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedStrategy(null)}
                    className="w-full mt-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                  >
                    Close Details
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
