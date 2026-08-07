import React from "react";
import { ShieldCheck, Gauge, Radio } from "lucide-react";
import { CycleState } from "../types";

interface GlobalStatusCardsProps {
  cycleState: CycleState;
  onSelectDistrict: (district: string) => void;
  onSelectTab: (tab: string) => void;
}

export const GlobalStatusCards: React.FC<GlobalStatusCardsProps> = ({
  cycleState,
  onSelectDistrict,
  onSelectTab,
}) => {
  const highestDist = cycleState.highest_risk_district || "Kamrup Metropolitan";
  const maxScore = cycleState.max_risk_score || 0;
  const summary = cycleState.district_summaries?.[highestDist];
  const severity = summary?.risk_level || "MEDIUM";
  const confidence = summary?.confidence_score || 0;
  const districtsCount = cycleState.ranked_districts?.length || 6;
  const alertsCount = cycleState.alerts_triggered_count || 0;

  const getSeverityBadgeClass = (level: string) => {
    switch (level) {
      case "CRITICAL":
      case "HIGH_RISK_ALERT":
        return "bg-red-500/20 text-red-400 border-red-500/40 glow-red";
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40 glow-amber";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-green";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* 1. Highest Risk District Card */}
      <div
        onClick={() => onSelectDistrict(highestDist)}
        className="bg-panel border border-hud hover:border-cyan-primary/50 p-3.5 rounded-sm transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono mb-1.5">
          <span className="flex items-center gap-1">
            HIGHEST RISK DISTRICT
          </span>
          <span className="text-gray-500 text-[10px]">RANK #1</span>
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <div className="font-display font-bold text-lg text-white group-hover:text-cyan-primary transition-colors truncate">
            {highestDist}
          </div>
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm border ${getSeverityBadgeClass(
              severity
            )}`}
          >
            {severity}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono text-gray-400">
          <span>Confidence: {confidence.toFixed(1)}%</span>
          <span className="text-cyan-primary font-bold">Inspect →</span>
        </div>
      </div>

      {/* 2. Max Risk Score Card */}
      <div className="bg-panel border border-hud p-3.5 rounded-sm">
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono mb-1.5">
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            MAX RISK SCORE
          </span>
          <span className="text-[10px] text-gray-500">PYTHON DETERMINISTIC</span>
        </div>
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="font-mono font-extrabold text-2xl text-amber-400">
            {maxScore.toFixed(2)}
            <span className="text-xs text-gray-500 font-normal"> / 100</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-hud">
          <div
            className={`h-full transition-all duration-500 ${
              maxScore >= 75
                ? "bg-red-500 glow-red"
                : maxScore >= 60
                ? "bg-amber-400 glow-amber"
                : maxScore >= 40
                ? "bg-yellow-400"
                : "bg-emerald-400 glow-green"
            }`}
            style={{ width: `${Math.min(100, maxScore)}%` }}
          />
        </div>
      </div>

      {/* 3. Monitored Districts */}
      <div
        onClick={() => onSelectTab("priority")}
        className="bg-panel border border-hud hover:border-cyan-primary/50 p-3.5 rounded-sm transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono mb-1.5">
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            MONITORED DISTRICTS
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">100% COVERAGE</span>
        </div>
        <div className="font-mono font-extrabold text-2xl text-white mb-1">
          {districtsCount}
          <span className="text-xs font-normal text-gray-400 ml-2">Active Wards</span>
        </div>
        <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
          <span>7 Multi-Source Signals Fused</span>
          <span className="text-cyan-primary font-bold">View Matrix →</span>
        </div>
      </div>

      {/* 4. Active Alerts Triggered */}
      <div
        onClick={() => onSelectTab("alerts")}
        className={`bg-panel border p-3.5 rounded-sm transition-all cursor-pointer ${
          alertsCount > 0
            ? "border-red-500/50 bg-red-950/10 hover:border-red-400"
            : "border-hud hover:border-cyan-primary/50"
        }`}
      >
        <div className="flex items-center justify-between text-gray-400 text-[11px] font-mono mb-1.5">
          <span className="flex items-center gap-1 text-red-400 font-bold">
            AUTONOMOUS ALERTS
          </span>
          <span className="text-[10px] text-gray-500">SUPERVISOR POLICY</span>
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <div
            className={`font-mono font-extrabold text-2xl ${
              alertsCount > 0 ? "text-red-400 animate-pulse" : "text-emerald-400"
            }`}
          >
            {alertsCount}
            <span className="text-xs font-normal text-gray-400 ml-2">
              {alertsCount === 1 ? "Triggered Alert" : "Triggered Alerts"}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-gray-400 font-mono flex items-center justify-between">
          <span>Rule: Risk ≥ 75 & Conf ≥ 70%</span>
          <span className="text-red-400 font-bold">Review →</span>
        </div>
      </div>
    </div>
  );
};
