import { useState } from "react";
import { BookOpen, Lock, ShieldCheck, CheckCircle, ExternalLink } from "lucide-react";

interface PlaybookPremiumProps {
  hasNqPlaybook: boolean;
  hasEsPlaybook: boolean;
  userEmail: string;
}

export default function PlaybookPremium({ hasNqPlaybook, hasEsPlaybook, userEmail }: PlaybookPremiumProps) {
  const [activeTab, setActiveTab] = useState<"nq" | "es">("nq");
  const nqCheckoutUrl = "https://nqbiasengine.lemonsqueezy.com/checkout/buy/afa17786-dd1c-463b-9ea8-c745ecd3dec5";
  const esCheckoutUrl = "https://nqbiasengine.lemonsqueezy.com/checkout/buy/YOUR_ES_PLAYBOOK_ID"; // placeholder checkout

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* Playbook Header & Tab Selector */}
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

      {/* RENDER NQ PLAYBOOK VIEW */}
      {activeTab === "nq" && (
        <div className="space-y-6">
          {!hasNqPlaybook ? (
            /* Pitch / Lock screen for NQ Playbook */
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-10 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
              
              <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <Lock className="w-5 h-5 text-zinc-400" />
              </div>

              <h3 className="text-lg font-bold text-zinc-100 mb-2">
                NQ Playbook — 6 Strategies · Volume Profile + Order Flow
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl mx-auto leading-relaxed mb-6">
                Master the E-mini Nasdaq (NQ) futures with a fully rules-based playbook. 
                Designed for prop firm traders aiming to pass evaluations, stay disciplined, and avoid overtrading.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={nqCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-semibold transition shadow-md w-full sm:w-auto justify-center"
                >
                  <span>Unlock NQ Playbook PDF — $5</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secure payment processed via Lemon Squeezy</span>
              </div>
            </div>
          ) : (
            /* Unlocked NQ Strategies View */
            <div className="space-y-6">
              <div className="px-4 py-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>NQ Playbook Unlocked! PDF download link sent to: {userEmail || "your inbox"}</span>
              </div>

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

      {/* RENDER ES PLAYBOOK VIEW */}
      {activeTab === "es" && (
        <div className="space-y-6">
          {!hasEsPlaybook ? (
            /* Pitch / Lock screen for ES Playbook */
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-10 text-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
              
              <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                <Lock className="w-5 h-5 text-zinc-400" />
              </div>

              <h3 className="text-lg font-bold text-zinc-100 mb-2">
                ES Options Gamma Playbook — 4 Strategies · Market Maker Flows
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl mx-auto leading-relaxed mb-6">
                Master Options Gamma Exposure (GEX) levels on S&P 500 futures. Design your trades around 
                mandatory dealer hedging rules, positive/negative volatility pivots, and 0DTE magnets.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={esCheckoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-xl text-xs font-semibold transition shadow-md w-full sm:w-auto justify-center"
                >
                  <span>Unlock ES Gamma Playbook PDF — $5</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-zinc-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secure payment processed via Lemon Squeezy</span>
              </div>
            </div>
          ) : (
            /* Unlocked ES Strategies View */
            <div className="space-y-6">
              <div className="px-4 py-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>ES Gamma Playbook Unlocked! PDF download link sent to: {userEmail || "your inbox"}</span>
              </div>

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
