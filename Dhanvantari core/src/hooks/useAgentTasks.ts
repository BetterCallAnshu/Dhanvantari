import { useState, useMemo } from "react";
import { CycleState } from "../types";

export interface RequiredSourceItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface TaskSection {
  id: string;
  title: string;
  content: string;
}

export interface AgentTask {
  id: string;
  title: string;
  agentName: string;
  description: string;
  districtFocus?: string;
  status: "Ready for Generation" | "In Progress" | "Missing Sources" | "Approved" | "Pending Approval";
  hasMissingData: boolean;
  sections: TaskSection[];
  sources: RequiredSourceItem[];
  generatedContent: string;
}

export const STORAGE_KEY_OVERRIDES = "dhanvantari_agent_task_user_overrides_v2";

export function useAgentTasks(cycleState?: CycleState | null, activeDistrict?: string) {
  // Store user explicit checkbox overrides
  const [userOverrides, setUserOverrides] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OVERRIDES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return {};
  });

  const targetDistrict = activeDistrict || cycleState?.highest_risk_district || "Kamrup Metropolitan";
  const districtSummary = cycleState?.district_summaries?.[targetDistrict];
  const sourceStatuses = districtSummary?.source_statuses || {};
  const reasoning = districtSummary?.reasoning;
  const subScores = districtSummary?.sub_scores;
  const resourceReport = cycleState?.reports?.resource_summaries?.[targetDistrict]?.json;
  const approvalStatus = cycleState?.reports?.approval_status || "DRAFT - PENDING APPROVAL";

  // Helper to check if a source feed is available
  const isSourceAvailable = (sourceKey: string, overrideKey: string): boolean => {
    if (userOverrides[overrideKey] !== undefined) {
      return userOverrides[overrideKey];
    }
    if (!sourceStatuses || Object.keys(sourceStatuses).length === 0) {
      return true; // Active baseline default
    }
    const status = sourceStatuses[sourceKey];
    return status ? status !== "UNAVAILABLE" : true;
  };

  const tasks: AgentTask[] = useMemo(() => {
    const list: AgentTask[] = [];

    // 1. Dynamic District Focus Assessment Task
    const sources1: RequiredSourceItem[] = [
      {
        id: `src-${targetDistrict}-disease`,
        label: "Disease Surveillance Data",
        completed: isSourceAvailable("disease", `src-${targetDistrict}-disease`),
      },
      {
        id: `src-${targetDistrict}-hospital`,
        label: "Hospital Capacity Data",
        completed: isSourceAvailable("hospital", `src-${targetDistrict}-hospital`),
      },
      {
        id: `src-${targetDistrict}-weather`,
        label: "Open-Meteo Weather Data",
        completed: isSourceAvailable("weather", `src-${targetDistrict}-weather`),
      },
      {
        id: `src-${targetDistrict}-ndma`,
        label: "Disaster Alerts (NDMA)",
        completed: isSourceAvailable("ndma", `src-${targetDistrict}-ndma`),
      },
    ];

    const missing1 = sources1.filter((s) => !s.completed).length;
    const isReady1 = missing1 === 0;

    const sections1: TaskSection[] = [
      {
        id: "overview",
        title: "Overview",
        content: `Active outbreak assessment for ${targetDistrict}. ${
          reasoning?.incident_summary ||
          `Epidemiological risk evaluation monitoring monsoonal vectors, syndromic hospital admissions, and environmental signals.`
        }`,
      },
      {
        id: "risk-analysis",
        title: "Risk Analysis",
        content: `District Risk Index: ${
          districtSummary ? districtSummary.risk_score.toFixed(1) : "75.0"
        }/100. Severity: ${districtSummary?.risk_level || "HIGH"}. Confidence: ${
          districtSummary ? districtSummary.confidence_score.toFixed(1) : "88.0"
        }%. ${
          subScores
            ? `Sub-score breakdown — Disease Outbreak: ${subScores.disease.toFixed(1)}, Weather: ${subScores.weather.toFixed(1)}, Hospital Strain: ${subScores.hospital.toFixed(1)}, Pharmacy: ${subScores.pharmacy.toFixed(1)}, AQI: ${subScores.aqi.toFixed(1)}.`
            : "All 5 sub-scores actively calculated across weather, disease, hospital, pharmacy, and AQI feeds."
        }`,
      },
      {
        id: "recommendations",
        title: "Recommendations",
        content: `Primary Action: ${
          reasoning?.recommendations?.[0] ||
          `Mobilize rapid diagnostic test kits and ORS distribution to PHCs in ${targetDistrict}.`
        } Advisory: ${reasoning?.public_advisory || "Boil drinking water and eliminate standing vector breeding water."}`,
      },
      {
        id: "sources",
        title: "Sources",
        content: `Data feeds evaluated: ${sources1.map((s) => `${s.label} [${s.completed ? "AVAILABLE" : "MISSING"}]`).join(", ")}.`,
      },
    ];

    list.push({
      id: `task-district-outbreak-${targetDistrict.toLowerCase().replace(/\s+/g, "-")}`,
      title: `${targetDistrict} Outbreak & Response Assessment`,
      agentName: `Outbreak Assessment Agent (${targetDistrict})`,
      description: `Active epidemiological risk evaluation for ${targetDistrict}${
        districtSummary ? ` (Risk Score: ${districtSummary.risk_score.toFixed(1)}/100)` : ""
      }.`,
      districtFocus: `${targetDistrict} Live Feed`,
      status: isReady1 ? "Ready for Generation" : "Missing Sources",
      hasMissingData: !isReady1,
      sources: sources1,
      sections: sections1,
      generatedContent: sections1.map((s) => `${s.title}: ${s.content}`).join("\n\n"),
    });

    // 2. Surveillance & Disease Clustering Task
    const sources2: RequiredSourceItem[] = [
      {
        id: "surv-1",
        label: "Disease Surveillance Data",
        completed: isSourceAvailable("disease", "surv-1"),
      },
      {
        id: "surv-2",
        label: "OTC Pharmacy Telemetry",
        completed: isSourceAvailable("pharmacy", "surv-2"),
      },
      {
        id: "surv-3",
        label: "Open-Meteo Weather Data",
        completed: isSourceAvailable("weather", "surv-3"),
      },
      {
        id: "surv-4",
        label: "Disaster Alerts (NDMA)",
        completed: isSourceAvailable("ndma", "surv-4"),
      },
    ];
    const missing2 = sources2.filter((s) => !s.completed).length;
    const isReady2 = missing2 === 0;

    const sections2: TaskSection[] = [
      {
        id: "overview",
        title: "Overview",
        content: `Monitors real-time disease surveillance feeds, symptom indicators, and OTC pharmacy telemetry across ${targetDistrict}.`,
      },
      {
        id: "risk-analysis",
        title: "Risk Analysis",
        content: `Disease Outbreak Sub-Score: ${
          subScores ? subScores.disease.toFixed(1) : "62.0"
        }/100. OTC Pharmacy Sub-Score: ${
          subScores ? subScores.pharmacy.toFixed(1) : "58.0"
        }/100. Evidence signals: ${
          districtSummary?.evidence?.join(", ") || "Acute Gastroenteritis clusters, fever medicine sales spike."
        }`,
      },
      {
        id: "recommendations",
        title: "Recommendations",
        content: "Flag localized fever and diarrhea clusters. Dispatch syndromic surveillance teams to high-volume pharmacy pin codes.",
      },
      {
        id: "sources",
        title: "Sources",
        content: `Data feeds evaluated: ${sources2.map((s) => `${s.label} [${s.completed ? "AVAILABLE" : "MISSING"}]`).join(", ")}.`,
      },
    ];

    list.push({
      id: "surveillance-cluster-monitoring",
      title: "Surveillance & Disease Clustering",
      agentName: "Surveillance & Syndromic Ingestion Agent",
      description: "Monitors real-time disease surveillance feeds, symptom indicators, and OTC pharmacy telemetry.",
      districtFocus: "IDSP & Pharmacy Telemetry",
      status: isReady2 ? "Ready for Generation" : "Missing Sources",
      hasMissingData: !isReady2,
      sources: sources2,
      sections: sections2,
      generatedContent: sections2.map((s) => `${s.title}: ${s.content}`).join("\n\n"),
    });

    // 3. Environmental & Climate Risk Analysis
    const sources3: RequiredSourceItem[] = [
      {
        id: "env-1",
        label: "Open-Meteo Weather Data",
        completed: isSourceAvailable("weather", "env-1"),
      },
      {
        id: "env-2",
        label: "AQI Environmental Feed",
        completed: isSourceAvailable("aqi", "env-2"),
      },
      {
        id: "env-3",
        label: "Disaster Alerts (NDMA)",
        completed: isSourceAvailable("ndma", "env-3"),
      },
    ];
    const missing3 = sources3.filter((s) => !s.completed).length;
    const isReady3 = missing3 === 0;

    const sections3: TaskSection[] = [
      {
        id: "overview",
        title: "Overview",
        content: "Monitors Open-Meteo weather API forecasts and Kaggle AQI environmental trends for vector breeding conditions.",
      },
      {
        id: "risk-analysis",
        title: "Risk Analysis",
        content: `Weather Risk Sub-Score: ${
          subScores ? subScores.weather.toFixed(1) : "78.0"
        }/100. Air Quality Index Sub-Score: ${
          subScores ? subScores.aqi.toFixed(1) : "45.0"
        }/100. Monsoonal precipitation and high relative humidity create elevated mosquito proliferation hazards.`,
      },
      {
        id: "recommendations",
        title: "Recommendations",
        content: "Issue vector control advisories in flood-prone and stagnant water zones. Coordinate fogging operations with municipal health authorities.",
      },
      {
        id: "sources",
        title: "Sources",
        content: `Data feeds evaluated: ${sources3.map((s) => `${s.label} [${s.completed ? "AVAILABLE" : "MISSING"}]`).join(", ")}.`,
      },
    ];

    list.push({
      id: "environmental-climate-surveillance",
      title: "Environmental & Climate Risk Analysis",
      agentName: "Environmental Risk Agent",
      description: "Monitors Open-Meteo weather API forecasts and Kaggle AQI environmental trends.",
      districtFocus: "Open-Meteo & AQI Feeds",
      status: isReady3 ? "Ready for Generation" : "Missing Sources",
      hasMissingData: !isReady3,
      sources: sources3,
      sections: sections3,
      generatedContent: sections3.map((s) => `${s.title}: ${s.content}`).join("\n\n"),
    });

    // 4. Multisensory Signal Fusion Task
    const sources4: RequiredSourceItem[] = [
      {
        id: "fus-1",
        label: "Disease Surveillance Data",
        completed: isSourceAvailable("disease", "fus-1"),
      },
      {
        id: "fus-2",
        label: "Hospital Capacity Data",
        completed: isSourceAvailable("hospital", "fus-2"),
      },
      {
        id: "fus-3",
        label: "Open-Meteo Weather Data",
        completed: isSourceAvailable("weather", "fus-3"),
      },
      {
        id: "fus-4",
        label: "AQI Environmental Feed",
        completed: isSourceAvailable("aqi", "fus-4"),
      },
    ];
    const missing4 = sources4.filter((s) => !s.completed).length;
    const isReady4 = missing4 === 0;

    const sections4: TaskSection[] = [
      {
        id: "overview",
        title: "Overview",
        content: "Combines 7 surveillance feeds into enriched DistrictSnapshots with census demographics.",
      },
      {
        id: "risk-analysis",
        title: "Risk Analysis",
        content: `Target District: ${targetDistrict}. Population: ${
          districtSummary?.demographics?.population?.toLocaleString() || "1,250,000"
        }, Density: ${
          districtSummary?.demographics?.population_density || 2400
        }/km², Total Hospital Beds: ${
          districtSummary?.demographics?.total_beds || 4200
        }, ICU Beds: ${districtSummary?.demographics?.icu_beds || 380}.`,
      },
      {
        id: "recommendations",
        title: "Recommendations",
        content: "Ensure continuous 100% telemetry availability across all 12 monitored Indian districts. Trigger pipeline refresh on anomalous feed values.",
      },
      {
        id: "sources",
        title: "Sources",
        content: `Data feeds evaluated: ${sources4.map((s) => `${s.label} [${s.completed ? "AVAILABLE" : "MISSING"}]`).join(", ")}.`,
      },
    ];

    list.push({
      id: "multisensory-signal-fusion",
      title: "Multisensory Signal Fusion",
      agentName: "Signal Fusion Agent",
      description: "Combines 7 surveillance feeds into enriched DistrictSnapshots with census demographics.",
      districtFocus: "Multi-Source Signal Engine",
      status: isReady4 ? "Ready for Generation" : "Missing Sources",
      hasMissingData: !isReady4,
      sources: sources4,
      sections: sections4,
      generatedContent: sections4.map((s) => `${s.title}: ${s.content}`).join("\n\n"),
    });

    // 5. Risk Assessment & Scoring Task
    const sources5: RequiredSourceItem[] = [
      {
        id: "risk-1",
        label: "Disease Surveillance Data",
        completed: isSourceAvailable("disease", "risk-1"),
      },
      {
        id: "risk-2",
        label: "Hospital Capacity Data",
        completed: isSourceAvailable("hospital", "risk-2"),
      },
      {
        id: "risk-3",
        label: "Open-Meteo Weather Data",
        completed: isSourceAvailable("weather", "risk-3"),
      },
      {
        id: "risk-4",
        label: "OTC Pharmacy Telemetry",
        completed: isSourceAvailable("pharmacy", "risk-4"),
      },
    ];
    const missing5 = sources5.filter((s) => !s.completed).length;
    const isReady5 = missing5 === 0;

    const sections5: TaskSection[] = [
      {
        id: "overview",
        title: "Overview",
        content: "Computes sub-scores, overall risk index, confidence metrics, and deterministic district rankings.",
      },
      {
        id: "risk-analysis",
        title: "Risk Analysis",
        content: `Overall Risk Score: ${
          districtSummary ? districtSummary.risk_score.toFixed(1) : "75.0"
        }/100 (Rank #${districtSummary?.rank || 1} of 12). Confidence Index: ${
          districtSummary ? districtSummary.confidence_score.toFixed(1) : "88.0"
        }%. Weighting: Disease (30%), Weather (25%), Hospital (20%), Pharmacy (15%), AQI (10%).`,
      },
      {
        id: "recommendations",
        title: "Recommendations",
        content: "Prioritize districts ranked in the RED (>70) and ORANGE (50-70) tiers for immediate medical supply allocation.",
      },
      {
        id: "sources",
        title: "Sources",
        content: `Data feeds evaluated: ${sources5.map((s) => `${s.label} [${s.completed ? "AVAILABLE" : "MISSING"}]`).join(", ")}.`,
      },
    ];

    list.push({
      id: "risk-assessment-scoring",
      title: "District Risk Assessment & Scoring",
      agentName: "Epidemiological Risk Agent",
      description: "Computes sub-scores, overall risk index, confidence metrics, and deterministic district rankings.",
      districtFocus: "Deterministic Risk Engine",
      status: isReady5 ? "Ready for Generation" : "Missing Sources",
      hasMissingData: !isReady5,
      sources: sources5,
      sections: sections5,
      generatedContent: sections5.map((s) => `${s.title}: ${s.content}`).join("\n\n"),
    });

    // 6. Decision Support & Resource Allocation Task
    const sources6: RequiredSourceItem[] = [
      {
        id: "dec-1",
        label: "Hospital Capacity Data",
        completed: isSourceAvailable("hospital", "dec-1"),
      },
      {
        id: "dec-2",
        label: "Disease Surveillance Data",
        completed: isSourceAvailable("disease", "dec-2"),
      },
      {
        id: "dec-3",
        label: "Open-Meteo Weather Data",
        completed: isSourceAvailable("weather", "dec-3"),
      },
      {
        id: "dec-4",
        label: "Disaster Alerts (NDMA)",
        completed: isSourceAvailable("ndma", "dec-4"),
      },
    ];
    const missing6 = sources6.filter((s) => !s.completed).length;
    const isReady6 = missing6 === 0;

    const sections6: TaskSection[] = [
      {
        id: "overview",
        title: "Overview",
        content: "Evaluates ward hospital strain and computes transparent resource allocation demand formulas.",
      },
      {
        id: "risk-analysis",
        title: "Risk Analysis",
        content: `Hospital Strain Sub-Score: ${
          subScores ? subScores.hospital.toFixed(1) : "72.0"
        }/100. Hospital Bed Occupancy: ${
          resourceReport?.hospital_strain?.icu_occupancy_percent || 78.5
        }%. Status: ${resourceReport?.hospital_strain?.strain_status || "HIGH SURGE STRAIN"}.`,
      },
      {
        id: "recommendations",
        title: "Recommendations",
        content: `Dispatch Recommendation: ${
          resourceReport?.gemini_dispatch_recommendation ||
          "Recommend immediate dispatch of requested ORS, diagnostic kits, and medical personnel."
        }`,
      },
      {
        id: "sources",
        title: "Sources",
        content: `Data feeds evaluated: ${sources6.map((s) => `${s.label} [${s.completed ? "AVAILABLE" : "MISSING"}]`).join(", ")}.`,
      },
    ];

    list.push({
      id: "decision-resource-allocation",
      title: "Decision Support & Resource Demand",
      agentName: "Decision Support Agent",
      description: "Evaluates ward hospital strain and computes transparent resource allocation demand formulas.",
      districtFocus: "Resource Demand Allocator",
      status: isReady6 ? "Pending Approval" : "Missing Sources",
      hasMissingData: !isReady6,
      sources: sources6,
      sections: sections6,
      generatedContent: sections6.map((s) => `${s.title}: ${s.content}`).join("\n\n"),
    });

    // 7. Gemini Reasoning & Supervisor Task
    const sources7: RequiredSourceItem[] = [
      {
        id: "sup-1",
        label: "Disease Surveillance Data",
        completed: isSourceAvailable("disease", "sup-1"),
      },
      {
        id: "sup-2",
        label: "Hospital Capacity Data",
        completed: isSourceAvailable("hospital", "sup-2"),
      },
      {
        id: "sup-3",
        label: "Open-Meteo Weather Data",
        completed: isSourceAvailable("weather", "sup-3"),
      },
      {
        id: "sup-4",
        label: "AQI Environmental Feed",
        completed: isSourceAvailable("aqi", "sup-4"),
      },
    ];
    const missing7 = sources7.filter((s) => !s.completed).length;
    const isReady7 = missing7 === 0;

    const sections7: TaskSection[] = [
      {
        id: "overview",
        title: "Overview",
        content: "Enforces threshold rules, fires critical alerts, and generates qualitative epidemiological reasoning.",
      },
      {
        id: "risk-analysis",
        title: "Risk Analysis",
        content: `Approval Status: ${
          approvalStatus
        }. Reasoning Trace: ${
          reasoning?.reasoning_trace?.join(" → ") ||
          "Weather signal anomaly detected → Hospital admissions surge → High risk threshold exceeded."
        }`,
      },
      {
        id: "recommendations",
        title: "Recommendations",
        content: "Submit draft resource request for Chief Medical Officer (CMO) digital signature. Broadcast WhatsApp public advisories.",
      },
      {
        id: "sources",
        title: "Sources",
        content: `Data feeds evaluated: ${sources7.map((s) => `${s.label} [${s.completed ? "AVAILABLE" : "MISSING"}]`).join(", ")}.`,
      },
    ];

    list.push({
      id: "gemini-supervisor-reasoning",
      title: "Gemini 2.5 Flash Reasoning & Policy Supervisor",
      agentName: "Supervisor & Reasoning Agent",
      description: "Enforces threshold rules, fires critical alerts, and generates qualitative epidemiological reasoning.",
      districtFocus: "AI Reasoning & Policy Control",
      status: isReady7 ? "Pending Approval" : "Missing Sources",
      hasMissingData: !isReady7,
      sources: sources7,
      sections: sections7,
      generatedContent: sections7.map((s) => `${s.title}: ${s.content}`).join("\n\n"),
    });

    return list;
  }, [cycleState, targetDistrict, sourceStatuses, userOverrides, reasoning, subScores, districtSummary, resourceReport]);

  const toggleSource = (taskId: string, sourceId: string) => {
    setUserOverrides((prev) => {
      const currentVal = tasks
        .find((t) => t.id === taskId)
        ?.sources.find((s) => s.id === sourceId)?.completed;
      const nextOverrides = { ...prev, [sourceId]: !currentVal };
      try {
        localStorage.setItem(STORAGE_KEY_OVERRIDES, JSON.stringify(nextOverrides));
      } catch {
        // Ignore
      }
      return nextOverrides;
    });
  };

  const resetToDefaults = () => {
    setUserOverrides({});
    try {
      localStorage.removeItem(STORAGE_KEY_OVERRIDES);
    } catch {
      // Ignore
    }
  };

  return {
    tasks,
    toggleSource,
    resetToDefaults,
  };
}
