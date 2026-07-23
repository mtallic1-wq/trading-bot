import { Zap, Sparkles, BookOpen, TrendingUp, Bell, ArrowRight, ShieldCheck, Lock } from "lucide-react";

interface LandingViewProps {
  onSyncClick: () => void;
  onExploreClick: () => void;
  checkoutUrl: string;
}

export default function LandingView({ onSyncClick, onExploreClick, checkoutUrl }: LandingViewProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 md:p-8 space-y-12 font-sans max-w-4xl mx-auto select-none">
      
      {/* 1. HERO SECTION */}
      <div className="text-center space-y-6 max-w-2xl mx-auto pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/30 text-purple-300 border border-purple-900/30 text-[10px] font-semibold tracking-wider uppercase">
          <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
          <span>Institutional Order Flow Intelligence</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-purple-300 to-indigo-100 leading-tight">
          Trade Nasdaq Futures with a Rules-Based Edge
        </h1>

        <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
          Educational pre-market bias analysis, daily Volume Profile study setups, and S&P 500 options dealer-hedging levels — delivered to your inbox before the opening bell for market study and research.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-100 rounded-xl text-xs font-bold transition shadow-lg hover:shadow-purple-500/10"
          >
            <Zap className="w-4 h-4 fill-current text-purple-200" />
            <span>Unlock Premium Access</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onSyncClick}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl text-xs font-bold transition"
          >
            <span>Sync Email / Sign In</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-6 pt-2 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secure Lemon Squeezy Checkout</span>
          </div>
          <span>•</span>
          <button 
            onClick={onExploreClick}
            className="hover:text-purple-400 transition underline font-medium"
          >
            Explore Free Preview
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC MOCK REPORT PREVIEW */}
      <div className="bg-zinc-950/80 border border-zinc-900 rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-950/5 via-transparent to-indigo-950/5 pointer-events-none" />
        
        {/* Mock Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-400">NASDAQ (NQ) PRE-MARKET REPORT</span>
              <span className="text-[10px] text-purple-400 font-mono font-semibold animate-pulse">● LIVE EDITION</span>
            </div>
            <h2 className="text-lg font-bold text-zinc-200">Daily Forecast & Option Boundaries</h2>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">Session Date: Today's Market Open</div>
        </div>

        {/* Mock Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block">Directional Bias</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-emerald-400 font-mono uppercase">BULLISH BIAS</span>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block">Volatility Regime</span>
            <span className="text-sm font-bold text-zinc-200 font-mono">POSITIVE GAMMA (STABLE)</span>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-4 space-y-1">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold block">Key Option Pivot</span>
            <span className="text-sm font-bold text-purple-400 font-mono">SPX 5,450.00 (FLIP)</span>
          </div>
        </div>

        {/* Locked Preview Overlay */}
        <div className="border border-zinc-900 rounded-xl p-5 bg-zinc-900/20 relative overflow-hidden text-center space-y-4 py-8">
          <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Premium Educational Analysis Locked</h4>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Detailed reference levels, VAH/VAL study conditions, SPX Call Wall and Put Wall zones, and daily AI analysis breakdowns are hidden.
            </p>
          </div>
          <a
            href={checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-zinc-100 rounded-lg text-[10px] font-bold transition shadow-md"
          >
            <span>Subscribe to Unlock Plan</span>
          </a>
        </div>
      </div>

      {/* 3. CORE BENEFITS SECTION */}
      <div className="space-y-6 pt-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-zinc-100">Engine Features</h2>
          <p className="text-xs text-zinc-500">Every tool you need to stay on the right side of the daily index trends</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-2 hover:border-zinc-800 transition">
            <div className="w-7 h-7 rounded-lg bg-cyan-950/20 border border-cyan-900/30 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Algorithmic Pre-Market Bias</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Computes net NYSE pressure and order flow deltas every morning to determine if the bias favors buyers or sellers before the open.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-2 hover:border-zinc-800 transition">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Dealer Gamma Exposure</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Tracks SPX options structure including Call Wall, Put Wall, and Zero-Gamma flip levels to identify institutional market pivots.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-2 hover:border-zinc-800 transition">
            <div className="w-7 h-7 rounded-lg bg-purple-950/20 border border-purple-900/30 flex items-center justify-center text-purple-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">10 Strategy Study Playbooks</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Learn from our educational Volume Profile and Option Gamma study manuals featuring detailed analysis notes and example scenarios.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-2 hover:border-zinc-800 transition">
            <div className="w-7 h-7 rounded-lg bg-amber-950/20 border border-amber-900/30 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">SMS & Email Delivery</h3>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Never miss an update. Forecasts and daily playbooks are pushed directly to your registered email and WhatsApp numbers.
            </p>
          </div>
        </div>
      </div>

      {/* 4. DISCLAIMER FOOTER */}
      <div className="border-t border-zinc-900 pt-6 mt-4">
        <p className="text-[10px] text-zinc-600 leading-relaxed text-center max-w-2xl mx-auto">
          <span className="font-semibold text-zinc-500">For educational and informational purposes only. Not financial advice.</span> All content is general market analysis and study material based on publicly available data. We do not provide personalized investment advice, do not execute trades, and do not hold or manage customer funds. Trading futures and options involves substantial risk of loss. You are solely responsible for your own trading decisions. Past performance is not indicative of future results.
        </p>
      </div>

    </div>
  );
}
