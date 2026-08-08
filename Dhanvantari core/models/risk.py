"""
Public Health Signal Fusion Agent - Deterministic Risk Result Models
Computed 100% in Python. Never calculated or modified by LLM/Gemini.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class RiskLevel(str, Enum):
    LOW = "LOW"            # 0 - 39.9
    MODERATE = "MODERATE"  # 40.0 - 59.9
    HIGH = "HIGH"          # 60.0 - 74.9
    CRITICAL = "CRITICAL"  # 75.0 - 100.0


@dataclass
class SubScores:
    """Normalized sub-scores per domain (0.0 to 100.0)."""
    weather_score: float = 0.0
    disease_score: float = 0.0
    hospital_score: float = 0.0
    pharmacy_score: float = 0.0
    aqi_score: float = 0.0


@dataclass
class DistrictRiskResult:
    """Computed deterministic risk result for a single district."""
    district: str
    timestamp: str
    
    # Per-source sub-scores (0 - 100)
    sub_scores: SubScores = field(default_factory=SubScores)
    
    # Fusion Engine Output Math
    agreement_score: float = 0.0    # 0.0 to 100.0 (measure of signal consensus)
    confidence_score: float = 0.0   # 0.0 to 100.0 (completeness + agreement)
    overall_risk_score: float = 0.0 # 0.0 to 100.0
    
    risk_level: RiskLevel = RiskLevel.LOW
    
    # Metadata on signal availability during evaluation
    available_signals_count: int = 0
    missing_signals: List[str] = field(default_factory=list)
    
    # Rank among all districts (1 = highest risk)
    rank: int = 0


@dataclass
class OverallRiskResult:
    """System-wide evaluation result across all monitored districts for a single cycle."""
    cycle_id: str
    timestamp: str
    
    district_results: Dict[str, DistrictRiskResult] = field(default_factory=dict)
    ranked_districts: List[str] = field(default_factory=list)  # Sorted descending by risk
    
    highest_risk_district: str = ""
    max_risk_score: float = 0.0
    max_confidence_score: float = 0.0
    
    requires_auto_alert: bool = False  # True if max_risk >= ALERT_RISK_THRESHOLD and max_confidence >= ALERT_CONFIDENCE_THRESHOLD
