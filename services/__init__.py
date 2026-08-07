"""
Public Health Signal Fusion Agent - Services Package
"""

from services.census_loader import (
    get_demographics,
    get_population,
    get_population_density,
    normalize_district_name,
)
from services.hospital_loader import (
    get_healthcare_index,
    get_hospital_capacity,
    get_total_beds,
)
from services.aqi_loader import (
    get_aqi,
    get_aqi_trend,
)
from services.dataset_loader import (
    get_district_context,
    init_all_datasets,
)

__all__ = [
    "get_demographics",
    "get_population",
    "get_population_density",
    "normalize_district_name",
    "get_healthcare_index",
    "get_hospital_capacity",
    "get_total_beds",
    "get_aqi",
    "get_aqi_trend",
    "get_district_context",
    "init_all_datasets",
]
