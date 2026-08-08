import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  RotateCcw,
  Bot,
  AlertTriangle,
  CheckCircle2,
  FileText,
  User,
  Database,
  XCircle,
  SlidersHorizontal,
} from "lucide-react";
import { useAgentTasks, AgentTask } from "../hooks/useAgentTasks";
import { AgentTaskCard } from "./AgentTaskCard";
import { CycleState } from "../types";

interface AgentTasksPanelProps {
  cycleState?: CycleState | null;
  selectedDistrict?: string;
}

export const AgentTasksPanel: React.FC<AgentTasksPanelProps> = ({
  cycleState,
  selectedDistrict,
}) => {
  const { tasks, toggleSource, resetToDefaults } = useAgentTasks(
    cycleState,
    selectedDistrict
  );

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAgent, setSelectedAgent] = useState<string>("all");
  const [selectedMissingData, setSelectedMissingData] = useState<string>("all");

  const activeDistrictName =
    selectedDistrict || cycleState?.highest_risk_district || "Kamrup Metropolitan";

  // Dynamic filter options derived directly from application data
  const availableSections = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      t.sections.forEach((s) => set.add(s.title));
    });
    return Array.from(set);
  }, [tasks]);

  const availableStatuses = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.status));
    return Array.from(set);
  }, [tasks]);

  const availableAgents = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => set.add(t.agentName));
    return Array.from(set);
  }, [tasks]);

  // Derived filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Search Query filter (searches titles, descriptions, agentName, focus, sources, and generated section content)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesAgent = task.agentName.toLowerCase().includes(query);
        const matchesDesc = task.description.toLowerCase().includes(query);
        const matchesFocus = (task.districtFocus || "").toLowerCase().includes(query);
        const matchesSources = task.sources.some((s) =>
          s.label.toLowerCase().includes(query)
        );
        const matchesSections = task.sections.some(
          (sec) =>
            sec.title.toLowerCase().includes(query) ||
            sec.content.toLowerCase().includes(query)
        );

        if (
          !matchesTitle &&
          !matchesAgent &&
          !matchesDesc &&
          !matchesFocus &&
          !matchesSources &&
          !matchesSections
        ) {
          return false;
        }
      }

      // 2. Section filter
      if (selectedSection !== "all") {
        const hasSection = task.sections.some(
          (sec) => sec.title.toLowerCase() === selectedSection.toLowerCase()
        );
        if (!hasSection) return false;
      }

      // 3. Status filter
      if (selectedStatus !== "all") {
        if (task.status.toLowerCase() !== selectedStatus.toLowerCase()) {
          return false;
        }
      }

      // 4. Agent / Owner filter
      if (selectedAgent !== "all") {
        if (task.agentName.toLowerCase() !== selectedAgent.toLowerCase()) {
          return false;
        }
      }

      // 5. Missing Data filter
      if (selectedMissingData !== "all") {
        if (selectedMissingData === "missing" && !task.hasMissingData) {
          return false;
        }
        if (selectedMissingData === "ready" && task.hasMissingData) {
          return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    searchQuery,
    selectedSection,
    selectedStatus,
    selectedAgent,
    selectedMissingData,
  ]);

  const totalTasksCount = tasks.length;
  const filteredCount = filteredTasks.length;
  const isFiltered =
    searchQuery.trim() !== "" ||
    selectedSection !== "all" ||
    selectedStatus !== "all" ||
    selectedAgent !== "all" ||
    selectedMissingData !== "all";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedSection("all");
    setSelectedStatus("all");
    setSelectedAgent("all");
    setSelectedMissingData("all");
  };

  const handleFullReset = () => {
    handleResetFilters();
    resetToDefaults();
  };

  return (
    <div className="space-y-4">
      {/* Panel Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-panel-container border border-zinc-700/80 p-4 rounded-sm">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Agent Task Intelligence & Pre-Flight Verification
            </h2>
          </div>
          <p className="text-zinc-400 text-xs mt-1">
            Dynamic surveillance checklist verifying input feed completeness, section content, and agent readiness for {activeDistrictName}.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleFullReset}
            className="px-3 py-1.5 rounded-sm bg-zinc-800 border border-zinc-600 hover:border-zinc-500 text-zinc-200 text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Reset Overrides</span>
          </button>
        </div>
      </div>

      {/* Active Focus District Banner */}
      <div className="bg-panel-container border border-zinc-700/80 p-3.5 rounded-sm space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-white border-b border-hud pb-1.5 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Active Focus Target: {activeDistrictName} Outbreak Assessment
          </span>
          <span className="bg-zinc-800 border border-zinc-600 text-zinc-200 px-2 py-0.5 rounded text-[10px]">
            {filteredCount} / {totalTasksCount} TASKS DISPLAYED
          </span>
        </div>
        <p className="text-zinc-400 text-xs leading-relaxed pt-0.5">
          Dynamic pre-flight checklist verifying required Open-Meteo weather API, IDSP surveillance, hospital capacity, and disaster alert feeds for {activeDistrictName}.
        </p>
      </div>

      {/* Section-Level Search & Compact Filter Toolbar */}
      <div className="bg-panel-container border border-zinc-700/80 p-3.5 rounded-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-white font-mono border-b border-hud pb-2">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
            Section-Level Content Search & Multi-Criteria Filtering
          </span>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-amber-400 hover:text-amber-300 text-[11px] flex items-center gap-1 font-mono transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>

        {/* Search & Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* 1. Search generated content */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search generated content..."
              className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-zinc-700 rounded-xs text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Section Filter */}
          <div className="relative">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full pl-2.5 pr-6 py-1.5 bg-black/60 border border-zinc-700 rounded-xs text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono appearance-none cursor-pointer"
            >
              <option value="all">Section: All ({availableSections.length})</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
            <FileText className="w-3 h-3 absolute right-2 top-3 text-zinc-500 pointer-events-none" />
          </div>

          {/* 3. Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-2.5 pr-6 py-1.5 bg-black/60 border border-zinc-700 rounded-xs text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono appearance-none cursor-pointer"
            >
              <option value="all">Status: All ({availableStatuses.length})</option>
              {availableStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <Filter className="w-3 h-3 absolute right-2 top-3 text-zinc-500 pointer-events-none" />
          </div>

          {/* 4. Owner / Agent Filter */}
          <div className="relative">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full pl-2.5 pr-6 py-1.5 bg-black/60 border border-zinc-700 rounded-xs text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono appearance-none cursor-pointer"
            >
              <option value="all">Agent: All ({availableAgents.length})</option>
              {availableAgents.map((ag) => (
                <option key={ag} value={ag}>
                  {ag}
                </option>
              ))}
            </select>
            <User className="w-3 h-3 absolute right-2 top-3 text-zinc-500 pointer-events-none" />
          </div>

          {/* 5. Missing Data Filter */}
          <div className="relative">
            <select
              value={selectedMissingData}
              onChange={(e) => setSelectedMissingData(e.target.value)}
              className="w-full pl-2.5 pr-6 py-1.5 bg-black/60 border border-zinc-700 rounded-xs text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono appearance-none cursor-pointer"
            >
              <option value="all">Data: All States</option>
              <option value="ready">All Data Ready</option>
              <option value="missing">Has Missing Data</option>
            </select>
            <Database className="w-3 h-3 absolute right-2 top-3 text-zinc-500 pointer-events-none" />
          </div>
        </div>

        {/* Active Filter Indicators */}
        {isFiltered && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-mono border-t border-zinc-800">
            <span className="text-zinc-400">Active Filters:</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-300 flex items-center gap-1">
                Query: "{searchQuery}"
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            {selectedSection !== "all" && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-emerald-300 flex items-center gap-1">
                Section: {selectedSection}
                <button
                  type="button"
                  onClick={() => setSelectedSection("all")}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            {selectedStatus !== "all" && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-cyan-300 flex items-center gap-1">
                Status: {selectedStatus}
                <button
                  type="button"
                  onClick={() => setSelectedStatus("all")}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            {selectedAgent !== "all" && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-indigo-300 flex items-center gap-1">
                Agent: {selectedAgent}
                <button
                  type="button"
                  onClick={() => setSelectedAgent("all")}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            {selectedMissingData !== "all" && (
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-amber-300 flex items-center gap-1">
                Data: {selectedMissingData === "ready" ? "All Ready" : "Has Missing"}
                <button
                  type="button"
                  onClick={() => setSelectedMissingData("all")}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-zinc-400 hover:text-white underline ml-auto text-[10px]"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Task List / Empty State */}
      {filteredTasks.length === 0 ? (
        <div className="bg-panel-container border border-zinc-700/80 p-8 rounded-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto text-zinc-400">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              No Matching Agent Tasks
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Try changing your search query or resetting active section, status, agent, or data-state filters.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-sm bg-emerald-950 border border-emerald-700 hover:border-emerald-600 text-emerald-200 text-xs font-mono font-medium inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters & Show All Tasks ({totalTasksCount})</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <AgentTaskCard
              key={task.id}
              task={task}
              onToggleSource={toggleSource}
              searchQuery={searchQuery}
              selectedSectionFilter={selectedSection}
            />
          ))}
        </div>
      )}
    </div>
  );
};
