import React from "react";
import { Gauge, Radio } from "lucide-react";
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
      case "HIGH":
        return "bg-red-950/80 text-red-200 border-red-700";
      case "MEDIUM":
        return "bg-zinc-800 text-zinc-200 border-zinc-600";
      default:
        return "bg-zinc-900 text-zinc-300 border-zinc-700";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-xs font-sans">
      {/* 1. Highest Risk District Card */}
      <div
        onClick={() => onSelectDistrict(highestDist)}
        className="bg-panel border border-hud hover:border-zinc-500 p-3.5 rounded-sm transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono mb-1.5">
          <span>HIGHEST RISK DISTRICT</span>
          <span className="text-zinc-500 text-[10px]">RANK #1</span>
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <div className="font-bold text-lg text-white group-hover:text-zinc-200 transition-colors truncate">
            {highestDist}
          </div>
          <span
            className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-sm border ${getSeverityBadgeClass(
              severity
            )}`}
          >
            {severity}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>Confidence: {confidence.toFixed(1)}%</span>
          <span className="text-white font-semibold">Inspect →</span>
        </div>
      </div>

      {/* 2. Max Risk Score Card */}
      <div className="bg-panel border border-hud p-3.5 rounded-sm">
        <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono mb-1.5">
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-zinc-300" />
            MAX RISK SCORE
          </span>
          <span className="text-[10px] text-zinc-500">DETERMINISTIC</span>
        </div>
        <div className="flex items-baseline justify-between mb-1.5">
          <div className="font-mono font-bold text-2xl text-white">
            {maxScore.toFixed(2)}
            <span className="text-xs text-zinc-500 font-normal"> / 100</span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-hud">
          <div
            className={`h-full transition-all duration-500 ${
              maxScore >= 60 ? "bg-red-700" : "bg-zinc-400"
            }`}
            style={{ width: `${Math.min(100, maxScore)}%` }}
          />
        </div>
      </div>

      {/* 3. Monitored Districts */}
      <div
        onClick={() => onSelectTab("priority")}
        className="bg-panel border border-hud hover:border-zinc-500 p-3.5 rounded-sm transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono mb-1.5">
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-zinc-300" />
            MONITORED DISTRICTS
          </span>
          <span className="text-[10px] text-zinc-300 font-bold">100% COVERAGE</span>
        </div>
        <div className="font-mono font-bold text-2xl text-white mb-1">
          {districtsCount}
          <span className="text-xs font-normal text-zinc-400 ml-2">Active Wards</span>
        </div>
        <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
          <span>7 Multi-Source Signals Fused</span>
          <span className="text-white font-semibold">View Matrix →</span>
        </div>
      </div>

      {/* 4. Active Alerts Triggered */}
      <div
        onClick={() => onSelectTab("alerts")}
        className={`bg-panel border p-3.5 rounded-sm transition-all cursor-pointer ${
          alertsCount > 0
            ? "border-red-700/80 bg-red-950/20 hover:border-red-600"
            : "border-hud hover:border-zinc-500"
        }`}
      >
        <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono mb-1.5">
          <span className="flex items-center gap-1 text-red-300 font-semibold">
            AUTONOMOUS ALERTS
          </span>
          <span className="text-[10px] text-zinc-500">SUPERVISOR POLICY</span>
        </div>
        <div className="flex items-baseline justify-between mb-1">
          <div
            className={`font-mono font-bold text-2xl ${
              alertsCount > 0 ? "text-red-300" : "text-white"
            }`}
          >
            {alertsCount}
            <span className="text-xs font-normal text-zinc-400 ml-2">
              {alertsCount === 1 ? "Triggered Alert" : "Triggered Alerts"}
            </span>
          </div>
        </div>
        <div className="text-[11px] text-zinc-400 font-mono flex items-center justify-between">
          <span>Rule: Risk ≥ 75 & Conf ≥ 70%</span>
          <span className="text-red-300 font-semibold">Review →</span>
        </div>
      </div>
    </div>
  );
};
