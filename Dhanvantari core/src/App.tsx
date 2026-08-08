import React, { useEffect, useState, useCallback } from "react";
import { CommandHeader } from "./components/CommandHeader";
import { NavigationSidebar } from "./components/NavigationSidebar";
import { GlobalStatusCards } from "./components/GlobalStatusCards";
import { IndiaRiskMap } from "./components/IndiaRiskMap";
import { DistrictPriorityTable } from "./components/DistrictPriorityTable";
import { DistrictDetailInspector } from "./components/DistrictDetailInspector";
import { DecisionSupportPanel } from "./components/DecisionSupportPanel";
import { IncidentReportViewer } from "./components/IncidentReportViewer";
import { AlertsTimeline } from "./components/AlertsTimeline";
import { AgentTasksPanel } from "./components/AgentTasksPanel";
import { SimulationModal } from "./components/SimulationModal";
import { CycleState } from "./types";
import { RefreshCw, AlertCircle, Database } from "lucide-react";

export default function App() {
  const [cycleState, setCycleState] = useState<CycleState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(60);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Kamrup Metropolitan");
  const [isSimulateOpen, setIsSimulateOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch or trigger cycle
  const loadCycleState = useCallback(async (forceNew = false) => {
    try {
      setError(null);
      if (forceNew) {
        setIsRefreshing(true);
        setCountdown(60);
      }
      const endpoint = forceNew ? "/api/cycle" : "/api/cycle";
      const method = forceNew ? "POST" : "GET";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data: CycleState = await response.json();
      setCycleState(data);

      if (data.highest_risk_district && !selectedDistrict) {
        setSelectedDistrict(data.highest_risk_district);
      }
    } catch (err: any) {
      console.error("Failed to load cycle state:", err);
      setError(err.message || "Failed to communicate with Fusion Engine backend.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDistrict]);

  // Initial load
  useEffect(() => {
    loadCycleState(false);
  }, [loadCycleState]);

  // Autonomous 60s Polling Countdown Loop
  useEffect(() => {
    if (!isPolling) {
      setCountdown(60);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          console.log("[DHANVANTARI] Autonomous cycle refresh trigger");
          loadCycleState(true);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPolling, loadCycleState]);

  // Handle Simulation Trigger
  const handleTriggerSimulate = async (params: {
    district: string;
    disease_score: number;
    weather_score: number;
    hospital_score: number;
    spike_type?: string;
  }) => {
    try {
      setIsSimulating(true);
      setError(null);
      setCountdown(60);
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Simulation failed with status ${response.status}`);
      }

      const data: CycleState = await response.json();
      setCycleState(data);
      setSelectedDistrict(params.district);
      setIsSimulateOpen(false);
    } catch (err: any) {
      console.error("Simulation error:", err);
      setError("Failed to execute spike simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  const districtSummaries = cycleState?.district_summaries || {};
  const currentSummary = districtSummaries[selectedDistrict] || Object.values(districtSummaries)[0];
  const rankedDistricts = cycleState?.ranked_districts || Object.keys(districtSummaries);

  return (
    <div className="min-h-screen bg-[#080B12] text-[#DCE4E5] font-sans flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Fixed Command Header */}
      <CommandHeader
        cycleId={cycleState?.cycle_id}
        status={cycleState?.status}
        alertsCount={cycleState?.alerts_triggered_count || 0}
        isPolling={isPolling}
        isRefreshing={isRefreshing}
        countdown={countdown}
        onRunCycle={() => loadCycleState(true)}
        onOpenSimulate={() => setIsSimulateOpen(true)}
        onTogglePolling={() => setIsPolling(!isPolling)}
        onSelectTab={setActiveTab}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <NavigationSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          alertsCount={cycleState?.alerts_triggered_count || 0}
        />

        {/* Workspace Main Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Error Banner */}
          {error && (
            <div className="bg-red-950/40 border border-red-500/60 p-3 rounded-sm flex items-center justify-between text-xs font-mono text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>Backend Error: {error}</span>
              </div>
              <button
                onClick={() => loadCycleState(true)}
                className="px-2 py-0.5 rounded-sm bg-red-500/20 hover:bg-red-500/30 border border-red-500 text-red-200 font-bold"
              >
                RETRY
              </button>
            </div>
          )}

          {/* Loading Overlay State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3 font-mono text-xs text-gray-400">
              <RefreshCw className="w-8 h-8 text-cyan-primary animate-spin glow-cyan" />
              <div>INITIALIZING DHANVANTARI SIGNAL FUSION PIPELINE...</div>
              <div className="text-[10px] text-gray-500">
                Fusing Weather, IDSP, Hospital Capacity, Pharmacy & AQI Feeds
              </div>
            </div>
          ) : cycleState ? (
            <>
              {/* Global KPI Telemetry Bar */}
              <GlobalStatusCards
                cycleState={cycleState}
                onSelectDistrict={(dist) => {
                  setSelectedDistrict(dist);
                  setActiveTab("overview");
                }}
                onSelectTab={setActiveTab}
              />

              {/* District Selector Quick Bar */}
              <div className="bg-panel border border-hud p-2 rounded-sm flex items-center justify-between gap-2 overflow-x-auto font-mono text-xs">
                <div className="flex items-center gap-1.5 shrink-0 text-gray-400 text-[11px] font-bold">
                  <span>SELECT DISTRICT FOCUS:</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {rankedDistricts.map((dist) => {
                    const isSelected = selectedDistrict === dist;
                    const summary = districtSummaries[dist];
                    const isCritical = summary?.risk_score >= 75;

                    return (
                      <button
                        key={dist}
                        onClick={() => setSelectedDistrict(dist)}
                        className={`px-2.5 py-1 rounded-sm border transition-all text-xs flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-red-700/20 border-red-700 text-red-300 font-bold"
                            : isCritical
                            ? "bg-red-900/10 border-red-500/40 text-red-300 hover:border-red-400"
                            : "bg-black/40 border-hud text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>{dist}</span>
                        {summary && (
                          <span
                            className={`text-[10px] ${
                              isCritical ? "text-red-400 font-bold" : "text-gray-500"
                            }`}
                          >
                            [{summary.risk_score.toFixed(0)}]
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Tab View Router */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  {/* Grid: Map + District Detail Inspector */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <IndiaRiskMap
                      districtSummaries={districtSummaries}
                      selectedDistrict={selectedDistrict}
                      onSelectDistrict={setSelectedDistrict}
                    />
                    {currentSummary && (
                      <DistrictDetailInspector
                        summary={currentSummary}
                        onSelectTab={setActiveTab}
                      />
                    )}
                  </div>

                  {/* District Priority Table */}
                  <DistrictPriorityTable
                    districtSummaries={districtSummaries}
                    rankedDistricts={rankedDistricts}
                    selectedDistrict={selectedDistrict}
                    onSelectDistrict={setSelectedDistrict}
                    onSelectTab={setActiveTab}
                  />
                </div>
              )}

              {activeTab === "map" && (
                <div className="w-full h-[calc(100vh-140px)]">
                  <IndiaRiskMap
                    districtSummaries={districtSummaries}
                    selectedDistrict={selectedDistrict}
                    onSelectDistrict={setSelectedDistrict}
                  />
                </div>
              )}

              {activeTab === "priority" && (
                <DistrictPriorityTable
                  districtSummaries={districtSummaries}
                  rankedDistricts={rankedDistricts}
                  selectedDistrict={selectedDistrict}
                  onSelectDistrict={setSelectedDistrict}
                  onSelectTab={setActiveTab}
                />
              )}

              {activeTab === "decision" && currentSummary && (
                <DecisionSupportPanel
                  summary={currentSummary}
                  cycleState={cycleState}
                  onSelectDistrict={setSelectedDistrict}
                />
              )}

              {activeTab === "agent-tasks" && (
                <AgentTasksPanel
                  cycleState={cycleState}
                  selectedDistrict={selectedDistrict}
                />
              )}

              {activeTab === "reports" && currentSummary && (
                <IncidentReportViewer
                  summary={currentSummary}
                  cycleState={cycleState}
                  onSelectDistrict={setSelectedDistrict}
                />
              )}

              {activeTab === "alerts" && (
                <AlertsTimeline
                  cycleState={cycleState}
                  onSelectDistrict={(dist) => {
                    setSelectedDistrict(dist);
                    setActiveTab("overview");
                  }}
                />
              )}
            </>
          ) : null}
        </main>
      </div>

      {/* Spike Simulation Modal */}
      <SimulationModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onTriggerSimulate={handleTriggerSimulate}
        isSimulating={isSimulating}
      />
    </div>
  );
}

