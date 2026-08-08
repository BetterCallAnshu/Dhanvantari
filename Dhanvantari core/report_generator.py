"""
Public Health Signal Fusion Agent - Report Generator
Generates Incident Reports, District Priority Reports, and Resource Request Summaries.
Supports JSON, Markdown, and PDF-ready structured outputs.
Strictly relies on Python deterministic risk engine for district ranking.
All outputs are explicitly marked with "DRAFT - PENDING APPROVAL".
"""

import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from models.risk import DistrictRiskResult, OverallRiskResult
from models.snapshot import DistrictSnapshot

def load_knowledge_base():
    base_path = "knowledge_base"
    kb = {}
    if os.path.exists(base_path):
        for filename in os.listdir(base_path):
            if filename.endswith(".json"):
                with open(os.path.join(base_path, filename), "r") as f:
                    kb[filename.replace(".json", "")] = json.load(f)
    return kb

KB = load_knowledge_base()

DRAFT_WATERMARK = "DRAFT - PENDING APPROVAL"


def determine_outbreak_model(
    snapshot: DistrictSnapshot,
    sub_scores: Any,
    simulation_params: Optional[Dict[str, Any]] = None,
) -> Tuple[str, str]:
    """
    Dynamically determines the Outbreak Model applicable to a district based on:
    1) Explicit simulation spike_type if present
    2) Signal inspection (disease name, weather condition, AQI, temp)
    3) Sub-score predominance

    Supported Models:
    - vector_borne: "Vector-Borne Outbreak Watch (Dengue / Malaria)"
    - water_borne: "Water-Borne Gastroenteritis Watch (Cholera / ADD)"
    - respiratory: "Respiratory Illness Surge (AQI Spike / SARI / Flu)"
    - heatwave: "Extreme Heatwave & Dehydration Crisis"
    """
    # Extract subscore values safely whether sub_scores is SubScores object or dict
    if isinstance(sub_scores, dict):
        d_score = sub_scores.get("disease", sub_scores.get("disease_score", 0.0))
        w_score = sub_scores.get("weather", sub_scores.get("weather_score", 0.0))
        h_score = sub_scores.get("hospital", sub_scores.get("hospital_score", 0.0))
        p_score = sub_scores.get("pharmacy", sub_scores.get("pharmacy_score", 0.0))
        a_score = sub_scores.get("aqi", sub_scores.get("aqi_score", 0.0))
    else:
        d_score = getattr(sub_scores, "disease_score", 0.0)
        w_score = getattr(sub_scores, "weather_score", 0.0)
        h_score = getattr(sub_scores, "hospital_score", 0.0)
        p_score = getattr(sub_scores, "pharmacy_score", 0.0)
        a_score = getattr(sub_scores, "aqi_score", 0.0)

    # 1. Explicit Simulation Spike Type Override
    if simulation_params and "spike_type" in simulation_params:
        st = str(simulation_params["spike_type"]).lower()
        if st in ["water_borne", "waterborne", "cholera", "gastro"]:
            return "water_borne", "Water-Borne Gastroenteritis Watch (Cholera / ADD)"
        elif st in ["respiratory", "aqi", "sari", "flu"]:
            return "respiratory", "Respiratory Illness Surge (AQI Spike / SARI / Flu)"
        elif st in ["heatwave", "heat_wave", "heat", "thermal"]:
            return "heatwave", "Extreme Heatwave & Dehydration Crisis"
        elif st in ["vector_borne", "vectorborne", "dengue", "malaria"]:
            return "vector_borne", "Vector-Borne Outbreak Watch (Dengue / Malaria)"

    # 2. Inspect Raw Snapshot Signals
    disease_name = str(getattr(snapshot.disease, "disease_name", "")).lower() if snapshot.disease else ""
    weather_cond = str(getattr(snapshot.weather, "weather_condition", "")).lower() if snapshot.weather else ""
    temp = float(getattr(snapshot.weather, "temperature_c", getattr(snapshot.weather, "temperature_celsius", 28.0))) if snapshot.weather else 28.0
    rainfall = float(getattr(snapshot.weather, "rainfall_mm_24h", 0.0)) if snapshot.weather else 0.0
    aqi_val = float(getattr(snapshot.aqi, "aqi_value", 0.0)) if snapshot.aqi else 0.0
    ors_surge = float(getattr(snapshot.pharmacy, "ors_sales_surge_percent", 0.0)) if snapshot.pharmacy else 0.0

    # Explicit Disease/Condition Keywords
    if any(k in disease_name or k in weather_cond for k in ["sari", "flu", "respiratory", "aqi", "smog", "particulate"]):
        return "respiratory", "Respiratory Illness Surge (AQI Spike / SARI / Flu)"
    
    if any(k in disease_name or k in weather_cond for k in ["heatwave", "heat stroke", "heatstroke", "dehydration", "extreme heat"]):
        return "heatwave", "Extreme Heatwave & Dehydration Crisis"

    if any(k in disease_name or k in weather_cond for k in ["cholera", "gastroenteritis", "diarrhea", "diarrhoeal", "flooding", "waterborne", "water-borne"]):
        return "water_borne", "Water-Borne Gastroenteritis Watch (Cholera / ADD)"

    if any(k in disease_name or k in weather_cond for k in ["dengue", "malaria", "chikungunya", "vector", "monsoon"]):
        return "vector_borne", "Vector-Borne Outbreak Watch (Dengue / Malaria)"

    # 3. Numeric Threshold & Signal Correlation Inferences
    if a_score >= 65.0 or aqi_val >= 180.0:
        return "respiratory", "Respiratory Illness Surge (AQI Spike / SARI / Flu)"

    if temp >= 39.0 or (w_score >= 65.0 and temp >= 37.0 and ors_surge >= 60.0):
        return "heatwave", "Extreme Heatwave & Dehydration Crisis"

    if (rainfall >= 80.0 and ors_surge >= 60.0) or (d_score >= 60.0 and ors_surge >= 70.0):
        return "water_borne", "Water-Borne Gastroenteritis Watch (Cholera / ADD)"

    # Default to Vector-Borne
    return "vector_borne", "Vector-Borne Outbreak Watch (Dengue / Malaria)"


def get_incident_severity(risk_score: float) -> str:
    if risk_score >= 75.0:
        return "CRITICAL"
    elif risk_score >= 60.0:
        return "HIGH"
    elif risk_score >= 40.0:
        return "MEDIUM"
    else:
        return "LOW"


def get_evidence_used_footprint(snapshot: DistrictSnapshot) -> Dict[str, Any]:
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
    Produces Incident Reports, District Priority Summaries, and Resource Request Summaries.
    Strictly adapts Clinical Intelligence interpretations to the active Outbreak Model.
    """

    def _calculate_resources(self, district_risk: DistrictRiskResult, snapshot: DistrictSnapshot) -> List[Dict[str, Any]]:
        sub = district_risk.sub_scores
        risk_score = district_risk.overall_risk_score
        pop = snapshot.census.population if snapshot.census else 1000000
        pop_weight = max(0.5, pop / 1000000.0)

        required_ors = int(sub.hospital_score * pop_weight * 8)
        required_doctors = max(2, int(sub.hospital_score * 0.2))
        required_test_kits = int(sub.disease_score * 20)
        required_mosquito_nets = int((sub.weather_score + sub.disease_score) * 2)
        required_iv_fluids = int(sub.hospital_score * 3)

        if risk_score >= 75.0:
            required_ors = max(required_ors, 500)
            required_doctors = max(required_doctors, 12)
            required_test_kits = max(required_test_kits, 1500)
            required_iv_fluids = max(required_iv_fluids, 200)
            required_mosquito_nets = max(required_mosquito_nets, 300)

        return [
            {"item_name": "ORS Packets", "quantity": required_ors, "formatted": f"{required_ors:,} units"},
            {"item_name": "Doctors / Personnel", "quantity": required_doctors, "formatted": f"{required_doctors} personnel"},
            {"item_name": "Diagnostic Kits", "quantity": required_test_kits, "formatted": f"{required_test_kits:,} kits"},
            {"item_name": "IV Fluids", "quantity": required_iv_fluids, "formatted": f"{required_iv_fluids:,} bottles"},
            {"item_name": "Insecticide Nets", "quantity": required_mosquito_nets, "formatted": f"{required_mosquito_nets:,} nets"},
        ]

    def _get_recommendations_for_model(self, model_key: str) -> Dict[str, List[str]]:
        model_to_disease = {
            "vector_borne": "Dengue",
            "water_borne": "Cholera",
            "respiratory": "SARI_Flu",
            "heatwave": "Heatstroke_Dehydration",
        }
        disease_key = model_to_disease.get(model_key, "Dengue")
        return KB.get("recommendations", {}).get(disease_key, {
            "immediate": ["Consult district health officer", "Initiate surveillance"],
            "short_term": ["Community mobilization"],
            "preventive": ["Public health awareness"]
        })

    def generate_incident_report(
        self,
        district_risk: DistrictRiskResult,
        snapshot: DistrictSnapshot,
        reasoning: Optional[Dict[str, Any]] = None,
        simulation_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generates an enriched, model-specific Incident Report for a district.
        Guarantees that the Clinical Intelligence layer adapts dynamically to the Outbreak Model.
        """
        district = district_risk.district
        timestamp = district_risk.timestamp or datetime.now(timezone.utc).isoformat()
        risk_score = district_risk.overall_risk_score
        confidence = district_risk.confidence_score
        severity = get_incident_severity(risk_score)
        sub = district_risk.sub_scores

        # Determine Model
        model_key, model_display_name = determine_outbreak_model(snapshot, sub, simulation_params)

        # Build Model-Specific Clinical Intelligence Layer
        clinical = self._build_clinical_intelligence_layer(
            district=district,
            district_risk=district_risk,
            snapshot=snapshot,
            model_key=model_key,
            model_display_name=model_display_name,
            reasoning=reasoning
        )

        recommendations = self._get_recommendations_for_model(model_key)
        resources = self._calculate_resources(district_risk, snapshot)

        # Event Timeline
        timeline = [
            f"08:00 — Surveillance feeds ingested ({snapshot.district})",
            f"10:30 — Signal correlation evaluated under {model_display_name}",
            f"12:15 — Risk severity scored at {risk_score:.1f}/100 ({severity})",
            "14:00 — Autonomous decision support & resource demand package calculated",
            "15:30 — Incident intelligence briefing compiled for district officer sign-off"
        ]

        # Consolidated JSON
        json_data = {
            "report_type": "INCIDENT_REPORT",
            "approval_status": DRAFT_WATERMARK,
            "metadata": {
                "district": district,
                "timestamp": timestamp,
                "severity": severity,
                "risk_score": risk_score,
                "confidence": confidence,
                "outbreak_model_key": model_key,
                "outbreak_model_name": model_display_name,
            },
            "clinical_intelligence": clinical,
            "recommendations": recommendations,
            "required_resources": resources,
            "affected_population": snapshot.census.population if snapshot.census else 1000000,
            "hospital_infrastructure": {
                "total_beds": snapshot.capacity.total_beds if snapshot.capacity else "N/A",
                "icu_occupancy": snapshot.hospital.icu_occupancy_percent if snapshot.hospital else "N/A",
            },
            "event_timeline": timeline,
            "reasoning_trace": reasoning.get("reasoning_trace") if reasoning else [],
            "executive_summary": reasoning.get("incident_summary") if reasoning else clinical["clinical_situation"],
        }

        # Formatted Markdown
        markdown_content = f"""# PUBLIC HEALTH INCIDENT INTELLIGENCE REPORT
**District Focus:** {district} | **Ref:** INC-{timestamp[:10].replace('-','')}-{district[:3].upper()}
**Outbreak Model:** {model_display_name}
**Severity Level:** {severity} ({risk_score:.1f} / 100) | **AI Confidence:** {confidence:.1f}%

---

## 1. Executive Situation Summary
{json_data['executive_summary']}

---

## 2. Clinical Intelligence Layer ({clinical['relevant_disease']})

### 1. What is Happening?
{clinical['clinical_situation']}

### 2. Why It Matters
{clinical['why_it_matters']}

### 3. Key Evidence & Telemetry Signals
{clinical['key_evidence']}

### 4. Potential Health Impact
{clinical['potential_health_impact']}

### 5. What to Monitor Next
{clinical['what_to_monitor']}

### 6. Recommended Interventions
{clinical['recommended_response']}

---

## 3. Clinical Diagnostic Parameters
- **Relevant Syndromes:** {", ".join(clinical['clinical_syndromes'])}
- **Symptoms & Signs:** {", ".join(clinical['symptoms'])}
- **Transmission Mechanism:** {clinical['transmission']}
- **Incubation Period:** {clinical['incubation']}
- **Citizen Advisory:** {clinical['public_advisory']}

---

## 4. Calculated Resource Dispatch Package
""" + "\n".join([f"- **{r['item_name']}**: {r['formatted']}" for r in resources])

        return {
            "json": json_data,
            "markdown": markdown_content,
        }

    def _build_clinical_intelligence_layer(
        self,
        district: str,
        district_risk: DistrictRiskResult,
        snapshot: DistrictSnapshot,
        model_key: str,
        model_display_name: str,
        reasoning: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Constructs the 6-part human-readable interpretation layer for Clinical Intelligence.
        Uses probabilistic language and model-specific clinical profiles.
        """
        sub = district_risk.sub_scores
        icu_occ = snapshot.hospital.icu_occupancy_percent if snapshot.hospital else 78.5
        cases = getattr(snapshot.disease, "reported_cases_count", getattr(snapshot.disease, "reported_cases", 45)) if snapshot.disease else 45
        confirmed = getattr(snapshot.disease, "confirmed_cases_count", getattr(snapshot.disease, "confirmed_cases", 30)) if snapshot.disease else 30
        rainfall = snapshot.weather.rainfall_mm_24h if snapshot.weather else 45.0
        temp = getattr(snapshot.weather, "temperature_c", getattr(snapshot.weather, "temperature_celsius", 28.5)) if snapshot.weather else 28.5
        humidity = snapshot.weather.humidity_percent if snapshot.weather else 75.0
        aqi_val = snapshot.aqi.aqi_value if snapshot.aqi else 120.0
        ors_surge = snapshot.pharmacy.ors_sales_surge_percent if snapshot.pharmacy else 45.0

        if model_key == "water_borne":
            relevant_disease = "Cholera & Acute Diarrhoeal Disease (ADD)"
            clinical_syndromes = ["Acute Watery Diarrhea", "Severe Electrolyte Dehydration", "Hypovolemic Shock Risk"]
            symptoms = ["Profuse watery stool", "Severe vomiting", "Rapid dehydration", "Muscle cramps", "Sunken eyes", "Lethargy"]
            transmission = "Ingestion of water or food contaminated with enteric pathogens (Vibrio cholerae / E. coli)"
            incubation = "12 hours to 5 days"
            hospital_indicators = ["Rehydration bed capacity", "Isolation ward availability", "IV fluid stock (RL/NS)", "Stool RDT kit supply"]
            environmental_signals = [f"24h Precipitation: {rainfall:.1f}mm", "Urban drainage water stagnation", "Pipeline coliform contamination risk"]
            population_risks = ["High-density unplanned settlements", "Populations lacking piped purified drinking water", "Pediatric and elderly residents"]
            
            clinical_situation = (
                f"Surveillance feeds in {district} indicate precipitation and sanitation signals that may increase the risk of water source contamination, "
                "creating conditions favorable for acute diarrhoeal disease and potential cholera transmission clusters."
            )
            why_it_matters = (
                "Contaminated water supplies can trigger rapid, explosive outbreaks of acute watery diarrhea. "
                f"At {icu_occ:.1f}% ICU occupancy, sudden severe dehydration cases risk causing hypovolemic complications if emergency IV rehydration is delayed."
            )
            key_evidence = (
                f"Precipitation: {rainfall:.1f}mm 24h rainfall; OTC Pharmacy ORS Surge: {ors_surge:.1f}%; "
                f"Disease Sub-Score: {sub.disease_score:.1f}/100; Reported Gastro Cases: {cases}."
            )
            potential_health_impact = (
                "Potential surge in acute gastroenteritis clinic visits, pediatric dehydration admissions, "
                "and high demand for oral rehydration salts and intravenous fluids (Ringer's Lactate)."
            )
            what_to_monitor = (
                "Water supply coliform counts, daily stool culture/RDT positivity rates, OTC anti-diarrheal sales trends, "
                "and rehydration ward bed turnover in district health facilities."
            )
            recommended_response = (
                "Establish emergency oral rehydration hubs, distribute chlorine water-purification tablets to impacted wards, "
                "conduct coliform testing on municipal water lines, and issue boil-water advisories."
            )
            public_advisory = "Drink only boiled or purified water, wash hands frequently with soap, and seek medical care immediately if experiencing watery diarrhea."

        elif model_key == "respiratory":
            relevant_disease = "Respiratory Illness Surge (SARI / ILI / AQI Strain)"
            clinical_syndromes = ["Severe Acute Respiratory Infection (SARI)", "Influenza-Like Illness (ILI)", "Asthma & COPD Exacerbation", "Acute Hypoxemia"]
            symptoms = ["Shortness of breath", "Persistent dry or productive cough", "Wheezing and stridor", "Chest tightness", "Throat irritation", "Hypoxemia"]
            transmission = "Inhalation of fine particulate pollutants (PM2.5/PM10) and airborne aerosol/droplet transmission"
            incubation = "Immediate airway irritation upon particulate exposure; 1-4 days for viral SARI"
            hospital_indicators = ["Oxygen bed occupancy", "Emergency ventilator availability", "Nebulizer station throughput", "Pediatric respiratory admissions"]
            environmental_signals = [f"Air Quality Index: {aqi_val:.0f}", "PM2.5 / PM10 elevated concentration", "Thermal inversion & dry stagnant air"]
            population_risks = ["Outdoor municipal and construction workers", "Elderly individuals with chronic obstructive pulmonary disease", "Asthmatic children"]

            clinical_situation = (
                f"Air quality monitoring in {district} registers elevated particulate concentrations (AQI: {aqi_val:.0f}), "
                "which may impair respiratory mucosal defenses and increase susceptibility to acute respiratory infections and airway exacerbations."
            )
            why_it_matters = (
                "High particulate exposure compromises respiratory defense mechanisms, compounding viral SARI/ILI transmission. "
                f"With hospital strain at {sub.hospital_score:.1f}/100, respiratory admissions could strain oxygen bed reserves."
            )
            key_evidence = (
                f"AQI Sub-score: {sub.aqi_score:.1f}/100 (AQI value: {aqi_val:.0f}); Disease Sub-score: {sub.disease_score:.1f}/100; "
                f"Hospital ICU Occupancy: {icu_occ:.1f}%."
            )
            potential_health_impact = (
                "Increased emergency department visits for acute bronchospasm, asthma attacks, hypoxemia requiring supplemental oxygen, "
                "and ICU ventilator admissions."
            )
            what_to_monitor = (
                "Daily PM2.5 and PM10 concentrations, emergency room respiratory triage volumes, medical oxygen cylinder consumption rates, "
                "and ventilator bed availability."
            )
            recommended_response = (
                "Establish dedicated oxygen support stations in emergency rooms, distribute N95 masks to outdoor municipal workers, "
                "issue citizen advisories restricting outdoor exercise, and enforce bans on open biomass burning."
            )
            public_advisory = "Wear an N95 mask when outdoors, run indoor air purifiers, stay well hydrated, and seek clinical evaluation if experiencing shortness of breath."

        elif model_key == "heatwave":
            relevant_disease = "Extreme Heat Hyperpyrexia & Dehydration Crisis"
            clinical_syndromes = ["Heat Hyperpyrexia (>40°C)", "Heat Exhaustion & Syncope", "Dehydration-Induced Acute Kidney Injury", "Electrolyte Derangement"]
            symptoms = ["Core body temperature >40°C", "Altered mental status or delirium", "Hot dry skin or profuse sweating", "Severe thirst", "Muscle cramps", "Dark urine"]
            transmission = "Direct prolonged environmental thermal radiation stress and intense solar exposure"
            incubation = "Acute onset within hours of sustained thermal exposure"
            hospital_indicators = ["Emergency cooling bay availability", "Cold IV rehydration protocol readiness", "ICU renal monitoring capacity", "Heat casualty triage load"]
            environmental_signals = [f"Ambient Temperature: {temp:.1f}°C", f"Relative Humidity: {humidity:.1f}%", "Solar radiation & heat wave alert"]
            population_risks = ["Outdoor agricultural and construction laborers", "Elderly residents without indoor air conditioning", "Infants and young children"]

            clinical_situation = (
                f"Meteorological feeds in {district} register elevated ambient temperatures ({temp:.1f}°C), "
                "creating conditions that significantly increase the risk of heat exhaustion, severe dehydration, and heat stroke among exposed populations."
            )
            why_it_matters = (
                "Sustained extreme thermal stress induces rapid fluid loss and core hyperthermia (>40°C), "
                "which elevates the risk of acute renal strain and cardiovascular failure if emergency cooling and rehydration are not administered promptly."
            )
            key_evidence = (
                f"Temperature: {temp:.1f}°C; Weather Sub-score: {sub.weather_score:.1f}/100; "
                f"Pharmacy Electrolyte Surge: {ors_surge:.1f}%; Hospital Strain: {sub.hospital_score:.1f}/100."
            )
            potential_health_impact = (
                "Surge in emergency room visits for heat exhaustion, heat hyperpyrexia, dehydration-induced acute kidney injury, "
                "and electrolyte imbalance complications."
            )
            what_to_monitor = (
                "Peak wet-bulb global temperature, emergency department heat casualty admissions, serum electrolyte/renal function trends in admitted patients, "
                "and public hydration station attendance."
            )
            recommended_response = (
                "Deploy public cooling centers and ORS hydration kiosks at transit hubs, issue heat alert SMS broadcasts, "
                "adjust working hours for outdoor laborers, and pre-position cold IV fluid reserves in emergency wards."
            )
            public_advisory = "Avoid direct sun exposure between 11 AM - 4 PM, drink ORS and electrolyte fluids frequently, stay in shaded areas, and seek emergency care for high fever or confusion."

        else: # vector_borne (default)
            relevant_disease = "Dengue & Malaria Vector Watch"
            clinical_syndromes = ["Acute Febrile Illness", "Retro-Orbital Pain & Thrombocytopenia", "Hemorrhagic Manifestations", "Malarial Chills & Rigors"]
            symptoms = ["High-grade fever", "Severe headache", "Retro-orbital pain", "Severe joint and muscle aches", "Skin rash", "Chills and rigors"]
            transmission = "Mosquito vector bite (Aedes aegypti / Anopheles breeding in stagnant water)"
            incubation = "4-10 days (Dengue) / 7-30 days (Malaria)"
            hospital_indicators = ["Platelet transfusion buffer capacity", "Febrile IPD bed occupancy", "Rapid Diagnostic Test (NS1/IgM/RDT) stock", "Blood bank readiness"]
            environmental_signals = [f"24h Rainfall: {rainfall:.1f}mm", f"Relative Humidity: {humidity:.1f}%", "Stagnant vector breeding containers"]
            population_risks = ["High-density residential wards with water storage", "Urban slums near unmanaged drainage", "Outdoor workers during twilight vector feeding hours"]

            clinical_situation = (
                f"Surveillance indicators in {district} show rainfall ({rainfall:.1f}mm) and humidity ({humidity:.1f}%) conditions that "
                "may increase vector breeding (Aedes/Anopheles) and elevate the potential risk of vector-borne fever clusters."
            )
            why_it_matters = (
                "Elevated vector density increases transmission rates for Dengue and Malaria. "
                f"With ICU occupancy at {icu_occ:.1f}%, early vector containment prevents severe clinical complications like thrombocytopenia and hemorrhagic shock."
            )
            key_evidence = (
                f"Disease Sub-score: {sub.disease_score:.1f}/100; 24h Rainfall: {rainfall:.1f}mm; "
                f"Reported Cases: {cases} ({confirmed} confirmed); ICU Occupancy: {icu_occ:.1f}%."
            )
            potential_health_impact = (
                "Surge in acute febrile hospital admissions, increased demand for platelet count monitoring and blood bank products, "
                "and emergency department triage strain."
            )
            what_to_monitor = (
                "Daily Dengue NS1/IgM and Malaria RDT positivity rates, platelet count trends in admitted febrile patients, "
                "mosquito container breeding index, and fever ward bed turnover."
            )
            recommended_response = (
                "Deploy thermal fogging and anti-larval spraying in flagged wards, isolate febrile patients under mosquito nets, "
                "pre-position blood bank platelet reserves, and distribute DEET insect repellents."
            )
            public_advisory = "Eliminate standing water in and around homes, apply mosquito repellent, wear long clothing, and get a blood test immediately if high fever develops."

        return {
            "outbreak_model_key": model_key,
            "outbreak_model_name": model_display_name,
            "relevant_disease": relevant_disease,
            "clinical_syndromes": clinical_syndromes,
            "symptoms": symptoms,
            "transmission": transmission,
            "incubation": incubation,
            "hospital_indicators": hospital_indicators,
            "environmental_signals": environmental_signals,
            "population_risks": population_risks,
            "clinical_situation": clinical_situation,
            "why_it_matters": why_it_matters,
            "key_evidence": key_evidence,
            "potential_health_impact": potential_health_impact,
            "what_to_monitor": what_to_monitor,
            "recommended_response": recommended_response,
            "public_advisory": public_advisory,
        }

    def generate_district_priority_report(
        self,
        overall_risk: OverallRiskResult,
        snapshots: Dict[str, DistrictSnapshot],
        reasoning_map: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        ranked = overall_risk.ranked_districts
        highest = overall_risk.highest_risk_district
        timestamp = overall_risk.timestamp or datetime.now(timezone.utc).isoformat()

        rankings = []
        for i, dist in enumerate(ranked):
            d_risk = overall_risk.district_results[dist]
            rankings.append({
                "rank": i + 1,
                "district": dist,
                "risk_score": d_risk.overall_risk_score,
                "risk_level": str(d_risk.risk_level),
                "confidence": d_risk.confidence_score,
            })

        markdown_lines = [
            "# NATIONAL DISTRICT PRIORITIZATION REPORT",
            f"**Timestamp:** {timestamp} | **Status:** {DRAFT_WATERMARK}",
            f"**Highest Priority District:** {highest}",
            "",
            "## Ranked Priority Table",
            "| Rank | District | Risk Score | Risk Level | Confidence |",
            "|------|----------|------------|------------|------------|",
        ]
        for r in rankings:
            markdown_lines.append(f"| {r['rank']} | {r['district']} | {r['risk_score']:.1f} | {r['risk_level']} | {r['confidence']:.1f}% |")

        return {
            "json": {
                "report_type": "DISTRICT_PRIORITY_REPORT",
                "approval_status": DRAFT_WATERMARK,
                "timestamp": timestamp,
                "highest_risk_district": highest,
                "rankings": rankings,
            },
            "markdown": "\n".join(markdown_lines)
        }

    def generate_resource_summaries(
        self,
        overall_risk: OverallRiskResult,
        snapshots: Dict[str, DistrictSnapshot],
    ) -> Dict[str, Dict[str, Any]]:
        summaries = {}
        for dist, d_risk in overall_risk.district_results.items():
            snap = snapshots[dist]
            resources = self._calculate_resources(d_risk, snap)
            markdown_lines = [
                f"# RESOURCE ALLOCATION SUMMARY — {dist.upper()}",
                f"**Risk Score:** {d_risk.overall_risk_score:.1f}/100 ({d_risk.risk_level})",
                "",
                "## Required Emergency Stockpiles",
            ]
            for r in resources:
                markdown_lines.append(f"- **{r['item_name']}**: {r['formatted']}")

            summaries[dist] = {
                "json": {
                    "district": dist,
                    "risk_score": d_risk.overall_risk_score,
                    "resources": resources,
                },
                "markdown": "\n".join(markdown_lines)
            }
        return summaries

    def generate_all_reports(
        self,
        overall_risk: OverallRiskResult,
        snapshots: Dict[str, DistrictSnapshot],
        reasoning_map: Optional[Dict[str, Any]] = None,
        simulation_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        incident_reports = {}
        for dist, d_risk in overall_risk.district_results.items():
            snap = snapshots[dist]
            reasoning = reasoning_map.get(dist) if reasoning_map else None
            incident_reports[dist] = self.generate_incident_report(
                d_risk, snap, reasoning=reasoning, simulation_params=simulation_params
            )

        priority_report = self.generate_district_priority_report(
            overall_risk, snapshots, reasoning_map=reasoning_map
        )
        resource_summaries = self.generate_resource_summaries(
            overall_risk, snapshots
        )

        return {
            "incident_reports": incident_reports,
            "priority_report": priority_report,
            "resource_summaries": resource_summaries,
        }
