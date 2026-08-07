import React from "react";
import {
  GitMerge,
  Radio,
  Layers,
  Calculator,
  Sparkles,
  ShieldAlert,
  FileCheck,
  CheckCircle,
} from "lucide-react";

export const PipelineFlowVisualizer: React.FC = () => {
  const pipelineNodes = [
    {
      title: "1. SURVEILLANCE FEEDS",
      desc: "Weather, IDSP, Hospital IPD, Pharmacy OTC, AQI, NDMA, RSS Feeds",
      icon: Radio,
      badge: "LIVE & CACHED",
      color: "border-cyan-primary text-cyan-primary bg-cyan-primary/10",
    },
    {
      title: "2. FUSION ENGINE",
      desc: "Combines 7 feeds into DistrictSnapshots enriched with Kaggle Census DB",
      icon: Layers,
      badge: "PURE PYTHON",
      color: "border-cyan-primary text-cyan-primary bg-cyan-primary/10",
    },
    {
      title: "3. RISK ENGINE",
      desc: "Computes sub-scores, overall risk, confidence %, deterministic rankings",
      icon: Calculator,
      badge: "ZERO GEMINI MATH",
      color: "border-amber-400 text-amber-400 bg-amber-500/10",
    },
    {
      title: "4. GEMINI REASONING",
      desc: "Translates scores to max 4-bullet reasoning trace & recommendations",
      icon: Sparkles,
      badge: "GEMINI 2.5 FLASH",
      color: "border-cyan-primary text-cyan-primary bg-cyan-primary/10",
    },
    {
      title: "5. SUPERVISOR & DECISION",
      desc: "Enforces policies, resource formulas, emergency camps, transfers",
      icon: ShieldAlert,
      badge: "DECISION SUPPORT",
      color: "border-amber-400 text-amber-400 bg-amber-500/10",
    },
    {
      title: "6. REPORTS & ALERTS",
      desc: "Generates JSON/MD reports with DRAFT watermark, fires critical alerts",
      icon: FileCheck,
      badge: "DRAFT WATERMARK",
      color: "border-emerald-400 text-emerald-400 bg-emerald-500/10",
    },
  ];

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-hud">
        <div className="flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-cyan-primary" />
          <h3 className="font-display font-bold text-base text-white">
            AUTONOMOUS PIPELINE ARCHITECTURE & DATA FLOW
          </h3>
        </div>
        <span className="font-mono text-xs text-gray-400 bg-black/40 px-2 py-0.5 rounded-sm border border-hud">
          END-TO-END AUTOMATED
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
        {pipelineNodes.map((node, idx) => {
          const Icon = node.icon;
          return (
            <div
              key={idx}
              className="bg-panel-container border border-hud p-3.5 rounded-sm space-y-2 relative group hover:border-cyan-primary transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-cyan-primary" />
                  <span className="font-bold text-white text-xs">{node.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-sm border text-[10px] font-bold ${node.color}`}>
                  {node.badge}
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">{node.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Rules & Mandates Box */}
      <div className="bg-black/40 border border-hud p-3.5 rounded-sm font-mono text-xs space-y-1.5 text-gray-300">
        <div className="font-bold text-cyan-primary text-xs uppercase flex items-center gap-1.5 border-b border-hud pb-1.5">
          <CheckCircle className="w-4 h-4 text-cyan-primary" />
          <span>STRICT SYSTEM ARCHITECTURAL MANDATES</span>
        </div>
        <div className="space-y-1 text-[11px] text-gray-300">
          <div>• Risk scores, sub-scores, rankings, and thresholds are 100% computed in Python.</div>
          <div>• Gemini 2.5 Flash strictly provides qualitative reasoning, explanations, and advice.</div>
          <div>• Gemini NEVER calculates or modifies numbers, scores, or district ordering.</div>
          <div>• Resource allocations use transparent, explicit deterministic formulas.</div>
          <div>• Every output is explicitly marked with "DRAFT - PENDING APPROVAL".</div>
        </div>
      </div>
    </div>
  );
};
