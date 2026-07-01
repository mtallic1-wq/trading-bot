interface GaugeProps {
  score: number; // 0 to 100
  label: string;
}

export default function Gauge({ score, label }: GaugeProps) {
  // Clamp score
  const clampedScore = Math.max(0, Math.min(100, score));
  
  // Calculate angle for needle: 0% is -90deg (left), 100% is 90deg (right)
  const angle = -90 + (clampedScore / 100) * 180;
  
  // Determine color matching sentiment
  const strokeColor = 
    clampedScore > 60 ? "#10b981" : // Emerald
    clampedScore < 40 ? "#f43f5e" : // Rose
    "#f59e0b"; // Amber

  return (
    <div className="flex flex-col items-center justify-center font-sans select-none h-full py-1">
      {/* SVG Arc Gauge */}
      <div className="relative w-24 h-12">
        <svg viewBox="0 0 100 50" className="w-full h-full overflow-visible">
          {/* Base track arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#27272a"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Highlighted active arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="125"
            strokeDashoffset={125 - (clampedScore / 100) * 125}
            className="transition-all duration-1000 ease-out"
          />
          
          {/* Needle pin center */}
          <circle cx="50" cy="50" r="4" fill="#f4f4f5" />
          
          {/* Needle pointer */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="18"
            stroke="#f4f4f5"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{
              transform: `rotate(${angle}deg)`,
              transformOrigin: "50px 50px",
              transition: "transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
            }}
          />
        </svg>
        
        {/* Score overlay */}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-zinc-100 mt-1">
          {clampedScore}%
        </span>
      </div>
      
      <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mt-2">
        {label}
      </span>
    </div>
  );
}
