"""
Public Health Signal Fusion Agent - Deterministic Risk Engine
100% Pure Python calculation of per-district sub-scores, agreement, confidence,
population exposure modifiers, overall risk scores, district rankings, and alert triggers.
Gemini / LLM is NEVER called in this module.
"""

from typing import Dict, List, Optional, Tuple
from config.settings import (
    ALERT_CONFIDENCE_THRESHOLD,
    ALERT_RISK_THRESHOLD,
    MAX_AGREEMENT_BONUS,
    SIGNAL_WEIGHTS,
)
from models.risk import DistrictRiskResult, OverallRiskResult, RiskLevel, SubScores
from models.signals import SourceStatus
from models.snapshot import DistrictSnapshot


class RiskEngine:
    """
    Deterministic Public Health Outbreak Risk Scoring Engine.
    Guarantees 100% reproducible scoring: identical inputs -> identical output every time.
    """

    def compute_weather_subscore(self, snapshot: DistrictSnapshot) -> float:
        """Computes 0-100 weather risk sub-score based on IMD/Open-Meteo signals."""
        w = snapshot.weather
        if not w or w.status == SourceStatus.UNAVAILABLE:
            return 0.0

        score = w.normalized_score

        # Rule-based IMD rainfall and heatwave adjustments
        if w.rainfall_mm_24h >= 100.0 or w.alert_level == "RED":
            score = max(score, 90.0)
        elif w.rainfall_mm_24h >= 50.0 or w.temperature_c >= 42.0 or w.alert_level == "ORANGE":
            score = max(score, 70.0)
        elif w.rainfall_mm_24h >= 20.0 or w.temperature_c >= 38.0 or w.alert_level == "YELLOW":
            score = max(score, 45.0)

        return min(100.0, max(0.0, score))

    def compute_disease_subscore(self, snapshot: DistrictSnapshot) -> float:
        """Computes 0-100 disease outbreak surveillance sub-score."""
        d = snapshot.disease
        if not d or d.status == SourceStatus.UNAVAILABLE:
            return 0.0

        score = d.normalized_score

        # Adjust score based on confirmed cases and suspected clusters
        if d.suspected_clusters >= 3 or d.confirmed_cases_count >= 50:
            score = max(score, 85.0)
        elif d.suspected_clusters >= 1 or d.confirmed_cases_count >= 15:
            score = max(score, 60.0)
        elif d.reported_cases_count >= 10:
            score = max(score, 35.0)

        return min(100.0, max(0.0, score))

    def compute_hospital_subscore(self, snapshot: DistrictSnapshot) -> float:
        """
        Computes 0-100 hospital surge sub-score.
        Applies Kaggle Hospitals & Beds capacity vulnerability modifier:
        Districts with lower bed density per 1,000 population receive higher pressure scores.
        """
        h = snapshot.hospital
        if not h or h.status == SourceStatus.UNAVAILABLE:
            return 0.0

        base_score = h.normalized_score

        if base_score <= 0.0:
            # Fallback calculation if raw surge data present
            admissions_score = min(100.0, (h.total_admissions_24h / 200.0) * 100.0)
            icu_score = min(100.0, h.icu_occupancy_percent)
            pediatric_score = min(100.0, h.pediatric_surge_index * 10.0)
            base_score = (admissions_score * 0.4) + (icu_score * 0.4) + (pediatric_score * 0.2)

        # Hospital Capacity Vulnerability Adjustment (Kaggle Dataset)
        capacity_modifier = 1.0
        if snapshot.capacity:
            beds_per_1k = snapshot.capacity.beds_per_1000_pop
            if beds_per_1k < 1.0:
                capacity_modifier = 1.20  # Severe capacity deficit -> 20% surge pressure boost
            elif beds_per_1k < 1.5:
                capacity_modifier = 1.10  # Moderate capacity deficit -> 10% surge pressure boost
            elif beds_per_1k > 3.0:
                capacity_modifier = 0.90  # Strong hospital infrastructure -> 10% pressure cushion

        adjusted_score = base_score * capacity_modifier
        return min(100.0, max(0.0, adjusted_score))

    def compute_pharmacy_subscore(self, snapshot: DistrictSnapshot) -> float:
        """Computes 0-100 OTC pharmacy demand surge sub-score."""
        p = snapshot.pharmacy
        if not p or p.status == SourceStatus.UNAVAILABLE:
            return 0.0

        if p.normalized_score > 0.0:
            return p.normalized_score

        # Weighted surge average: ORS (40%), Paracetamol (35%), Antibiotics (25%)
        surge_score = (
            (min(200.0, p.ors_sales_surge_percent) / 200.0 * 100.0 * 0.40)
            + (min(200.0, p.paracetamol_sales_surge_percent) / 200.0 * 100.0 * 0.35)
            + (min(200.0, p.antibiotic_sales_surge_percent) / 200.0 * 100.0 * 0.25)
        )
        return min(100.0, max(0.0, surge_score))

    def compute_aqi_subscore(self, snapshot: DistrictSnapshot) -> float:
        """Computes 0-100 environmental air quality risk sub-score."""
        a = snapshot.aqi
        if not a or a.status == SourceStatus.UNAVAILABLE:
            return 0.0

        return min(100.0, max(0.0, a.normalized_score))

    def compute_agreement(self, sub_scores_dict: Dict[str, float]) -> float:
        """
        Computes signal consensus/agreement score (0.0 to 100.0).
        High agreement occurs when available non-zero sub-scores point in the same direction.
        """
        active_scores = [score for score in sub_scores_dict.values() if score > 0.0]
        if len(active_scores) <= 1:
            return 50.0  # Neutral agreement for single/no active signal

        mean_score = sum(active_scores) / len(active_scores)
        # Calculate mean absolute deviation
        variance = sum(abs(s - mean_score) for s in active_scores) / len(active_scores)

        # Lower variance = higher agreement
        agreement = max(0.0, 100.0 - (variance * 1.5))
        return round(agreement, 2)

    def compute_district_risk(self, snapshot: DistrictSnapshot) -> DistrictRiskResult:
        """Computes complete deterministic risk result for a single district snapshot."""
        # 1. Compute Sub-scores
        weather_score = self.compute_weather_subscore(snapshot)
        disease_score = self.compute_disease_subscore(snapshot)
        hospital_score = self.compute_hospital_subscore(snapshot)
        pharmacy_score = self.compute_pharmacy_subscore(snapshot)
        aqi_score = self.compute_aqi_subscore(snapshot)

        sub_scores = SubScores(
            weather_score=round(weather_score, 2),
            disease_score=round(disease_score, 2),
            hospital_score=round(hospital_score, 2),
            pharmacy_score=round(pharmacy_score, 2),
            aqi_score=round(aqi_score, 2),
        )

        sub_scores_map = {
            "weather": weather_score,
            "disease": disease_score,
            "hospital": hospital_score,
            "pharmacy": pharmacy_score,
            "aqi": aqi_score,
        }

        # 2. Track missing vs available signals explicitly
        available_signals = []
        missing_signals = []
        weighted_sum = 0.0
        sum_weights = 0.0

        for key, weight in SIGNAL_WEIGHTS.items():
            status = snapshot.source_statuses.get(key, SourceStatus.UNAVAILABLE)
            if status != SourceStatus.UNAVAILABLE:
                available_signals.append(key)
                weighted_sum += sub_scores_map[key] * weight
                sum_weights += weight
            else:
                missing_signals.append(key)

        # Base weighted score normalized by active available weights
        base_risk = (weighted_sum / sum_weights) if sum_weights > 0.0 else 0.0

        # 3. Compute Agreement & Confidence
        agreement_score = self.compute_agreement(sub_scores_map)
        completeness_ratio = len(available_signals) / max(1, len(SIGNAL_WEIGHTS))
        confidence_score = (completeness_ratio * 60.0) + (agreement_score * 0.40)

        # 4. Agreement Bonus
        agreement_bonus = (agreement_score / 100.0) * (MAX_AGREEMENT_BONUS * (base_risk / 100.0))

        # 5. Population Exposure Adjustment (Kaggle Census Data)
        population_adj = 0.0
        if snapshot.census:
            density = snapshot.census.population_density_per_sq_km
            if density >= 2500.0:
                population_adj = 3.5  # High-density rapid vector/airborne transmission boost
            elif density >= 1000.0:
                population_adj = 1.5

        # 6. Overall Risk Score
        overall_risk = min(100.0, max(0.0, base_risk + agreement_bonus + population_adj))

        # 7. Risk Level Mapping
        if overall_risk >= 75.0:
            level = RiskLevel.CRITICAL
        elif overall_risk >= 60.0:
            level = RiskLevel.HIGH
        elif overall_risk >= 40.0:
            level = RiskLevel.MODERATE
        else:
            level = RiskLevel.LOW

        return DistrictRiskResult(
            district=snapshot.district,
            timestamp=snapshot.timestamp,
            sub_scores=sub_scores,
            agreement_score=round(agreement_score, 2),
            confidence_score=round(confidence_score, 2),
            overall_risk_score=round(overall_risk, 2),
            risk_level=level,
            available_signals_count=len(available_signals),
            missing_signals=missing_signals,
            rank=0,  # Assigned after multi-district evaluation
        )

    def evaluate_all(self, snapshots: Dict[str, DistrictSnapshot], cycle_id: str = "") -> OverallRiskResult:
        """
        Evaluates risk across all monitored districts for a given cycle.
        Ranks districts descending by risk score and evaluates system auto-alert trigger criteria.
        """
        district_results: Dict[str, DistrictRiskResult] = {}
        eval_time = ""

        for district, snapshot in snapshots.items():
            result = self.compute_district_risk(snapshot)
            district_results[district] = result
            if not eval_time:
                eval_time = snapshot.timestamp

        # Sort districts descending by overall risk score
        sorted_districts = sorted(
            district_results.keys(),
            key=lambda d: district_results[d].overall_risk_score,
            reverse=True,
        )

        # Assign rankings (1 = highest risk)
        for rank, district in enumerate(sorted_districts, start=1):
            district_results[district].rank = rank

        highest_district = sorted_districts[0] if sorted_districts else ""
        max_risk = district_results[highest_district].overall_risk_score if highest_district else 0.0
        max_confidence = district_results[highest_district].confidence_score if highest_district else 0.0

        # Autonomous Alert Trigger Criteria: Risk >= 75.0 AND Confidence >= 70.0%
        requires_alert = (
            max_risk >= ALERT_RISK_THRESHOLD and max_confidence >= ALERT_CONFIDENCE_THRESHOLD
        )

        return OverallRiskResult(
            cycle_id=cycle_id,
            timestamp=eval_time,
            district_results=district_results,
            ranked_districts=sorted_districts,
            highest_risk_district=highest_district,
            max_risk_score=max_risk,
            max_confidence_score=max_confidence,
            requires_auto_alert=requires_alert,
        )


# Global singleton instance
_risk_engine_instance = RiskEngine()


def compute_district_risk(snapshot: DistrictSnapshot) -> DistrictRiskResult:
    return _risk_engine_instance.compute_district_risk(snapshot)


def evaluate_all_districts(snapshots: Dict[str, DistrictSnapshot], cycle_id: str = "") -> OverallRiskResult:
    return _risk_engine_instance.evaluate_all(snapshots, cycle_id=cycle_id)
