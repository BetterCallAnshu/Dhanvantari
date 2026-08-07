import React, { useState } from "react";
import {
  ShieldAlert,
  Activity,
  Sparkles,
  Database,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  FileCheck,
  Megaphone,
  Copy,
  Check,
} from "lucide-react";
import { DistrictSummary } from "../types";

interface DistrictDetailInspectorProps {
  summary: DistrictSummary;
  onSelectTab: (tab: string) => void;
}

export const DistrictDetailInspector: React.FC<DistrictDetailInspectorProps> = ({
  summary,
  onSelectTab,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  if (!summary) return null;

  const getSeverityBadge = (level: string) => {
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

  const demo = summary.demographics;
  const reasoning = summary.reasoning;
  const sub = summary.sub_scores;

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-4">
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hud">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-xl text-white">
              {summary.district}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-sm border font-mono text-xs font-bold ${getSeverityBadge(
                summary.risk_level
              )}`}
            >
              {summary.risk_level}
            </span>
            <span className="bg-black/40 border border-hud text-gray-400 font-mono text-xs px-2 py-0.5 rounded-sm">
              RANK #{summary.rank}
            </span>
          </div>
          <div className="text-xs font-mono text-gray-400 mt-0.5">
            Epidemiological Surveillance & Intelligence Footprint
          </div>
        </div>

        {/* Big Risk Score Gauge Box */}
        <div className="flex items-center gap-4 bg-black/40 border border-hud p-2.5 rounded-sm font-mono">
          <div className="text-right">
            <div className="text-[10px] text-gray-400">OVERALL RISK SCORE</div>
            <div className="text-2xl font-extrabold text-cyan-primary">
              {summary.risk_score.toFixed(2)}
              <span className="text-xs text-gray-500 font-normal"> / 100</span>
            </div>
          </div>
          <div className="h-8 w-px bg-gray-800" />
          <div>
            <div className="text-[10px] text-gray-400">CONFIDENCE</div>
            <div className="text-lg font-bold text-emerald-400">
              {summary.confidence_score.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. Risk Sub-Scores Matrix */}
      <div>
        <div className="text-[11px] font-mono font-bold text-gray-400 mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-primary" />
          DETERMINISTIC SUB-SCORE BREAKDOWN
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs">
          <div className="bg-panel-container border border-hud p-2.5 rounded-sm">
            <div className="text-[10px] text-gray-400 mb-1">DISEASE OUTBREAK</div>
            <div className="text-lg font-bold text-amber-400">{sub.disease.toFixed(1)}</div>
            <div className="w-full h-1 bg-black rounded-full overflow-hidden mt-1">
              <div className="h-full bg-amber-400" style={{ width: `${sub.disease}%` }} />
            </div>
          </div>

          <div className="bg-panel-container border border-hud p-2.5 rounded-sm">
            <div className="text-[10px] text-gray-400 mb-1">HOSPITAL SURGE</div>
            <div className="text-lg font-bold text-amber-400">{sub.hospital.toFixed(1)}</div>
            <div className="w-full h-1 bg-black rounded-full overflow-hidden mt-1">
              <div className="h-full bg-amber-400" style={{ width: `${sub.hospital}%` }} />
            </div>
          </div>

          <div className="bg-panel-container border border-hud p-2.5 rounded-sm">
            <div className="text-[10px] text-gray-400 mb-1">WEATHER ANOMALY</div>
            <div className="text-lg font-bold text-cyan-primary">{sub.weather.toFixed(1)}</div>
            <div className="w-full h-1 bg-black rounded-full overflow-hidden mt-1">
              <div className="h-full bg-cyan-primary" style={{ width: `${sub.weather}%` }} />
            </div>
          </div>

          <div className="bg-panel-container border border-hud p-2.5 rounded-sm">
            <div className="text-[10px] text-gray-400 mb-1">PHARMACY DEMAND</div>
            <div className="text-lg font-bold text-cyan-primary">{sub.pharmacy.toFixed(1)}</div>
            <div className="w-full h-1 bg-black rounded-full overflow-hidden mt-1">
              <div className="h-full bg-cyan-primary" style={{ width: `${sub.pharmacy}%` }} />
            </div>
          </div>

          <div className="bg-panel-container border border-hud p-2.5 rounded-sm">
            <div className="text-[10px] text-gray-400 mb-1">AQI RISK</div>
            <div className="text-lg font-bold text-gray-300">{sub.aqi.toFixed(1)}</div>
            <div className="w-full h-1 bg-black rounded-full overflow-hidden mt-1">
              <div className="h-full bg-gray-400" style={{ width: `${sub.aqi}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Demographic & Hospital Capacity Context */}
      <div className="bg-black/30 border border-hud p-3 rounded-sm font-mono text-xs">
        <div className="text-[11px] font-bold text-gray-400 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-primary" />
            DEMOGRAPHIC & HEALTHCARE INFRASTRUCTURE
          </span>
          <span className="text-[10px] text-gray-500">CENSUS INDIA + HOSPITAL DATASET</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-gray-300">
          <div>
            <span className="text-gray-500 text-[10px] block">POPULATION:</span>
            <span className="font-bold text-white">
              {(demo?.population || 1000000).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] block">TOTAL BEDS:</span>
            <span className="font-bold text-white">
              {(demo?.total_beds || 2000).toLocaleString()} beds
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] block">ICU BEDS:</span>
            <span className="font-bold text-white">
              {demo?.icu_beds || 200} beds
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] block">HEALTHCARE INDEX:</span>
            <span className="font-bold text-cyan-primary">
              {demo?.healthcare_index?.toFixed(1) || "75.0"} / 100
            </span>
          </div>
        </div>
      </div>

      {/* 4. Gemini Reasoning Trace */}
      <div className="bg-panel-container border border-hud p-3.5 rounded-sm space-y-2">
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-primary" />
            <h4 className="font-display font-bold text-xs text-white">
              Epidemiological Reasoning
            </h4>
          </div>
          {reasoning?.is_fallback && (
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-sm border border-amber-500/30">
              DETERMINISTIC FALLBACK MODE
            </span>
          )}
        </div>

        {/* Narrative */}
        {reasoning?.incident_summary && (
          <p className="text-xs text-gray-300 italic leading-relaxed bg-black/40 p-2.5 rounded-sm border border-hud font-sans">
            "{reasoning.incident_summary}"
          </p>
        )}

        {/* Reasoning Trace Bullets */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="text-[10px] text-gray-400 font-bold uppercase">
            REASONING TRACE (MAX 4 BULLETS):
          </div>
          {reasoning?.reasoning_trace?.map((bullet, idx) => (
            <div key={idx} className="flex items-start gap-2 text-gray-300">
              <span className="text-cyan-primary font-bold">›</span>
              <span>{bullet}</span>
            </div>
          ))}
        </div>

        {/* Multi-Domain Recommendations */}
        <div className="space-y-1.5 font-mono text-xs pt-2 border-t border-hud">
          <div className="text-[10px] text-gray-400 font-bold uppercase flex items-center justify-between">
            <span>MULTI-DOMAIN ACTION RECOMMENDATIONS:</span>
            <span className="text-amber-400 font-bold">DRAFT — PENDING APPROVAL</span>
          </div>
          {reasoning?.recommendations?.map((rec, idx) => (
            <div
              key={idx}
              className="p-2 bg-black/30 border border-hud rounded-sm text-gray-300 text-[11px] leading-relaxed"
            >
              {rec}
            </div>
          ))}
        </div>
      </div>

      {/* 4.5. Citizen Safety & Dispatch Intelligence */}
      <div className="bg-panel-container border border-amber-500/30 p-3.5 rounded-sm space-y-3 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <h4 className="font-display font-bold text-xs text-amber-300 uppercase tracking-wider">
              Citizen Safety & Dispatch Intelligence
            </h4>
          </div>
          <span className="text-[9px] font-mono text-gray-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-sm border border-amber-500/20">
            CITIZEN-FACING DISPATCH
          </span>
        </div>

        {/* Public Advisory Statement */}
        {reasoning?.public_advisory && (
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase block font-mono">
              PUBLIC ADVISORY ALERT:
            </span>
            <div className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-sm text-amber-100 text-xs leading-relaxed font-sans font-bold shadow-sm">
              📢 {reasoning.public_advisory}
            </div>
          </div>
        )}

        {/* Do's and Don'ts Lists */}
        {reasoning?.dos_and_donts && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Do's List */}
            <div className="bg-emerald-950/10 border border-emerald-500/20 p-2.5 rounded-sm space-y-1.5">
              <span className="text-[9px] text-emerald-400 font-extrabold uppercase font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> RECOMMENDED ACTIONS (DO's)
              </span>
              <ul className="space-y-1 text-[11px] text-gray-300 list-none font-sans">
                {reasoning.dos_and_donts.dos?.map((doItem, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{doItem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Don'ts List */}
            <div className="bg-red-950/10 border border-red-500/20 p-2.5 rounded-sm space-y-1.5">
              <span className="text-[9px] text-red-400 font-extrabold uppercase font-mono flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> BEHAVIORS TO AVOID (DON'Ts)
              </span>
              <ul className="space-y-1 text-[11px] text-gray-300 list-none font-sans">
                {reasoning.dos_and_donts.donts?.map((dontItem, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-red-400 font-bold">✗</span>
                    <span>{dontItem}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* WhatsApp Broadcast Alert Box */}
        {reasoning?.whatsapp_message && (
          <div className="space-y-1 pt-1.5 border-t border-hud">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 font-bold uppercase block font-mono">
                WHATSAPP BROADCAST MESSAGE (COPY-READY):
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reasoning.whatsapp_message || "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2 py-0.5 rounded-sm bg-cyan-primary/20 hover:bg-cyan-primary/30 border border-cyan-primary text-[10px] text-cyan-primary font-bold flex items-center gap-1 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "COPIED!" : "COPY DISPATCH"}</span>
              </button>
            </div>
            {/* Mock Chat preview bubble */}
            <div className="bg-emerald-950/15 border border-emerald-500/25 p-3 rounded-sm font-sans text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto relative shadow-inner">
              <div className="absolute right-2 top-2 bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[8px] font-mono border border-emerald-500/20">
                WHATSAPP CHAT PREVIEW
              </div>
              {reasoning.whatsapp_message}
            </div>
          </div>
        )}
      </div>

      {/* 5. Quick Nav Link to Reports */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => onSelectTab("reports")}
          className="px-3 py-1.5 rounded-sm bg-cyan-primary/20 hover:bg-cyan-primary/30 border border-cyan-primary text-cyan-primary font-mono text-xs font-bold flex items-center gap-1.5 transition-all glow-cyan"
        >
          <FileCheck className="w-4 h-4" />
          <span>VIEW FULL INCIDENT & RESOURCE REPORT →</span>
        </button>
      </div>
    </div>
  );
};
