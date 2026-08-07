"""
Public Health Signal Fusion Agent - Unified Dataset Loader
Central manager for Census, Hospital Capacity, and AQI Kaggle datasets.
Ensures zero Streamlit dependency, zero Gemini dependency, and pure memory caching.
"""

from typing import Any, Dict, Optional
from models.signals import AQISignal, CensusData, HospitalCapacityData
from services.aqi_loader import AQILoader, get_aqi, get_aqi_trend
from services.census_loader import (
    CensusLoader,
    get_demographics,
    get_population,
    get_population_density,
    normalize_district_name,
)
from services.hospital_loader import (
    HospitalLoader,
    get_healthcare_index,
    get_hospital_capacity,
    get_total_beds,
)


def init_all_datasets() -> None:
    """Pre-loads and caches all static Kaggle datasets into memory."""
    CensusLoader().load()
    HospitalLoader().load()
    AQILoader().load()


def get_district_context(district: str) -> Dict[str, Any]:
    """Returns combined Kaggle dataset metadata context for a given district."""
    census = get_demographics(district)
    capacity = get_hospital_capacity(district)
    aqi = get_aqi(district)

    return {
        "district": district,
        "population": census.population if census else 1000000,
        "population_density": census.population_density_per_sq_km if census else 500.0,
        "urbanization_rate": census.urbanization_rate_percent if census else 50.0,
        "literacy_rate": census.literacy_rate_percent if census else 75.0,
        "total_hospitals": capacity.total_hospitals if capacity else 20,
        "government_hospitals": capacity.government_hospitals if capacity else 5,
        "total_beds": capacity.total_beds if capacity else 2000,
        "icu_beds": capacity.icu_beds if capacity else 200,
        "beds_per_1000": capacity.beds_per_1000_pop if capacity else 1.5,
        "healthcare_index": get_healthcare_index(district),
        "aqi_value": aqi.aqi_value if aqi else 100,
        "aqi_category": aqi.category if aqi else "Moderate",
    }


__all__ = [
    "init_all_datasets",
    "get_district_context",
    "get_population",
    "get_population_density",
    "get_demographics",
    "get_hospital_capacity",
    "get_total_beds",
    "get_healthcare_index",
    "get_aqi",
    "get_aqi_trend",
    "normalize_district_name",
]
