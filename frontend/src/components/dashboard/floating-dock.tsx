import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Activity,
  History,
  Newspaper,
  Settings,
  BookOpen,
  Sliders,
  TrendingUp,
  LogIn,
  LogOut,
  HelpCircle
} from "lucide-react";

interface FloatingDockProps {
  currentView: string;
  setView: (view: any) => void;
  userEmail: string;
  hasPremium: boolean;
  subStatus: string;
  onSyncClick?: () => void;
  onLogoutClick?: () => void;
  onHelpClick?: () => void;
}

export default function FloatingDock({
  currentView,
  setView,
  userEmail,
  onSyncClick,
  onLogoutClick,
  onHelpClick
}: FloatingDockProps) {
  const mouseX = useMotionValue(Infinity);

  const items = [
    { label: "Dashboard", view: "dashboard", icon: Activity },
    { label: "Options Gamma", view: "gamma", icon: TrendingUp },
    { label: "Playbooks", view: "playbook", icon: BookOpen },
    { label: "News Feed", view: "news", icon: Newspaper },
    { label: "History", view: "history", icon: History },
    { label: "Performance", view: "tracker", icon: Sliders },
    { label: "Settings", view: "settings", icon: Settings },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center pointer-events-auto">
      <motion.div
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="mx-auto flex h-14 items-end gap-3 rounded-2xl bg-zinc-950/40 border border-white/10 px-4 pb-2.5 backdrop-blur-xl shadow-2xl relative"
      >
        {items.map((item) => (
          <DockIcon
            key={item.label}
            mouseX={mouseX}
            label={item.label}
            icon={item.icon}
            isActive={currentView === item.view}
            onClick={() => setView(item.view)}
          />
        ))}

        {/* Separator Line */}
        <div className="h-8 w-px bg-zinc-850 self-center" />

        {/* Profile Sync / Access Trigger */}
        {userEmail ? (
          <DockIcon
            mouseX={mouseX}
            label={`Sign Out (${userEmail})`}
            icon={LogOut}
            isActive={false}
            onClick={onLogoutClick}
            isAction={true}
            actionType="logout"
          />
        ) : (
          <DockIcon
            mouseX={mouseX}
            label="Sync Access"
            icon={LogIn}
            isActive={false}
            onClick={onSyncClick}
            isAction={true}
            actionType="login"
          />
        )}

        {/* Help Center */}
        <DockIcon
          mouseX={mouseX}
          label="Help Center"
          icon={HelpCircle}
          isActive={false}
          onClick={onHelpClick}
          isAction={true}
        />
      </motion.div>
    </div>
  );
}

function DockIcon({
  mouseX,
  label,
  icon: Icon,
  isActive,
  onClick,
  isAction = false,
  actionType = ""
}: {
  mouseX: any;
  label: string;
  icon: any;
  isActive: boolean;
  onClick?: () => void;
  isAction?: boolean;
  actionType?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthTransform = useTransform(distance, [-150, 0, 150], [40, 56, 40]);
  const heightTransform = useTransform(distance, [-150, 0, 150], [40, 56, 40]);

  const width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  const height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onClick={onClick}
      className={`group relative flex items-center justify-center rounded-xl cursor-pointer select-none transition-colors duration-200 border ${
        isActive
          ? "bg-purple-950/20 border-purple-500/30 text-purple-400"
          : isAction && actionType === "login"
          ? "bg-purple-950/10 border-purple-900/20 text-purple-300 hover:bg-purple-950/20"
          : isAction && actionType === "logout"
          ? "bg-rose-950/10 border-rose-900/20 text-rose-400 hover:bg-rose-950/20"
          : "bg-zinc-900/20 border-zinc-800/40 text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
      }`}
    >
      <Icon className="w-5 h-5" />

      {/* Hover Tooltip */}
      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all duration-200 bg-zinc-900 border border-zinc-800 text-[10px] font-semibold font-sans text-zinc-200 px-2 py-1 rounded shadow-md pointer-events-none whitespace-nowrap">
        {label}
      </span>

      {/* Active Indicator Glow Node */}
      {isActive && (
        <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
      )}
    </motion.div>
  );
}
