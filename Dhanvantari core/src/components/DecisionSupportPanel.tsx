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
  Printer,
} from "lucide-react";
import { DistrictSummary, CycleState } from "../types";
import { exportResourceAllocationReportHTML } from "../utils/agentTaskReportExporter";

interface DecisionSupportPanelProps {
  summary: DistrictSummary;
  cycleState: CycleState;
  onSelectDistrict: (district: string) => void;
}

export const DecisionSupportPanel: React.FC<DecisionSupportPanelProps> = ({
  summary,
  cycleState,
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
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-5 text-xs font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hud">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-zinc-800 border border-zinc-700">
            <Boxes className="w-5 h-5 text-zinc-200" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white tracking-wide">
              DECISION SUPPORT & RESOURCE DEMAND ALLOCATOR
            </h3>
            <p className="text-xs font-mono text-zinc-400">
              Evaluated Ward: <span className="text-white font-semibold">{summary.district}</span>
              {" | "}
              <span className="text-zinc-400">Risk: </span>
              <span className="text-zinc-200 font-semibold">{summary.risk_score.toFixed(1)} / 100</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportResourceAllocationReportHTML(summary, cycleState)}
            className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 hover:text-white font-mono text-xs px-3 py-1.5 rounded-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Download formatted Resource Allocation & Logistics PDF Report"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXPORT RESOURCE PDF</span>
          </button>

          <div className="bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs px-3 py-1.5 rounded-sm font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span>STATUS: DRAFT — PENDING APPROVAL</span>
          </div>
        </div>
      </div>

      {/* 1. Transparent Formulas Notice Banner */}
      <div className="bg-black/40 border border-hud p-3.5 rounded-sm font-mono text-xs space-y-2.5">
        <div className="flex items-center justify-between text-zinc-400 font-semibold border-b border-hud pb-2">
          <span className="flex items-center gap-2 text-white text-xs">
            <Calculator className="w-4 h-4" />
            DETERMINISTIC RESOURCE DEMAND FORMULAS
          </span>
          <span className="text-[10px] text-zinc-500">EXPLICIT MATHEMATICAL MODEL</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-zinc-300">
          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-zinc-400 block text-[10px] font-semibold">ORS PACKETS</span>
            <code className="text-white font-semibold">Hospital Score × Pop Weight × 8</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-zinc-400 block text-[10px] font-semibold">MEDICAL DOCTORS</span>
            <code className="text-white font-semibold">Hospital Score × 0.2</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-zinc-400 block text-[10px] font-semibold">RAPID TEST KITS</span>
            <code className="text-white font-semibold">Disease Score × 20</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-zinc-400 block text-[10px] font-semibold">MOSQUITO NETS</span>
            <code className="text-white font-semibold">(Weather + Disease Score) × 2</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud">
            <span className="text-zinc-400 block text-[10px] font-semibold">IV FLUIDS (RL/NS)</span>
            <code className="text-white font-semibold">Hospital Score × 3</code>
          </div>

          <div className="bg-panel-container p-2.5 rounded-sm border border-hud text-[10px] text-zinc-300">
            <span className="text-zinc-400 block text-[10px] font-semibold">FLOOR GUARANTEE</span>
            <span>Triggered when Risk Score ≥ 75.0</span>
          </div>
        </div>
      </div>

      {/* 2. Calculated Quantities Table */}
      <div className="bg-panel-container border border-hud rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <h4 className="font-semibold text-xs text-white uppercase tracking-wider flex items-center gap-2">
            <Pill className="w-4 h-4 text-zinc-300" />
            CALCULATED RESOURCE ALLOCATION DEMAND — {summary.district.toUpperCase()}
          </h4>
          <span className="font-mono text-[10px] text-zinc-400">
            POPULATION: {(pop).toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-hud text-zinc-400 text-[10px] uppercase bg-black/50">
                <th className="p-2.5">Resource Item</th>
                <th className="p-2.5">Calculated Quantity</th>
                <th className="p-2.5">Priority Level</th>
                <th className="p-2.5">Applied Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hud">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-semibold text-white flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-zinc-400" />
                  <span>ORS Packets</span>
                </td>
                <td className="p-2.5 font-bold text-white text-sm">
                  {ors.toLocaleString()} <span className="text-xs font-normal text-zinc-400">units</span>
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] font-semibold">
                    {summary.risk_score >= 60 ? "HIGH" : "MEDIUM"}
                  </span>
                </td>
                <td className="p-2.5 text-zinc-400 text-[10px]">Hospital Score × Pop Weight × 8</td>
              </tr>

              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-semibold text-white flex items-center gap-2">
                  <Stethoscope className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Emergency Doctors</span>
                </td>
                <td className="p-2.5 font-bold text-white text-sm">
                  {doctors} <span className="text-xs font-normal text-zinc-400">personnel</span>
                </td>
                <td className="p-2.5">
                  <span
                    className={`px-2 py-0.5 rounded-sm border text-[10px] font-semibold ${
                      summary.risk_score >= 75
                        ? "bg-red-950/80 border-red-700 text-red-200"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300"
                    }`}
                  >
                    {summary.risk_score >= 75 ? "URGENT" : "HIGH"}
                  </span>
                </td>
                <td className="p-2.5 text-zinc-400 text-[10px]">Hospital Score × 0.2</td>
              </tr>

              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-semibold text-white flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Rapid Test Kits</span>
                </td>
                <td className="p-2.5 font-bold text-white text-sm">
                  {kits.toLocaleString()} <span className="text-xs font-normal text-zinc-400">kits</span>
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] font-semibold">
                    {sub.disease >= 50 ? "HIGH" : "MEDIUM"}
                  </span>
                </td>
                <td className="p-2.5 text-zinc-400 text-[10px]">Disease Outbreak Score × 20</td>
              </tr>

              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-semibold text-white flex items-center gap-2">
                  <Pill className="w-3.5 h-3.5 text-zinc-400" />
                  <span>IV Fluids (RL/NS)</span>
                </td>
                <td className="p-2.5 font-bold text-white text-sm">
                  {iv.toLocaleString()} <span className="text-xs font-normal text-zinc-400">bottles</span>
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] font-semibold">
                    {summary.risk_score >= 60 ? "HIGH" : "MEDIUM"}
                  </span>
                </td>
                <td className="p-2.5 text-zinc-400 text-[10px]">Hospital Score × 3</td>
              </tr>

              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-2.5 font-semibold text-white flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Mosquito Nets</span>
                </td>
                <td className="p-2.5 font-bold text-white text-sm">
                  {nets.toLocaleString()} <span className="text-xs font-normal text-zinc-400">nets</span>
                </td>
                <td className="p-2.5">
                  <span className="px-2 py-0.5 rounded-sm bg-zinc-800 border border-zinc-700 text-zinc-200 text-[10px] font-semibold">
                    {sub.weather >= 60 ? "HIGH" : "MEDIUM"}
                  </span>
                </td>
                <td className="p-2.5 text-zinc-400 text-[10px]">(Weather + Disease) × 2</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Emergency Mobile Camp Mobilization Box */}
      <div
        className={`border p-4 rounded-sm font-mono text-xs space-y-3 ${
          campTriggered
            ? "bg-red-950/20 border-red-700 text-red-200"
            : "bg-panel-container border-hud text-zinc-300"
        }`}
      >
        <div className="flex items-center justify-between border-b border-hud pb-2">
          <div className="flex items-center gap-2">
            <Tent className={`w-4 h-4 ${campTriggered ? "text-red-300" : "text-zinc-300"}`} />
            <span className="font-semibold text-xs text-white tracking-wide uppercase">
              EMERGENCY MOBILE CAMP MOBILIZATION
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-sm text-[10px] font-semibold border ${
              campTriggered
                ? "bg-red-900/80 text-red-200 border-red-700"
                : "bg-zinc-800 text-zinc-200 border-zinc-600"
            }`}
          >
            {campTriggered ? "MOBILIZATION TRIGGERED" : "NOT REQUIRED"}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-zinc-200">{campSummary}</p>

        {campLocations.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-zinc-400 text-[10px] font-semibold block uppercase tracking-wider">
              SUGGESTED MOBILIZATION HUBS:
            </span>
            <div className="flex flex-wrap gap-2">
              {campLocations.map((loc, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-sm bg-black/50 border border-red-700 text-red-300 text-xs font-mono flex items-center gap-1.5"
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
            <ArrowRightLeft className="w-4 h-4 text-zinc-300" />
            <h4 className="font-semibold text-xs text-white uppercase tracking-wider">
              INTER-DISTRICT MEDICINE REDISTRIBUTION TRANSFERS
            </h4>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">SURPLUS LOW RISK → DEFICIT HIGH RISK</span>
        </div>

        {redistributions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs">
            {redistributions.map((tr, idx) => (
              <div
                key={idx}
                className="p-3 bg-black/50 border border-hud rounded-sm space-y-1.5 hover:border-zinc-500 transition-all"
              >
                <div className="flex items-center justify-between gap-2 border-b border-hud pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-200 font-semibold">{tr.from_district}</span>
                    <span className="text-zinc-400 font-bold">→</span>
                    <span className="text-red-300 font-semibold">{tr.to_district}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-sm bg-zinc-800 text-zinc-200 border border-zinc-700 font-semibold text-[10px]">
                    {tr.quantity}
                  </span>
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">{tr.reason}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-zinc-400 italic">
            No inter-district transfers required; supply levels balanced across monitored wards.
          </p>
        )}
      </div>
    </div>
  );
};
