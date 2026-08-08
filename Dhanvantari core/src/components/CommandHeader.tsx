import React, { useEffect, useState } from "react";
import {
  Activity,
  Shield,
  RefreshCw,
  FlaskConical,
  Clock,
  Radio,
  AlertTriangle,
} from "lucide-react";

interface CommandHeaderProps {
  cycleId?: string;
  status?: string;
  alertsCount?: number;
  isPolling: boolean;
  isRefreshing: boolean;
  countdown?: number;
  onRunCycle: () => void;
  onOpenSimulate: () => void;
  onTogglePolling: () => void;
  onSelectTab: (tab: string) => void;
}

export const CommandHeader: React.FC<CommandHeaderProps> = ({
  cycleId = "CYC-INITIALIZING",
  status = "NOMINAL",
  alertsCount = 0,
  isPolling,
  isRefreshing,
  countdown = 60,
  onRunCycle,
  onOpenSimulate,
  onTogglePolling,
  onSelectTab,
}) => {
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-panel border-b border-hud px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Brand & Mission Identifier */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-zinc-800 border border-zinc-700 text-white">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 font-bold text-sm tracking-wide text-white">
            <span>DHANVANTARI</span>
            <span className="text-zinc-300 font-mono text-xs px-1.5 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700">
              v3.6-FLASH
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono tracking-wider">
            PUBLIC HEALTH SIGNAL FUSION AGENT — NATIONAL SURVEILLANCE
          </div>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div className="hidden lg:flex items-center gap-4 bg-black/40 px-3 py-1.5 rounded-sm border border-hud font-mono text-[11px]">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span>{utcTime || "2026-08-06 17:06:00 UTC"}</span>
        </div>

        <div className="h-3 w-px bg-zinc-800" />

        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">CYCLE ID:</span>
          <span className="text-white font-semibold">{cycleId}</span>
        </div>

        <div className="h-3 w-px bg-zinc-800" />

        <div className="flex items-center gap-1.5">
          <span className="text-zinc-400">STATUS:</span>
          <span
            className={`font-semibold px-1.5 py-0.5 rounded-sm text-[10px] ${
              status === "CRITICAL" || status === "HIGH_RISK_ALERT"
                ? "bg-red-950/80 text-red-300 border border-red-700/80"
                : "bg-zinc-800 text-zinc-200 border border-zinc-700"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="h-3 w-px bg-zinc-800" />

        {/* Polling Mode Indicator */}
        <div className="flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-zinc-400" />
          <span className={isPolling ? "text-white font-semibold" : "text-zinc-500"}>
            {isPolling ? `AUTONOMOUS (${countdown}s)` : "PAUSED"}
          </span>
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="flex items-center gap-2">
        {/* Trigger Alerts Badge */}
        {alertsCount > 0 && (
          <button
            onClick={() => onSelectTab("alerts")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-950/80 border border-red-700 text-red-200 font-mono font-semibold hover:bg-red-900/80 transition-all"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-300" />
            <span>{alertsCount} ALERTS</span>
          </button>
        )}

        {/* Auto Poll Toggle */}
        <button
          onClick={onTogglePolling}
          title={isPolling ? "Pause auto polling" : "Enable 60s auto polling"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border font-mono transition-all ${
            isPolling
              ? "bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700"
              : "bg-panel-container border-hud text-zinc-400 hover:text-white"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isPolling ? `POLL ON (${countdown}s)` : "POLL OFF"}
          </span>
        </button>

        {/* Simulate Spike Button */}
        <button
          onClick={onOpenSimulate}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-800 border border-zinc-700 text-zinc-200 font-mono font-semibold hover:bg-zinc-700 transition-all"
        >
          <FlaskConical className="w-3.5 h-3.5 text-zinc-300" />
          <span className="hidden sm:inline">SIMULATE SPIKE</span>
        </button>

        {/* Manual Run Fusion Cycle */}
        <button
          onClick={onRunCycle}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-zinc-100 text-zinc-900 border border-zinc-200 font-mono font-bold hover:bg-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "FUSING..." : "RUN CYCLE"}</span>
        </button>
      </div>
    </header>
  );
};
