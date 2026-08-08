import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Bot,
  ListChecks,
  CheckSquare,
  Square,
  FileText,
  Clock,
  Layers,
  Printer,
} from "lucide-react";
import { AgentTask } from "../hooks/useAgentTasks";
import { HighlightText } from "./HighlightText";
import {
  exportAgentTaskHTMLReport,
} from "../utils/agentTaskReportExporter";

interface AgentTaskCardProps {
  task: AgentTask;
  onToggleSource: (taskId: string, sourceId: string) => void;
  searchQuery?: string;
  selectedSectionFilter?: string;
  compact?: boolean;
}

export const AgentTaskCard: React.FC<AgentTaskCardProps> = ({
  task,
  onToggleSource,
  searchQuery = "",
  selectedSectionFilter = "all",
  compact = false,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>("overview");

  // Sync active section when section filter changes
  useEffect(() => {
    if (selectedSectionFilter && selectedSectionFilter !== "all") {
      const matchSec = task.sections.find(
        (s) => s.title.toLowerCase() === selectedSectionFilter.toLowerCase()
      );
      if (matchSec) {
        setActiveSectionId(matchSec.id);
      }
    }
  }, [selectedSectionFilter, task.sections]);

  const completedCount = task.sources.filter((s) => s.completed).length;
  const totalCount = task.sources.length;
  const isReady = completedCount === totalCount;
  const missingCount = totalCount - completedCount;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const currentSection =
    task.sections.find((s) => s.id === activeSectionId) || task.sections[0];

  const getStatusBadgeClass = (status: AgentTask["status"]) => {
    switch (status) {
      case "Ready for Generation":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700/80";
      case "Pending Approval":
        return "bg-amber-950/80 text-amber-300 border-amber-700/80";
      case "Approved":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-700/80";
      case "In Progress":
        return "bg-blue-950/80 text-blue-300 border-blue-700/80";
      case "Missing Sources":
      default:
        return "bg-zinc-900 text-zinc-400 border-zinc-700/80";
    }
  };

  return (
    <div
      className={`bg-panel-container border transition-all rounded-sm p-4 space-y-3.5 text-xs ${
        isReady
          ? "border-zinc-600 bg-zinc-900/60 shadow-sm"
          : "border-zinc-700/80 bg-zinc-900/30"
      }`}
    >
      {/* Header: Title, Agent Badge & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hud pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-white text-sm flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
              <HighlightText text={task.title} match={searchQuery} />
            </span>
            <span className="px-2 py-0.5 rounded-xs bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-mono">
              <HighlightText text={task.agentName} match={searchQuery} />
            </span>
            {task.districtFocus && (
              <span className="text-[10px] text-zinc-400 bg-black/40 px-1.5 py-0.5 rounded-xs border border-hud font-mono">
                <HighlightText text={task.districtFocus} match={searchQuery} />
              </span>
            )}
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            <HighlightText text={task.description} match={searchQuery} />
          </p>
        </div>

        {/* Readiness Status, Completion Count & Export Report Action */}
        <div className="flex items-center sm:items-end flex-row sm:flex-col justify-between sm:justify-start gap-2 shrink-0 relative">
          <div className="flex items-center gap-2">
            <div
              className={`px-2.5 py-1 rounded-sm border font-medium text-[11px] flex items-center gap-1.5 ${getStatusBadgeClass(
                task.status
              )}`}
            >
              {isReady ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{task.status}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {missingCount} Source{missingCount > 1 ? "s" : ""} Missing
                  </span>
                </>
              )}
            </div>

            {/* Export Report Action Button */}
            <button
              type="button"
              onClick={() => exportAgentTaskHTMLReport(task)}
              className="px-2.5 py-1 rounded-sm bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 hover:text-white font-mono text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Export human-readable executive report as printable PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>EXPORT PDF</span>
            </button>
          </div>

          <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
            <span className={isReady ? "text-white font-semibold" : "text-zinc-400"}>
              {completedCount} / {totalCount} Feeds Available
            </span>
            <span className="text-zinc-500">({percent}%)</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-hud">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isReady ? "bg-emerald-400" : "bg-amber-500/80"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Task Content Sections Navigation */}
      <div className="space-y-2 pt-0.5">
        <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            Generated Task Sections
          </span>
          <span className="text-zinc-500 text-[9px]">Section-Level Content</span>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {task.sections.map((section) => {
            const isActive = section.id === activeSectionId;
            const matchesQuery =
              searchQuery.trim() !== "" &&
              (section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                section.content.toLowerCase().includes(searchQuery.toLowerCase()));

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`px-2.5 py-1 rounded-xs border text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-zinc-800 text-white border-zinc-500 shadow-xs"
                    : matchesQuery
                    ? "bg-amber-950/40 text-amber-200 border-amber-600/60"
                    : "bg-black/30 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <FileText className="w-3 h-3 text-zinc-400" />
                <HighlightText text={section.title} match={searchQuery} />
                {matchesQuery && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Section Generated Content Box */}
        {currentSection && (
          <div className="bg-black/40 border border-zinc-700/70 p-3 rounded-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-300 border-b border-zinc-800 pb-1">
              <span className="flex items-center gap-1 text-zinc-200 font-mono">
                <FileText className="w-3 h-3 text-emerald-400" />
                <HighlightText text={currentSection.title} match={searchQuery} />
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                Generated Content
              </span>
            </div>
            <p className="text-zinc-300 text-xs leading-relaxed font-sans pt-0.5">
              <HighlightText text={currentSection.content} match={searchQuery} />
            </p>
          </div>
        )}
      </div>

      {/* Required Sources Checklist Section */}
      <div className="space-y-2 pt-1 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
          <span className="flex items-center gap-1.5 text-zinc-300">
            <ListChecks className="w-3.5 h-3.5 text-zinc-400" />
            Required Data Feeds Checklist
          </span>
          <span className="text-zinc-500 text-[9px]">Pre-flight Input Verification</span>
        </div>

        <div
          className={`grid ${
            compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
          } gap-2 text-xs`}
        >
          {task.sources.map((source) => {
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => onToggleSource(task.id, source.id)}
                className={`flex items-center justify-between p-2.5 rounded-sm border text-left transition-all cursor-pointer select-none ${
                  source.completed
                    ? "bg-zinc-800/80 border-zinc-600 text-white hover:border-zinc-500"
                    : "bg-black/40 border-zinc-700/80 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  {source.completed ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500 shrink-0" />
                  )}
                  <span
                    className={`text-xs ${
                      source.completed ? "font-medium text-white" : "text-zinc-400"
                    }`}
                  >
                    <HighlightText text={source.label} match={searchQuery} />
                  </span>
                </div>

                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    source.completed
                      ? "bg-zinc-700 text-zinc-200 border border-zinc-600"
                      : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                  }`}
                >
                  {source.completed ? "AVAILABLE" : "MISSING"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
