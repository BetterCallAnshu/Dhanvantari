"""
Public Health Signal Fusion Agent - Supervisor Agent
Evaluates threshold conditions across Fusion Engine, Risk Engine, and Reasoning Agent outputs.
Enforces autonomous alert generation rules (Risk >= 75 AND Confidence >= 70).
Does NOT calculate risk scores. Enforces rules, generates alerts, logs audit events,
and persists alerts to alerts.json.
"""

from datetime import datetime, timezone
import json
import logging
import os
from typing import Any, Dict, List, Optional
import uuid

from config.settings import ALERT_CONFIDENCE_THRESHOLD, ALERT_RISK_THRESHOLD
from models.alerts import AlertEvent, AlertStatus
from models.risk import DistrictRiskResult, OverallRiskResult
from models.snapshot import DistrictSnapshot

logger = logging.getLogger("supervisor_agent")


class SupervisorAgent:
    """
    Supervisor Agent responsible for policy enforcement, alert triggering,
    and audit log generation. Does NOT calculate risk scores.
    """

    def __init__(self, alerts_file_path: Optional[str] = None):
        self.primary_alerts_path = alerts_file_path or os.path.join("logs", "alerts.json")
        self.fallback_alerts_path = "alerts.json"

    def evaluate_cycle(
        self,
        overall_risk_result: OverallRiskResult,
        snapshots: Dict[str, DistrictSnapshot],
        reasoning_outputs: Optional[Dict[str, Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Evaluates outputs from Fusion Engine, Risk Engine, and Reasoning Agent.
        Determines whether alert threshold criteria (Risk >= 75 AND Confidence >= 70) are met.

        Returns a dictionary containing:
        - overall_status: 'AUTO_TRIGGERED_ALERT' or 'MONITORING_NORMAL'
        - alerts_triggered: List of AlertEvent objects for threshold breaches
        - district_evaluations: Dict mapping district -> evaluation summary
        - audit_log: List of detailed audit entries for this cycle
        """
        reasoning_outputs = reasoning_outputs or {}
        cycle_id = overall_risk_result.cycle_id or f"CYC-{uuid.uuid4().hex[:8]}"
        eval_timestamp = datetime.now(timezone.utc).isoformat()

        alerts_triggered: List[AlertEvent] = []
        district_evaluations: Dict[str, Dict[str, Any]] = {}
        audit_log: List[Dict[str, Any]] = []

        # Iterate through evaluated districts in risk-ranked order
        for district in overall_risk_result.ranked_districts:
            risk_res: DistrictRiskResult = overall_risk_result.district_results[district]
            snapshot: Optional[DistrictSnapshot] = snapshots.get(district)
            reasoning: Optional[Dict[str, Any]] = reasoning_outputs.get(district)

            is_risk_threshold_met = risk_res.overall_risk_score >= ALERT_RISK_THRESHOLD
            is_confidence_threshold_met = risk_res.confidence_score >= ALERT_CONFIDENCE_THRESHOLD
            should_auto_trigger = is_risk_threshold_met and is_confidence_threshold_met

            if should_auto_trigger:
                status = AlertStatus.AUTO_TRIGGERED
                alert_id = f"ALT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
                trigger_reason = (
                    f"CRITICAL RISK THRESHOLD BREACH: Overall Risk {risk_res.overall_risk_score:.1f} >= {ALERT_RISK_THRESHOLD} "
                    f"and Confidence {risk_res.confidence_score:.1f}% >= {ALERT_CONFIDENCE_THRESHOLD}%."
                )

                alert = AlertEvent(
                    alert_id=alert_id,
                    cycle_id=cycle_id,
                    timestamp=eval_timestamp,
                    district=district,
                    risk_score=risk_res.overall_risk_score,
                    confidence_score=risk_res.confidence_score,
                    risk_level=str(risk_res.risk_level),
                    status=status,
                    trigger_reason=trigger_reason,
                    is_auto_fired=True,
                )
                alerts_triggered.append(alert)

                district_evaluations[district] = {
                    "alert_id": alert_id,
                    "status": status.value,
                    "risk_score": risk_res.overall_risk_score,
                    "confidence_score": risk_res.confidence_score,
                    "risk_level": str(risk_res.risk_level),
                    "is_auto_fired": True,
                    "trigger_reason": trigger_reason,
                    "reasoning": reasoning,
                }
            else:
                status = AlertStatus.MONITORING_NORMAL
                trigger_reason = (
                    f"MONITORING NORMAL: Risk {risk_res.overall_risk_score:.1f} < {ALERT_RISK_THRESHOLD} "
                    f"or Confidence {risk_res.confidence_score:.1f}% < {ALERT_CONFIDENCE_THRESHOLD}%."
                )

                district_evaluations[district] = {
                    "alert_id": None,
                    "status": status.value,
                    "risk_score": risk_res.overall_risk_score,
                    "confidence_score": risk_res.confidence_score,
                    "risk_level": str(risk_res.risk_level),
                    "is_auto_fired": False,
                    "trigger_reason": trigger_reason,
                    "reasoning": reasoning,
                }

            audit_entry = {
                "timestamp": eval_timestamp,
                "cycle_id": cycle_id,
                "district": district,
                "risk_score": risk_res.overall_risk_score,
                "confidence_score": risk_res.confidence_score,
                "risk_level": str(risk_res.risk_level),
                "threshold_met": should_auto_trigger,
                "status": status.value,
            }
            audit_log.append(audit_entry)

        # Store triggered alerts into alerts.json
        if alerts_triggered:
            self._persist_alerts(alerts_triggered)

        overall_status = (
            "AUTO_TRIGGERED_ALERT" if len(alerts_triggered) > 0 else "MONITORING_NORMAL"
        )

        return {
            "cycle_id": cycle_id,
            "timestamp": eval_timestamp,
            "overall_status": overall_status,
            "alerts_triggered": alerts_triggered,
            "district_evaluations": district_evaluations,
            "highest_risk_district": overall_risk_result.highest_risk_district,
            "max_risk_score": overall_risk_result.max_risk_score,
            "audit_log": audit_log,
        }

    def _persist_alerts(self, new_alerts: List[AlertEvent]) -> None:
        """Appends new alert objects to logs/alerts.json and alerts.json."""
        alert_dicts = [
            {
                "alert_id": a.alert_id,
                "cycle_id": a.cycle_id,
                "timestamp": a.timestamp,
                "district": a.district,
                "risk_score": a.risk_score,
                "confidence_score": a.confidence_score,
                "risk_level": str(a.risk_level),
                "status": str(a.status),
                "trigger_reason": a.trigger_reason,
                "is_auto_fired": a.is_auto_fired,
            }
            for a in new_alerts
        ]

        for file_path in [self.primary_alerts_path, self.fallback_alerts_path]:
            try:
                parent_dir = os.path.dirname(file_path)
                if parent_dir:
                    os.makedirs(parent_dir, exist_ok=True)

                existing_data: List[Dict[str, Any]] = []

                if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
                    with open(file_path, "r", encoding="utf-8") as f:
                        try:
                            existing_data = json.load(f)
                            if not isinstance(existing_data, list):
                                existing_data = []
                        except json.JSONDecodeError:
                            existing_data = []

                existing_data.extend(alert_dicts)

                with open(file_path, "w", encoding="utf-8") as f:
                    json.dump(existing_data, f, indent=2)

            except Exception as e:
                logger.error(f"Failed writing alerts to {file_path}: {e}")


# Global singleton instance
_supervisor_instance = SupervisorAgent()


def evaluate_supervisor_rules(
    overall_risk_result: OverallRiskResult,
    snapshots: Dict[str, DistrictSnapshot],
    reasoning_outputs: Optional[Dict[str, Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Helper function to execute supervisor evaluation."""
    return _supervisor_instance.evaluate_cycle(
        overall_risk_result=overall_risk_result,
        snapshots=snapshots,
        reasoning_outputs=reasoning_outputs,
    )
