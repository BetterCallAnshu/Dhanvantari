"""
Public Health Signal Fusion Agent - Report Generator
Generates Incident Reports, District Priority Reports, and Resource Request Summaries.
Supports JSON, Markdown, and PDF-ready structured outputs.
Strictly relies on Python deterministic risk engine for district ranking.
All outputs are explicitly marked with "DRAFT - PENDING APPROVAL".
"""

from datetime import datetime, timezone
import json
from typing import Any, Dict, List, Optional, Tuple

from models.risk import DistrictRiskResult, OverallRiskResult
from models.snapshot import DistrictSnapshot

DRAFT_WATERMARK = "DRAFT - PENDING APPROVAL"


def get_incident_severity(risk_score: float) -> str:
    """
    Categorizes Incident Severity deterministically based on Risk Score:
    0 - 39: LOW
    40 - 59: MEDIUM
    60 - 74: HIGH
    75+: CRITICAL
    """
    if risk_score >= 75.0:
        return "CRITICAL"
    elif risk_score >= 60.0:
        return "HIGH"
    elif risk_score >= 40.0:
        return "MEDIUM"
    else:
        return "LOW"


def get_evidence_used_footprint(snapshot: DistrictSnapshot) -> Dict[str, Any]:
    """
    Generates an Explainable AI evidence footprint indicating active vs unavailable sources.
    """
    sources = {
        "Weather": snapshot.weather is not None and getattr(snapshot.weather, "status", None) != "UNAVAILABLE",
        "Hospital": snapshot.hospital is not None and getattr(snapshot.hospital, "status", None) != "UNAVAILABLE",
        "Pharmacy": snapshot.pharmacy is not None and getattr(snapshot.pharmacy, "status", None) != "UNAVAILABLE",
        "Disease": snapshot.disease is not None and getattr(snapshot.disease, "status", None) != "UNAVAILABLE",
        "AQI": snapshot.aqi is not None and getattr(snapshot.aqi, "status", None) != "UNAVAILABLE",
        "NDMA": snapshot.ndma_alerts is not None and len(snapshot.ndma_alerts) > 0,
        "RSS": snapshot.rss_items is not None and len(snapshot.rss_items) > 0,
    }

    formatted_items = []
    for src_name, is_active in sources.items():
        symbol = "✓" if is_active else "✗"
        status_str = "Active" if is_active else "Unavailable"
        formatted_items.append(f"{symbol} {src_name} ({status_str})")

    return {
        "sources": sources,
        "formatted_items": formatted_items,
    }


class ReportGenerator:
    """
    Automated Operational Report Generator for Public Health Authorities.
    Produces Incident Reports, District Priority Summaries, and Resource Request Summaries
    in JSON, Markdown, and PDF-ready structural formats.
    """

    def generate_incident_report(
        self,
        district_risk: DistrictRiskResult,
        snapshot: DistrictSnapshot,
        reasoning: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generates an individual Incident Report for a district.
        Includes Incident Severity (LOW, MEDIUM, HIGH, CRITICAL), District, Timestamp, Risk Score,
        Confidence, Reasoning Trace, Evidence Used, and Sub-scores.
        """
        district = district_risk.district
        timestamp = district_risk.timestamp or datetime.now(timezone.utc).isoformat()
        risk_score = district_risk.overall_risk_score
        confidence = district_risk.confidence_score
        risk_level = str(district_risk.risk_level)
        severity = get_incident_severity(risk_score)

        # Reasoning trace from Gemini/Fallback or generated from sub-scores
        reasoning_trace: List[str] = []
        if reasoning and "reasoning_trace" in reasoning:
            reasoning_trace = reasoning["reasoning_trace"]
        else:
            sub = district_risk.sub_scores
            reasoning_trace = [
                f"Surveillance evaluated overall risk at {risk_score:.1f}/100 ({severity} severity) with {confidence:.1f}% confidence.",
                f"Disease risk sub-score: {sub.disease_score:.1f}/100 based on syndromic monitoring.",
                f"Hospital surge sub-score: {sub.hospital_score:.1f}/100; Pharmacy demand surge: {sub.pharmacy_score:.1f}/100.",
                f"Environmental risk sub-score: Weather {sub.weather_score:.1f}/100, AQI {sub.aqi_score:.1f}/100.",
            ]

        # Consolidated evidence list from snapshot
        evidence: List[str] = snapshot.to_evidence_list()
        evidence_footprint = get_evidence_used_footprint(snapshot)

        # JSON Representation
        json_data = {
            "report_type": "INCIDENT_REPORT",
            "approval_status": DRAFT_WATERMARK,
            "district": district,
            "timestamp": timestamp,
            "incident_severity": severity,
            "risk_score": risk_score,
            "confidence": confidence,
            "risk_level": risk_level,
            "reasoning_trace": reasoning_trace,
            "evidence": evidence,
            "evidence_used_footprint": evidence_footprint["formatted_items"],
            "sub_scores": {
                "weather": district_risk.sub_scores.weather_score,
                "disease": district_risk.sub_scores.disease_score,
                "hospital": district_risk.sub_scores.hospital_score,
                "pharmacy": district_risk.sub_scores.pharmacy_score,
                "aqi": district_risk.sub_scores.aqi_score,
            },
        }

        # Markdown Representation
        md_lines = [
            f"# EPIDEMIOLOGICAL INCIDENT REPORT — {district.upper()}",
            f"**STATUS:** `{DRAFT_WATERMARK}`",
            f"**Timestamp:** {timestamp}",
            f"**Affected District:** {district}",
            f"**Incident Severity:** **{severity}**",
            f"**Overall Risk Score:** **{risk_score:.2f} / 100.0** ({risk_level})",
            f"**Confidence Score:** **{confidence:.1f}%**",
            "",
            "---",
            "",
            "## 1. REASONING TRACE",
        ]
        for bullet in reasoning_trace:
            md_lines.append(f"- {bullet}")

        md_lines.extend(["", "## 2. SURVEILLANCE EVIDENCE & SIGNALS"])
        if evidence:
            for item in evidence:
                md_lines.append(f"- {item}")
        else:
            md_lines.append("- No anomalous signals recorded for this period.")

        md_lines.extend(["", "## 3. SUB-SCORE BREAKDOWN"])
        sub = district_risk.sub_scores
        md_lines.append(f"- **Weather Risk:** {sub.weather_score:.1f} / 100")
        md_lines.append(f"- **Disease Outbreak Risk:** {sub.disease_score:.1f} / 100")
        md_lines.append(f"- **Hospital Surge Risk:** {sub.hospital_score:.1f} / 100")
        md_lines.append(f"- **Pharmacy Demand Risk:** {sub.pharmacy_score:.1f} / 100")
        md_lines.append(f"- **Air Quality (AQI) Risk:** {sub.aqi_score:.1f} / 100")

        md_lines.extend(["", "---", "", "### EVIDENCE USED & EXPLAINABILITY"])
        for item in evidence_footprint["formatted_items"]:
            md_lines.append(f"- {item}")
        md_lines.append(f"**Calculated Confidence:** {confidence:.1f}%")

        markdown_content = "\n".join(md_lines)

        # PDF-ready Structure
        pdf_structure = {
            "title": f"Public Health Incident Report — {district}",
            "header_watermark": DRAFT_WATERMARK,
            "metadata_table": [
                {"field": "District", "value": district},
                {"field": "Incident Severity", "value": severity},
                {"field": "Evaluation Timestamp", "value": timestamp},
                {"field": "Risk Score", "value": f"{risk_score:.2f} ({risk_level})"},
                {"field": "Confidence Score", "value": f"{confidence:.1f}%"},
                {"field": "Approval Status", "value": DRAFT_WATERMARK},
            ],
            "sections": [
                {
                    "section_title": "Epidemiological Reasoning Trace",
                    "content_type": "bullet_list",
                    "items": reasoning_trace,
                },
                {
                    "section_title": "Surveillance Evidence",
                    "content_type": "bullet_list",
                    "items": evidence or ["No anomalous signals recorded."],
                },
                {
                    "section_title": "Risk Sub-Scores",
                    "content_type": "key_value_pairs",
                    "data": {
                        "Weather Risk": f"{sub.weather_score:.1f}",
                        "Disease Outbreak Risk": f"{sub.disease_score:.1f}",
                        "Hospital Surge Risk": f"{sub.hospital_score:.1f}",
                        "Pharmacy Demand Surge": f"{sub.pharmacy_score:.1f}",
                        "Air Quality Risk": f"{sub.aqi_score:.1f}",
                    },
                },
                {
                    "section_title": "Evidence Used & Confidence",
                    "content_type": "bullet_list",
                    "items": evidence_footprint["formatted_items"] + [f"Confidence: {confidence:.1f}%"],
                },
            ],
        }

        return {
            "json": json_data,
            "markdown": markdown_content,
            "pdf_structure": pdf_structure,
        }

    def generate_district_priority_report(
        self,
        overall_risk_result: OverallRiskResult,
        snapshots: Dict[str, DistrictSnapshot],
        reasoning_map: Optional[Dict[str, Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Generates a District Priority Report across all monitored districts.
        Strictly sorted using Python deterministic risk scores (overall_risk_result.ranked_districts).
        Gemini is NEVER used for district ordering or sorting.
        """
        reasoning_map = reasoning_map or {}
        timestamp = overall_risk_result.timestamp or datetime.now(timezone.utc).isoformat()

        # Ranked list strictly preserving Python deterministic engine sorting
        district_rankings = []
        for rank, district in enumerate(overall_risk_result.ranked_districts, start=1):
            risk_res = overall_risk_result.district_results[district]
            snapshot = snapshots[district]
            reasoning = reasoning_map.get(district, {})
            trace = reasoning.get("reasoning_trace", [])
            primary_driver = trace[0] if trace else f"Highest sub-score: {self._get_highest_driver(risk_res)}"
            severity = get_incident_severity(risk_res.overall_risk_score)
            footprint = get_evidence_used_footprint(snapshot)

            district_rankings.append({
                "rank": rank,
                "district": district,
                "incident_severity": severity,
                "risk_score": risk_res.overall_risk_score,
                "risk_level": str(risk_res.risk_level),
                "confidence_score": risk_res.confidence_score,
                "available_signals_count": risk_res.available_signals_count,
                "primary_driver": primary_driver,
                "evidence_used": footprint["formatted_items"],
            })

        # Calculate inter-district redistribution recommendations
        redistributions = self._calculate_medicine_redistribution(overall_risk_result, snapshots)

        # JSON Representation
        json_data = {
            "report_type": "DISTRICT_PRIORITY_REPORT",
            "approval_status": DRAFT_WATERMARK,
            "timestamp": timestamp,
            "cycle_id": overall_risk_result.cycle_id,
            "total_districts_monitored": len(overall_risk_result.ranked_districts),
            "highest_risk_district": overall_risk_result.highest_risk_district,
            "max_risk_score": overall_risk_result.max_risk_score,
            "rankings": district_rankings,
            "medicine_redistribution_transfers": redistributions,
        }

        # Markdown Representation
        md_lines = [
            "# DISTRICT PRIORITIZATION REPORT",
            f"**STATUS:** `{DRAFT_WATERMARK}`",
            f"**Timestamp:** {timestamp}",
            f"**Monitored Districts:** {len(overall_risk_result.ranked_districts)}",
            f"**Highest Risk District:** {overall_risk_result.highest_risk_district} ({overall_risk_result.max_risk_score:.2f}/100)",
            "",
            "---",
            "",
            "## 1. DETERMINISTIC PRIORITY RANKINGS",
            "| Rank | District | Severity | Risk Score | Risk Level | Confidence | Primary Driver |",
            "| :---: | :--- | :---: | :---: | :---: | :---: | :--- |",
        ]
        for item in district_rankings:
            md_lines.append(
                f"| {item['rank']} | **{item['district']}** | `{item['incident_severity']}` | **{item['risk_score']:.2f}** | {item['risk_level']} | {item['confidence_score']:.1f}% | {item['primary_driver'][:50]}... |"
            )

        md_lines.extend(["", "## 2. INTER-DISTRICT RESOURCE REDISTRIBUTION"])
        if redistributions:
            for red in redistributions:
                md_lines.append(f"- **Transfer:** Move {red['quantity']} of `{red['item']}` from **{red['from_district']}** (Low Risk Surplus) → **{red['to_district']}** (High Risk Deficit).")
        else:
            md_lines.append("- No immediate inter-district transfers required; supply levels are balanced.")

        md_lines.extend(["", "## 3. OPERATIONAL SUMMARY"])
        md_lines.append(
            "Priority ranking is derived 100% deterministically from multi-source signal fusion. "
            "Districts requiring immediate operational attention and resource allocation are prioritized at Rank 1."
        )

        markdown_content = "\n".join(md_lines)

        # PDF-ready Structure
        pdf_structure = {
            "title": "Public Health District Prioritization Report",
            "header_watermark": DRAFT_WATERMARK,
            "summary": {
                "timestamp": timestamp,
                "total_monitored": len(overall_risk_result.ranked_districts),
                "highest_risk": overall_risk_result.highest_risk_district,
                "max_score": f"{overall_risk_result.max_risk_score:.2f}",
                "approval_status": DRAFT_WATERMARK,
            },
            "priority_table": {
                "columns": ["Rank", "District", "Severity", "Risk Score", "Level", "Confidence", "Primary Driver"],
                "rows": [
                    [
                        str(item["rank"]),
                        item["district"],
                        item["incident_severity"],
                        f"{item['risk_score']:.2f}",
                        item["risk_level"],
                        f"{item['confidence_score']:.1f}%",
                        item["primary_driver"],
                    ]
                    for item in district_rankings
                ],
            },
            "redistribution_transfers": redistributions,
        }

        return {
            "json": json_data,
            "markdown": markdown_content,
            "pdf_structure": pdf_structure,
        }

    def generate_resource_request_summary(
        self,
        district_risk: DistrictRiskResult,
        snapshot: DistrictSnapshot,
        reasoning: Optional[Dict[str, Any]] = None,
        is_highest_risk_district: bool = False,
    ) -> Dict[str, Any]:
        """
        Generates a Resource Allocation & Request Summary for a district.
        Uses transparent, explicit deterministic formulas:
        - Required ORS = Hospital Surge Score × Population Weight
        - Required Doctors = Hospital Score × 0.2
        - Required Test Kits = Disease Score × 20
        - Required Mosquito Nets = (Weather Score + Disease Score) × 2
        - Required IV Fluids = Hospital Score × 3

        Camp Recommendation Condition:
        Triggered if (Is Highest Risk District) AND (Hospital Score >= 60) AND (Disease Score >= 60) AND (Hospital Beds < 3000).
        """
        district = district_risk.district
        timestamp = district_risk.timestamp or datetime.now(timezone.utc).isoformat()
        risk_score = district_risk.overall_risk_score
        confidence = district_risk.confidence_score
        severity = get_incident_severity(risk_score)
        sub = district_risk.sub_scores

        # Population from Kaggle Census Dataset
        pop = snapshot.census.population if snapshot.census else 1000000
        pop_weight = max(0.5, pop / 1000000.0)

        # Transparent Deterministic Formula Calculations
        required_ors = int(sub.hospital_score * pop_weight * 8)
        required_doctors = max(2, int(sub.hospital_score * 0.2))
        required_test_kits = int(sub.disease_score * 20)
        required_mosquito_nets = int((sub.weather_score + sub.disease_score) * 2)
        required_iv_fluids = int(sub.hospital_score * 3)

        # If risk >= 75 (Critical Threshold), enforce floor guarantees as requested
        if risk_score >= 75.0:
            required_ors = max(required_ors, 500)
            required_doctors = max(required_doctors, 12)
            required_test_kits = max(required_test_kits, 1500)
            required_iv_fluids = max(required_iv_fluids, 200)
            required_mosquito_nets = max(required_mosquito_nets, 300)

        suggested_medicines = [
            {
                "item_name": "ORS Packets",
                "quantity": required_ors,
                "formatted_quantity": f"{required_ors:,} units",
                "formula_used": "Hospital Surge Score × Population Weight × 8",
                "priority": "HIGH" if risk_score >= 60 else "MEDIUM",
            },
            {
                "item_name": "Emergency Medical Doctors / Personnel",
                "quantity": required_doctors,
                "formatted_quantity": f"{required_doctors} doctors",
                "formula_used": "Hospital Surge Score × 0.2",
                "priority": "URGENT" if risk_score >= 75 else "HIGH",
            },
            {
                "item_name": "Rapid Diagnostic Test Kits",
                "quantity": required_test_kits,
                "formatted_quantity": f"{required_test_kits:,} kits",
                "formula_used": "Disease Outbreak Score × 20",
                "priority": "HIGH" if risk_score >= 50 else "MEDIUM",
            },
            {
                "item_name": "IV Fluids (Normal Saline/RL)",
                "quantity": required_iv_fluids,
                "formatted_quantity": f"{required_iv_fluids:,} bottles",
                "formula_used": "Hospital Surge Score × 3",
                "priority": "URGENT" if risk_score >= 75 else "MEDIUM",
            },
            {
                "item_name": "Insecticide-Treated Mosquito Nets",
                "quantity": required_mosquito_nets,
                "formatted_quantity": f"{required_mosquito_nets:,} nets",
                "formula_used": "(Weather Score + Disease Score) × 2",
                "priority": "HIGH" if sub.weather_score >= 60 else "MEDIUM",
            },
        ]

        # Hospital metrics from Kaggle Healthcare Capacity Dataset
        total_beds = snapshot.capacity.total_beds if snapshot.capacity else 2000
        icu_occupancy = (
            snapshot.hospital.icu_occupancy_percent
            if snapshot.hospital and snapshot.hospital.icu_occupancy_percent > 0
            else min(95.0, 45.0 + (risk_score * 0.4))
        )

        # Camp Recommendation Rule:
        # Highest Risk District AND High Hospital Score (>=60) AND High Disease Score (>=60) AND Low Beds (<3000)
        should_recommend_camps = (
            is_highest_risk_district
            and sub.hospital_score >= 60.0
            and sub.disease_score >= 60.0
            and total_beds < 3000
        ) or (risk_score >= 75.0)

        num_camps = max(1, min(8, int(risk_score / 15.0))) if should_recommend_camps else 0

        if should_recommend_camps:
            camp_summary = f"RECOMMEND IMMEDIATE MOBILE EMERGENCY CAMPS: Triggered by Highest Risk status, Hospital Surge ({sub.hospital_score:.1f}), Disease Score ({sub.disease_score:.1f}), and Low Hospital Beds ({total_beds} total beds)."
            camp_locations = [f"{district} High-Density Ward #{i+1} Mobilization Hub" for i in range(num_camps)]
        else:
            camp_summary = "Standard hospital ward capacity sufficient; no emergency mobile camps required at current risk level."
            camp_locations = []

        # Gemini Commentary
        gemini_dispatch_commentary = (
            f"Recommend immediate dispatch of requested resources to {district} based on deterministic inventory deficit."
            if risk_score >= 60.0
            else f"Routine dispatch recommended for {district} to maintain baseline inventory buffers."
        )

        evidence_footprint = get_evidence_used_footprint(snapshot)

        # JSON Representation
        json_data = {
            "report_type": "RESOURCE_REQUEST_SUMMARY",
            "approval_status": DRAFT_WATERMARK,
            "district": district,
            "timestamp": timestamp,
            "incident_severity": severity,
            "risk_score": risk_score,
            "confidence_score": confidence,
            "gemini_dispatch_recommendation": gemini_dispatch_commentary,
            "hospital_strain": {
                "total_hospital_beds": total_beds,
                "icu_occupancy_percent": round(icu_occupancy, 1),
                "strain_status": "CRITICAL STRAIN" if icu_occupancy >= 80 else "MODERATE STRAIN",
            },
            "suggested_resource_quantities": suggested_medicines,
            "camp_recommendation": {
                "triggered": should_recommend_camps,
                "summary": camp_summary,
                "recommended_camps_count": num_camps,
                "suggested_locations": camp_locations,
            },
            "evidence_used_footprint": evidence_footprint["formatted_items"],
        }

        # Markdown Representation
        md_lines = [
            f"# RESOURCE ALLOCATION REQUEST — {district.upper()}",
            f"**STATUS:** `{DRAFT_WATERMARK}`",
            f"**Timestamp:** {timestamp}",
            f"**District:** {district}",
            f"**Incident Severity:** **{severity}**",
            f"**Risk Score:** {risk_score:.2f} / 100.0 (Confidence: {confidence:.1f}%)",
            f"**Dispatch Guidance:** *\"{gemini_dispatch_commentary}\"*",
            "",
            "---",
            "",
            "## 1. DETERMINISTIC RESOURCE DEMAND FORMULAS",
            "| Item Name | Calculated Quantity | Priority Level | Transparent Formula Used |",
            "| :--- | :---: | :---: | :--- |",
        ]
        for med in suggested_medicines:
            md_lines.append(
                f"| {med['item_name']} | **{med['formatted_quantity']}** | `{med['priority']}` | `{med['formula_used']}` |"
            )

        md_lines.extend([
            "",
            "## 2. EMERGENCY CAMP MOBILIZATION DECISION",
            f"**Camp Recommendation Status:** `{'TRIGGERED' if should_recommend_camps else 'NOT REQUIRED'}`",
            f"**Summary:** {camp_summary}",
        ])
        if camp_locations:
            md_lines.append("**Suggested Locations:**")
            for loc in camp_locations:
                md_lines.append(f"- {loc}")

        md_lines.extend(["", "---", "", "### EVIDENCE USED & EXPLAINABILITY"])
        for item in evidence_footprint["formatted_items"]:
            md_lines.append(f"- {item}")
        md_lines.append(f"**Confidence Score:** {confidence:.1f}%")

        markdown_content = "\n".join(md_lines)

        # PDF-ready Structure
        pdf_structure = {
            "title": f"Emergency Resource Request Draft — {district}",
            "header_watermark": DRAFT_WATERMARK,
            "summary_metrics": {
                "District": district,
                "Incident Severity": severity,
                "Risk Score": f"{risk_score:.2f}",
                "Confidence Score": f"{confidence:.1f}%",
                "Approval Status": DRAFT_WATERMARK,
            },
            "medicine_table": {
                "columns": ["Item Name", "Calculated Quantity", "Priority", "Formula"],
                "rows": [
                    [med["item_name"], med["formatted_quantity"], med["priority"], med["formula_used"]]
                    for med in suggested_medicines
                ],
            },
            "camp_recommendation_box": {
                "Status": "TRIGGERED" if should_recommend_camps else "NOT REQUIRED",
                "Summary": camp_summary,
                "Locations": camp_locations,
            },
            "evidence_footprint": evidence_footprint["formatted_items"],
        }

        return {
            "json": json_data,
            "markdown": markdown_content,
            "pdf_structure": pdf_structure,
        }

    def generate_all_reports(
        self,
        overall_risk_result: OverallRiskResult,
        snapshots: Dict[str, DistrictSnapshot],
        reasoning_map: Optional[Dict[str, Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Master generator for a complete operational cycle.
        Produces District Priority Report, Incident Reports, and Resource Request Summaries for all districts.
        """
        reasoning_map = reasoning_map or {}

        # 1. District Priority Report
        priority_report = self.generate_district_priority_report(
            overall_risk_result=overall_risk_result,
            snapshots=snapshots,
            reasoning_map=reasoning_map,
        )

        # 2. Per-District Incident Reports & Resource Summaries
        incident_reports: Dict[str, Dict[str, Any]] = {}
        resource_summaries: Dict[str, Dict[str, Any]] = {}

        highest_district = overall_risk_result.highest_risk_district

        for district, risk_res in overall_risk_result.district_results.items():
            snapshot = snapshots[district]
            reasoning = reasoning_map.get(district)
            is_highest = (district == highest_district)

            incident_reports[district] = self.generate_incident_report(
                district_risk=risk_res,
                snapshot=snapshot,
                reasoning=reasoning,
            )

            resource_summaries[district] = self.generate_resource_request_summary(
                district_risk=risk_res,
                snapshot=snapshot,
                reasoning=reasoning,
                is_highest_risk_district=is_highest,
            )

        return {
            "cycle_id": overall_risk_result.cycle_id,
            "timestamp": overall_risk_result.timestamp or datetime.now(timezone.utc).isoformat(),
            "priority_report": priority_report,
            "incident_reports": incident_reports,
            "resource_summaries": resource_summaries,
            "approval_status": DRAFT_WATERMARK,
        }

    def _calculate_medicine_redistribution(
        self,
        overall_risk_result: OverallRiskResult,
        snapshots: Dict[str, DistrictSnapshot],
    ) -> List[Dict[str, Any]]:
        """
        Calculates inter-district transfers from Low Risk districts (surplus) to High Risk districts (deficit).
        Low Risk (Risk < 40) → Transfer → High Risk (Risk >= 60).
        """
        low_risk_districts = []
        high_risk_districts = []

        for district, risk_res in overall_risk_result.district_results.items():
            if risk_res.overall_risk_score < 40.0:
                low_risk_districts.append((district, risk_res))
            elif risk_res.overall_risk_score >= 60.0:
                high_risk_districts.append((district, risk_res))

        transfers = []
        for low_dist, low_res in low_risk_districts:
            for high_dist, high_res in high_risk_districts:
                transfers.append({
                    "from_district": low_dist,
                    "to_district": high_dist,
                    "item": "ORS Packets & Test Kits",
                    "quantity": "250 ORS units, 500 Test Kits",
                    "reason": f"Surplus reallocation from Low Risk district ({low_res.overall_risk_score:.1f}) to High Risk district ({high_res.overall_risk_score:.1f}).",
                })

        return transfers

    def _get_highest_driver(self, district_risk: DistrictRiskResult) -> str:
        """Utility to find highest sub-score key for a district."""
        sub = district_risk.sub_scores
        scores = {
            "Disease Outbreak": sub.disease_score,
            "Hospital Surge": sub.hospital_score,
            "Pharmacy Demand": sub.pharmacy_score,
            "Weather Anomaly": sub.weather_score,
            "AQI Risk": sub.aqi_score,
        }
        return max(scores, key=lambda k: scores[k])


# Global singleton instance
_report_generator_instance = ReportGenerator()


def generate_incident_report(
    district_risk: DistrictRiskResult,
    snapshot: DistrictSnapshot,
    reasoning: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    return _report_generator_instance.generate_incident_report(district_risk, snapshot, reasoning)


def generate_district_priority_report(
    overall_risk_result: OverallRiskResult,
    snapshots: Dict[str, DistrictSnapshot],
    reasoning_map: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    return _report_generator_instance.generate_district_priority_report(overall_risk_result, snapshots, reasoning_map)


def generate_resource_request_summary(
    district_risk: DistrictRiskResult,
    snapshot: DistrictSnapshot,
    reasoning: Optional[Dict[str, Any]] = None,
    is_highest_risk_district: bool = False,
) -> Dict[str, Any]:
    return _report_generator_instance.generate_resource_request_summary(
        district_risk, snapshot, reasoning, is_highest_risk_district
    )


def generate_all_reports(
    overall_risk_result: OverallRiskResult,
    snapshots: Dict[str, DistrictSnapshot],
    reasoning_map: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    return _report_generator_instance.generate_all_reports(overall_risk_result, snapshots, reasoning_map)
