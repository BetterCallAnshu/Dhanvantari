"""
Public Health Signal Fusion Agent - Alert & Decision Support Models
Operational alerts, audit entries, and human-in-the-loop action drafts.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional


class AlertStatus(str, Enum):
    AUTO_TRIGGERED = "AUTO_TRIGGERED"
    MONITORING_NORMAL = "MONITORING_NORMAL"
    INSUFFICIENT_SIGNAL = "INSUFFICIENT_SIGNAL"
    RESOLVED = "RESOLVED"


@dataclass
class AlertEvent:
    """Audit log entry and alert notification fired by Supervisor Agent."""
    alert_id: str
    cycle_id: str
    timestamp: str
    district: str
    risk_score: float
    confidence_score: float
    risk_level: str
    status: AlertStatus
    trigger_reason: str
    is_auto_fired: bool = True  # True if fired without human button click


@dataclass
class IncidentReport:
    """Operational incident report draft produced for health officials."""
    report_id: str
    timestamp: str
    district: str
    risk_level: str
    confidence_score: float
    executive_summary: str
    key_evidence: List[str] = field(default_factory=list)
    action_items: List[str] = field(default_factory=list)
    approval_status: str = "DRAFT - PENDING APPROVAL"


@dataclass
class ResourceItem:
    """Resource inventory request item."""
    item_name: str      # e.g., 'ORS Packets', 'IV Fluids', 'Paracetamol Tablets', 'Mobile Medical Units'
    quantity: str        # e.g., '5,000 units', '2 teams'
    priority: str        # 'HIGH', 'URGENT', 'CRITICAL'


@dataclass
class ResourceRequestDraft:
    """Resource Allocation Request produced by Decision Support Agent."""
    request_id: str
    timestamp: str
    district: str
    requested_items: List[ResourceItem] = field(default_factory=list)
    target_facility_or_camp: str = ""
    justification: str = ""
    approval_status: str = "DRAFT - PENDING APPROVAL"  # Hard-enforced draft status


@dataclass
class DecisionRecommendation:
    """Health camp & operational recommendations produced by Decision Support Agent."""
    recommendation_id: str
    timestamp: str
    district: str
    suggested_camp_locations: List[str] = field(default_factory=list)
    medicine_redistribution_plan: List[str] = field(default_factory=list)
    medicine_demand_forecast_7d: Dict[str, str] = field(default_factory=dict)
    approval_status: str = "DRAFT - PENDING APPROVAL"  # Requires human click to approve
