import React, { useState } from "react";
import {
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Activity,
  ArrowRightLeft,
  Bot,
  Pill,
  Stethoscope,
  ChevronRight,
  Sparkles,
  Building2,
  BarChart3,
  Layers,
  Send,
  ShieldCheck,
  Zap,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { DistrictSummary, CycleState } from "../types";

interface DistrictPriorityIntelligenceDashboardProps {
  districtSummaries: Record<string, DistrictSummary>;
  rankedDistricts: string[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  onSelectTab?: (tab: string) => void;
  cycleState?: CycleState;
}

export const DistrictPriorityIntelligenceDashboard: React.FC<
  DistrictPriorityIntelligenceDashboardProps
> = ({
  districtSummaries,
  rankedDistricts,
  selectedDistrict,
  onSelectDistrict,
  onSelectTab,
  cycleState,
}) => {
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

  // Helper functions
  const cleanRiskLevel = (rawLevel?: string): string => {
    if (!rawLevel) return "NORMAL RISK";
    const str = rawLevel.replace("RiskLevel.", "").toUpperCase();
    if (str.includes("CRITICAL")) return "CRITICAL RISK";
    if (str.includes("HIGH")) return "HIGH RISK";
    if (str.includes("MEDIUM") || str.includes("MODERATE")) return "MODERATE RISK";
    if (str.includes("LOW")) return "LOW RISK";
    return "NORMAL RISK";
  };

  const getSeverityBadgeClass = (levelStr: string) => {
    switch (levelStr) {
      case "CRITICAL RISK":
        return "bg-red-500/20 text-red-400 border-red-500/50 glow-red font-bold";
      case "HIGH RISK":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold";
      case "MODERATE RISK":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-bold";
      case "LOW RISK":
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold";
    }
  };

  const getPrimaryDriverText = (summary?: DistrictSummary): string => {
    if (!summary) return "Multifactor signal anomaly";
    const sub = summary.sub_scores;
    if (!sub) return "Surveillance signal anomaly";

    const scores = [
      { name: "Disease Surveillance Spike", score: sub.disease || 0 },
      { name: "ICU & Hospital Capacity Strain", score: sub.hospital || 0 },
      { name: "Vector & Atmospheric Risk", score: sub.weather || 0 },
      { name: "AQI & Respiratory Load", score: sub.aqi || 0 },
      { name: "OTC Pharmacy Sales Surge", score: sub.pharmacy || 0 },
    ];
    scores.sort((a, b) => b.score - a.score);
    return `${scores[0].name} (${scores[0].score.toFixed(0)}/100)`;
  };

  const getRecommendedActionText = (summary?: DistrictSummary): string => {
    if (summary?.reasoning?.recommendations?.[0]) {
      return summary.reasoning.recommendations[0];
    }
    if (!summary) return "Activate district surveillance & monitor capacity";
    if (summary.risk_score >= 75) {
      return "Deploy rapid response epidemic team & reserve ICU capacity";
    } else if (summary.risk_score >= 50) {
      return "Increase laboratory testing & deploy vector control measures";
    }
    return "Maintain baseline monitoring & update daily telemetry";
  };

  // Calculations
  const totalDistricts = rankedDistricts.length;
  const highestRiskDistrictName =
    cycleState?.highest_risk_district || rankedDistricts[0] || "Kamrup Metropolitan";
  const highestSummary = districtSummaries[highestRiskDistrictName];
  const highestRiskScore = highestSummary?.risk_score || cycleState?.max_risk_score || 0;
  const highestConfidence = highestSummary?.confidence_score || 90;
  const highestLevelStr = cleanRiskLevel(highestSummary?.risk_level);

  let criticalCount = 0;
  let highCount = 0;
  let totalConfidence = 0;

  rankedDistricts.forEach((d) => {
    const s = districtSummaries[d];
    if (s) {
      const lvl = cleanRiskLevel(s.risk_level);
      if (lvl === "CRITICAL RISK" || s.risk_score >= 75) criticalCount++;
      else if (lvl === "HIGH RISK" || s.risk_score >= 50) highCount++;
      totalConfidence += s.confidence_score || 90;
    }
  });

  const avgConfidence = totalDistricts > 0 ? (totalConfidence / totalDistricts).toFixed(1) : "91.5";
  const timestampStr = cycleState?.timestamp
    ? new Date(cycleState.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Priority Report Transfers
  const priorityJson = cycleState?.reports?.priority_report?.json;
  const transfers = priorityJson?.medicine_redistribution_transfers || [];

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-5">
      {/* 1. HEADER SECTION */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 relative overflow-hidden">
        {/* Subtle grid background accent */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10 border-b border-hud pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-cyan-primary/10 border border-cyan-primary/30">
                <ShieldAlert className="w-5 h-5 text-cyan-primary" />
              </span>
              <h2 className="font-display font-bold text-lg text-white tracking-wide">
                DISTRICT RISK PRIORITIZATION INTELLIGENCE
              </h2>
            </div>
            <p className="text-xs font-mono text-gray-400 flex items-center gap-2">
              <span>National Public Health Command System</span>
              <span>•</span>
              <span className="text-gray-400">Cycle ID:</span>
              <span className="text-cyan-primary font-bold">{cycleState?.cycle_id || "CYC-LIVE"}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 px-3 py-1 rounded-sm font-bold flex items-center gap-1.5 glow-amber">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>DRAFT • PENDING APPROVAL</span>
            </div>
            <div className="bg-black/50 border border-hud text-gray-400 px-3 py-1 rounded-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-primary" />
              <span>UPDATED: {timestampStr}</span>
            </div>
          </div>
        </div>

        {/* Hero Card for Top Risk Ward */}
        <div className="mt-4 pt-1">
          <div className="bg-red-950/20 border border-red-500/50 rounded-sm p-4 relative glow-red flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-sm bg-red-500/20 text-red-400 border border-red-500/60 font-mono font-bold text-xs flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-red-400" />
                  CRITICAL ALERT FOCUS
                </span>
                <span className="text-xs font-mono text-gray-400">Rank #1 Target</span>
              </div>
              <div className="flex items-baseline gap-3">
                <h3 className="font-display font-extrabold text-2xl text-white tracking-wider">
                  {highestRiskDistrictName}
                </h3>
                <span className="text-xs font-mono text-red-300">
                  {highestSummary?.demographics?.population
                    ? `Pop: ${(highestSummary.demographics.population).toLocaleString()}`
                    : "High Density Urban District"}
                </span>
              </div>
              <p className="text-xs font-mono text-gray-300 max-w-2xl leading-relaxed">
                <strong className="text-red-400">Primary Concern:</strong>{" "}
                {getPrimaryDriverText(highestSummary)} — Requires immediate surveillance expansion and hospital bed allocation.
              </p>
            </div>

            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-red-500/30 pt-3 md:pt-0 md:pl-5 shrink-0 font-mono">
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block uppercase">Risk Score</span>
                <div className="text-2xl font-extrabold text-red-400">
                  {highestRiskScore.toFixed(2)}
                  <span className="text-xs text-gray-500 font-normal">/100</span>
                </div>
              </div>
              <div className="text-right border-l border-hud pl-4">
                <span className="text-[10px] text-gray-400 block uppercase">Confidence</span>
                <div className="text-xl font-bold text-emerald-400">
                  {highestConfidence.toFixed(1)}%
                </div>
              </div>
              <button
                onClick={() => onSelectDistrict(highestRiskDistrictName)}
                className="px-3 py-2 rounded-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <span>Inspect Ward</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RISK OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 font-mono text-xs">
        {/* Card 1 */}
        <div className="bg-panel-container border border-hud p-3.5 rounded-sm space-y-1 hover:border-cyan-primary/40 transition-all">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">MONITORED WARDS</span>
            <Building2 className="w-4 h-4 text-cyan-primary" />
          </div>
          <div className="text-2xl font-extrabold text-white">{totalDistricts}</div>
          <div className="text-[10px] text-gray-500">Active telemetry feeds</div>
        </div>

        {/* Card 2 */}
        <div className="bg-panel-container border border-hud p-3.5 rounded-sm space-y-1 hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">CRITICAL WARDS</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-red-400">{criticalCount}</div>
          <div className="text-[10px] text-red-300/70">Risk Score ≥ 75.0</div>
        </div>

        {/* Card 3 */}
        <div className="bg-panel-container border border-hud p-3.5 rounded-sm space-y-1 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">HIGH RISK WARDS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300">{highCount}</div>
          <div className="text-[10px] text-amber-300/70">Risk Score 50.0 – 74.9</div>
        </div>

        {/* Card 4 */}
        <div className="bg-panel-container border border-hud p-3.5 rounded-sm space-y-1 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">AVG CONFIDENCE</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{avgConfidence}%</div>
          <div className="text-[10px] text-gray-500">Multisensory signal weight</div>
        </div>

        {/* Card 5 */}
        <div className="bg-panel-container border border-hud p-3.5 rounded-sm space-y-1 hover:border-amber-500/40 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">TOP FOCUS LOCATION</span>
            <TrendingUp className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-base font-extrabold text-amber-300 truncate">
            {highestRiskDistrictName}
          </div>
          <div className="text-[10px] text-gray-400">Score: {highestRiskScore.toFixed(1)} / 100</div>
        </div>
      </div>

      {/* 3. DISTRICT PRIORITY TABLE */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-primary" />
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">
              DISTRICT RISK PRIORITY MATRIX & DECISION MATRIX
            </h3>
          </div>
          <span className="text-[10px] font-mono text-gray-400">SORTED BY EPIDEMIOLOGICAL RISK</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-hud text-gray-400 text-[10px] uppercase bg-black/50">
                <th className="p-2.5 w-14 text-center">Rank</th>
                <th className="p-2.5">District</th>
                <th className="p-2.5">Risk Level</th>
                <th className="p-2.5 w-48">Risk Score</th>
                <th className="p-2.5 text-center">Confidence</th>
                <th className="p-2.5">Primary Driver</th>
                <th className="p-2.5">Recommended Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hud">
              {rankedDistricts.map((dName, idx) => {
                const summary = districtSummaries[dName];
                const rank = idx + 1;
                const score = summary?.risk_score || 0;
                const conf = summary?.confidence_score || 90;
                const levelStr = cleanRiskLevel(summary?.risk_level);
                const isSelected = selectedDistrict === dName;
                const driver = getPrimaryDriverText(summary);
                const action = getRecommendedActionText(summary);
                const isExpanded = expandedDistrict === dName;

                return (
                  <React.Fragment key={dName}>
                    <tr
                      onClick={() => onSelectDistrict(dName)}
                      className={`cursor-pointer transition-colors hover:bg-white/5 ${
                        isSelected
                          ? "bg-cyan-primary/10 border-l-4 border-cyan-primary text-white"
                          : "text-gray-300"
                      }`}
                    >
                      {/* Rank Badge */}
                      <td className="p-2.5 text-center font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-sm text-xs font-mono font-bold ${
                            rank === 1
                              ? "bg-red-500/20 text-red-400 border border-red-500/50 glow-red"
                              : rank === 2
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : rank === 3
                              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                              : "bg-black/40 text-gray-400 border border-hud"
                          }`}
                        >
                          {rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : `#${rank}`}
                        </span>
                      </td>

                      {/* District Name */}
                      <td className="p-2.5 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{dName}</span>
                          {isSelected && <span className="text-[10px] text-cyan-primary">● FOCUS</span>}
                        </div>
                      </td>

                      {/* Risk Level Pill */}
                      <td className="p-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-sm border text-[10px] ${getSeverityBadgeClass(
                            levelStr
                          )}`}
                        >
                          {levelStr}
                        </span>
                      </td>

                      {/* Risk Score Progress Bar */}
                      <td className="p-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-cyan-primary">
                            <span>{score.toFixed(2)}</span>
                            <span className="text-[10px] text-gray-500 font-normal">/ 100</span>
                          </div>
                          <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-hud">
                            <div
                              className={`h-full rounded-full transition-all ${
                                score >= 75
                                  ? "bg-red-500"
                                  : score >= 50
                                  ? "bg-amber-400"
                                  : "bg-cyan-primary"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Confidence Percentage Meter */}
                      <td className="p-2.5 text-center font-bold text-emerald-400">
                        {conf.toFixed(1)}%
                      </td>

                      {/* Primary Driver */}
                      <td className="p-2.5 text-gray-300 text-[11px] max-w-xs truncate">
                        {driver}
                      </td>

                      {/* Recommended Action */}
                      <td className="p-2.5 text-gray-200 text-[11px] max-w-sm">
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{action}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDistrict(isExpanded ? null : dName);
                            }}
                            className="text-[10px] text-cyan-primary hover:underline shrink-0"
                          >
                            {isExpanded ? "[Less]" : "[Details]"}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Row */}
                    {isExpanded && summary && (
                      <tr className="bg-black/50 border-b border-hud">
                        <td colSpan={7} className="p-3 text-xs text-gray-300 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                            <div className="bg-panel-container p-2 rounded border border-hud">
                              <span className="text-gray-400 text-[10px] block font-bold">SUB-SCORE BREAKDOWN</span>
                              <div className="text-[11px] space-y-0.5 mt-1">
                                <div>Disease Outbreak: <strong className="text-amber-300">{summary.sub_scores?.disease?.toFixed(0) || 0}</strong></div>
                                <div>Hospital ICU Surge: <strong className="text-cyan-primary">{summary.sub_scores?.hospital?.toFixed(0) || 0}</strong></div>
                                <div>Vector & Weather: <strong className="text-emerald-400">{summary.sub_scores?.weather?.toFixed(0) || 0}</strong></div>
                              </div>
                            </div>

                            <div className="bg-panel-container p-2 rounded border border-hud">
                              <span className="text-gray-400 text-[10px] block font-bold">KEY EVIDENCE SIGNALS</span>
                              <ul className="list-disc pl-4 text-[10px] text-gray-300 space-y-0.5 mt-1">
                                {summary.evidence?.slice(0, 3).map((ev, eIdx) => (
                                  <li key={eIdx}>{ev}</li>
                                )) || <li>Surveillance telemetry nominal</li>}
                              </ul>
                            </div>

                            <div className="bg-panel-container p-2 rounded border border-hud flex flex-col justify-between">
                              <span className="text-gray-400 text-[10px] block font-bold">HEALTHCARE DEMOGRAPHICS</span>
                              <div className="text-[11px] text-gray-300">
                                <div>Pop Density: <strong>{summary.demographics?.population_density || "N/A"} / km²</strong></div>
                                <div>Total ICU Beds: <strong>{summary.demographics?.icu_beds || "N/A"}</strong></div>
                              </div>
                              <button
                                onClick={() => {
                                  onSelectDistrict(dName);
                                  if (onSelectTab) onSelectTab("overview");
                                }}
                                className="mt-2 text-cyan-primary text-[10px] font-bold hover:underline"
                              >
                                View Complete District Intelligence →
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. AI ANALYST INSIGHT PANEL */}
      <div className="bg-gradient-to-r from-panel-container via-black/60 to-panel-container border border-cyan-primary/30 rounded-sm p-4 space-y-3 relative">
        <div className="flex items-center gap-2 border-b border-hud pb-2">
          <div className="p-1.5 rounded bg-cyan-primary/20 border border-cyan-primary/40">
            <Sparkles className="w-4 h-4 text-cyan-primary" />
          </div>
          <h3 className="font-display font-bold text-sm text-cyan-primary tracking-wide uppercase">
            SITUATION ASSESSMENT & EXECUTIVE BRIEFING
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-gray-300 leading-relaxed">
          <div className="space-y-2 bg-black/40 p-3.5 rounded border border-hud">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs text-amber-300">
              <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
              Epidemiological Outbreak Risk Analysis:
            </h4>
            <p className="text-gray-300">
              <strong className="text-white">{highestRiskDistrictName}</strong> demonstrates elevated epidemiological risk due to increased surveillance signals combined with environmental and population vulnerability indicators. High population density and elevated hospital bed occupancy accentuate potential containment challenges.
            </p>
          </div>

          <div className="space-y-2 bg-black/40 p-3.5 rounded border border-hud">
            <h4 className="font-bold text-white flex items-center gap-1.5 text-xs text-cyan-primary">
              <ChevronRight className="w-3.5 h-3.5 text-cyan-primary" />
              Recommended Strategic Next Steps:
            </h4>
            <ul className="space-y-1.5 text-gray-300">
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-primary font-bold">1.</span>
                <span>Increase rapid testing capacity and activate district surveillance teams in high-risk sectors.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-primary font-bold">2.</span>
                <span>Pre-position ORS packets, IV fluids (RL/NS), and emergency medical staff for rapid mobilization.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-cyan-primary font-bold">3.</span>
                <span>Conduct daily telemetry audits of ICU bed occupancy and pharmacy OTC symptom sales.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 5. RESOURCE ALLOCATION SECTION & 6. AGENTIC AI ELEMENTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono text-xs">
        {/* Resource Operational Panel */}
        <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-hud pb-2">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-400" />
              <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                RESOURCE ALLOCATION STATUS & REDISTRIBUTION
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              SYSTEM NOMINAL
            </span>
          </div>

          <div className="space-y-2">
            <div className="p-2.5 bg-black/40 border border-hud rounded-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">🟢 Medical Supplies:</span>
              </div>
              <span className="text-gray-200 font-bold">Balanced across wards</span>
            </div>

            <div className="p-2.5 bg-black/40 border border-hud rounded-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-cyan-primary font-bold">🚑 Medical Teams:</span>
              </div>
              <span className="text-gray-200 font-bold">Adequate / Standby Ready</span>
            </div>

            <div className="p-2.5 bg-black/40 border border-hud rounded-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-bold">📦 Emergency Stock:</span>
              </div>
              <span className="text-gray-200 font-bold">
                {transfers.length > 0 ? `${transfers.length} Active Transfer Orders` : "No inter-district transfers required"}
              </span>
            </div>
          </div>

          {transfers.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-[10px] text-gray-400 font-bold block uppercase">
                Active Inter-District Transfer Directives:
              </span>
              {transfers.map((tr, tIdx) => (
                <div key={tIdx} className="p-2 bg-black/60 border border-hud rounded text-[11px] flex justify-between items-center">
                  <div>
                    <span className="text-emerald-400 font-bold">{tr.from_district}</span>
                    <span className="text-gray-500 mx-1">→</span>
                    <span className="text-red-400 font-bold">{tr.to_district}</span>
                  </div>
                  <span className="text-cyan-primary font-bold">{tr.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Agentic AI Actions Panel */}
        <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-hud pb-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-primary" />
              <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                AUTONOMOUS AGENT ACTIONS PERFORMED
              </h3>
            </div>
            <span className="text-[10px] text-cyan-primary font-bold bg-cyan-primary/10 px-2 py-0.5 rounded border border-cyan-primary/30">
              4 AGENTS COMPLETE
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-300">
            <div className="p-2 bg-black/40 border border-hud rounded flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Surveillance Agent:</strong> Analyzed disease indicators, hospital ICU load feeds, and OTC sales.
              </div>
            </div>

            <div className="p-2 bg-black/40 border border-hud rounded flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Data Fusion Agent:</strong> Combined multi-source signals (IDSP, AQI, Weather, Census).
              </div>
            </div>

            <div className="p-2 bg-black/40 border border-hud rounded flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Risk Assessment Agent:</strong> Calculated district vulnerability & risk priority scores.
              </div>
            </div>

            <div className="p-2 bg-black/40 border border-hud rounded flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Decision Agent:</strong> Generated operational recommendations & resource allocation formulas.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
