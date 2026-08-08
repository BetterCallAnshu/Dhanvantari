import React from "react";
import {
  ShieldAlert,
  Clock,
  Activity,
  Bot,
  Layers,
  Sparkles,
  Stethoscope,
  Pill,
  CloudSun,
  Send,
  Zap,
  Printer,
} from "lucide-react";
import { DistrictSummary, CycleState } from "../types";
import { useAgentTasks } from "../hooks/useAgentTasks";
import { AgentTaskCard } from "./AgentTaskCard";
import { exportPublicHealthIncidentReportHTML } from "../utils/agentTaskReportExporter";

interface IncidentReportIntelligenceDashboardProps {
  summary: DistrictSummary;
  cycleState: CycleState;
  onSelectDistrict?: (district: string) => void;
}

export const IncidentReportIntelligenceDashboard: React.FC<
  IncidentReportIntelligenceDashboardProps
> = ({ summary, cycleState }) => {
  const { tasks, toggleSource } = useAgentTasks(cycleState, summary?.district);
  const districtName = summary?.district || "Kamrup Metropolitan";
  const incData = cycleState?.reports?.incident_reports?.[districtName]?.json;
  const riskScore = summary?.risk_score || incData?.metadata?.risk_score || 75.0;
  const confidenceScore = summary?.confidence_score || incData?.metadata?.confidence || 91.8;

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
      case "HIGH SEVERITY":
        return "bg-red-950/80 text-red-200 border-red-700 font-semibold";
      case "MODERATE SEVERITY":
        return "bg-zinc-800 text-zinc-200 border-zinc-600 font-semibold";
      default:
        return "bg-zinc-900 text-zinc-300 border-zinc-700 font-semibold";
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
      status: subs.disease >= 70 ? "Spike Anomaly" : "Baseline Nominal",
      weight: "35%",
      impact: subs.disease >= 70 ? "HIGH IMPACT" : "MODERATE IMPACT",
      color: subs.disease >= 70 ? "text-red-300" : "text-zinc-300",
      icon: Activity,
      desc: "Elevated IDSP acute fever & respiratory symptom clusters",
    },
    {
      title: "Healthcare ICU Surge",
      status: subs.hospital >= 70 ? "Capacity Strain" : "Normal Beds",
      weight: "25%",
      impact: subs.hospital >= 70 ? "HIGH IMPACT" : "MODERATE IMPACT",
      color: subs.hospital >= 70 ? "text-red-300" : "text-zinc-300",
      icon: Stethoscope,
      desc: "Increased hospital ICU bed utilization & emergency triage load",
    },
    {
      title: "OTC Pharmacy Sales",
      status: subs.pharmacy >= 65 ? "Demand Spike" : "Stable Sales",
      weight: "20%",
      impact: subs.pharmacy >= 65 ? "MODERATE IMPACT" : "LOW IMPACT",
      color: subs.pharmacy >= 65 ? "text-zinc-300" : "text-zinc-400",
      icon: Pill,
      desc: "Surge in fever, antipyretic, & rehydration formulation sales",
    },
    {
      title: "Environmental & AQI Feeds",
      status: subs.weather >= 60 || subs.aqi >= 60 ? "Vector Climate Risk" : "Favorable",
      weight: "20%",
      impact: subs.weather >= 60 ? "MODERATE IMPACT" : "LOW IMPACT",
      color: subs.weather >= 60 ? "text-zinc-300" : "text-zinc-400",
      icon: CloudSun,
      desc: "High humidity & rainfall promoting vector proliferation conditions",
    },
  ];

  // Clinical intelligence
  const clinical = incData?.clinical_intelligence;

  // Recommendations list
  const recs =
    incData?.recommendations?.immediate || [
      "Consult district health officer",
      "Initiate surveillance",
    ];

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-5 font-mono text-xs">
      {/* 1. INCIDENT HEADER */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-hud pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded bg-red-950 border border-red-700">
                <ShieldAlert className="w-5 h-5 text-red-300" />
              </span>
              <h2 className="font-semibold text-lg text-white tracking-wide">
                PUBLIC HEALTH INCIDENT INTELLIGENCE REPORT
              </h2>
            </div>
            <p className="text-xs text-zinc-400 flex items-center gap-2">
              <span>National Outbreak Surveillance Network</span>
              <span>•</span>
              <span>ID: <strong className="text-white">{incidentId}</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => exportPublicHealthIncidentReportHTML(summary, cycleState)}
              className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 hover:text-white font-mono text-xs px-3 py-1 rounded-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Download formatted Public Health Incident PDF Report"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>EXPORT PDF REPORT</span>
            </button>

            <div className="bg-red-950/80 border border-red-700 text-red-200 px-3 py-1 rounded-sm font-semibold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-red-300 fill-red-300" />
              <span>ACTIVE INCIDENT • UNDER INVESTIGATION</span>
            </div>
            <div className="bg-black/50 border border-hud text-zinc-400 px-3 py-1 rounded-sm flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-300" />
              <span>DETECTED: {timestampStr}</span>
            </div>
          </div>
        </div>

        {/* Overview KPI Card Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-1">
          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5">
            <span className="text-[10px] text-zinc-400 block font-semibold">TARGET LOCATION</span>
            <div className="font-bold text-white text-base truncate">{districtName}</div>
            <div className="text-[10px] text-zinc-400">Ward Focus</div>
          </div>

          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5">
            <span className="text-[10px] text-zinc-400 block font-semibold">SYNDROME CATEGORY</span>
            <div className="font-semibold text-zinc-200 text-sm truncate">Acute Outbreak Cluster</div>
            <div className="text-[10px] text-zinc-400">Multi-source signal</div>
          </div>

          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5">
            <span className="text-[10px] text-zinc-400 block font-semibold">CURRENT SEVERITY</span>
            <div>
              <span className={`px-2 py-0.5 rounded-sm border text-[10px] inline-block ${getSeverityBadgeClass(severityLevelStr)}`}>
                {severityLevelStr}
              </span>
            </div>
            <div className="text-[10px] text-red-300 font-semibold mt-1">Score: {riskScore.toFixed(1)} / 100</div>
          </div>

          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5">
            <span className="text-[10px] text-zinc-400 block font-semibold">AI CONFIDENCE SCORE</span>
            <div className="font-bold text-zinc-200 text-base">{confidenceScore.toFixed(1)}%</div>
            <div className="text-[10px] text-zinc-400">High Reliability</div>
          </div>

          <div className="bg-black/50 border border-hud p-3 rounded-sm space-y-0.5 col-span-2">
            <span className="text-[10px] text-zinc-400 block font-semibold">SUPERVISOR STATUS</span>
            <div className="font-semibold text-white text-xs truncate">AUTOMATED TELEMETRY EVALUATED</div>
            <div className="text-[10px] text-zinc-400">Zero manual override needed</div>
          </div>
        </div>
      </div>

      {/* 2. AI SITUATION EXECUTIVE SUMMARY */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-2.5">
        <div className="flex items-center gap-2 border-b border-hud pb-2">
          <Sparkles className="w-4 h-4 text-zinc-300" />
          <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
            AI SITUATION EXECUTIVE SUMMARY
          </h3>
        </div>
        <p className="text-zinc-200 text-xs leading-relaxed font-sans">
          {incData?.executive_summary ||
            `Automated surveillance analysis in ${districtName} detected an anomalous surge in acute fever and respiratory illness indicators.`}
        </p>
      </div>

      {/* 2.5 MODEL-SPECIFIC CLINICAL INTELLIGENCE LAYER */}
      {clinical && (
        <div className="bg-panel-container border border-red-700/80 rounded-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-700/60 pb-2.5">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-red-300" />
              <h3 className="font-semibold text-xs text-red-200 uppercase tracking-wider">
                CLINICAL INTELLIGENCE — {clinical.relevant_disease || clinical.likely_disease}
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-red-950/80 border border-red-600 text-red-200 font-semibold self-start sm:self-auto">
              MODEL: {clinical.outbreak_model_name || incData?.metadata?.outbreak_model_name || "Vector-Borne Watch"}
            </span>
          </div>

          {/* 6-Part Human-Readable Interpretation Layer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-black/50 border border-red-900/60 p-3 rounded-sm space-y-1">
              <span className="text-red-300 font-semibold block text-[11px]">1. WHAT IS HAPPENING?</span>
              <p className="text-zinc-200 leading-relaxed">{clinical.clinical_situation || "Surveillance feeds register anomalous syndromic activity across local monitoring stations."}</p>
            </div>

            <div className="bg-black/50 border border-red-900/60 p-3 rounded-sm space-y-1">
              <span className="text-red-300 font-semibold block text-[11px]">2. WHY IT MATTERS</span>
              <p className="text-zinc-200 leading-relaxed">{clinical.why_it_matters || "Elevated clinical strain reduces healthcare absorption buffer and requires early intervention."}</p>
            </div>

            <div className="bg-black/50 border border-red-900/60 p-3 rounded-sm space-y-1">
              <span className="text-red-300 font-semibold block text-[11px]">3. KEY EVIDENCE & TELEMETRY SIGNALS</span>
              <p className="text-zinc-200 leading-relaxed">{clinical.key_evidence || "Correlated from real-time IDSP, pharmacy demand surges, and weather monitoring feeds."}</p>
            </div>

            <div className="bg-black/50 border border-red-900/60 p-3 rounded-sm space-y-1">
              <span className="text-red-300 font-semibold block text-[11px]">4. POTENTIAL HEALTH IMPACT</span>
              <p className="text-zinc-200 leading-relaxed">{clinical.potential_health_impact || "Potential surge in emergency department triage load and specialized bed admissions."}</p>
            </div>

            <div className="bg-black/50 border border-red-900/60 p-3 rounded-sm space-y-1">
              <span className="text-red-300 font-semibold block text-[11px]">5. WHAT TO MONITOR NEXT</span>
              <p className="text-zinc-200 leading-relaxed">{clinical.what_to_monitor || "Daily diagnostic positivity rates, hospital bed turnover, and OTC pharmacy sales."}</p>
            </div>

            <div className="bg-black/50 border border-red-900/60 p-3 rounded-sm space-y-1">
              <span className="text-red-300 font-semibold block text-[11px]">6. RECOMMENDED INTERVENTIONS</span>
              <p className="text-zinc-200 leading-relaxed">{clinical.recommended_response || "Pre-position medical supplies, issue public health advisories, and mobilize active surveillance."}</p>
            </div>
          </div>

          {/* Diagnostic Context & Model Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-red-900/40">
            <div className="bg-black/40 p-2.5 rounded border border-hud space-y-1">
              <span className="text-zinc-400 font-semibold block text-[10px]">RELEVANT SYNDROMES</span>
              <p className="text-white text-xs">{clinical.clinical_syndromes ? clinical.clinical_syndromes.join(", ") : "Acute Fever Cluster"}</p>
            </div>
            <div className="bg-black/40 p-2.5 rounded border border-hud space-y-1">
              <span className="text-zinc-400 font-semibold block text-[10px]">TRANSMISSION & INCUBATION</span>
              <p className="text-white text-xs">{clinical.transmission || "N/A"} ({clinical.incubation || "N/A"})</p>
            </div>
            <div className="bg-black/40 p-2.5 rounded border border-hud space-y-1">
              <span className="text-zinc-400 font-semibold block text-[10px]">KEY SYMPTOMS</span>
              <p className="text-white text-xs">{clinical.symptoms ? clinical.symptoms.join(", ") : "Fever, Body Ache"}</p>
            </div>
          </div>

          <div className="bg-red-950/40 p-3 rounded border border-red-800/60 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
            <div>
              <span className="text-red-300 font-semibold text-xs block">Public Health Citizen Advisory:</span>
              <p className="text-red-100 text-xs font-sans mt-0.5 leading-relaxed">{clinical.public_advisory}</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. SIGNAL FUSION BREAKDOWN */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-zinc-300" />
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
              MULTISENSORY SIGNAL FUSION BREAKDOWN
            </h3>
          </div>
          <span className="text-[10px] text-zinc-400">AI SIGNAL CORRELATION ENGINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {signals.map((sig, idx) => {
            const IconComp = sig.icon;
            return (
              <div key={idx} className="bg-black/50 border border-hud p-3 rounded-sm space-y-2 hover:border-zinc-500 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <IconComp className="w-4 h-4 text-zinc-300" />
                    <span className="font-semibold text-white text-xs">{sig.title}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded bg-black/60 border border-hud ${sig.color}`}>
                    {sig.impact}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] border-t border-b border-hud py-1">
                  <span className="text-zinc-300 font-semibold">{sig.status}</span>
                  <span className="text-zinc-400">Weight: <strong className="text-white">{sig.weight}</strong></span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal">{sig.desc}</p>
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
              <Clock className="w-4 h-4 text-zinc-300" />
              <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                INCIDENT EVALUATION TIMELINE
              </h3>
            </div>
            <span className="text-[10px] text-zinc-400">CHRONOLOGICAL DISPATCH SEQUENCE</span>
          </div>

          <div className="space-y-3 pl-2 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-hud">
            <div className="flex items-start gap-3 relative z-10">
              <span className="w-3 h-3 rounded-full bg-zinc-400 ring-4 ring-black mt-1" />
              <div>
                <span className="text-[10px] text-zinc-300 font-semibold">08:00 hrs — Feeds Ingested</span>
                <p className="text-zinc-300 text-xs">Surveillance sensors ingested real-time IDSP, AQI, and hospital occupancy feeds.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 relative z-10">
              <span className="w-3 h-3 rounded-full bg-zinc-400 ring-4 ring-black mt-1" />
              <div>
                <span className="text-[10px] text-zinc-300 font-semibold">10:30 hrs — Anomaly Correlated</span>
                <p className="text-zinc-300 text-xs">Signal Fusion Engine flagged statistical spike in acute fever cases exceeding baseline threshold.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 relative z-10">
              <span className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-black mt-1" />
              <div>
                <span className="text-[10px] text-red-300 font-semibold">12:15 hrs — Incident Escalated</span>
                <p className="text-zinc-300 text-xs">Severity scored at {riskScore.toFixed(1)} / 100. Automated Critical Alert generated.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 relative z-10">
              <span className="w-3 h-3 rounded-full bg-zinc-400 ring-4 ring-black mt-1" />
              <div>
                <span className="text-[10px] text-zinc-200 font-semibold">14:00 hrs — Response Formulated</span>
                <p className="text-zinc-300 text-xs">Resource demand formulas calculated & operational action plan generated for district officer sign-off.</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Tasks & Required Sources Pre-flight Check */}
        <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-hud pb-2">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-zinc-300" />
              <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
                AUTONOMOUS AGENT TASKS & REQUIRED SOURCES
              </h3>
            </div>
            <span className="text-[10px] text-zinc-300 font-semibold bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {tasks.filter((t) => t.sources.every((s) => s.completed)).length} / {tasks.length} READY FOR GENERATION
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {tasks.map((task) => (
              <AgentTaskCard
                key={task.id}
                task={task}
                onToggleSource={toggleSource}
                compact={true}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 6. RECOMMENDED RESPONSE ACTIONS */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-zinc-300" />
            <h3 className="font-semibold text-xs text-white uppercase tracking-wider">
              RECOMMENDED OPERATIONAL NEXT ACTIONS
            </h3>
          </div>
          <span className="text-[10px] text-zinc-300 font-semibold">PRIORITIZED FOR IMMEDIATE EXECUTION</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {recs.slice(0, 4).map((recText, rIdx) => {
            const priorityNum = rIdx + 1;

            return (
              <div
                key={rIdx}
                className="border border-zinc-700 bg-black/40 p-3 rounded-sm space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-white font-semibold border border-zinc-700">
                      PRIORITY {priorityNum}
                    </span>
                    <span className="text-[10px] text-zinc-400">Action #{priorityNum}</span>
                  </div>
                  <p className="text-xs leading-relaxed font-sans text-zinc-200">{recText}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
