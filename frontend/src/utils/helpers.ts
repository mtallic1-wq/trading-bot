export const pct = (v: any, d = 2) => {
  const n = parseFloat(v);
  return isNaN(n) ? "—" : (n > 0 ? "+" : "") + n.toFixed(d) + "%";
};

export const chgCls = (v: any) => {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return "text-gray-400";
  return n > 0 ? "text-emerald-400 font-medium" : "text-rose-400 font-medium";
};

export const num = (v: any) => {
  return v === null || v === undefined || v === "?" || v === "" ? "—" : v;
};

export const fmt = (v: any) => {
  return !v || v === "None" ? "—" : v;
};

export const biasCls = (b: string) => {
  const u = (b || "").toUpperCase();
  if (u.includes("BULL") || u.includes("BUY")) return "text-emerald-400";
  if (u.includes("BEAR") || u.includes("SELL")) return "text-rose-400";
  return "text-amber-400";
};

export const sideCls = (s: string) => {
  const u = (s || "").toUpperCase();
  if (u.includes("BUY") || u.includes("BULL")) return "bull";
  if (u.includes("SELL") || u.includes("BEAR")) return "bear";
  return "neutral";
};

export const badgeCls = (s: string) => {
  const u = (s || "").toUpperCase();
  if (u.includes("BUY") || u.includes("BULL"))
    return "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20";
  if (u.includes("SELL") || u.includes("BEAR"))
    return "bg-rose-950/40 text-rose-400 border border-rose-500/20";
  return "bg-amber-950/40 text-amber-400 border border-amber-500/20";
};

export const badgeLbl = (s: string) => {
  const u = (s || "").toUpperCase();
  if (u.includes("BUY")) return "BUY";
  if (u.includes("SELL")) return "SELL";
  return "NEU";
};

export const macroSig = (label: string, dc: number, price: any): [string, string] => {
  const d = parseFloat(dc as any) || 0;
  const p = parseFloat(price as any) || 0;
  
  if (label.includes("DXY")) {
    return d > 0.3 ? ["USD STRONG", "bg-rose-950/30 text-rose-400 border-rose-500/20"] : d < -0.3 ? ["USD WEAK", "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"] : ["Neutral", "bg-slate-900 text-slate-400 border-slate-800"];
  }
  if (label.includes("VIX")) {
    return p > 20 || d > 3 ? ["FEAR HIGH", "bg-rose-950/30 text-rose-400 border-rose-500/20"] : d < -3 ? ["Fear Low", "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"] : ["Neutral", "bg-slate-900 text-slate-400 border-slate-800"];
  }
  if (label.includes("10Y") || label.includes("Treasury")) {
    return d > 2 ? ["YIELDS UP", "bg-amber-950/30 text-amber-400 border-amber-500/20"] : d < -2 ? ["Yields Down", "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"] : ["Neutral", "bg-slate-900 text-slate-400 border-slate-800"];
  }
  if (label.includes("Gold")) {
    return d > 0.5 ? ["Safe Haven", "bg-amber-950/30 text-amber-400 border-amber-500/20"] : d < -0.5 ? ["Risk-On", "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"] : ["Neutral", "bg-slate-900 text-slate-400 border-slate-800"];
  }
  if (label.includes("Oil") || label.includes("Crude")) {
    return d > 1.5 ? ["OIL UP", "bg-amber-950/30 text-amber-400 border-amber-500/20"] : d < -1.5 ? ["Oil Down", "bg-emerald-950/30 text-emerald-400 border-emerald-500/20"] : ["Neutral", "bg-slate-900 text-slate-400 border-slate-800"];
  }
  return ["", "bg-slate-900 text-slate-400 border-slate-800"];
};

export const extractConf = (t: any): number | null => {
  if (typeof t === "number") return t;
  if (!t || typeof t !== "string") return null;
  const m = t.match(/Confidence[\s*:]+(\d+)\s*%/i) || t.match(/\|\s*(\d+)\s*%\s*\|\s*(?:HIGH|MEDIUM|LOW)/i);
  return m ? parseInt(m[1], 10) : null;
};

export function parseAnalysis(raw: string): string {
  if (!raw) return "";
  let t = raw.replace(/\r\n/g, "\n");

  // Clean markdown horizontal rules
  t = t.replace(/^---$/gm, '<hr class="border-zinc-800/80 my-4" />');

  // Convert markdown tables
  t = t.replace(/((?:^\|.+\|\n?)+)/gm, (block) => {
    const lines = block.trim().split("\n").filter((l) => l.trim());
    if (lines.length < 2) return block;
    const isSep = (l: string) => /^\|[-:| ]+\|$/.test(l.trim());
    const parseRow = (l: string, tag: string) => {
      const cells = l.split("|").slice(1, -1);
      return (
        '<tr class="border-b border-zinc-850/60 last:border-0 hover:bg-zinc-900/30 transition-colors">' +
        cells
          .map((c, i) => {
            const content = c.trim()
              .replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>')
              .replace(/<br\s*\/?>/gi, "<br />");
            const isHeader = tag === "th";
            const classes = isHeader
              ? "px-3.5 py-2.5 bg-zinc-900/90 text-zinc-300 font-semibold text-[11px] uppercase tracking-wider text-left border-b border-zinc-800"
              : i === 0
              ? "px-3.5 py-2.5 text-zinc-200 font-medium text-xs whitespace-nowrap bg-zinc-900/20"
              : "px-3.5 py-2.5 text-zinc-400 text-xs leading-relaxed";
            return `<${tag} class="${classes}">${content}</${tag}>`;
          })
          .join("") +
        "</tr>"
      );
    };

    let html =
      '<div class="overflow-x-auto my-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 shadow-inner"><table class="w-full border-collapse text-xs text-left">';
    let inBody = false;
    lines.forEach((l) => {
      if (isSep(l)) {
        inBody = true;
        return;
      }
      html += inBody ? parseRow(l, "td") : parseRow(l, "th");
    });
    return html + "</table></div>";
  });

  // Headers (### with optional number badge, and ##)
  t = t.replace(/^### (?:(\d+)\s+)?(.+)$/gm, (_, num, title) => {
    const badge = num ? `<span class="inline-flex items-center justify-center w-5 h-5 rounded-md bg-purple-950/60 border border-purple-800/50 text-purple-300 text-[10px] font-bold mr-2">${num}</span>` : "";
    return `<h3 class="text-xs font-bold uppercase tracking-wider text-zinc-200 mt-6 mb-2.5 flex items-center">${badge}${title}</h3>`;
  });

  t = t.replace(/^## (.+)$/gm, '<h2 class="text-xs font-bold uppercase tracking-wider text-zinc-400 mt-6 mb-3 pb-1.5 border-b border-zinc-800/80">$1</h2>');

  // Bold formatting
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong class="text-zinc-100 font-semibold">$1</strong>');

  // Lists
  t = t.replace(/^- (.+)$/gm, '<li class="my-1 text-zinc-300">$1</li>');
  t = t.replace(/(<li>[^<]*<\/li>\n?)+/g, (m) => '<ul class="list-disc pl-5 my-2 space-y-1">' + m + "</ul>");

  // Paragraphs
  t = t.replace(/\n{3,}/g, "\n\n");
  t = t.replace(/\n\n/g, "</p><p class='mb-2.5 text-zinc-300 leading-relaxed text-xs'>");
  t = t.replace(/^(?!<[h|u|d|t|p|l|hr])(.+)$/gm, "<p class='mb-2.5 text-zinc-300 leading-relaxed text-xs'>$1</p>");

  return t.trim();
}
