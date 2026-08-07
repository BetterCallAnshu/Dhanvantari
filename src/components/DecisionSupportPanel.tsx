import React from "react";
import {
  Boxes,
  Calculator,
  Tent,
  ArrowRightLeft,
  Pill,
  UserCheck,
  Stethoscope,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { DistrictSummary, CycleState } from "../types";

interface DecisionSupportPanelProps {
  summary: DistrictSummary;
  cycleState: CycleState;
  onSelectDistrict: (district: string) => void;
}

export const DecisionSupportPanel: React.FC<DecisionSupportPanelProps> = ({
  summary,
  cycleState,
  onSelectDistrict,
}) => {
  if (!summary) return null;

  const resReport = cycleState.reports?.resource_summaries?.[summary.district]?.json;
  const redistributions = cycleState.reports?.priority_report?.json?.medicine_redistribution_transfers || [];

  const sub = summary.sub_scores;
  const pop = summary.demographics?.population || 1000000;
  const popWeight = Math.max(0.5, pop / 1000000.0);

  // Deterministic calculations
  let ors = Math.floor(sub.hospital * popWeight * 8);
  let doctors = Math.max(2, Math.floor(sub.hospital * 0.2));
  let kits = Math.floor(sub.disease * 20);
  let nets = Math.floor((sub.weather + sub.disease) * 2);
  let iv = Math.floor(sub.hospital * 3);

  // Floor guarantees if risk >= 75
  if (summary.risk_score >= 75.0) {
    ors = Math.max(ors, 500);
    doctors = Math.max(doctors, 12);
    kits = Math.max(kits, 1500);
    iv = Math.max(iv, 200);
    nets = Math.max(nets, 300);
  }

  const campTriggered = resReport?.camp_recommendation?.triggered || summary.risk_score >= 75;
  const campSummary = resReport?.camp_recommendation?.summary || "Standard hospital capacity sufficient.";
  const campLocations = resReport?.camp_recommendation?.suggested_locations || [];

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hud">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-cyan-primary/10 border border-cyan-primary/30">
            <Boxes className="w-5 h-5 text-cyan-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-white tracking-wide">
              DECISION SUPPORT & RESOURCE DEMAND ALLOCATOR
            </h3>
            <p className="text-xs font-mono text-gray-400">
              Evaluated Ward: <span className="text-cyan-primary font-bold">{summary.district}</span>
              {" | "}
              <span className="text-gray-400">Risk: </span>
              <span className="text-amber-300 font-bold">{summary.risk_score.toFixed(1)} / 100</span>
            </p>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/40 text-amber-300 font-mono text-xs px-3 py-1 rounded-sm font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>STATUS: DRAFT — PENDING APPROVAL</span>
        </div>
      </div>

      {/* 1. Transparent Formulas Notice Banner */}
      <div className="bg-black/40 border border-hud p-3.5 rounded-sm font-mono text-xs space-y-2.5">
        <div className="flex items-center justify-between text-gray-400 font-bold border-b border-hud pb-2">
          <span className="flex items-center gap-2 text-cyan-primary text-xs">
            <Calculator className="w-4 h-4" />
            DETERMINISTIC RESOURCE DEMAND FORMULAS
          </span>
          <span className="text-[10px] text-gray-500">EXPLICIT MATHEMATICAL MODEL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-gray-300">
          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-gray-400 block text-[10px] font-bold">ORS PACKETS</span>
            <code className="text-cyan-primary font-bold">Hospital Score × Pop Weight × 8</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-gray-400 block text-[10px] font-bold">MEDICAL DOCTORS</span>
            <code className="text-cyan-primary font-bold">Hospital Score × 0.2</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-gray-400 block text-[10px] font-bold">RAPID TEST KITS</span>
            <code className="text-cyan-primary font-bold">Disease Score × 20</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-gray-400 block text-[10px] font-bold">MOSQUITO NETS</span>
            <code className="text-cyan-primary font-bold">(Weather + Disease Score) × 2</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-gray-400 block text-[10px] font-bold">IV FLUIDS (RL/NS)</span>
            <code className="text-cyan-primary font-bold">Hospital Score × 3</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud text-[10px] text-amber-300">
            <span className="text-gray-400 block text-[10px] font-bold">FLOOR GUARANTEE</span>
            <span>Triggered when Risk Score ≥ 75.0</span>
          </div>
        </div>
      </div>

      {/* 2. Calculated Quantities Table */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <Pill className="w-4 h-4 text-cyan-primary" />
            CALCULATED RESOURCE ALLOCATION DEMAND — {summary.district.toUpperCase()}
          </h4>
          <span className="font-mono text-[10px] text-gray-400">
            POPULATION: {(pop).toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-hud text-gray-400 text-[10px] uppercase bg-black/50">
                <th className="p-2.5">Resource Item</th>
                <th className="p-2.5">Calculated Quantity</th>
                <th className="p-2.5">Priority Level</th>
                <th className="p-2.5">Applied Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hud">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-bold text-white flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-cyan-primary" />
                  <span>ORS Packets</span>
                </td>
                <td className="p-2.5 font-extrabold text-cyan-primary text-sm">
                  {ors.toLocaleString()} <span className="text-xs font-normal text-gray-400">units</span>
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded-sm bg-cyan-primary/10 border border-cyan-primary/30 text-cyan-primary text-[10px] font-bold">
                    {summary.risk_score >= 60 ? "HIGH" : "MEDIUM"}
                  </span>
                </td>
                <td className="p-2.5 text-gray-400 text-[10px]">Hospital Score × Pop Weight × 8</td>
              </tr>

              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-3.5 h-3.5 text-amber-400" />
                  <span>Emergency Doctors</span>
                </td>
                <td className="p-2.5 font-extrabold text-cyan-primary text-sm">
                  {doctors} <span className="text-xs font-normal text-gray-400">personnel</span>
                </td>
                <td className="p-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-sm border text-[10px] font-bold ${
                      summary.risk_score >= 75
                        ? "bg-red-500/20 border-red-500/50 text-red-400 glow-red"
                        : "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    }`}
                  >
                    {summary.risk_score >= 75 ? "URGENT" : "HIGH"}
                  </span>
                </td>
                <td className="p-2.5 text-gray-400 text-[10px]">Hospital Score × 0.2</td>
              </tr>

              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-bold text-white flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rapid Test Kits</span>
                </td>
                <td className="p-2.5 font-extrabold text-cyan-primary text-sm">
                  {kits.toLocaleString()} <span className="text-xs font-normal text-gray-400">kits</span>
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded-sm bg-cyan-primary/10 border border-cyan-primary/30 text-cyan-primary text-[10px] font-bold">
                    {sub.disease >= 50 ? "HIGH" : "MEDIUM"}
                  </span>
                </td>
                <td className="p-2.5 text-gray-400 text-[10px]">Disease Outbreak Score × 20</td>
              </tr>

              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-bold text-white flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-cyan-primary" />
                  <span>IV Fluids (RL/NS)</span>
                </td>
                <td className="p-2.5 font-extrabold text-cyan-primary text-sm">
                  {iv.toLocaleString()} <span className="text-xs font-normal text-gray-400">bottles</span>
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded-sm bg-cyan-primary/10 border border-cyan-primary/30 text-cyan-primary text-[10px] font-bold">
                    {summary.risk_score >= 60 ? "HIGH" : "MEDIUM"}
                  </span>
                </td>
                <td className="p-2.5 text-gray-400 text-[10px]">Hospital Score × 3</td>
              </tr>

              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                  <span>Mosquito Nets</span>
                </td>
                <td className="p-2.5 font-extrabold text-cyan-primary text-sm">
                  {nets.toLocaleString()} <span className="text-xs font-normal text-gray-400">nets</span>
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded-sm bg-cyan-primary/10 border border-cyan-primary/30 text-cyan-primary text-[10px] font-bold">
                    {sub.weather >= 60 ? "HIGH" : "MEDIUM"}
                  </span>
                </td>
                <td className="p-2.5 text-gray-400 text-[10px]">(Weather + Disease) × 2</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Emergency Mobile Camp Mobilization Box */}
      <div
        className={`border p-4 rounded-sm font-mono text-xs space-y-3 ${
          campTriggered
            ? "bg-red-950/20 border-red-500/50 glow-red text-red-200"
            : "bg-panel-container border-hud text-gray-300"
        }`}
      >
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <Tent className={`w-4 h-4 ${campTriggered ? "text-red-400" : "text-emerald-400"}`} />
            <span className="font-display font-bold text-xs text-white tracking-wide uppercase">
              EMERGENCY MOBILE CAMP MOBILIZATION
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-sm text-[10px] font-bold border ${
              campTriggered
                ? "bg-red-500/20 text-red-400 border-red-500/50 glow-red"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
            }`}
          >
            {campTriggered ? "MOBILIZATION TRIGGERED" : "NOT REQUIRED"}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-gray-200">{campSummary}</p>

        {campLocations.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-gray-400 text-[10px] font-bold block uppercase tracking-wider">
              SUGGESTED MOBILIZATION HUBS:
            </span>
            <div className="flex flex-wrap gap-2">
              {campLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-sm bg-black/50 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-1.5"
                >
                  <span>{loc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Inter-District Medicine Redistribution Matrix */}
      <div className="bg-panel-container border border-hud p-4 rounded-sm space-y-3">
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-primary" />
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">
              INTER-DISTRICT MEDICINE REDISTRIBUTION TRANSFERS
            </h4>
          </div>
          <span className="text-[10px] font-mono text-gray-400">SURPLUS LOW RISK → DEFICIT HIGH RISK</span>
        </div>

        {redistributions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs">
            {redistributions.map((tr, idx) => (
              <div
                key={idx}
                className="p-3 bg-black/50 border border-hud rounded-sm space-y-1.5 hover:border-gray-500 transition-all"
              >
                <div className="flex items-center justify-between gap-2 border-b border-hud pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">{tr.from_district}</span>
                    <span className="text-cyan-primary font-bold">→</span>
                    <span className="text-red-400 font-bold">{tr.to_district}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-sm bg-cyan-primary/20 text-cyan-primary border border-cyan-primary/40 font-bold text-[10px]">
                    {tr.quantity}
                  </span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">{tr.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-gray-400 italic">
            No inter-district transfers required; supply levels balanced across monitored wards.
          </p>
        )}
      </div>
    </div>
  );
};

