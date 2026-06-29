import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../ui/table";
import { MoreHorizontal, GripVertical } from "lucide-react";

interface PlaybookTableProps {
  playbook: any;
}

export default function PlaybookTable({ playbook }: PlaybookTableProps) {
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
                  <TableRow key={strat.key} className="border-b border-zinc-900/40 hover:bg-zinc-900/10 transition">
                    <TableCell className="px-4 py-3.5 text-zinc-700">
                      <input type="checkbox" className="rounded border-zinc-800 bg-zinc-950 accent-zinc-200 cursor-pointer w-3.5 h-3.5" />
                    </TableCell>
                    <TableCell className="px-0 py-3.5 text-zinc-700">
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
                    
                    <TableCell className="text-right py-3.5">
                      <button className="text-zinc-600 hover:text-zinc-300 transition">
                        <MoreHorizontal className="w-4 h-4" />
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
    </div>
  );
}
