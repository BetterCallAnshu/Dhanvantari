"""
Public Health Signal Fusion Agent - Hospital & Healthcare Infrastructure Loader
Parses Kaggle Hospitals and Beds dataset and provides capacity lookup functions.
"""

import csv
import os
from typing import Dict, Optional
from config.settings import DEFAULT_DISTRICT_METADATA
from models.signals import HospitalCapacityData
from services.census_loader import normalize_district_name


class HospitalLoader:
    """In-memory cached loader for Hospitals & Beds dataset."""

    def __init__(self, csv_path: Optional[str] = None):
        self.csv_path = csv_path or os.path.join(os.path.dirname(__file__), "..", "data", "hospitals_beds_india.csv")
        self._cache: Dict[str, HospitalCapacityData] = {}
        self._is_loaded = False

    def load(self) -> Dict[str, HospitalCapacityData]:
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
                        self._cache[norm_key] = HospitalCapacityData(
                            district=district,
                            total_hospitals=int(float(row.get("Total_Hospitals", 20))),
                            government_hospitals=int(float(row.get("Government_Hospitals", 5))),
                            private_hospitals=int(float(row.get("Private_Hospitals", 15))),
                            total_beds=int(float(row.get("Total_Beds", 2000))),
                            icu_beds=int(float(row.get("ICU_Beds", 200))),
                            beds_per_1000_pop=float(row.get("Beds_Per_1000_Pop", 1.5)),
                        )
            except Exception as e:
                print(f"[HospitalLoader Warning] Failed to parse {self.csv_path}: {e}")

        # Ensure scope districts have fallback defaults if missing from CSV
        for district, meta in DEFAULT_DISTRICT_METADATA.items():
            norm_key = normalize_district_name(district)
            if norm_key not in self._cache:
                total_beds = int(meta.get("total_beds", 3000))
                gov_hosp = int(meta.get("gov_hospitals", 10))
                pop = int(meta.get("population", 1000000))
                beds_per_1k = round((total_beds / pop) * 1000, 2) if pop > 0 else 1.5
                self._cache[norm_key] = HospitalCapacityData(
                    district=district,
                    total_hospitals=gov_hosp * 3,
                    government_hospitals=gov_hosp,
                    private_hospitals=gov_hosp * 2,
                    total_beds=total_beds,
                    icu_beds=int(total_beds * 0.10),
                    beds_per_1000_pop=beds_per_1k,
                )

        self._is_loaded = True
        return self._cache

    def get_hospital_capacity(self, district: str) -> Optional[HospitalCapacityData]:
        """Returns HospitalCapacityData for a given district name."""
        self.load()
        key = normalize_district_name(district)
        return self._cache.get(key)

    def get_total_beds(self, district: str) -> int:
        """Returns total hospital beds in a district."""
        data = self.get_hospital_capacity(district)
        return data.total_beds if data else 2000

    def get_healthcare_index(self, district: str) -> float:
        """Calculates a 0.0 to 10.0 healthcare infrastructure index based on bed density."""
        data = self.get_hospital_capacity(district)
        if not data:
            return 5.0
        # National benchmark: ~2.5 beds per 1000 pop = score of 7.5
        score = (data.beds_per_1000_pop / 3.0) * 10.0
        return round(min(10.0, max(1.0, score)), 2)


# Global singleton instance
_hospital_loader_instance = HospitalLoader()


def get_hospital_capacity(district: str) -> Optional[HospitalCapacityData]:
    return _hospital_loader_instance.get_hospital_capacity(district)


def get_total_beds(district: str) -> int:
    return _hospital_loader_instance.get_total_beds(district)


def get_healthcare_index(district: str) -> float:
    return _hospital_loader_instance.get_healthcare_index(district)
