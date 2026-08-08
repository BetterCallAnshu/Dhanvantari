"""
Public Health Signal Fusion Agent - District Snapshot Model
Holds all raw and normalized signal states for a district at a given point in time.
"""

from dataclasses import dataclass, field
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


@dataclass
class DistrictSnapshot:
    """Unified snapshot of all multi-source signals for a single district."""
    district: str
    timestamp: str
    
    # Core Signals
    weather: Optional[WeatherSignal] = None
    disease: Optional[DiseaseSignal] = None
    hospital: Optional[HospitalSignal] = None
    pharmacy: Optional[PharmacySignal] = None
    aqi: Optional[AQISignal] = None
    
    # Auxiliary Feeds
    ndma_alerts: List[NDMAAlertSignal] = field(default_factory=list)
    rss_items: List[RSSNewsSignal] = field(default_factory=list)
    
    # Enrichment Datasets (Census & Healthcare Infrastructure)
    census: Optional[CensusData] = None
    capacity: Optional[HospitalCapacityData] = None
    
    # Ingestion Source Availability Flags
    source_statuses: Dict[str, SourceStatus] = field(default_factory=dict)
    
    @property
    def total_active_sources(self) -> int:
        """Returns number of available (LIVE, CACHED, or SIMULATED) sources."""
        return sum(
            1 for status in self.source_statuses.values()
            if status in (SourceStatus.LIVE, SourceStatus.CACHED, SourceStatus.SIMULATED)
        )

    def to_evidence_list(self) -> List[str]:
        """Consolidates available signal observations into human-readable evidence items."""
        evidence: List[str] = []
        if self.disease and self.disease.status != SourceStatus.UNAVAILABLE:
            evidence.append(
                f"IDSP Surveillance: {self.disease.disease_name} ({self.disease.confirmed_cases_count} confirmed cases, "
                f"{self.disease.reported_cases_count} reported, {self.disease.suspected_clusters} suspected clusters)."
            )
        if self.hospital and self.hospital.status != SourceStatus.UNAVAILABLE:
            evidence.append(
                f"Hospital Admissions & Capacity: {self.hospital.total_admissions_24h} admissions in 24h, "
                f"ICU occupancy at {self.hospital.icu_occupancy_percent:.1f}%, pediatric surge index {self.hospital.pediatric_surge_index:.1f}."
            )
        if self.pharmacy and self.pharmacy.status != SourceStatus.UNAVAILABLE:
            evidence.append(
                f"OTC Pharmacy Demand: ORS sales surge +{self.pharmacy.ors_sales_surge_percent:.0f}%, "
                f"Paracetamol sales surge +{self.pharmacy.paracetamol_sales_surge_percent:.0f}%, "
                f"Antibiotic demand +{self.pharmacy.antibiotic_sales_surge_percent:.0f}%."
            )
        if self.weather and self.weather.status != SourceStatus.UNAVAILABLE:
            evidence.append(
                f"Weather Anomaly: {self.weather.weather_condition}, Temp {self.weather.temperature_c:.1f}°C, "
                f"Rainfall {self.weather.rainfall_mm_24h:.1f}mm/24h (Alert: {self.weather.alert_level})."
            )
        if self.aqi and self.aqi.status != SourceStatus.UNAVAILABLE:
            evidence.append(
                f"Air Quality: AQI {self.aqi.aqi_value} ({self.aqi.category}), PM2.5: {self.aqi.pm25:.1f} µg/m³."
            )
        for alert in self.ndma_alerts:
            if alert.status != SourceStatus.UNAVAILABLE:
                evidence.append(f"NDMA Alert: [{alert.severity}] {alert.alert_type} - {alert.description}")
        for rss in self.rss_items:
            if rss.status != SourceStatus.UNAVAILABLE:
                evidence.append(f"RSS Media Brief: {rss.headline}")
        return evidence
