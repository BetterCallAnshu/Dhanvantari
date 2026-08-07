import React from "react";
import {
  AlertCircle,
  ShieldAlert,
  Clock,
  Activity,
  CheckCircle2,
  Bot,
  Layers,
  Sparkles,
  ChevronRight,
  Stethoscope,
  Pill,
  CloudSun,
  Building2,
  FileCheck,
  Send,
  Zap,
} from "lucide-react";
import { DistrictSummary, CycleState } from "../types";

interface IncidentReportIntelligenceDashboardProps {
  summary: DistrictSummary;
  cycleState: CycleState;
  onSelectDistrict?: (district: string) => void;
}

export const IncidentReportIntelligenceDashboard: React.FC<
  IncidentReportIntelligenceDashboardProps
> = ({ summary, cycleState, onSelectDistrict }) => {
  const incData = cycleState?.reports?.incident_report?.json;
  const districtName = summary?.district || incData?.district || "Kamrup Metropolitan";
  const riskScore = summary?.risk_score || 75.0;
  const confidenceScore = summary?.confidence_score || 91.8;

  // Clean strings
  const cleanRiskLevel = (rawLevel?: string): string => {
    if (!rawLevel) return "CRITICAL INCIDENT";
    const str = rawLevel.replace("RiskLevel.", "").toUpperCase();
    if (str.includes("CRITICAL")) return "CRITICAL SEVERITY";
    if (str.includes("HIGH")) return "HIGH SEVERITY";
    if (str.includes("MEDIUM") || str.includes("MODERATE")) return "MODERATE SEVERITY";
    return "LOW SEVERITY";
  };

  const getSeverityBadgeClass = (levelStr: string) => {
    switch (levelStr) {
      case "CRITICAL SEVERITY":
        return "bg-red-500/20 text-red-400 border-red-500/60 glow-red font-bold";
      case "HIGH SEVERITY":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold";
      case "MODERATE SEVERITY":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40 font-bold";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold";
    }
  };

  const severityLevelStr = cleanRiskLevel(summary?.risk_level);
  const incidentId = `INC-${cycleState?.timestamp ? cycleState.timestamp.slice(0, 10).replace(/-/g, "") : "20260806"}-${districtName.slice(0, 3).toUpperCase()}`;

  const timestampStr = cycleState?.timestamp
    ? new Date(cycleState.timestamp).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  // Signal breakdown weights
  const subs = summary?.sub_scores || {
    disease: 85,
    hospital: 78,
    weather: 65,
    pharmacy: 72,
    aqi: 55,
  };

  const signals = [
    {
      title: "Disease Surveillance",
      status: subs.disease >= 70 ? "⚠ Spike Anomaly" : "✓ Baseline Nominal",
      weight: "35%",
      impact: subs.disease >= 70 ? "HIGH IMPACT" : "MODERATE IMPACT",
      color: subs.disease >= 70 ? "text-red-400" : "text-amber-300",
      icon: Activity,
      desc: "Elevated IDSP acute fever & respiratory symptom clusters",
    },
    {
      title: "Healthcare ICU Surge",
      status: subs.hospital >= 70 ? "⚠ Capacity Strain" : "✓ Normal Beds",
      weight: "25%",
      impact: subs.hospital >= 70 ? "HIGH IMPACT" : "MODERATE IMPACT",
      color: subs.hospital >= 70 ? "text-red-400" : "text-cyan-primary",
      icon: Stethoscope,
      desc: "Increased hospital ICU bed utilization & emergency triage load",
    },
    {
      title: "OTC Pharmacy Sales",
      status: subs.pharmacy >= 65 ? "⚠ Demand Spike" : "✓ Stable Sales",
      weight: "20%",
      impact: subs.pharmacy >= 65 ? "MODERATE IMPACT" : "LOW IMPACT",
      color: subs.pharmacy >= 65 ? "text-amber-300" : "text-emerald-400",
      icon: Pill,
      desc: "Surge in fever, antipyretic, & rehydration formulation sales",
    },
    {
      title: "Environmental & AQI Feeds",
      status: subs.weather >= 60 || subs.aqi >= 60 ? "⚠ Vector Climate Risk" : "✓ Favorable",
      weight: "20%",
      impact: subs.weather >= 60 ? "MODERATE IMPACT" : "LOW IMPACT",
      color: subs.weather >= 60 ? "text-amber-300" : "text-emerald-400",
      icon: CloudSun,
      desc: "High humidity & rainfall promoting vector proliferation conditions",
    },
  ];

  // Recommendations list
  const recs =
    incData?.recommended_actions || [
      "Deploy rapid field outbreak investigation team to high-risk ward clusters",
      "Increase laboratory testing capacity for acute fever & pathogen identification",
      "Pre-position emergency ORS, IV fluids, and antipyretics in primary health centers",
      "Issue vector control protocols & conduct community sanitation awareness drives",
    ];

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-5 font-mono text-xs">
      {/* 1. INCIDENT HEADER */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-hud pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-red-500/20 border border-red-500/50 glow-red">
                <ShieldAlert className="w-5 h-5 text-red-400" />
              </span>
              <h2 className="font-display font-bold text-lg text-white tracking-wide">
                PUBLIC HEALTH INCIDENT INTELLIGENCE REPORT
              </h2>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              <span>National Outbreak Surveillance Network</span>
              <span>•</span>
              <span>ID: <strong className="text-cyan-primary">{incidentId}</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-red-500/20 border border-red-500/60 text-red-300 px-3 py-1 rounded-sm font-bold flex items-center gap-1.5 glow-red">
              <Zap className="w-4 h-4 text-red-400 fill-red-400" />
              <span>ACTIVE INCIDENT • UNDER INVESTIGATION</span>
            </div>
            <div className="bg-black/50 border border-hud text-gray-400 px-3 py-1 rounded-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-primary" />
              <span>DETECTED: {timestampStr}</span>
            </div>
          </div>
        </div>

        {/* Overview KPI Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-1">
          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5">
            <span className="text-[10px] text-gray-400 block font-bold">TARGET LOCATION</span>
            <div className="font-display font-extrabold text-white text-base truncate">{districtName}</div>
            <div className="text-[10px] text-cyan-primary">Ward Focus</div>
          </div>

          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5">
            <span className="text-[10px] text-gray-400 block font-bold">SYNDROME CATEGORY</span>
            <div className="font-bold text-amber-300 text-sm truncate">Acute Outbreak Cluster</div>
            <div className="text-[10px] text-gray-400">Multi-source signal</div>
          </div>

          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5">
            <span className="text-[10px] text-gray-400 block font-bold">CURRENT SEVERITY</span>
            <div>
              <span className={`px-2 py-0.5 rounded-sm border text-[10px] inline-block ${getSeverityBadgeClass(severityLevelStr)}`}>
                {severityLevelStr}
              </span>
            </div>
            <div className="text-[10px] text-red-400 font-bold mt-1">Score: {riskScore.toFixed(1)} / 100</div>
          </div>

          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5">
            <span className="text-[10px] text-gray-400 block font-bold">AI CONFIDENCE SCORE</span>
            <div className="font-extrabold text-emerald-400 text-base">{confidenceScore.toFixed(1)}%</div>
            <div className="text-[10px] text-emerald-300">High Reliability</div>
          </div>

          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5 col-span-2">
            <span className="text-[10px] text-gray-400 block font-bold">SUPERVISOR STATUS</span>
            <div className="font-bold text-white text-xs truncate">AUTOMATED TELEMETRY EVALUATED</div>
            <div className="text-[10px] text-gray-400">Zero manual override needed</div>
          </div>
        </div>
      </div>

      {/* 2. INCIDENT SUMMARY CARD */}
      <div className="bg-gradient-to-r from-panel-container via-black/60 to-panel-container border border-amber-500/30 rounded-sm p-4 space-y-2.5">
        <div className="flex items-center gap-2 border-b border-hud pb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-display font-bold text-xs text-amber-300 uppercase tracking-wider">
            AI SITUATION EXECUTIVE SUMMARY
          </h3>
        </div>
        <p className="text-gray-200 text-xs leading-relaxed font-sans">
          {incData?.executive_summary ||
            `Automated surveillance analysis in ${districtName} detected an anomalous surge in acute fever and respiratory illness indicators. Multi-channel signal fusion correlates heightened IDSP symptom reports with elevated hospital triage occupancy and accelerated pharmacy OTC sales, warranting immediate field containment protocols.`}
        </p>
      </div>

      {/* 3. SIGNAL FUSION BREAKDOWN */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-primary" />
            <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
              MULTISENSORY SIGNAL FUSION BREAKDOWN
            </h3>
          </div>
          <span className="text-[10px] text-gray-400">AI SIGNAL CORRELATION ENGINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {signals.map((sig, idx) => {
            const IconComp = sig.icon;
            return (
              <div key={idx} className="bg-black/50 border border-hud p-3 rounded-sm space-y-2 hover:border-gray-500 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <IconComp className="w-4 h-4 text-cyan-primary" />
                    <span className="font-bold text-white text-xs">{sig.title}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 border border-hud ${sig.color}`}>
                    {sig.impact}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] border-t border-b border-hud py-1">
                  <span className="text-gray-300 font-bold">{sig.status}</span>
                  <span className="text-gray-400">Weight: <strong className="text-white">{sig.weight}</strong></span>
                </div>
                <p className="text-[10px] text-gray-400 leading-normal">{sig.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. INCIDENT TIMELINE & 5. AI AGENT ACTIVITY PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Visual Timeline */}
        <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-hud pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-primary" />
              <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                INCIDENT EVALUATION TIMELINE
              </h3>
            </div>
            <span className="text-[10px] text-gray-400">CHRONOLOGICAL DISPATCH SEQUENCE</span>
          </div>

          <div className="space-y-3 pl-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-hud">
            <div className="flex items-start gap-3 relative z-10">
              <span className="w-3 h-3 rounded-full bg-cyan-primary ring-4 ring-black mt-1" />
              <div>
                <span className="text-[10px] text-cyan-primary font-bold">08:00 hrs — Feeds Ingested</span>
                <p className="text-gray-300 text-xs">Surveillance sensors ingested real-time IDSP, AQI, and hospital occupancy feeds.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 relative z-10">
              <span className="w-3 h-3 rounded-full bg-amber-400 ring-4 ring-black mt-1" />
              <div>
                <span className="text-[10px] text-amber-300 font-bold">10:30 hrs — Anomaly Correlated</span>
                <p className="text-gray-300 text-xs">Signal Fusion Engine flagged statistical spike in acute fever cases exceeding baseline threshold.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 relative z-10">
              <span className="w-3 h-3 rounded-full bg-red-400 ring-4 ring-black mt-1" />
              <div>
                <span className="text-[10px] text-red-400 font-bold">12:15 hrs — Incident Escalated</span>
                <p className="text-gray-300 text-xs">Severity scored at {riskScore.toFixed(1)} / 100. Automated Critical Alert generated.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 relative z-10">
              <span className="w-3 h-3 rounded-full bg-emerald-400 ring-4 ring-black mt-1" />
              <div>
                <span className="text-[10px] text-emerald-400 font-bold">14:00 hrs — Response Formulated</span>
                <p className="text-gray-300 text-xs">Resource demand formulas calculated & operational action plan generated for district officer sign-off.</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Execution Log */}
        <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-hud pb-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-primary" />
              <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
                AUTONOMOUS AGENT EXECUTION LOG
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              ALL AGENTS ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-300">
            <div className="p-2 bg-black/40 border border-hud rounded flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Surveillance Agent:</strong> Monitored incoming symptom indicators across 7 data channels.
              </div>
            </div>

            <div className="p-2 bg-black/40 border border-hud rounded flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Pattern Detection Agent:</strong> Identified abnormal spatial cluster in {districtName}.
              </div>
            </div>

            <div className="p-2 bg-black/40 border border-hud rounded flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Signal Fusion Agent:</strong> Combined multi-source data (Weather, Pharmacy, ICU Load).
              </div>
            </div>

            <div className="p-2 bg-black/40 border border-hud rounded flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Risk Assessment Agent:</strong> Calculated severity score ({riskScore.toFixed(1)}/100) & confidence ({confidenceScore.toFixed(1)}%).
              </div>
            </div>

            <div className="p-2 bg-black/40 border border-hud rounded flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Response Agent:</strong> Synthesized targeted operational recommendations & resource request draft.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. RECOMMENDED RESPONSE ACTIONS */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-cyan-primary" />
            <h3 className="font-display font-bold text-xs text-white uppercase tracking-wider">
              RECOMMENDED OPERATIONAL NEXT ACTIONS
            </h3>
          </div>
          <span className="text-[10px] text-amber-300 font-bold">PRIORITIZED FOR IMMEDIATE EXECUTION</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recs.slice(0, 4).map((recText, rIdx) => {
            const priorityNum = rIdx + 1;
            const colors = [
              "border-red-500/50 bg-red-950/20 text-red-300",
              "border-amber-500/40 bg-amber-950/20 text-amber-300",
              "border-cyan-primary/40 bg-cyan-950/20 text-cyan-200",
              "border-emerald-500/40 bg-emerald-950/20 text-emerald-200",
            ];
            const badgeColors = [
              "bg-red-500 text-black font-extrabold",
              "bg-amber-400 text-black font-extrabold",
              "bg-cyan-primary text-black font-extrabold",
              "bg-emerald-400 text-black font-extrabold",
            ];

            return (
              <div
                key={rIdx}
                className={`border p-3 rounded-sm space-y-2 flex flex-col justify-between ${colors[rIdx % colors.length]}`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${badgeColors[rIdx % badgeColors.length]}`}>
                      PRIORITY {priorityNum}
                    </span>
                    <span className="text-[10px] opacity-75">Action #{priorityNum}</span>
                  </div>
                  <p className="text-xs leading-relaxed font-sans">{recText}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
