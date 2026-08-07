"""
Public Health Signal Fusion Agent - AQI Data Loader
Parses Kaggle Indian AQI Trends dataset and provides environmental signal lookups.
"""

import csv
import os
from typing import Dict, Optional
from models.signals import AQISignal, SourceStatus
from services.census_loader import normalize_district_name


class AQILoader:
    """In-memory cached loader for Indian AQI Trends dataset."""

    def __init__(self, csv_path: Optional[str] = None):
        self.csv_path = csv_path or os.path.join(os.path.dirname(__file__), "..", "data", "indian_aqi_trends.csv")
        self._cache: Dict[str, AQISignal] = {}
        self._is_loaded = False

    def load(self) -> Dict[str, AQISignal]:
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
                        aqi_val = int(float(row.get("AQI", 100)))
                        
                        # Calculate normalized score (0 to 100 where 100 is severe AQI 400+)
                        norm_score = min(100.0, max(0.0, (aqi_val / 400.0) * 100.0))
                        
                        self._cache[norm_key] = AQISignal(
                            district=district,
                            aqi_value=aqi_val,
                            pm25=float(row.get("PM25", 40.0)),
                            pm10=float(row.get("PM10", 80.0)),
                            category=row.get("Category", "Moderate"),
                            status=SourceStatus.CACHED,
                            normalized_score=round(norm_score, 2),
                            timestamp="2026-08-06T00:00:00Z"
                        )
            except Exception as e:
                print(f"[AQILoader Warning] Failed to parse {self.csv_path}: {e}")

        self._is_loaded = True
        return self._cache

    def get_aqi(self, district: str) -> Optional[AQISignal]:
        """Returns AQISignal for a given district name."""
        self.load()
        key = normalize_district_name(district)
        if key in self._cache:
            return self._cache[key]
        
        # Fallback default Moderate AQI
        return AQISignal(
            district=district,
            aqi_value=110,
            pm25=45.0,
            pm10=90.0,
            category="Moderate",
            status=SourceStatus.SIMULATED,
            normalized_score=27.5,
            timestamp="2026-08-06T00:00:00Z"
        )

    def get_aqi_trend(self, district: str) -> str:
        """Returns environmental trend for district."""
        aqi_signal = self.get_aqi(district)
        if aqi_signal.aqi_value > 200:
            return "CRITICAL_POLLUTION"
        elif aqi_signal.aqi_value > 150:
            return "ELEVATED_RISK"
        return "NORMAL"


# Global singleton instance
_aqi_loader_instance = AQILoader()


def get_aqi(district: str) -> Optional[AQISignal]:
    return _aqi_loader_instance.get_aqi(district)


def get_aqi_trend(district: str) -> str:
    return _aqi_loader_instance.get_aqi_trend(district)
