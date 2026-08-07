"""
Public Health Signal Fusion Agent - Fusion Engine
Fuses multi-source syndromic signals, environmental feeds, and Kaggle datasets
into a unified, deterministic DistrictSnapshot object per district.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from models.signals import (
    AQISignal,
    CensusData,
    DiseaseSignal,
    HospitalCapacityData,
    HospitalSignal,
    NDMAAlertSignal,
    PharmacySignal,
    RSSNewsSignal,
    SourceStatus,
    WeatherSignal,
)
from models.snapshot import DistrictSnapshot
from services.aqi_loader import get_aqi
from services.census_loader import get_demographics
from services.hospital_loader import get_hospital_capacity
from services.signals_loader import (
    get_disease,
    get_hospital,
    get_ndma_alerts,
    get_pharmacy,
    get_rss_items,
    get_weather,
)


class FusionEngine:
    """
    Pure Python Signal Fusion Engine.
    Combines weather, disease, hospital, pharmacy, AQI, NDMA, RSS, census,
    and healthcare capacity data into a single DistrictSnapshot object.
    Never calls Gemini, never calculates risk scores.
    """

    def fuse_district(
        self,
        district: str,
        weather: Optional[WeatherSignal] = None,
        disease: Optional[DiseaseSignal] = None,
        hospital: Optional[HospitalSignal] = None,
        pharmacy: Optional[PharmacySignal] = None,
        aqi: Optional[AQISignal] = None,
        ndma_alerts: Optional[List[NDMAAlertSignal]] = None,
        rss_items: Optional[List[RSSNewsSignal]] = None,
        timestamp: Optional[str] = None,
    ) -> DistrictSnapshot:
        """
        Builds a DistrictSnapshot for a single district.
        Explicitly tracks source availability for missing signals.
        """
        eval_time = timestamp or datetime.now(timezone.utc).isoformat()

        # Enrich with Kaggle Demographic and Healthcare Capacity Datasets
        census: Optional[CensusData] = get_demographics(district)
        capacity: Optional[HospitalCapacityData] = get_hospital_capacity(district)

        # Fallback to active/live baseline feeds if not explicitly supplied
        effective_aqi: Optional[AQISignal] = aqi or get_aqi(district)
        effective_weather: Optional[WeatherSignal] = weather or get_weather(district)
        effective_disease: Optional[DiseaseSignal] = disease or get_disease(district)
        effective_hospital: Optional[HospitalSignal] = hospital or get_hospital(district)
        effective_pharmacy: Optional[PharmacySignal] = pharmacy or get_pharmacy(district)
        effective_ndma: List[NDMAAlertSignal] = (
            ndma_alerts if ndma_alerts is not None and len(ndma_alerts) > 0 else get_ndma_alerts(district)
        )
        effective_rss: List[RSSNewsSignal] = (
            rss_items if rss_items is not None and len(rss_items) > 0 else get_rss_items(district)
        )

        # Map source statuses explicitly (never silently zero-fill or drop)
        source_statuses: Dict[str, SourceStatus] = {
            "weather": effective_weather.status if effective_weather else SourceStatus.UNAVAILABLE,
            "disease": effective_disease.status if effective_disease else SourceStatus.UNAVAILABLE,
            "hospital": effective_hospital.status if effective_hospital else SourceStatus.UNAVAILABLE,
            "pharmacy": effective_pharmacy.status if effective_pharmacy else SourceStatus.UNAVAILABLE,
            "aqi": effective_aqi.status if effective_aqi else SourceStatus.UNAVAILABLE,
            "ndma": (
                effective_ndma[0].status
                if effective_ndma and len(effective_ndma) > 0
                else SourceStatus.UNAVAILABLE
            ),
            "rss": (
                effective_rss[0].status
                if effective_rss and len(effective_rss) > 0
                else SourceStatus.UNAVAILABLE
            ),
        }

        # Build and return the consolidated DistrictSnapshot
        snapshot = DistrictSnapshot(
            district=district,
            timestamp=eval_time,
            weather=effective_weather,
            disease=effective_disease,
            hospital=effective_hospital,
            pharmacy=effective_pharmacy,
            aqi=effective_aqi,
            ndma_alerts=effective_ndma,
            rss_items=effective_rss,
            census=census,
            capacity=capacity,
            source_statuses=source_statuses,
        )

        return snapshot

    def fuse_all_districts(
        self,
        districts: List[str],
        weather_map: Optional[Dict[str, WeatherSignal]] = None,
        disease_map: Optional[Dict[str, DiseaseSignal]] = None,
        hospital_map: Optional[Dict[str, HospitalSignal]] = None,
        pharmacy_map: Optional[Dict[str, PharmacySignal]] = None,
        aqi_map: Optional[Dict[str, AQISignal]] = None,
        ndma_map: Optional[Dict[str, List[NDMAAlertSignal]]] = None,
        rss_map: Optional[Dict[str, List[RSSNewsSignal]]] = None,
        timestamp: Optional[str] = None,
    ) -> Dict[str, DistrictSnapshot]:
        """
        Fuses signals across all monitored districts for a cycle.
        Returns a dictionary mapping district_name -> DistrictSnapshot.
        """
        weather_map = weather_map or {}
        disease_map = disease_map or {}
        hospital_map = hospital_map or {}
        pharmacy_map = pharmacy_map or {}
        aqi_map = aqi_map or {}
        ndma_map = ndma_map or {}
        rss_map = rss_map or {}

        snapshots: Dict[str, DistrictSnapshot] = {}

        for district in districts:
            snapshot = self.fuse_district(
                district=district,
                weather=weather_map.get(district),
                disease=disease_map.get(district),
                hospital=hospital_map.get(district),
                pharmacy=pharmacy_map.get(district),
                aqi=aqi_map.get(district),
                ndma_alerts=ndma_map.get(district, []),
                rss_items=rss_map.get(district, []),
                timestamp=timestamp,
            )
            snapshots[district] = snapshot

        return snapshots


# Global singleton instance
_fusion_engine_instance = FusionEngine()


def fuse_district_signals(
    district: str,
    weather: Optional[WeatherSignal] = None,
    disease: Optional[DiseaseSignal] = None,
    hospital: Optional[HospitalSignal] = None,
    pharmacy: Optional[PharmacySignal] = None,
    aqi: Optional[AQISignal] = None,
    ndma_alerts: Optional[List[NDMAAlertSignal]] = None,
    rss_items: Optional[List[RSSNewsSignal]] = None,
    timestamp: Optional[str] = None,
) -> DistrictSnapshot:
    """Helper function to fuse signals for a single district."""
    return _fusion_engine_instance.fuse_district(
        district=district,
        weather=weather,
        disease=disease,
        hospital=hospital,
        pharmacy=pharmacy,
        aqi=aqi,
        ndma_alerts=ndma_alerts,
        rss_items=rss_items,
        timestamp=timestamp,
    )


def fuse_all_district_signals(
    districts: List[str],
    weather_map: Optional[Dict[str, WeatherSignal]] = None,
    disease_map: Optional[Dict[str, DiseaseSignal]] = None,
    hospital_map: Optional[Dict[str, HospitalSignal]] = None,
    pharmacy_map: Optional[Dict[str, PharmacySignal]] = None,
    aqi_map: Optional[Dict[str, AQISignal]] = None,
    ndma_map: Optional[Dict[str, List[NDMAAlertSignal]]] = None,
    rss_map: Optional[Dict[str, List[RSSNewsSignal]]] = None,
    timestamp: Optional[str] = None,
) -> Dict[str, DistrictSnapshot]:
    """Helper function to fuse signals across all districts."""
    return _fusion_engine_instance.fuse_all_districts(
        districts=districts,
        weather_map=weather_map,
        disease_map=disease_map,
        hospital_map=hospital_map,
        pharmacy_map=pharmacy_map,
        aqi_map=aqi_map,
        ndma_map=ndma_map,
        rss_map=rss_map,
        timestamp=timestamp,
    )
