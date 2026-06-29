import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Calendar, Newspaper } from "lucide-react";
import { fmt } from "../../utils/helpers";

interface NewsFeedProps {
  yahooNews: any[];
  tvNews: any[];
  calendar: any[];
}

export default function NewsFeed({ yahooNews = [], tvNews = [], calendar = [] }: NewsFeedProps) {
  const [activeNewsTab, setActiveNewsTab] = useState<"yahoo" | "tradingview">("yahoo");

  const newsItems = activeNewsTab === "yahoo" ? yahooNews : tvNews;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-sans select-none">
      
      {/* 1. Economic Calendar */}
      <Card className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-zinc-900 flex flex-row items-center gap-2">
          <Calendar className="w-4 h-4 text-zinc-400" />
          <CardTitle className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
            Economic Calendar Releases
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-72 w-full">
            <div className="p-4 space-y-3">
              {calendar && calendar.filter(e => e.title).length > 0 ? (
                calendar
                  .filter(e => e.title)
                  .map((evt, idx) => {
                    const impactNum = parseInt(evt.impact) || 0;
                    const impactColor = 
                      impactNum >= 3 ? "bg-rose-500 shadow-rose-500/20" : 
                      impactNum >= 2 ? "bg-amber-500 shadow-amber-500/20" : 
                      "bg-zinc-700";

                    return (
                      <div key={idx} className="p-3 bg-zinc-900/40 border border-zinc-900 rounded-lg flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${impactColor}`} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-zinc-200 truncate">{evt.title}</span>
                            <span className="text-[10px] text-zinc-500 mt-0.5">{evt.country || "US"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px] text-right shrink-0">
                          <div className="flex flex-col">
                            <span className="text-zinc-300 font-semibold">{fmt(evt.actual)}</span>
                            <span className="text-zinc-600 text-[9px] uppercase">Actual</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-zinc-500">{fmt(evt.forecast)}</span>
                            <span className="text-zinc-600 text-[9px] uppercase">Forecast</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center text-zinc-600 text-xs py-8">
                  No economic releases listed.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 2. News Headings */}
      <Card className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-zinc-900 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-zinc-400" />
            <CardTitle className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              Market Sentiment News
            </CardTitle>
          </div>
          {/* Tabs header selector */}
          <div className="flex bg-zinc-900 border border-zinc-800 rounded p-0.5">
            <button
              onClick={() => setActiveNewsTab("yahoo")}
              className={`px-2 py-0.5 text-[9px] font-medium rounded transition ${
                activeNewsTab === "yahoo" ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Yahoo
            </button>
            <button
              onClick={() => setActiveNewsTab("tradingview")}
              className={`px-2 py-0.5 text-[9px] font-medium rounded transition ${
                activeNewsTab === "tradingview" ? "bg-zinc-800 text-zinc-200" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              TradingView
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-72 w-full">
            <div className="p-4 space-y-2">
              {newsItems && newsItems.length > 0 ? (
                newsItems.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-3 hover:bg-zinc-900/30 border border-transparent hover:border-zinc-900 rounded-lg transition"
                  >
                    <span className="text-xs font-semibold text-zinc-200 hover:text-zinc-100 transition line-clamp-2 leading-relaxed">
                      {item.title}
                    </span>
                    <div className="flex items-center justify-between mt-2 text-[9px] text-zinc-500 font-mono">
                      <span>{item.source || "Feed"}</span>
                      {item.published && <span>{item.published.slice(5, 16)}</span>}
                    </div>
                  </a>
                ))
              ) : (
                <div className="text-center text-zinc-600 text-xs py-8">
                  No headlines fetched.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
}
