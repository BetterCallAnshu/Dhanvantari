export interface SubScores {
  weather: number;
  disease: number;
  hospital: number;
  pharmacy: number;
  aqi: number;
}

export interface Demographics {
  district: string;
  population: number;
  population_density: number;
  urbanization_rate: number;
  literacy_rate: number;
  total_hospitals: number;
  government_hospitals: number;
  total_beds: number;
  icu_beds: number;
  beds_per_1000: number;
  healthcare_index: number;
  aqi_value: number;
  aqi_category: string;
}

export interface ReasoningOutput {
  risk_level: string;
  confidence: number;
  affected_district: string;
  reasoning_trace: string[];
  recommendations: string[];
  incident_summary: string;
  is_fallback?: boolean;
  public_advisory?: string;
  dos_and_donts?: {
    dos: string[];
    donts: string[];
  };
  whatsapp_message?: string;
}

export interface DistrictSummary {
  district: string;
  risk_score: number;
  confidence_score: number;
  risk_level: string;
  rank: number;
  sub_scores: SubScores;
  evidence: string[];
  reasoning: ReasoningOutput;
  demographics: Demographics;
  source_statuses: Record<string, string>;
}

export interface AlertItem {
  alert_id: string;
  cycle_id: string;
  timestamp: string;
  district: string;
  risk_score: number;
  confidence_score: number;
  risk_level: string;
  status: string;
  trigger_reason: string;
  is_auto_fired: boolean;
}

export interface SuggestedResource {
  item_name: string;
  quantity: number;
  formatted_quantity: string;
  formula_used: string;
  priority: string;
}

export interface CampRecommendation {
  triggered: boolean;
  summary: string;
  recommended_camps_count: number;
  suggested_locations: string[];
}

export interface TransferItem {
  from_district: string;
  to_district: string;
  item: string;
  quantity: string;
  reason: string;
}

export interface ResourceSummaryJson {
  report_type: string;
  approval_status: string;
  district: string;
  timestamp: string;
  incident_severity: string;
  risk_score: number;
  confidence_score: number;
  gemini_dispatch_recommendation: string;
  hospital_strain: {
    total_hospital_beds: number;
    icu_occupancy_percent: number;
    strain_status: string;
  };
  suggested_resource_quantities: SuggestedResource[];
  camp_recommendation: CampRecommendation;
  evidence_used_footprint: string[];
}

export interface IncidentReportJson {
  report_type: string;
  approval_status: string;
  district: string;
  timestamp: string;
  incident_severity: string;
  risk_score: number;
  confidence_score: number;
  risk_level: string;
  reasoning_trace: string[];
  evidence: string[];
  evidence_used_footprint: string[];
  sub_scores: SubScores;
}

export interface PriorityReportJson {
  report_type: string;
  approval_status: string;
  timestamp: string;
  cycle_id: string;
  total_districts_monitored: number;
  highest_risk_district: string;
  max_risk_score: number;
  rankings: Array<{
    rank: number;
    district: string;
    incident_severity: string;
    risk_score: number;
    risk_level: string;
    confidence_score: number;
    available_signals_count: number;
    primary_driver: string;
    evidence_used: string[];
  }>;
  medicine_redistribution_transfers: TransferItem[];
}

export interface FullReportsPackage {
  cycle_id: string;
  timestamp: string;
  priority_report: {
    json: PriorityReportJson;
    markdown: string;
  };
  incident_reports: Record<string, {
    json: IncidentReportJson;
    markdown: string;
  }>;
  resource_summaries: Record<string, {
    json: ResourceSummaryJson;
    markdown: string;
  }>;
  approval_status: string;
}

export interface AuditLogEntry {
  timestamp: string;
  cycle_id: string;
  district: string;
  risk_score: number;
  confidence_score: number;
  risk_level: string;
  threshold_met: boolean;
  status: string;
}

export interface CycleState {
  cycle_id: string;
  timestamp: string;
  status: string;
  highest_risk_district: string;
  max_risk_score: number;
  ranked_districts: string[];
  alerts_triggered_count: number;
  district_summaries: Record<string, DistrictSummary>;
  supervisor_eval: {
    overall_status: string;
    audit_log: (string | AuditLogEntry)[];
    alerts_triggered: AlertItem[];
  };
  reports: FullReportsPackage;
}
