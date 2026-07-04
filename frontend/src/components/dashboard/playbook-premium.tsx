import { useState } from "react";
import { BookOpen, Lock, ShieldCheck, CheckCircle, ExternalLink, Sparkles, Zap } from "lucide-react";

interface PlaybookPremiumProps {
  hasPremium: boolean;
  hasNqPlaybook: boolean;
  hasEsPlaybook: boolean;
  userEmail: string;
}

export default function PlaybookPremium({ hasPremium, hasNqPlaybook, hasEsPlaybook, userEmail }: PlaybookPremiumProps) {
  const [activeTab, setActiveTab] = useState<"nq" | "es">("nq");
  
  // Unified premium subscription checkout link
  const premiumCheckoutUrl = "https://nqbiasengine.lemonsqueezy.com/checkout/buy/a34c11f9-068e-4b0f-a2bb-f163e729d7a2";

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans select-none">
      
      {/* 1. PREMIUM BENEFITS CARD (UPSell Banner for Free Tier) */}
      {!hasPremium ? (
        <div className="relative overflow-hidden rounded-2xl border border-purple-900/30 bg-zinc-950 p-6 md:p-8 shadow-2xl flex flex-col md:flex-row gap-6 md:gap-8 items-stretch justify-between">
          <div className="absolute top-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -z-10" />
          
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <h2 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>NQ Bias Engine Premium</span>
              </h2>
              <h3 className="text-xl font-extrabold text-zinc-100 tracking-tight">
                Unlock Complete Pre-Market Dominance
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                Get full instant access to all rules-based execution playbooks, advanced market predictions, and custom AI tools. Aligned for professional prop-firm risk limits.
              </p>
            </div>

            {/* Benefit Grid List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-300">
              <div className="flex items-start gap-2.5">
                <div className="w-4.5 h-4.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-200 text-[11px]">NQ Volume Profile Playbook</h4>
                  <span className="text-[10px] text-zinc-500 block leading-tight">6 setups with exact triggers & stop-loss rules.</span>
                </div>
              </div>
              
              <div className="flex items-start gap-2.5">
                <div className="w-4.5 h-4.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-200 text-[11px]">ES Options Gamma Playbook</h4>
                  <span className="text-[10px] text-zinc-500 block leading-tight">4 MM flow setups (Compression, GEX runs, etc.)</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4.5 h-4.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-200 text-[11px]">Daily AI Premarket Planner</h4>
                  <span className="text-[10px] text-zinc-500 block leading-tight">LLM premarket trade plans built around option boundaries.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4.5 h-4.5 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-zinc-200 text-[11px]">AI Prediction Matrix</h4>
                  <span className="text-[10px] text-zinc-500 block leading-tight">Multi-model LLM predictions and news digests.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Block */}
          <div className="md:w-64 flex flex-col justify-center items-center p-5 bg-zinc-900/60 border border-zinc-900 rounded-xl space-y-3 shrink-0 select-none">
            <div className="text-center">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Unified Access</span>
              <div className="flex items-baseline justify-center gap-1 mt-1">
                <span className="text-2xl font-black text-zinc-100">$5</span>
                <span className="text-[10px] text-zinc-500 font-mono">/ month</span>
              </div>
            </div>
            
            <a
              href={premiumCheckoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-zinc-100 rounded-xl text-xs font-bold transition shadow-lg"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Unlock Premium Access</span>
            </a>

            <div className="flex items-center justify-center gap-1.5 text-[9px] text-zinc-500">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Processed by Lemon Squeezy</span>
            </div>
          </div>
        </div>
      ) : (
        /* Premium Member Active Notification */
        <div className="px-5 py-4 rounded-xl bg-purple-950/20 border border-purple-900/30 text-purple-300 text-xs flex items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            <span><strong>Premium Account Active!</strong> You have unlocked full access to all playbooks, AI prediction engines, and trading planners.</span>
          </div>
          {userEmail && <span className="text-[10px] text-purple-500 font-mono">{userEmail}</span>}
        </div>
      )}

      {/* 2. TAB SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-4 gap-4 select-none">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <span>Playbook Library</span>
          </h2>
          <span className="text-[11px] text-zinc-500 block">
            Rules-based strategy manuals for prop firm trading and index futures.
          </span>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 self-start sm:self-center">
          <button
            onClick={() => setActiveTab("nq")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === "nq" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span>NQ Volume Profile</span>
            {!hasNqPlaybook && <Lock className="w-3 h-3 text-zinc-500" />}
          </button>
          <button
            onClick={() => setActiveTab("es")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeTab === "es" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span>ES Options Gamma</span>
            {!hasEsPlaybook && <Lock className="w-3 h-3 text-zinc-500" />}
          </button>
        </div>
      </div>

      {/* 3. NQ PLAYBOOK STRATEGIES */}
      {activeTab === "nq" && (
        <div className="space-y-6">
          {!hasNqPlaybook ? (
            /* Lock teaser specifically for NQ strategies */
            <div className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 p-8 text-center space-y-4 select-none">
              <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center">
                <Lock className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-zinc-200 uppercase">NQ Playbook Locked</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Detailed trigger rules, exact execution zones, stop placements, targets, and invalidation kill switches are locked. Subscribe to **Premium** to unlock.
                </p>
              </div>
              <a
                href={premiumCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-205 border border-zinc-800 rounded-xl text-xs font-semibold transition"
              >
                <span>Subscribe to Unlock</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            /* Unlocked NQ Strategies */
            <div className="space-y-6">
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
          )}
        </div>
      )}

      {/* 4. ES PLAYBOOK STRATEGIES */}
      {activeTab === "es" && (
        <div className="space-y-6">
          {!hasEsPlaybook ? (
            /* Lock teaser specifically for ES strategies */
            <div className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-950 p-8 text-center space-y-4 select-none">
              <div className="mx-auto w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-850 flex items-center justify-center">
                <Lock className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h4 className="text-sm font-bold text-zinc-200 uppercase">ES Gamma Playbook Locked</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Detailed dealer hedging triggers, setup invalidations, stops, and execution note rules are locked. Subscribe to **Premium** to unlock.
                </p>
              </div>
              <a
                href={premiumCheckoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 rounded-xl text-xs font-semibold transition"
              >
                <span>Subscribe to Unlock</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ) : (
            /* Unlocked ES Strategies */
            <div className="space-y-6">
              {/* G1 */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                    Strategy G1 — Volatility Compression Fade
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 font-semibold font-mono">65-70% WIN RATE</span>
                </div>
                <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                  <p><strong>Setup Condition:</strong> Spot is above the Zero-Gamma Flip level (Positive Gamma zone). Price pushes into the Call Wall (ceiling) or Put Wall (floor) on the option grid.</p>
                  <p><strong>Entry Trigger:</strong> Wait for a touch/overshoot of the wall followed by bid/ask absorption on the footprint chart. Enter on the candle reversal closing back inside the range.</p>
                  <p><strong>Target:</strong> Target the Zero-Gamma Flip level or the 0DTE Magnet strike.</p>
                  <p><strong>Kill Switch:</strong> A 15-minute close outside the wall boundary invalidates the range; cut the trade immediately.</p>
                </div>
              </div>

              {/* G2 */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                    Strategy G2 — Zero-Gamma Flip Switch
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 font-semibold font-mono">1:2 - 1:3 R:R TARGET</span>
                </div>
                <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                  <p><strong>Setup Condition:</strong> S&P 500 spot price crosses and closes past the Gamma Flip level. Below expands volatility (Negative Gamma); above compresses it (Positive Gamma).</p>
                  <p><strong>Entry Trigger:</strong> Go short on a break and successful retest of the Flip from below. Go long on a break and successful retest of the Flip from above.</p>
                  <p><strong>Target:</strong> Opposite walls (e.g. if flipping down, target is Put Wall. If flipping up, target is Call Wall).</p>
                  <p><strong>Kill Switch:</strong> A candle close returning back across the Flip level invalidates the setup.</p>
                </div>
              </div>

              {/* G3 */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                    Strategy G3 — The Negative Gamma Run
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 font-semibold font-mono">55-60% WIN RATE</span>
                </div>
                <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                  <p><strong>Setup Condition:</strong> Spot is below the Gamma Flip and the Put Wall has failed. Volatility expands; dealers are forced to sell dips to remain delta-hedged.</p>
                  <p><strong>Entry Trigger:</strong> Short breakdowns of key minor support levels or sell pullbacks to the VWAP/9 EMA. Do not fade or buy support.</p>
                  <p><strong>Target:</strong> Psychological strike targets at every 25/50 S&P index points.</p>
                  <p><strong>Kill Switch:</strong> Exit shorts immediately if price climbs back above the broken Put Wall strike.</p>
                </div>
              </div>

              {/* G4 */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                    Strategy G4 — The 0DTE Magnet Pin
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 font-semibold font-mono">70-75% WIN RATE</span>
                </div>
                <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
                  <p><strong>Setup Condition:</strong> Same-day expiration (0DTE) in the final 2 hours of the NYSE session (after 14:00 ET). Spot is within 10-12 points of the 0DTE Magnet strike.</p>
                  <p><strong>Entry Trigger:</strong> Trade directionally towards the magnet strike. Sell range options (iron butterflies) centered at the magnet strike once the price reaches it.</p>
                  <p><strong>Target:</strong> Exact `0dte_magnet` strike price.</p>
                  <p><strong>Kill Switch:</strong> A sudden macro news spike driving price more than 15 points away from the magnet in the final hour.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
