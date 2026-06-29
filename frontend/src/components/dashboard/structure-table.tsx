import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import { MoreHorizontal, GripVertical } from "lucide-react";
import { num } from "../../utils/helpers";

interface StructureTableProps {
  priceAction: any;
}

export default function StructureTable({ priceAction }: StructureTableProps) {
  if (!priceAction || priceAction.error) {
    return (
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-6 text-center text-zinc-500 font-sans">
        Price action structure is currently offline or unavailable.
      </div>
    );
  }

  const timeframes = priceAction.timeframes || {};
  const tfOrder = ["Daily", "4H", "1H", "15m"];

  // Helper to format status badges matching screenshot
  const renderStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "BULLISH") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/20 text-emerald-400 border border-emerald-900/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Bullish
        </span>
      );
    }
    if (s === "BEARISH") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-950/20 text-rose-400 border border-rose-900/30">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-450" />
          Bearish
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-850">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
        Ranging
      </span>
    );
  };

  return (
    <div className="bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden font-sans select-none">
      <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-150 uppercase tracking-wider">
            Multi-Timeframe Structure (Gen1 PA)
          </h3>
          <span className="text-[10px] text-zinc-500 mt-1 block">
            Top-down price swings, breaks, and shifts
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
          Bias Score: {priceAction.score_pct}%
        </span>
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-zinc-900 hover:bg-transparent">
              <TableHead className="w-10 px-4"></TableHead>
              <TableHead className="w-6 px-0"></TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3">Timeframe</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3">Structure</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3">Price</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3 text-right">Resistance / Support</TableHead>
              <TableHead className="text-zinc-500 font-medium text-xs py-3 text-right">Structural Shifts</TableHead>
              <TableHead className="w-10 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-zinc-900/50">
            {tfOrder.map((tfLabel) => {
              const data = timeframes[tfLabel];
              if (!data) return null;

              const structure = data.structure || "RANGING";
              const current = data.current || "—";
              const res = data.resistance || "—";
              const sup = data.support || "—";
              
              // Shift details
              let shiftLabel = "No Shifts Detected";
              let shiftColor = "text-zinc-500";
              if (data.choch) {
                shiftLabel = `CHoCH (${data.choch.level})`;
                shiftColor = data.choch.direction === "BULLISH" ? "text-emerald-400" : "text-rose-400";
              } else if (data.bos) {
                shiftLabel = `BOS (${data.bos.level})`;
                shiftColor = data.bos.direction === "BULLISH" ? "text-emerald-400" : "text-rose-400";
              }

              return (
                <TableRow key={tfLabel} className="border-b border-zinc-900/40 hover:bg-zinc-900/10 transition">
                  {/* Mock Drag handles & Checkboxes matching user screenshot */}
                  <TableCell className="px-4 py-3.5 text-zinc-700">
                    <input type="checkbox" className="rounded border-zinc-800 bg-zinc-950 accent-zinc-200 cursor-pointer w-3.5 h-3.5" />
                  </TableCell>
                  <TableCell className="px-0 py-3.5 text-zinc-700">
                    <GripVertical className="w-3.5 h-3.5 opacity-40 cursor-grab" />
                  </TableCell>
                  
                  {/* Values */}
                  <TableCell className="font-semibold text-zinc-200 py-3.5">{tfLabel}</TableCell>
                  <TableCell className="py-3.5">{renderStatusBadge(structure)}</TableCell>
                  <TableCell className="font-mono text-zinc-300 py-3.5">{num(current)}</TableCell>
                  
                  <TableCell className="text-right font-mono py-3.5">
                    <span className="text-rose-400">{num(res)}</span>
                    <span className="text-zinc-700 px-1.5">|</span>
                    <span className="text-emerald-400">{num(sup)}</span>
                  </TableCell>
                  
                  <TableCell className={`text-right font-medium py-3.5 text-xs ${shiftColor}`}>
                    {shiftLabel}
                  </TableCell>
                  
                  <TableCell className="text-right py-3.5">
                    <button className="text-zinc-600 hover:text-zinc-300 transition">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
