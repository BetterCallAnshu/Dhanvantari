"""
Public Health Signal Fusion Agent - Configuration Module
PRD-Compliant Global Settings, Constants, and Thresholds
"""

from typing import Dict, List

# --- Application Meta ---
APP_NAME: str = "Public Health Signal Fusion Agent"
APP_VERSION: str = "1.0.0-MVP"

# --- Monitoring & Loop Parameters ---
DEFAULT_POLLING_INTERVAL_SECONDS: int = 30  # Polling/loop interval in seconds for demo
AUTONOMOUS_LOOP_ENABLED_DEFAULT: bool = True

# --- Districts in Scope (Demo Scope: Priority Districts in India) ---
DEMO_DISTRICTS: List[str] = [
    "Kamrup Metropolitan",  # Assam
    "Patna",                 # Bihar
    "Ernakulam",             # Kerala
    "Wayanad",               # Kerala
    "Pune",                  # Maharashtra
    "Chennai",               # Tamil Nadu
    "Ludhiana",              # Punjab
    "Amritsar",              # Punjab
    "Jalandhar",             # Punjab
    "Patiala",               # Punjab
    "SAS Nagar (Mohali)",    # Punjab
    "Chandigarh",            # Chandigarh UT
]

# Default District Metadata (Fallback if Census/Hospital CSVs unavailable)
DEFAULT_DISTRICT_METADATA: Dict[str, Dict[str, float]] = {
    "Kamrup Metropolitan": {"population": 1154000, "area_sq_km": 1528, "total_beds": 3200, "gov_hospitals": 14},
    "Patna": {"population": 5838000, "area_sq_km": 3202, "total_beds": 8500, "gov_hospitals": 28},
    "Ernakulam": {"population": 3280000, "area_sq_km": 3068, "total_beds": 7100, "gov_hospitals": 22},
    "Wayanad": {"population": 817000, "area_sq_km": 2131, "total_beds": 1800, "gov_hospitals": 9},
    "Pune": {"population": 9429000, "area_sq_km": 15643, "total_beds": 12500, "gov_hospitals": 38},
    "Chennai": {"population": 7088000, "area_sq_km": 426, "total_beds": 11200, "gov_hospitals": 24},
    "Ludhiana": {"population": 3498000, "area_sq_km": 3578, "total_beds": 6200, "gov_hospitals": 18},
    "Amritsar": {"population": 2490000, "area_sq_km": 2647, "total_beds": 4900, "gov_hospitals": 15},
    "Jalandhar": {"population": 2193000, "area_sq_km": 2632, "total_beds": 4100, "gov_hospitals": 12},
    "Patiala": {"population": 1895000, "area_sq_km": 3218, "total_beds": 3600, "gov_hospitals": 11},
    "SAS Nagar (Mohali)": {"population": 994000, "area_sq_km": 1093, "total_beds": 3400, "gov_hospitals": 8},
    "Chandigarh": {"population": 1055000, "area_sq_km": 114, "total_beds": 4500, "gov_hospitals": 8},
}

# --- Deterministic Risk Engine Formula Weights (Python Pure Math) ---
# Sum of weights = 1.00
SIGNAL_WEIGHTS: Dict[str, float] = {
    "weather": 0.20,
    "disease": 0.35,
    "hospital": 0.25,
    "pharmacy": 0.15,
    "aqi": 0.05,
}

# Agreement Bonus Multiplier (0.00 to 0.15 added to overall risk when multiple signals align)
MAX_AGREEMENT_BONUS: float = 15.0

# --- Supervisor Alert Thresholds ---
ALERT_RISK_THRESHOLD: float = 75.0        # Risk >= 75.0 triggers auto alert
ALERT_CONFIDENCE_THRESHOLD: float = 70.0  # Confidence >= 70.0% required for auto alert

# --- Gemini Prompt Contract Templates ---
GEMINI_SYSTEM_PROMPT: str = """You are the Lead Reasoning & Epidemiological Intelligence Agent inside the Public Health Signal Fusion System.
Your job is to explain pre-calculated risk metrics, provide an actionable reasoning trace, write an operational incident report, and recommend emergency response drafts.

CRITICAL CONSTRAINTS:
1. NEVER alter, re-calculate, override, or correct any numeric values (Risk Score, Confidence, Sub-scores, District Rankings). All numbers were calculated by deterministic Python modules and are ground truth.
2. Return ONLY a valid JSON object matching the requested schema. No markdown code blocks (do NOT use ```json), no intro text, no conversational prose.
3. Every operational recommendation or resource request MUST be clearly marked as DRAFT - PENDING APPROVAL.
"""
