import { BookOpen, Lock, ShieldCheck, CheckCircle, ExternalLink } from "lucide-react";

interface PlaybookPremiumProps {
  hasPlaybook: boolean;
  userEmail: string;
}

export default function PlaybookPremium({ hasPlaybook, userEmail }: PlaybookPremiumProps) {
  const checkoutUrl = "https://nqbiasengine.lemonsqueezy.com/checkout/buy/afa17786-dd1c-463b-9ea8-c745ecd3dec5";

  if (!hasPlaybook) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 p-1 font-sans select-none">
        
        {/* Pitch Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-10 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
            <Lock className="w-5 h-5 text-zinc-400" />
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight mb-3">
            NQ Playbook — 6 Strategies · Volume Profile + Order Flow
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl mx-auto leading-relaxed mb-6">
            Master the E-mini Nasdaq (NQ) futures with a fully backtested, rules-based playbook. 
            Designed for prop firm traders aiming to pass evaluations, stay disciplined, and avoid overtrading.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-semibold transition shadow-md w-full sm:w-auto justify-center"
            >
              <span>Unlock Playbook PDF — $5</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure payment processed via Lemon Squeezy</span>
          </div>
        </div>

        {/* What's Included / Strategy Cards */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">
            What's inside the playbook:
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-mono">STRATEGY R1</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">REVERSAL</span>
              </div>
              <h4 className="text-sm font-semibold text-zinc-200">Value Area Edge Fade</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Learn how to trade reversals at the Value Area High (VAH) and Value Area Low (VAL) using order flow delta and absorption signals.
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-mono">STRATEGY R2</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">ACCEPTANCE</span>
              </div>
              <h4 className="text-sm font-semibold text-zinc-200">The 80% Rule</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Understand how to capture high-probability moves from one end of value to the other when price accepts back inside the prior day's range.
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-mono">STRATEGY MY-R</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">RANGE BOUND</span>
              </div>
              <h4 className="text-sm font-semibold text-zinc-200">Big Balance Extreme Fade</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Fade multi-day composite range extremes with high risk-to-reward metrics. Key rules to identify true breakouts vs. false breaks.
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-mono">STRATEGY T1</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">TREND DAY</span>
              </div>
              <h4 className="text-sm font-semibold text-zinc-200">Trend Day Continuation</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Identify trend days early and safely join the momentum on pullbacks using Initial Balance (IB) breakout rules.
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-mono">STRATEGY T2</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">REVERSAL</span>
              </div>
              <h4 className="text-sm font-semibold text-zinc-200">Failed Auction Reversal</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Trade traps and failures where buyers/sellers exhaust themselves beyond range extremes, triggering fast momentum unwind moves.
              </p>
            </div>

            <div className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 font-mono">BONUS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">RISK</span>
              </div>
              <h4 className="text-sm font-semibold text-zinc-200">Drawdown & Scale Management</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Complete scaling structures to build size safely and protect daily drawdown limits during evaluation tests.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- Purchase Verified View ---
  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-900 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>NQ Playbook — Strategy Library</span>
          </h2>
          <span className="text-xs text-zinc-500 mt-1 block">
            Thank you for purchasing! Your one-time access is verified ({userEmail}).
          </span>
        </div>
        
        {/* PDF Download Info */}
        <div className="mt-3 sm:mt-0 px-3 py-1.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>PDF download link sent to your email inbox!</span>
        </div>
      </div>

      {/* Premium Content Body */}
      <div className="space-y-6">
        
        {/* R1 */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Strategy R1 — Value Area Edge Fade
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/30 text-cyan-400 border border-cyan-900/30 font-semibold font-mono">60-70% WIN RATE</span>
          </div>
          <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
            <p><strong>Setup Condition:</strong> Price opens inside yesterday's Value Area or moves into it. As price approaches VAH (Value Area High) or VAL (Value Area Low), watch for absorption/exhaustion.</p>
            <p><strong>Entry Trigger:</strong> Wait for a clear delta shift/divergence on your footprint chart or CVD (Cumulative Volume Delta) flip. A tape speed acceleration followed by an absorption block is the primary sign of reversal.</p>
            <p><strong>Target:</strong> Target POC (Point of Control) first. If momentum stays in your favor, hold for the opposite side of the value area (e.g. VAL to VAH).</p>
            <p><strong>Kill Switch:</strong> If price consolidates at the edge for 15+ minutes with positive/negative delta building with the breakout direction, exit immediately. This indicates a breakout attempt rather than a reversal.</p>
          </div>
        </div>

        {/* R2 */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Strategy R2 — The 80% Rule
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/30 text-cyan-400 border border-cyan-900/30 font-semibold font-mono">70-80% WIN RATE</span>
          </div>
          <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
            <p><strong>Setup Condition:</strong> Market opens outside yesterday's Value Area (either above VAH or below VAL). Wait for price to cross back inside the value area boundary.</p>
            <p><strong>Entry Trigger:</strong> Enter on a successful retest of the value area line from the inside. A 15-minute bar must close inside the value area boundary to confirm acceptance before taking the trade.</p>
            <p><strong>Target:</strong> Opposite value area boundary (e.g., if price accepted below VAH, the target is VAL).</p>
            <p><strong>Kill Switch:</strong> Close the trade if price crosses back outside the entry boundary (VAH/VAL) and registers consecutive closes on the 5-minute chart.</p>
          </div>
        </div>

        {/* MY-R */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Strategy MY-R — Big Balance Extreme Fade
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-950/30 text-cyan-400 border border-cyan-900/30 font-semibold font-mono">1:3+ R:R TARGET</span>
          </div>
          <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
            <p><strong>Setup Condition:</strong> Identify a multi-day (3-to-10 day) composite balance zone. Wait for price to reach the extreme highs/lows of this composite range.</p>
            <p><strong>Entry Trigger:</strong> Look for failed breakouts. Price must print outside the range and immediately snap back inside on high volume (stop run). Enter on the pullback/retest of the range extreme.</p>
            <p><strong>Target:</strong> Composite POC or the opposite end of the composite balance range for swing trades.</p>
            <p><strong>Kill Switch:</strong> A 30-minute block close outside the composite range extreme invalidates the setup.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
