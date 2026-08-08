"""
Public Health Signal Fusion Agent - Gemini Reasoning Agent
Strict JSON reasoning agent using Gemini 3.5 Flash / REST API.
Does NOT compute risk scores, confidence, rankings, or thresholds.
Translates pre-calculated deterministic risk results into structured qualitative reasoning,
incident summaries, and multi-domain public health recommendations.
Dynamically adapts to the active Outbreak Model.
"""

import json
import logging
import os
import urllib.request
from typing import Any, Dict, List, Optional

from models.gemini import GEMINI_OUTPUT_JSON_SCHEMA

logger = logging.getLogger("reasoning_agent")

GEMINI_MODEL = "gemini-3.5-flash"

MODEL_DISPLAY_NAMES = {
    "vector_borne": "Vector-Borne Outbreak Watch (Dengue / Malaria)",
    "water_borne": "Water-Borne Gastroenteritis Watch (Cholera / ADD)",
    "respiratory": "Respiratory Illness Surge (AQI Spike / SARI / Flu)",
    "heatwave": "Extreme Heatwave & Dehydration Crisis",
}


class GeminiReasoningAgent:
    """
    Gemini Reasoning Agent for Public Health Epidemiological Intelligence.
    Consumes pre-computed deterministic risk scores and generates structured JSON reasoning.
    Does NOT calculate risk scores or confidence.
    Guarantees deterministic fallback JSON if Gemini API fails or is unavailable.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")

    def generate_reasoning(
        self,
        district: str,
        overall_risk_score: float,
        confidence_score: float,
        risk_level: str,
        sub_scores: Dict[str, float],
        evidence_summary: List[str],
        metadata: Optional[Dict[str, Any]] = None,
        outbreak_model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generates structured reasoning for a district's pre-calculated risk score.
        Receives ONLY pre-calculated scores, confidence, sub-scores, evidence, metadata, and outbreak_model.
        Returns a dictionary conforming strictly to the required JSON schema.
        """
        metadata = metadata or {}
        outbreak_model_key = outbreak_model or "vector_borne"
        model_display_name = MODEL_DISPLAY_NAMES.get(
            outbreak_model_key, "Vector-Borne Outbreak Watch (Dengue / Malaria)"
        )

        # Attempt Gemini API call if API key present
        if self.api_key:
            try:
                gemini_output = self._call_gemini_api(
                    district=district,
                    overall_risk_score=overall_risk_score,
                    confidence_score=confidence_score,
                    risk_level=risk_level,
                    sub_scores=sub_scores,
                    evidence_summary=evidence_summary,
                    metadata=metadata,
                    outbreak_model_key=outbreak_model_key,
                    model_display_name=model_display_name,
                )
                if gemini_output:
                    return gemini_output
            except Exception as e:
                logger.warning(
                    f"Gemini API invocation failed: {e}. Falling back to model-specific local JSON reasoning."
                )

        # Fallback if Gemini fails or API key missing
        return self.generate_fallback_reasoning(
            district=district,
            overall_risk_score=overall_risk_score,
            confidence_score=confidence_score,
            risk_level=risk_level,
            sub_scores=sub_scores,
            evidence_summary=evidence_summary,
            metadata=metadata,
            outbreak_model_key=outbreak_model_key,
            model_display_name=model_display_name,
        )

    def _call_gemini_api(
        self,
        district: str,
        overall_risk_score: float,
        confidence_score: float,
        risk_level: str,
        sub_scores: Dict[str, float],
        evidence_summary: List[str],
        metadata: Dict[str, Any],
        outbreak_model_key: str,
        model_display_name: str,
    ) -> Optional[Dict[str, Any]]:
        """Invokes Gemini 3.5 Flash API with strict JSON schema response mode."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={self.api_key}"

        formatted_evidence = (
            "\n".join(f"- {item}" for item in evidence_summary)
            if evidence_summary
            else "- No anomalous raw signals recorded."
        )
        formatted_subscores = ", ".join(
            f"{k.capitalize()}: {v:.1f}/100" for k, v in sub_scores.items()
        )
        formatted_metadata = json.dumps(metadata)

        prompt = f"""EVALUATION DISTRICT: {district}
CURRENT OUTBREAK MODEL BEING EVALUATED: {model_display_name} ({outbreak_model_key})
PRE-CALCULATED OVERALL RISK SCORE: {overall_risk_score:.2f} / 100.0
PRE-CALCULATED RISK LEVEL: {risk_level}
PRE-CALCULATED CONFIDENCE SCORE: {confidence_score:.2f}%
PRE-CALCULATED SUB-SCORES: {formatted_subscores}

DISTRICT INFRASTRUCTURE & POPULATION METADATA:
{formatted_metadata}

SUPPORTING EVIDENCE & SURVEILLANCE FEED:
{formatted_evidence}

SYSTEM MANDATE & CLINICAL INTERPRETATION RULES:
1. You MUST evaluate this district STRICTLY through the lens of the selected Outbreak Model ({model_display_name}).
   - If model is 'respiratory': Discuss AQI, PM2.5/10, SARI/ILI, airway obstruction, oxygen support, mask advisories. Do NOT mention mosquitoes or dengue.
   - If model is 'water_borne': Discuss heavy precipitation, sewage overflow, Cholera/Gastroenteritis, acute watery diarrhea, ORS/IV hydration, water purification. Do NOT mention dengue or mosquitoes.
   - If model is 'heatwave': Discuss extreme ambient temperature, direct solar radiation, heat stroke, dehydration-induced renal strain, cooling centers, electrolyte replenishment. Do NOT mention dengue or mosquitoes.
   - If model is 'vector_borne': Discuss standing water, Aedes/Anopheles breeding, Dengue/Malaria, fever, platelet monitoring, vector fogging.
2. Use probabilistic language ('may increase risk of', 'creates conditions favorable for', 'is consistent with', 'suggests', 'warrants monitoring'). Do NOT state unverified clinical conclusions as absolute facts.
3. DO NOT re-calculate, alter, or question any of the pre-calculated numbers.

JSON REQUIREMENTS:
1. "risk_level": Must match exact pre-calculated string "{risk_level}".
2. "confidence": Must match exact pre-calculated number {confidence_score:.2f}.
3. "affected_district": Must match exact string "{district}".
4. "reasoning_trace": Array of strings with MAXIMUM 4 bullet points explaining the driving epidemiological factors under {model_display_name}.
5. "recommendations": Array of strings containing actionable recommendations that explicitly address:
   - Weather
   - Disease
   - Hospital Load
   - AQI
   - Population
   - Resource Availability
   (Each recommendation must begin with [DRAFT - PENDING APPROVAL])
6. "incident_summary": Concise formal narrative summary of the current health risk situation for this district under {model_display_name}.
7. "public_advisory": A high-impact 2-sentence public health advisory statement tailored for citizens of {district} and specific to {model_display_name}.
8. "dos_and_donts": Object containing "dos" (exactly 3 actionable positive items) and "donts" (exactly 3 behaviors/actions to avoid) for citizens for this specific model.
9. "whatsapp_message": A beautifully structured, copy-pasteable WhatsApp broadcast message complete with warning/alert emojis, clear bold section headings, list formatting, and a designated helpline (e.g., 104 Health Helpline).
"""

        payload = {
            "systemInstruction": {
                "parts": [
                    {
                        "text": (
                            "You are a Public Health Epidemiological Reasoning Agent. "
                            "You analyze pre-computed risk signals and generate structured health briefs and citizen alerts. "
                            "You MUST NOT calculate or alter risk scores, confidence, or rankings. "
                            "Produce strictly valid JSON matching the requested schema."
                        )
                    }
                ]
            },
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": GEMINI_OUTPUT_JSON_SCHEMA,
                "temperature": 0.2,
            },
        }

        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "aistudio-build",
            },
        )

        with urllib.request.urlopen(req, timeout=3) as response:
            if response.status != 200:
                raise RuntimeError(f"Gemini API returned status code {response.status}")

            resp_body = response.read().decode("utf-8")
            res_json = json.loads(resp_body)

            candidates = res_json.get("candidates", [])
            if not candidates:
                raise ValueError("No response candidates returned by Gemini API")

            raw_text = (
                candidates[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "")
            )
            parsed_json = json.loads(raw_text)

            # Enforce max 4 reasoning trace bullets
            if "reasoning_trace" in parsed_json and len(parsed_json["reasoning_trace"]) > 4:
                parsed_json["reasoning_trace"] = parsed_json["reasoning_trace"][:4]

            # Enforce exact ground truth values from Python deterministic engine
            parsed_json["risk_level"] = str(risk_level)
            parsed_json["confidence"] = float(confidence_score)
            parsed_json["affected_district"] = str(district)

            return parsed_json

    def generate_fallback_reasoning(
        self,
        district: str,
        overall_risk_score: float,
        confidence_score: float,
        risk_level: str,
        sub_scores: Dict[str, float],
        evidence_summary: List[str],
        metadata: Dict[str, Any],
        outbreak_model_key: str = "vector_borne",
        model_display_name: str = "Vector-Borne Outbreak Watch (Dengue / Malaria)",
    ) -> Dict[str, Any]:
        """
        Generates 100% deterministic local fallback JSON tailored to the active Outbreak Model.
        Called whenever Gemini fails, times out, or lacks an API key.
        """
        bullets = []

        weather_score = sub_scores.get("weather", 0.0)
        disease_score = sub_scores.get("disease", 0.0)
        hospital_score = sub_scores.get("hospital", 0.0)
        pharmacy_score = sub_scores.get("pharmacy", 0.0)
        aqi_score = sub_scores.get("aqi", 0.0)

        pop = metadata.get("population", 1000000)
        beds = metadata.get("total_beds", 2000)

        # Model-Specific Bullets & Language
        if outbreak_model_key == "water_borne":
            bullets.append(
                f"Rainfall and drainage telemetry in {district} indicate precipitative risks that may increase water source contamination probability."
            )
            bullets.append(
                f"Disease surveillance registered an enteric/diarrhoeal risk sub-score of {disease_score:.1f}/100, with pharmacy ORS demand surge at {pharmacy_score:.1f}/100."
            )
            bullets.append(
                f"Healthcare infrastructure reflects hospital bed strain score of {hospital_score:.1f}/100, warranting pre-positioning of oral and IV rehydration stocks."
            )
            bullets.append(
                "Environmental monitoring advises water purity testing across municipal pipelines and high-density catchments."
            )

            recommendations = [
                f"[DRAFT - PENDING APPROVAL] [Weather]: Monitor intense precipitation anomalies in {district} to preempt drainage sewage overflow.",
                f"[DRAFT - PENDING APPROVAL] [Disease]: Mobilize IDSP surveillance teams for rapid active case finding of acute watery diarrhea cases.",
                f"[DRAFT - PENDING APPROVAL] [Hospital Load]: Alert regional hospitals in {district} ({beds} beds) to prepare oral rehydration wards and isolation beds.",
                f"[DRAFT - PENDING APPROVAL] [AQI]: Maintain baseline air quality monitoring alongside active water quality testing.",
                f"[DRAFT - PENDING APPROVAL] [Population]: Distribute chlorine water-purification tablets to high-density urban settlements (~{pop:,} pop).",
                f"[DRAFT - PENDING APPROVAL] [Resource Availability]: Pre-position emergency stockpiles of ORS, Ringer's Lactate IV fluids, and stool RDT kits.",
            ]

            incident_summary = (
                f"Water-Borne Epidemiological Alert for {district}: Overall risk score evaluated at {overall_risk_score:.1f}/100 ({risk_level}) "
                f"with {confidence_score:.1f}% confidence under {model_display_name}. "
                f"Primary drivers include gastrointestinal disease surveillance ({disease_score:.1f}/100), hospital strain ({hospital_score:.1f}/100), "
                f"and OTC pharmacy ORS demand ({pharmacy_score:.1f}/100)."
            )

            public_advisory = (
                f"WATER SAFETY ADVISORY: Elevated water contamination risks recorded in {district}. "
                "Citizens are strongly advised to consume only boiled or purified water and practice strict food and hand hygiene."
            )
            dos = [
                "Boil all drinking water for at least one minute or use verified water purification tablets.",
                "Wash hands thoroughly with soap before eating and after handling water storage containers.",
                "Consume ORS fluids immediately and visit a health center if acute diarrhea or vomiting occurs."
            ]
            donts = [
                "Do not consume unboiled municipal tap water or unverified well water.",
                "Do not eat uncovered street food or raw cut fruits from exposed vendors.",
                "Do not delay seeking clinical care if feeling weak or showing signs of severe thirst and dehydration."
            ]
            whatsapp_message = (
                f"💧 *WATER SAFETY ALERT: {district.upper()}* 💧\n\n"
                f"Public health surveillance warns of increased water contamination risk in {district}.\n\n"
                f"👉 *REQUIRED PRECAUTIONS:*\n"
                f"✅ Boil all drinking water thoroughly before consumption.\n"
                f"✅ Wash hands with soap frequently, especially before meals.\n"
                f"✅ Use ORS packets at the first sign of gastrointestinal distress.\n\n"
                f"👉 *WHAT TO AVOID:*\n"
                f"❌ DO NOT drink unboiled tap water or unverified well water.\n"
                f"❌ Avoid raw, uncovered street food.\n\n"
                f"📞 *For medical assistance or water testing alerts, call 104 immediately.*"
            )

        elif outbreak_model_key == "respiratory":
            bullets.append(
                f"Air quality sensors in {district} recorded a critical AQI sub-score of {aqi_score:.1f}/100, which may impair respiratory mucosal barriers."
            )
            bullets.append(
                f"Disease surveillance signals indicate respiratory/SARI illness sub-score of {disease_score:.1f}/100."
            )
            bullets.append(
                f"Hospital load score of {hospital_score:.1f}/100 highlights potential demand for emergency oxygen beds and nebulizer stations."
            )
            bullets.append(
                "Environmental monitoring advises dust suppression measures and open biomass burning enforcement."
            )

            recommendations = [
                f"[DRAFT - PENDING APPROVAL] [Weather]: Monitor thermal inversion and atmospheric stagnation layers over {district}.",
                f"[DRAFT - PENDING APPROVAL] [Disease]: Triage acute respiratory infections (SARI/ILI) in dedicated hospital fever clinics.",
                f"[DRAFT - PENDING APPROVAL] [Hospital Load]: Ensure medical oxygen supply and ventilator readiness in district hospitals ({beds} beds).",
                f"[DRAFT - PENDING APPROVAL] [AQI]: Issue high AQI health advisories and enforce open burning prohibitions in {district}.",
                f"[DRAFT - PENDING APPROVAL] [Population]: Distribute N95 masks to outdoor municipal workers and vulnerable residents (~{pop:,} pop).",
                f"[DRAFT - PENDING APPROVAL] [Resource Availability]: Pre-position diagnostic kits, oxygen cylinders, and bronchodilator inhalers.",
            ]

            incident_summary = (
                f"Respiratory Health Alert for {district}: Overall risk score evaluated at {overall_risk_score:.1f}/100 ({risk_level}) "
                f"with {confidence_score:.1f}% confidence under {model_display_name}. "
                f"Primary drivers include air quality particulate strain ({aqi_score:.1f}/100) and acute respiratory syndromic surveillance ({disease_score:.1f}/100)."
            )

            public_advisory = (
                f"AIR QUALITY ADVISORY: Unhealthful particulate levels (AQI score: {aqi_score:.1f}/100) recorded in {district}. "
                "Children, elderly citizens, and respiratory patients should minimize outdoor exposure and wear N95 masks."
            )
            dos = [
                "Wear an N95 filter mask securely when stepping outside.",
                "Keep doors and windows closed and use indoor air filtration where possible.",
                "Maintain high fluid intake to soothe throat irritation and support airway clearance."
            ]
            donts = [
                "Do not engage in strenuous outdoor exercise, morning jogs, or heavy physical work during peak smog hours.",
                "Do not burn leaves, garbage, or agricultural waste outdoors.",
                "Avoid exposure to secondhand tobacco smoke or indoor fuel combustion."
            ]
            whatsapp_message = (
                f"😷 *AIR QUALITY ALERT: {district.upper()}* 😷\n\n"
                f"Surveillance monitors record dangerous particulate pollution levels across {district} today.\n\n"
                f"👉 *SAFETY GUIDELINES:*\n"
                f"✅ Wear an N95 filter mask when traveling outdoors.\n"
                f"✅ Keep household windows closed to keep out pollutants.\n"
                f"✅ Drink plenty of water throughout the day.\n\n"
                f"👉 *BEHAVIORS TO AVOID:*\n"
                f"❌ Avoid early morning jogs or outdoor strenuous exercise.\n"
                f"❌ Do not burn waste or dry leaves outdoors.\n\n"
                f"📞 *Seek emergency clinical advice via 104 if experiencing severe shortness of breath.*"
            )

        elif outbreak_model_key == "heatwave":
            bullets.append(
                f"Thermal monitoring in {district} registered extreme weather risk sub-score of {weather_score:.1f}/100, with elevated ambient temperatures."
            )
            bullets.append(
                f"Pharmacy OTC sales show significant electrolyte/ORS demand surge ({pharmacy_score:.1f}/100), reflecting community heat stress."
            )
            bullets.append(
                f"Hospital surge score of {hospital_score:.1f}/100 highlights potential heat exhaustion and dehydration-induced renal strain admissions."
            )
            bullets.append(
                "Environmental monitoring advises establishing public cooling spots and hydration kiosks across high-density markets."
            )

            recommendations = [
                f"[DRAFT - PENDING APPROVAL] [Weather]: Issue extreme heat alert SMS warnings for {district} during peak solar hours.",
                f"[DRAFT - PENDING APPROVAL] [Disease]: Monitor emergency departments for heat stroke, syncope, and hyperthermia admissions.",
                f"[DRAFT - PENDING APPROVAL] [Hospital Load]: Establish emergency cooling bays and cold IV fluid stations at regional facilities ({beds} beds).",
                f"[DRAFT - PENDING APPROVAL] [AQI]: Monitor ozone and thermal pollution factors during peak temperature windows.",
                f"[DRAFT - PENDING APPROVAL] [Population]: Adjust working hours for outdoor laborers and vulnerable community groups (~{pop:,} pop).",
                f"[DRAFT - PENDING APPROVAL] [Resource Availability]: Pre-position emergency stocks of ORS, cold saline IV fluids, and ice cooling packs.",
            ]

            incident_summary = (
                f"Extreme Heatwave & Dehydration Alert for {district}: Overall risk score evaluated at {overall_risk_score:.1f}/100 ({risk_level}) "
                f"with {confidence_score:.1f}% confidence under {model_display_name}. "
                f"Primary drivers include thermal weather risk ({weather_score:.1f}/100) and pharmacy electrolyte demand surge ({pharmacy_score:.1f}/100)."
            )

            public_advisory = (
                f"HEATWAVE WARNING: Extreme thermal conditions in {district}. "
                "Citizens should avoid direct sunlight between 11 AM and 4 PM and consume ORS or water frequently to prevent heat stroke."
            )
            dos = [
                "Drink ORS, buttermilk, or water frequently even if not feeling thirsty.",
                "Wear lightweight, loose-fitting, light-colored cotton clothing.",
                "Take shelter in cool, shaded, or air-conditioned environments during peak afternoon hours."
            ]
            donts = [
                "Do not step into direct solar radiation between 11:00 AM and 4:00 PM without head protection.",
                "Do not leave children, elderly persons, or pets inside parked vehicles.",
                "Avoid caffeinated or alcoholic beverages, which exacerbate bodily dehydration."
            ]
            whatsapp_message = (
                f"☀️ *EXTREME HEAT ALERT: {district.upper()}* ☀️\n\n"
                f"Severe heatwave conditions recorded across {district}. Protect yourself against thermal dehydration and heat stroke.\n\n"
                f"👉 *ESSENTIAL ADVICE:*\n"
                f"✅ Drink ORS, coconut water, or water continuously.\n"
                f"✅ Rest in shaded or cooled indoor areas during the afternoon.\n"
                f"✅ Use umbrellas or wide hats if walking outdoors.\n\n"
                f"👉 *CRITICAL DON'TS:*\n"
                f"❌ DO NOT stay under direct sun between 11 AM - 4 PM.\n"
                f"❌ Never leave anyone in a parked closed vehicle.\n\n"
                f"📞 *In case of heat hyperpyrexia or fainting, contact 104 immediately.*"
            )

        else: # vector_borne
            bullets.append(
                f"Disease surveillance in {district} registered an elevated risk sub-score of {disease_score:.1f}/100 based on acute febrile clusters."
            )
            bullets.append(
                f"Weather risk sub-score of {weather_score:.1f}/100 indicates precipitative and humidity conditions favorable for vector breeding."
            )
            bullets.append(
                f"Healthcare indicators reflect hospital strain score of {hospital_score:.1f}/100 and OTC antipyretic sales surge of {pharmacy_score:.1f}/100."
            )
            bullets.append(
                "Environmental monitoring advises vector control spraying and container breeding elimination."
            )

            recommendations = [
                f"[DRAFT - PENDING APPROVAL] [Weather]: Monitor rainfall stagnation zones in {district} to preempt mosquito vector breeding.",
                f"[DRAFT - PENDING APPROVAL] [Disease]: Mobilize IDSP surveillance teams for rapid active case finding and NS1/IgM diagnostic testing.",
                f"[DRAFT - PENDING APPROVAL] [Hospital Load]: Alert district hospitals in {district} ({beds} beds) to prepare screened fever wards and blood bank reserves.",
                f"[DRAFT - PENDING APPROVAL] [AQI]: Maintain baseline air quality monitoring during vector control fogging operations.",
                f"[DRAFT - PENDING APPROVAL] [Population]: Execute community container-cleaning and fogging drives across urban catchments (~{pop:,} pop).",
                f"[DRAFT - PENDING APPROVAL] [Resource Availability]: Pre-position rapid test kits, paracetamol, IV fluids, and mosquito nets at central depots.",
            ]

            incident_summary = (
                f"Vector-Borne Outbreak Watch for {district}: Overall risk score evaluated at {overall_risk_score:.1f}/100 ({risk_level}) "
                f"with {confidence_score:.1f}% confidence under {model_display_name}. "
                f"Primary drivers include disease surveillance ({disease_score:.1f}/100), weather vector risk ({weather_score:.1f}/100), "
                f"and hospital surge ({hospital_score:.1f}/100)."
            )

            public_advisory = (
                f"VECTOR-BORNE HEALTH ADVISORY: Elevated fever cluster activity detected in {district}. "
                "Citizens should eliminate standing water around homes and use mosquito repellents or bed nets."
            )
            dos = [
                "Apply mosquito repellent containing DEET or Picaridin on exposed skin.",
                "Ensure water storage drums, coolers, and flower pots are emptied and dried weekly.",
                "Sleep under insecticide-treated mosquito nets and wear long-sleeved clothing."
            ]
            donts = [
                "Do not allow stagnant water to accumulate in open containers or discarded tires.",
                "Do not self-medicate with aspirin or NSAIDs if fever develops; seek medical testing first.",
                "Do not ignore persistent high fever, joint pain, or rash."
            ]
            whatsapp_message = (
                f"🚨 *VECTOR OUTBREAK WATCH: {district.upper()}* 🚨\n\n"
                f"Public Health Surveillance flags increased vector-borne fever risk in {district}.\n\n"
                f"👉 *PREVENTATIVE STEPS:*\n"
                f"✅ Clear standing water around your residence immediately.\n"
                f"✅ Use mosquito repellents and sleep under bed nets.\n"
                f"✅ Seek a diagnostic blood test if fever persists.\n\n"
                f"👉 *WHAT TO AVOID:*\n"
                f"❌ DO NOT self-medicate with painkiller drugs.\n"
                f"❌ Do not leave water containers uncovered.\n\n"
                f"📞 *Call the State Health Line at 104 for fever guidance.*"
            )

        reasoning_trace = bullets[:4]

        return {
            "risk_level": str(risk_level),
            "confidence": float(confidence_score),
            "affected_district": str(district),
            "reasoning_trace": reasoning_trace,
            "recommendations": recommendations,
            "incident_summary": incident_summary,
            "public_advisory": public_advisory,
            "dos_and_donts": {
                "dos": dos,
                "donts": donts
            },
            "whatsapp_message": whatsapp_message,
            "is_fallback": True,
        }


# Global singleton instance
_reasoning_agent_instance = GeminiReasoningAgent()


def run_gemini_reasoning(
    district: str,
    overall_risk_score: float,
    confidence_score: float,
    risk_level: str,
    sub_scores: Dict[str, float],
    evidence_summary: List[str],
    metadata: Optional[Dict[str, Any]] = None,
    outbreak_model: Optional[str] = None,
) -> Dict[str, Any]:
    """Helper function to execute Gemini reasoning agent with automatic fallback."""
    return _reasoning_agent_instance.generate_reasoning(
        district=district,
        overall_risk_score=overall_risk_score,
        confidence_score=confidence_score,
        risk_level=risk_level,
        sub_scores=sub_scores,
        evidence_summary=evidence_summary,
        metadata=metadata,
        outbreak_model=outbreak_model,
    )
