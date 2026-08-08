import React, { useState } from "react";
import {
  Download,
  Copy,
  Check,
  ShieldCheck,
  FileText,
  Eye,
  Code2,
  Printer,
} from "lucide-react";
import { DistrictSummary, CycleState } from "../types";
import { FormattedMarkdown } from "./FormattedMarkdown";
import { DistrictPriorityIntelligenceDashboard } from "./DistrictPriorityIntelligenceDashboard";
import { IncidentReportIntelligenceDashboard } from "./IncidentReportIntelligenceDashboard";
import {
  exportPublicHealthIncidentReportHTML,
  exportResourceAllocationReportHTML,
} from "../utils/agentTaskReportExporter";

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

  const handlePDFExport = () => {
    if (reportType === "resource") {
      exportResourceAllocationReportHTML(summary, cycleState);
    } else {
      exportPublicHealthIncidentReportHTML(summary, cycleState);
    }
  };

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-4 font-sans text-xs">
      {/* Draft Watermark Top Banner */}
      <div className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-sm flex items-center justify-between text-zinc-300 font-mono text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
          <span className="font-semibold">OFFICIAL OPERATIONAL DRAFT — PENDING DISTRICT HEALTH OFFICER SIGN-OFF</span>
        </div>
        <span className="text-[10px] text-zinc-400">CYCLE: {cycleState.cycle_id}</span>
      </div>

      {/* Controls & Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hud pb-3">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setReportType("incident")}
            className={`px-3 py-1.5 rounded-sm border transition-all ${
              reportType === "incident"
                ? "bg-zinc-800 border-zinc-600 text-white font-semibold"
                : "bg-black/40 border-hud text-zinc-400 hover:text-white"
            }`}
          >
            Incident Report
          </button>

          <button
            onClick={() => setReportType("resource")}
            className={`px-3 py-1.5 rounded-sm border transition-all ${
              reportType === "resource"
                ? "bg-zinc-800 border-zinc-600 text-white font-semibold"
                : "bg-black/40 border-hud text-zinc-400 hover:text-white"
            }`}
          >
            Resource Allocation
          </button>

          <button
            onClick={() => setReportType("priority")}
            className={`px-3 py-1.5 rounded-sm border transition-all ${
              reportType === "priority"
                ? "bg-zinc-800 border-zinc-600 text-white font-semibold"
                : "bg-black/40 border-hud text-zinc-400 hover:text-white"
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
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Formatted</span>
            </button>
            <button
              onClick={() => setViewMode("raw")}
              className={`px-2 py-1 text-[11px] font-mono flex items-center gap-1 rounded-xs transition-all ${
                viewMode === "raw"
                  ? "bg-zinc-800 text-white font-semibold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3 h-3" />
              <span>Raw MD</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-black/40 border border-hud hover:border-zinc-500 text-zinc-300 font-mono text-xs transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "COPIED" : "COPY MD"}</span>
          </button>

          <button
            onClick={handlePDFExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 hover:text-white font-mono text-xs font-semibold transition-all cursor-pointer shadow-xs"
            title="Export human-readable executive report as printable A4 PDF"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>EXPORT PDF / PRINT</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-mono text-xs font-semibold transition-all"
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
        <div className="bg-black/60 border border-hud rounded-sm p-5 font-mono text-xs text-zinc-200 overflow-x-auto max-h-[650px] space-y-3 leading-relaxed border-l-4 border-l-zinc-500">
          <div className="text-zinc-500 text-[10px] uppercase border-b border-hud pb-2 flex justify-between items-center">
            <span className="font-semibold text-zinc-300 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-zinc-300" />
              {reportTitle}
            </span>
            <span>CYC ID: {cycleState.cycle_id}</span>
          </div>

          {viewMode === "formatted" ? (
            <FormattedMarkdown content={currentMarkdown} />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-300 leading-relaxed bg-black/40 p-3 rounded border border-hud">
              {currentMarkdown}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
