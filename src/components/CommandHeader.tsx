import React, { useEffect, useState } from "react";
import {
  Activity,
  Shield,
  Zap,
  RefreshCw,
  FlaskConical,
  Clock,
  Radio,
  FileText,
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
        <div className="flex items-center justify-center w-8 h-8 rounded-sm bg-cyan-primary/10 border border-cyan-primary/40 text-cyan-primary glow-cyan">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 font-display font-bold text-sm tracking-wide text-white">
            <span>DHANVANTARI</span>
            <span className="text-cyan-primary font-mono text-xs px-1.5 py-0.5 rounded-sm bg-cyan-primary/10 border border-cyan-primary/30">
              v3.6-FLASH
            </span>
          </div>
          <div className="text-[11px] text-gray-400 font-mono tracking-wider">
            PUBLIC HEALTH SIGNAL FUSION AGENT — NATIONAL SURVEILLANCE
          </div>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div className="hidden lg:flex items-center gap-4 bg-black/40 px-3 py-1.5 rounded-sm border border-hud font-mono text-[11px]">
        <div className="flex items-center gap-1.5 text-gray-300">
          <Clock className="w-3.5 h-3.5 text-cyan-primary" />
          <span>{utcTime || "2026-08-06 17:06:00 UTC"}</span>
        </div>

        <div className="h-3 w-px bg-gray-800" />

        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">CYCLE ID:</span>
          <span className="text-cyan-primary font-semibold">{cycleId}</span>
        </div>

        <div className="h-3 w-px bg-gray-800" />

        <div className="flex items-center gap-1.5">
          <span className="text-gray-400">STATUS:</span>
          <span
            className={`font-bold px-1.5 py-0.5 rounded-sm text-[10px] ${
              status === "CRITICAL" || status === "HIGH_RISK_ALERT"
                ? "bg-red-500/20 text-red-400 border border-red-500/40 glow-red"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-green"
            }`}
          >
            {status}
          </span>
        </div>

        <div className="h-3 w-px bg-gray-800" />

        {/* Polling Mode Indicator */}
        <div className="flex items-center gap-1.5">
          <Radio
            className={`w-3.5 h-3.5 ${
              isPolling ? "text-emerald-400 animate-live-pulse" : "text-gray-500"
            }`}
          />
          <span className={isPolling ? "text-emerald-400 font-bold" : "text-gray-500"}>
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
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-500/20 border border-red-500/50 text-red-300 font-mono font-semibold hover:bg-red-500/30 transition-all glow-red"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
            <span>{alertsCount} ALERTS</span>
          </button>
        )}

        {/* Auto Poll Toggle */}
        <button
          onClick={onTogglePolling}
          title={isPolling ? "Pause auto polling" : "Enable 60s auto polling"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border font-mono transition-all ${
            isPolling
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40"
              : "bg-panel-container border-hud text-gray-400 hover:text-white"
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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono font-semibold hover:bg-amber-500/20 transition-all glow-amber"
        >
          <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">SIMULATE SPIKE</span>
        </button>

        {/* Manual Run Fusion Cycle */}
        <button
          onClick={onRunCycle}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-cyan-primary/20 border border-cyan-primary/60 text-cyan-primary font-mono font-bold hover:bg-cyan-primary/30 transition-all glow-cyan disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>{isRefreshing ? "FUSING..." : "RUN CYCLE"}</span>
        </button>
      </div>
    </header>
  );
};
