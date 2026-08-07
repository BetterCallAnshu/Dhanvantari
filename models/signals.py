"""
Public Health Signal Fusion Agent - Data Signals Models
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class SourceStatus(str, Enum):
    """Status of data source ingestion."""
    LIVE = "LIVE"
    CACHED = "CACHED"
    SIMULATED = "SIMULATED"
    UNAVAILABLE = "UNAVAILABLE"


@dataclass
class WeatherSignal:
    """Raw & normalized weather data for a district."""
    district: str
    temperature_c: float
    rainfall_mm_24h: float
    humidity_percent: float
    weather_condition: str
    alert_level: str  # e.g., 'NONE', 'YELLOW', 'ORANGE', 'RED'
    source: str       # e.g., 'IMD', 'Open-Meteo', 'CACHED_FALLBACK'
    status: SourceStatus
    normalized_score: float = 0.0  # 0.0 to 100.0 (Calculated by Python)
    timestamp: str = ""


@dataclass
class DiseaseSignal:
    """Raw & normalized disease outbreak report signal (IDSP / Surveillance)."""
    district: str
    disease_name: str         # e.g., 'Dengue', 'Cholera', 'Acute Diarrheal Disease', 'Influenza'
    reported_cases_count: int
    confirmed_cases_count: int
    suspected_clusters: int
    source: str               # e.g., 'IDSP_SNAPSHOT', 'STATE_SURVEILLANCE'
    status: SourceStatus
    normalized_score: float = 0.0  # 0.0 to 100.0 (Calculated by Python)
    timestamp: str = ""


@dataclass
class HospitalSignal:
    """Raw & normalized hospital surge signal."""
    district: str
    total_admissions_24h: int
    fever_ipd_admissions: int
    icu_occupancy_percent: float
    pediatric_surge_index: float  # 0.0 to 10.0
    status: SourceStatus
    normalized_score: float = 0.0  # 0.0 to 100.0 (Calculated by Python)
    timestamp: str = ""


@dataclass
class PharmacySignal:
    """Raw & normalized OTC pharmacy sales signal."""
    district: str
    ors_sales_surge_percent: float         # % increase above baseline
    paracetamol_sales_surge_percent: float  # % increase above baseline
    antibiotic_sales_surge_percent: float  # % increase above baseline
    status: SourceStatus
    normalized_score: float = 0.0          # 0.0 to 100.0 (Calculated by Python)
    timestamp: str = ""


@dataclass
class AQISignal:
    """Optional environmental air quality signal."""
    district: str
    aqi_value: int
    pm25: float
    pm10: float
    category: str                          # 'Good', 'Moderate', 'Unhealthy', 'Severe'
    status: SourceStatus
    normalized_score: float = 0.0          # 0.0 to 100.0 (Calculated by Python)
    timestamp: str = ""


@dataclass
class NDMAAlertSignal:
    """NDMA disaster alert feed item."""
    district: str
    alert_type: str    # 'FLOOD', 'HEATWAVE', 'CYCLONE'
    severity: str      # 'MODERATE', 'HIGH', 'EXTREME'
    description: str
    status: SourceStatus
    timestamp: str = ""


@dataclass
class RSSNewsSignal:
    """Filtered public news RSS outbreak keywords signal."""
    district: str
    headline: str
    matched_keywords: List[str] = field(default_factory=list)
    relevance_score: float = 0.0
    status: SourceStatus = SourceStatus.LIVE
    timestamp: str = ""


@dataclass
class CensusData:
    """Kaggle India Census enrichment data."""
    district: str
    state: str
    population: int
    population_density_per_sq_km: float
    urbanization_rate_percent: float
    literacy_rate_percent: float


@dataclass
class HospitalCapacityData:
    """Kaggle Hospitals & Beds in India enrichment dataset."""
    district: str
    total_hospitals: int
    government_hospitals: int
    private_hospitals: int
    total_beds: int
    icu_beds: int
    beds_per_1000_pop: float
