"""
Public Health Signal Fusion Agent - Census Data Loader
Parses Kaggle India Census dataset and provides demographic lookup functions.
"""

import csv
import os
from typing import Dict, Optional
from config.settings import DEFAULT_DISTRICT_METADATA
from models.signals import CensusData


def normalize_district_name(name: str) -> str:
    """Standardize district names (lowercase, strip whitespace, remove trailing 'District')."""
    if not name:
        return ""
    cleaned = name.strip()
    if cleaned.lower().endswith(" district"):
        cleaned = cleaned[:-9].strip()
    return cleaned.lower()


class CensusLoader:
    """In-memory cached loader for India Census demographic data."""

    def __init__(self, csv_path: Optional[str] = None):
        self.csv_path = csv_path or os.path.join(os.path.dirname(__file__), "..", "data", "census_india.csv")
        self._cache: Dict[str, CensusData] = {}
        self._is_loaded = False

    def load(self) -> Dict[str, CensusData]:
        """Loads CSV into memory with graceful fallback handling."""
        if self._is_loaded and self._cache:
            return self._cache

        self._cache = {}
        if os.path.exists(self.csv_path):
            try:
                with open(self.csv_path, mode="r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        district = row.get("District", "").strip()
                        if not district:
                            continue
                        norm_key = normalize_district_name(district)
                        self._cache[norm_key] = CensusData(
                            district=district,
                            state=row.get("State", "Unknown"),
                            population=int(float(row.get("Population", 1000000))),
                            population_density_per_sq_km=float(row.get("Population_Density_Per_Sq_Km", 500.0)),
                            urbanization_rate_percent=float(row.get("Urbanization_Rate_Percent", 50.0)),
                            literacy_rate_percent=float(row.get("Literacy_Rate_Percent", 75.0)),
                        )
            except Exception as e:
                print(f"[CensusLoader Warning] Failed to parse {self.csv_path}: {e}")

        # Ensure scope districts have fallback defaults if missing from CSV
        for district, meta in DEFAULT_DISTRICT_METADATA.items():
            norm_key = normalize_district_name(district)
            if norm_key not in self._cache:
                pop = int(meta.get("population", 1000000))
                area = float(meta.get("area_sq_km", 1000))
                density = round(pop / area, 2) if area > 0 else 500.0
                self._cache[norm_key] = CensusData(
                    district=district,
                    state="India",
                    population=pop,
                    population_density_per_sq_km=density,
                    urbanization_rate_percent=60.0,
                    literacy_rate_percent=80.0,
                )

        self._is_loaded = True
        return self._cache

    def get_demographics(self, district: str) -> Optional[CensusData]:
        """Returns CensusData for a given district name."""
        self.load()
        key = normalize_district_name(district)
        return self._cache.get(key)

    def get_population(self, district: str) -> int:
        """Returns total district population."""
        data = self.get_demographics(district)
        return data.population if data else 1000000

    def get_population_density(self, district: str) -> float:
        """Returns district population density per sq km."""
        data = self.get_demographics(district)
        return data.population_density_per_sq_km if data else 500.0


# Global singleton instance
_census_loader_instance = CensusLoader()


def get_population(district: str) -> int:
    return _census_loader_instance.get_population(district)


def get_population_density(district: str) -> float:
    return _census_loader_instance.get_population_density(district)


def get_demographics(district: str) -> Optional[CensusData]:
    return _census_loader_instance.get_demographics(district)
