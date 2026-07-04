import { useState, useEffect } from "react";
import { Sliders, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface SettingsFormProps {
  token: string;
}

export default function SettingsForm({ token }: SettingsFormProps) {
  const [email, setEmail] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("08:30");
  const [timezone, setTimezone] = useState("America/New_York");
  const [subStatus, setSubStatus] = useState("free");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: "", type: "" });

  const timezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Karachi",
    "Asia/Dubai",
    "Asia/Singapore"
  ];

  useEffect(() => {
    if (!token) return;
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/settings?token=${token}`);
      if (!res.ok) throw new Error("Settings fetch failed");
      const data = await res.json();
      if (data.success && data.user) {
        setEmail(data.user.email);
        setDeliveryTime(data.user.delivery_time || "08:30");
        setTimezone(data.user.timezone || "America/New_York");
        setSubStatus(data.user.subscription_status || "free");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMsg({ text: "Saving settings...", type: "info" });
    
    try {
      const res = await fetch(`/api/user/settings?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delivery_time: deliveryTime,
          timezone: timezone
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ text: "Settings saved successfully", type: "success" });
        setTimeout(() => setStatusMsg({ text: "", type: "" }), 3000);
      } else {
        throw new Error(data.error || "Save settings failed");
      }
    } catch (err: any) {
      setStatusMsg({ text: `Save failed: ${err.message}`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x", `${x}px`);
    e.currentTarget.style.setProperty("--y", `${y}px`);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="spotlight-card relative overflow-hidden font-sans select-none max-w-xl mx-auto p-5"
    >
      <div className="flex items-center gap-2 border-b border-zinc-900 pb-4 relative z-10 mb-4">
        <Sliders className="w-4 h-4 text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
          Alert Preferences Setup
        </h3>
      </div>
      
      <div className="relative z-10">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Email (Readonly) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-500 font-medium">Registered Email</label>
            <input
              type="text"
              value={email}
              disabled
              className="bg-zinc-900/30 border border-zinc-800/40 text-zinc-400 px-3 py-2 rounded-lg cursor-not-allowed opacity-50 focus:outline-none"
            />
          </div>

          {/* Grid: Delivery Time & Timezone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 font-medium">Delivery Time (Local)</label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="bg-zinc-950/40 border border-zinc-800/80 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-400 font-medium">Your Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="bg-zinc-950/40 border border-zinc-800/80 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition cursor-pointer"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz} className="bg-zinc-950 text-zinc-300">
                    {tz}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Subscriber status flag */}
          <div className="pt-3 border-t border-zinc-900 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-zinc-500">Subscription status</span>
              <span className="text-[11px] text-zinc-300 mt-0.5 capitalize font-semibold">
                {subStatus} Tier Account
              </span>
            </div>
            
            {subStatus === "active" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/20 text-emerald-400 border border-emerald-900/30">
                Premium Active
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-zinc-400 border border-zinc-800">
                Free Tier (No Alerts)
              </span>
            )}
          </div>

          {/* Status Message */}
          {statusMsg.text && (
            <div className={`p-2.5 rounded-lg flex items-center gap-2 border ${
              statusMsg.type === "success" ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30" : 
              statusMsg.type === "error" ? "bg-rose-950/20 text-rose-400 border-rose-900/30" :
              "bg-zinc-900/40 text-zinc-400 border-zinc-800"
            }`}>
              {statusMsg.type === "info" && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {statusMsg.type === "success" && <CheckCircle className="w-3.5 h-3.5" />}
              {statusMsg.type === "error" && <XCircle className="w-3.5 h-3.5" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-2 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Save Settings
          </button>

        </form>
      </div>
    </div>
  );
}
