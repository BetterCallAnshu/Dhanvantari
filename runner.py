"""
Public Health Signal Fusion Agent - Central Pipeline Runner
Provides JSON execution bridge for Express backend and CLI usage.
Runs Fusion Engine, Risk Engine, Gemini Reasoning Agent, Supervisor Agent, and Report Generator.
"""

import argparse
from datetime import datetime, timezone
import json
import os
import sys
from typing import Any, Dict, List

# Ensure current directory is in python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from services.dataset_loader import init_all_datasets, get_district_context
from fusion import FusionEngine, RiskEngine
from reasoning_agent import GeminiReasoningAgent
from supervisor import SupervisorAgent
from report_generator import ReportGenerator
from models.signals import (
    DiseaseSignal, WeatherSignal, HospitalSignal, PharmacySignal, AQISignal, SourceStatus
)


DEFAULT_DISTRICTS = [
    "Kamrup Metropolitan",
    "Patna",
    "Ernakulam",
    "Wayanad",
    "Pune",
    "Chennai",
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "SAS Nagar (Mohali)",
    "Chandigarh"
]

def run_pipeline(
    districts: List[str] = None,
    cycle_id: str = None,
    simulation_params: Dict[str, Any] = None,
    use_gemini: bool = True
) -> Dict[str, Any]:
    """Runs a complete end-to-end signal fusion & reasoning cycle across monitored districts."""
    init_all_datasets()
    districts = districts or DEFAULT_DISTRICTS
    cycle_id = cycle_id or f"CYC-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

    fe = FusionEngine()
    re = RiskEngine()
    ra = GeminiReasoningAgent()
    sup = SupervisorAgent()
    rg = ReportGenerator()

    disease_map = {}
    weather_map = {}
    hospital_map = {}
    pharmacy_map = {}
    aqi_map = {}

    # Handle simulation spikes if provided
    if simulation_params:
        target_district = simulation_params.get("district", districts[0])
        disease_score = float(simulation_params.get("disease_score", 90.0))
        weather_score = float(simulation_params.get("weather_score", 85.0))
        hospital_score = float(simulation_params.get("hospital_score", 88.0))
        spike_type = simulation_params.get("spike_type", "vector_borne")

        # Determine signal details based on spike profile type
        if spike_type == "water_borne":
            disease_name = "Cholera & Gastrointestinal Outbreak Cluster"
            weather_condition = "Severe Flooding, Overflows, & Water Contamination"
            weather_alert = "RED"
            reported_cases = 110
            confirmed_cases = 80
            suspected_clusters = 9
            rainfall = 145.0
            humidity = 93.0
            temp = 29.5

            # Also inject a simulated high pharmacy surge for waterborne disease (ORS/rehydration)
            pharmacy_map[target_district] = PharmacySignal(
                district=target_district,
                ors_sales_surge_percent=125.0,
                paracetamol_sales_surge_percent=60.0,
                antibiotic_sales_surge_percent=85.0,
                status=SourceStatus.SIMULATED,
                normalized_score=disease_score
            )
        elif spike_type == "respiratory":
            disease_name = "Severe Acute Respiratory Infection (SARI) / Influenza-like Illness Surge"
            weather_condition = "Thermal Inversion & Suspended Particulate Aggravation"
            weather_alert = "YELLOW"
            reported_cases = 135
            confirmed_cases = 95
            suspected_clusters = 11
            rainfall = 0.0
            humidity = 38.0
            temp = 16.0

            # Also inject a simulated high AQI exposure signal
            aqi_map[target_district] = AQISignal(
                district=target_district,
                aqi_value=340,
                pm25=195.0,
                pm10=315.0,
                category="Severe",
                status=SourceStatus.SIMULATED,
                normalized_score=weather_score
            )
        elif spike_type == "heatwave":
            disease_name = "Heatstroke & Acute Severe Dehydration Clusters"
            weather_condition = "Severe Heatwave alert with temperature exceeding 45°C"
            weather_alert = "RED"
            reported_cases = 75
            confirmed_cases = 50
            suspected_clusters = 5
            rainfall = 0.0
            humidity = 14.0
            temp = 45.2

            # Inject simulated high pharmacy demand (electrolytes & ORS formulas)
            pharmacy_map[target_district] = PharmacySignal(
                district=target_district,
                ors_sales_surge_percent=145.0,
                paracetamol_sales_surge_percent=45.0,
                antibiotic_sales_surge_percent=15.0,
                status=SourceStatus.SIMULATED,
                normalized_score=disease_score
            )
        else:  # "vector_borne"
            disease_name = "Dengue & Chikungunya Syndromic Outbreak"
            weather_condition = "Severe Heavy Rainfall & Vector Proliferation Index"
            weather_alert = "RED"
            reported_cases = 85
            confirmed_cases = 65
            suspected_clusters = 6
            rainfall = 115.0
            humidity = 88.0
            temp = 34.5

        disease_map[target_district] = DiseaseSignal(
            district=target_district,
            status=SourceStatus.SIMULATED,
            disease_name=disease_name,
            source="Simulated Active Surveillance",
            reported_cases_count=reported_cases,
            confirmed_cases_count=confirmed_cases,
            suspected_clusters=suspected_clusters,
            normalized_score=disease_score
        )
        weather_map[target_district] = WeatherSignal(
            district=target_district,
            status=SourceStatus.SIMULATED,
            weather_condition=weather_condition,
            source="Simulated IMD Feed",
            temperature_c=temp,
            humidity_percent=humidity,
            rainfall_mm_24h=rainfall,
            alert_level=weather_alert,
            normalized_score=weather_score
        )
        hospital_map[target_district] = HospitalSignal(
            district=target_district,
            status=SourceStatus.SIMULATED,
            total_admissions_24h=210,
            fever_ipd_admissions=105,
            icu_occupancy_percent=92.5,
            pediatric_surge_index=9.2,
            normalized_score=hospital_score
        )

    # 1. Fuse signals into snapshots
    snapshots = fe.fuse_all_districts(
        districts=districts,
        disease_map=disease_map,
        weather_map=weather_map,
        hospital_map=hospital_map,
        pharmacy_map=pharmacy_map,
        aqi_map=aqi_map
    )

    # 2. Risk Engine - Deterministic Evaluation
    overall_risk_result = re.evaluate_all(snapshots, cycle_id=cycle_id)

    # 3. Gemini Reasoning Agent (Parallel execution across districts)
    from concurrent.futures import ThreadPoolExecutor

    reasoning_map = {}

    def _get_district_reasoning(district: str):
        d_risk = overall_risk_result.district_results[district]
        sub_dict = {
            "weather": d_risk.sub_scores.weather_score,
            "disease": d_risk.sub_scores.disease_score,
            "hospital": d_risk.sub_scores.hospital_score,
            "pharmacy": d_risk.sub_scores.pharmacy_score,
            "aqi": d_risk.sub_scores.aqi_score,
        }
        snapshot = snapshots[district]
        evidence = snapshot.to_evidence_list()
        ctx = get_district_context(district)

        reasoning_out = ra.generate_reasoning(
            district=district,
            overall_risk_score=d_risk.overall_risk_score,
            confidence_score=d_risk.confidence_score,
            risk_level=str(d_risk.risk_level),
            sub_scores=sub_dict,
            evidence_summary=evidence,
            metadata=ctx
        )
        return district, reasoning_out

    with ThreadPoolExecutor(max_workers=min(10, len(districts))) as executor:
        results = executor.map(_get_district_reasoning, districts)
        for dist, res_out in results:
            reasoning_map[dist] = res_out

    # 4. Supervisor Agent Evaluation & Policy Enforcement
    supervisor_eval = sup.evaluate_cycle(overall_risk_result, snapshots, reasoning_map)

    # 5. Report Generator
    reports = rg.generate_all_reports(overall_risk_result, snapshots, reasoning_map)

    # Compile unified JSON state output
    district_summaries = {}
    for district in districts:
        risk = overall_risk_result.district_results[district]
        snap = snapshots[district]
        ctx = get_district_context(district)

        district_summaries[district] = {
            "district": district,
            "risk_score": risk.overall_risk_score,
            "confidence_score": risk.confidence_score,
            "risk_level": str(risk.risk_level),
            "rank": overall_risk_result.ranked_districts.index(district) + 1,
            "sub_scores": {
                "weather": risk.sub_scores.weather_score,
                "disease": risk.sub_scores.disease_score,
                "hospital": risk.sub_scores.hospital_score,
                "pharmacy": risk.sub_scores.pharmacy_score,
                "aqi": risk.sub_scores.aqi_score,
            },
            "evidence": snap.to_evidence_list(),
            "reasoning": reasoning_map.get(district, {}),
            "demographics": ctx,
            "source_statuses": {k: str(v) for k, v in snap.source_statuses.items()}
        }

    return {
        "cycle_id": cycle_id,
        "timestamp": overall_risk_result.timestamp or datetime.now(timezone.utc).isoformat(),
        "status": supervisor_eval["overall_status"],
        "highest_risk_district": overall_risk_result.highest_risk_district,
        "max_risk_score": overall_risk_result.max_risk_score,
        "ranked_districts": overall_risk_result.ranked_districts,
        "alerts_triggered_count": len(supervisor_eval["alerts_triggered"]),
        "district_summaries": district_summaries,
        "supervisor_eval": {
            "overall_status": supervisor_eval["overall_status"],
            "audit_log": supervisor_eval["audit_log"],
            "alerts_triggered": [
                {
                    "alert_id": a.alert_id,
                    "cycle_id": a.cycle_id,
                    "timestamp": a.timestamp,
                    "district": a.district,
                    "risk_score": a.risk_score,
                    "confidence_score": a.confidence_score,
                    "risk_level": str(a.risk_level),
                    "status": str(a.status),
                    "trigger_reason": a.trigger_reason,
                    "is_auto_fired": a.is_auto_fired,
                }
                for a in supervisor_eval["alerts_triggered"]
            ]
        },
        "reports": reports
    }


def main():
    parser = argparse.ArgumentParser(description="Public Health Signal Fusion Pipeline Runner")
    parser.add_argument("--action", default="cycle", choices=["cycle", "simulate", "alerts", "context"])
    parser.add_argument("--districts", default="")
    parser.add_argument("--district", default="Kamrup Metropolitan")
    parser.add_argument("--disease_score", type=float, default=90.0)
    parser.add_argument("--weather_score", type=float, default=85.0)
    parser.add_argument("--hospital_score", type=float, default=88.0)
    parser.add_argument("--spike_type", default="vector_borne")

    args = parser.parse_args()

    dist_list = [d.strip() for d in args.districts.split(",") if d.strip()] if args.districts else DEFAULT_DISTRICTS

    if args.action == "simulate":
        sim_params = {
            "district": args.district,
            "disease_score": args.disease_score,
            "weather_score": args.weather_score,
            "hospital_score": args.hospital_score,
            "spike_type": args.spike_type,
        }
        res = run_pipeline(districts=dist_list, simulation_params=sim_params)
    elif args.action == "context":
        init_all_datasets()
        res = get_district_context(args.district)
    elif args.action == "alerts":
        alerts_file = "logs/alerts.json"
        if os.path.exists(alerts_file):
            with open(alerts_file, "r") as f:
                res = json.load(f)
        else:
            res = []
    else:
        res = run_pipeline(districts=dist_list)

    print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
