import React, { useState } from "react";
import {
  FileCheck,
  Download,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Eye,
  Code2,
} from "lucide-react";
import { DistrictSummary, CycleState } from "../types";
import { FormattedMarkdown } from "./FormattedMarkdown";
import { DistrictPriorityIntelligenceDashboard } from "./DistrictPriorityIntelligenceDashboard";
import { IncidentReportIntelligenceDashboard } from "./IncidentReportIntelligenceDashboard";

interface IncidentReportViewerProps {
  summary: DistrictSummary;
  cycleState: CycleState;
  onSelectDistrict: (district: string) => void;
}

export const IncidentReportViewer: React.FC<IncidentReportViewerProps> = ({
  summary,
  cycleState,
  onSelectDistrict,
}) => {
  const [reportType, setReportType] = useState<"incident" | "priority" | "resource">("incident");
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [copied, setCopied] = useState<boolean>(false);

  if (!summary || !cycleState.reports) return null;

  const district = summary.district;
  const reports = cycleState.reports;

  let currentMarkdown = "";
  let reportTitle = "";

  if (reportType === "incident") {
    currentMarkdown = reports.incident_reports?.[district]?.markdown || "";
    reportTitle = `EPIDEMIOLOGICAL INCIDENT REPORT — ${district.toUpperCase()}`;
  } else if (reportType === "priority") {
    currentMarkdown = reports.priority_report?.markdown || "";
    reportTitle = "DISTRICT PRIORITIZATION REPORT — NATIONAL OVERVIEW";
  } else {
    currentMarkdown = reports.resource_summaries?.[district]?.markdown || "";
    reportTitle = `RESOURCE ALLOCATION REQUEST — ${district.toUpperCase()}`;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentMarkdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportType}_report_${district}_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-4">
      {/* Draft Watermark Top Banner */}
      <div className="bg-amber-500/10 border border-amber-500/40 p-2.5 rounded-sm flex items-center justify-between text-amber-300 font-mono text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span className="font-bold">OFFICIAL OPERATIONAL DRAFT — PENDING DISTRICT HEALTH OFFICER SIGN-OFF</span>
        </div>
        <span className="text-[10px] text-gray-400">CYCLE: {cycleState.cycle_id}</span>
      </div>

      {/* Controls & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hud pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setReportType("incident")}
            className={`px-3 py-1.5 rounded-sm border transition-all ${
              reportType === "incident"
                ? "bg-cyan-primary/20 border-cyan-primary text-cyan-primary font-bold glow-cyan"
                : "bg-black/40 border-hud text-gray-400 hover:text-white"
            }`}
          >
            Incident Report
          </button>

          <button
            onClick={() => setReportType("resource")}
            className={`px-3 py-1.5 rounded-sm border transition-all ${
              reportType === "resource"
                ? "bg-cyan-primary/20 border-cyan-primary text-cyan-primary font-bold glow-cyan"
                : "bg-black/40 border-hud text-gray-400 hover:text-white"
            }`}
          >
            Resource Allocation
          </button>

          <button
            onClick={() => setReportType("priority")}
            className={`px-3 py-1.5 rounded-sm border transition-all ${
              reportType === "priority"
                ? "bg-cyan-primary/20 border-cyan-primary text-cyan-primary font-bold glow-cyan"
                : "bg-black/40 border-hud text-gray-400 hover:text-white"
            }`}
          >
            Priority Matrix Intelligence
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Formatted vs Raw Mode Switcher */}
          <div className="flex items-center bg-black/50 border border-hud rounded-sm p-0.5">
            <button
              onClick={() => setViewMode("formatted")}
              className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1 rounded-xs transition-all ${
                viewMode === "formatted"
                  ? "bg-cyan-primary/20 text-cyan-primary font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Formatted</span>
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1 rounded-xs transition-all ${
                viewMode === "raw"
                  ? "bg-cyan-primary/20 text-cyan-primary font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Raw MD</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-black/40 border border-hud hover:border-gray-500 text-gray-300 font-mono text-xs transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "COPIED" : "COPY MD"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-cyan-primary/20 hover:bg-cyan-primary/30 border border-cyan-primary text-cyan-primary font-mono text-xs font-bold transition-all glow-cyan"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT (.MD)</span>
          </button>
        </div>
      </div>

      {/* Main Content View */}
      {reportType === "priority" && viewMode === "formatted" ? (
        <DistrictPriorityIntelligenceDashboard
          districtSummaries={cycleState.district_summaries}
          rankedDistricts={cycleState.ranked_districts}
          selectedDistrict={district}
          onSelectDistrict={onSelectDistrict}
          cycleState={cycleState}
        />
      ) : reportType === "incident" && viewMode === "formatted" ? (
        <IncidentReportIntelligenceDashboard
          summary={summary}
          cycleState={cycleState}
          onSelectDistrict={onSelectDistrict}
        />
      ) : (
        /* Report Document Preview Box */
        <div className="bg-black/60 border border-hud rounded-sm p-5 font-mono text-xs text-gray-200 overflow-x-auto max-h-[650px] space-y-3 leading-relaxed border-l-4 border-l-cyan-primary">
          <div className="text-gray-500 text-[10px] uppercase border-b border-hud pb-2 flex justify-between items-center">
            <span className="font-bold text-gray-300 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-cyan-primary" />
              {reportTitle}
            </span>
            <span>CYC ID: {cycleState.cycle_id}</span>
          </div>

          {viewMode === "formatted" ? (
            <FormattedMarkdown content={currentMarkdown} />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs text-gray-300 leading-relaxed bg-black/40 p-3 rounded border border-hud">
              {currentMarkdown}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};


