"""
Public Health Signal Fusion Agent - Gemini Reasoning Agent
Strict JSON reasoning agent using Gemini 3.6 Flash / REST API.
Does NOT compute risk scores, confidence, rankings, or thresholds.
Translates pre-calculated deterministic risk results into structured qualitative reasoning,
incident summaries, and multi-domain public health recommendations.
"""

import json
import logging
import os
import urllib.request
from typing import Any, Dict, List, Optional

from models.gemini import GEMINI_OUTPUT_JSON_SCHEMA

logger = logging.getLogger("reasoning_agent")

GEMINI_MODEL = "gemini-3.5-flash"


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
    ) -> Dict[str, Any]:
        """
        Generates structured reasoning for a district's pre-calculated risk score.
        Receives ONLY pre-calculated scores, confidence, sub-scores, evidence, and metadata.
        Returns a dictionary conforming strictly to the required JSON schema.
        """
        metadata = metadata or {}

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
                )
                if gemini_output:
                    return gemini_output
            except Exception as e:
                logger.warning(
                    f"Gemini API invocation failed: {e}. Falling back to deterministic JSON reasoning."
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
PRE-CALCULATED OVERALL RISK SCORE: {overall_risk_score:.2f} / 100.0
PRE-CALCULATED RISK LEVEL: {risk_level}
PRE-CALCULATED CONFIDENCE SCORE: {confidence_score:.2f}%
PRE-CALCULATED SUB-SCORES: {formatted_subscores}

DISTRICT INFRASTRUCTURE & POPULATION METADATA:
{formatted_metadata}

SUPPORTING EVIDENCE & SURVEILLANCE FEED:
{formatted_evidence}

SYSTEM MANDATE:
Generate an epidemiological analysis and public communication package for health authorities in STRICT JSON.
DO NOT re-calculate, alter, or question any of the pre-calculated numbers.

JSON REQUIREMENTS:
1. "risk_level": Must match exact pre-calculated string "{risk_level}".
2. "confidence": Must match exact pre-calculated number {confidence_score:.2f}.
3. "affected_district": Must match exact string "{district}".
4. "reasoning_trace": Array of strings with MAXIMUM 4 bullet points explaining the driving epidemiological factors behind the score.
5. "recommendations": Array of strings containing actionable recommendations that explicitly address:
   - Weather
   - Disease
   - Hospital Load
   - AQI
   - Population
   - Resource Availability
   (Each recommendation must begin with [DRAFT - PENDING APPROVAL])
6. "incident_summary": Concise formal narrative summary of the current health risk situation for this district.
7. "public_advisory": A high-impact 2-sentence public health advisory statement tailored for citizens of {district}.
8. "dos_and_donts": Object containing "dos" (exactly 3 actionable positive items) and "donts" (exactly 3 behaviors/actions to avoid) for citizens.
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
    ) -> Dict[str, Any]:
        """
        Generates 100% deterministic local fallback JSON matching the strict schema.
        Called whenever Gemini fails, times out, or lacks an API key.
        """
        bullets = []

        weather_score = sub_scores.get("weather", 0.0)
        disease_score = sub_scores.get("disease", 0.0)
        hospital_score = sub_scores.get("hospital", 0.0)
        pharmacy_score = sub_scores.get("pharmacy", 0.0)
        aqi_score = sub_scores.get("aqi", 0.0)

        if disease_score > 0:
            bullets.append(
                f"Disease surveillance registered an elevated risk sub-score of {disease_score:.1f}/100 based on outbreak and syndromic clusters."
            )
        else:
            bullets.append("Disease surveillance signals indicate nominal baseline activity.")

        if hospital_score > 0 or pharmacy_score > 0:
            bullets.append(
                f"Healthcare pressure indicates hospital surge score of {hospital_score:.1f}/100 and OTC pharmacy demand surge of {pharmacy_score:.1f}/100."
            )
        else:
            bullets.append(
                "Hospital capacity and pharmacy demand remain within standard baseline operational thresholds."
            )

        if weather_score > 0:
            bullets.append(
                f"Environmental monitoring flagged weather anomaly risk score of {weather_score:.1f}/100 (precipitative/thermal threshold)."
            )
        else:
            bullets.append("Weather patterns remain within historical seasonal norms.")

        if aqi_score > 0:
            bullets.append(
                f"Air quality monitoring shows elevated particulate exposure score of {aqi_score:.1f}/100, compounding respiratory susceptibility."
            )
        else:
            bullets.append("Air quality levels present negligible baseline respiratory risk.")

        # Ensure maximum 4 bullets
        reasoning_trace = bullets[:4]

        pop = metadata.get("population", 1000000)
        beds = metadata.get("total_beds", 2000)

        recommendations = [
            f"[DRAFT - PENDING APPROVAL] [Weather]: Monitor IMD rainfall and temperature alerts for {district} to preempt vector/waterborne growth.",
            f"[DRAFT - PENDING APPROVAL] [Disease]: Mobilize IDSP surveillance teams for rapid active case finding and contact tracing in flagged syndromic clusters.",
            f"[DRAFT - PENDING APPROVAL] [Hospital Load]: Alert regional hospitals in {district} ({beds} total beds) to prepare overflow wards and pediatric ICU beds.",
            f"[DRAFT - PENDING APPROVAL] [AQI]: Issue public health advisories for high AQI zones to protect vulnerable respiratory populations.",
            f"[DRAFT - PENDING APPROVAL] [Population]: Deploy targeted community health workers in high-density urban zones across catchment population (~{pop:,}).",
            f"[DRAFT - PENDING APPROVAL] [Resource Availability]: Pre-position emergency stockpiles of ORS, paracetamol, IV fluids, and diagnostic test kits at district warehouses.",
        ]

        incident_summary = (
            f"Public Health Risk Analysis for {district}: Overall risk score evaluated at {overall_risk_score:.1f}/100 ({risk_level}) "
            f"with {confidence_score:.1f}% confidence across active syndromic and environmental feeds. "
            f"Key driving vectors include disease surveillance ({disease_score:.1f}/100), hospital surge ({hospital_score:.1f}/100), "
            f"and weather/environmental risk ({weather_score:.1f}/100)."
        )

        # Dynamic, context-appropriate public advisory, dos/donts, and whatsapp message fallbacks
        if disease_score >= 70.0:
            # Outbreak / Vector or Waterborne scenario
            public_advisory = (
                f"URGENT HEALTH ADVISORY: A localized spike in syndromic fever clusters has been detected in {district}. "
                "Citizens are strongly advised to eliminate standing water and maintain strict hand and drinking water hygiene."
            )
            dos = [
                "Apply mosquito repellent containing DEET and sleep under insecticide-treated bed nets.",
                "Boil all drinking water for at least one minute or use verified water purification tablets.",
                "Seek immediate medical attention at the nearest healthcare facility if high-grade fever persists."
            ]
            donts = [
                "Do not allow open containers, flower pots, or discarded tires to accumulate stagnant water.",
                "Do not self-medicate with painkillers like aspirin or ibuprofen, which can exacerbate bleeding risk.",
                "Avoid consuming raw, uncooked, or uncovered street food from unverified vendors."
            ]
            whatsapp_message = (
                f"🚨 *URGENT HEALTH ALERT: {district.upper()}* 🚨\n\n"
                f"The Public Health Department has flagged an active surge in acute fever and infection signals in {district}.\n\n"
                f"👉 *WHAT YOU MUST DO:*\n"
                f"✅ Eliminate stagnant water around your home immediately.\n"
                f"✅ Keep your drinking water boiled or purified.\n"
                f"✅ Wear long-sleeved clothing to prevent mosquito bites.\n\n"
                f"👉 *WHAT TO AVOID:*\n"
                f"❌ DO NOT self-medicate if experiencing a high fever.\n"
                f"❌ Avoid food and water from uncovered or unhygienic sources.\n\n"
                f"📞 *In case of emergency, contact the State Health Helpline at 104 immediately.*"
            )
        elif aqi_score >= 70.0:
            # Air Pollution / Respiratory scenario
            public_advisory = (
                f"AIR QUALITY ADVISORY: Dangerous particulate levels (AQI score: {aqi_score:.1f}/100) recorded in {district}. "
                "Vulnerable groups (children, elderly, and respiratory patients) should restrict outdoor activities."
            )
            dos = [
                "Wear an N95 mask securely when traveling or working outdoors.",
                "Keep windows closed and run indoor air purifiers to maintain a clean breathing zone.",
                "Stay well-hydrated to help your body flush inhaled particulates and maintain airway moisture."
            ]
            donts = [
                "Avoid morning jogs, heavy outdoor exercise, or prolonged physical activity outside.",
                "Do not burn dry leaves, household waste, or any combustible agricultural materials.",
                "Do not expose yourself to active or passive cigarette or hookah smoke."
            ]
            whatsapp_message = (
                f"😷 *AIR QUALITY ALERT: {district.upper()}* 😷\n\n"
                f"Vocal monitoring warns of critical particulate pollution levels in {district} today.\n\n"
                f"👉 *SAFETY GUIDELINES:*\n"
                f"✅ Wear an N95 filter mask when stepping outdoors.\n"
                f"✅ Keep your doors and windows closed to seal out pollutants.\n"
                f"✅ Drink plenty of water throughout the day.\n\n"
                f"👉 *ACTIONS TO AVOID:*\n"
                f"❌ Avoid early morning jogs and intensive outdoor activities.\n"
                f"❌ Do not burn garbage or leaves outdoors.\n\n"
                f"📞 *Report hazardous smoke sources or seek clinical support via 104.*"
            )
        else:
            # Seasonal baseline nominal scenario
            public_advisory = (
                f"SEASONAL HEALTH ALERT: Changing weather patterns in {district} are increasing seasonal disease risks. "
                "Practice clean personal hygiene and clean residential surrounds to prevent sudden infectious spikes."
            )
            dos = [
                "Wash hands thoroughly with soap before meals and after outdoor contact.",
                "Maintain cleanliness and dry conditions inside and around household gardens.",
                "Keep a reliable thermometer handy to track body temperature early."
            ]
            donts = [
                "Do not ignore early symptoms of headache, fatigue, or mild throat soreness.",
                "Do not dump household garbage near open drainage networks.",
                "Avoid visiting highly congested indoor spaces if you feel under the weather."
            ]
            whatsapp_message = (
                f"📢 *HEALTH WATCH: {district.upper()}* 📢\n\n"
                f"Vigilance is advised across {district} as seasonal climatic shifts begin.\n\n"
                f"👉 *BEST PRACTICES:*\n"
                f"✅ Maintain dry, clean surroundings around your home.\n"
                f"✅ Wash hands frequently using sanitizer or soap.\n"
                f"✅ Consult a doctor early if symptoms of infection appear.\n\n"
                f"👉 *BEHAVIORS TO AVOID:*\n"
                f"❌ Do not leave waste exposed near drainage lines.\n"
                f"❌ Do not ignore fever symptoms thinking it is a simple cold.\n\n"
                f"📞 *Stay safe! Reach out to the health desk at 104 for counseling.*"
            )

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
    )
