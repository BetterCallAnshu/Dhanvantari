import React, { useState } from "react";
import {
  ShieldAlert,
  Send,
  History,
} from "lucide-react";
import { AlertItem, CycleState } from "../types";

interface AlertsTimelineProps {
  cycleState: CycleState;
  onSelectDistrict: (district: string) => void;
}

export const AlertsTimeline: React.FC<AlertsTimelineProps> = ({
  cycleState,
  onSelectDistrict,
}) => {
  const alerts: AlertItem[] = cycleState?.supervisor_eval?.alerts_triggered || [];
  const [acknowledgedIds, setAcknowledgedIds] = useState<Record<string, string>>({});

  const handleAction = (alertId: string, status: string) => {
    setAcknowledgedIds((prev) => ({ ...prev, [alertId]: status }));
  };

  const auditLogs = cycleState?.supervisor_eval?.audit_log || [];

  const formatScore = (val: any): string => {
    if (typeof val === "number") return val.toFixed(1);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) return parsed.toFixed(1);
    return "N/A";
  };

  const cleanString = (val: any, prefix = ""): string => {
    if (!val) return "";
    let str = typeof val === "string" ? val : String(val);
    if (prefix && str.startsWith(prefix)) {
      str = str.replace(prefix, "");
    }
    return str;
  };

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 space-y-5 text-xs font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-hud">
        <div className="flex items-center gap-2">
          <div>
            <h3 className="font-semibold text-base text-white">
              AUTONOMOUS ALERT LOG & DISPATCH TIMELINE
            </h3>
            <p className="text-xs font-mono text-zinc-400">
              Trigger Rule: <span className="text-white">Overall Risk Score ≥ 75.0</span> AND{" "}
              <span className="text-white">Confidence ≥ 70.0%</span>
            </p>
          </div>
        </div>

        <span className="font-mono text-xs px-2.5 py-1 rounded-sm bg-black/40 border border-hud text-zinc-300">
          {alerts.length} ALERTS FIRED
        </span>
      </div>

      {/* Triggered Alerts Feed */}
      <div className="space-y-3 font-mono text-xs">
        <h4 className="font-semibold text-xs text-white uppercase flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          CRITICAL THREAT ALERTS
        </h4>

        {alerts.length > 0 ? (
          alerts.map((alert, idx) => {
            const alertId = alert.alert_id || `alert-${idx}`;
            const rawStatus = acknowledgedIds[alertId] || alert.status || "AUTO_TRIGGERED";
            const currentStatus = cleanString(rawStatus, "AlertStatus.");
            const riskLevel = cleanString(alert.risk_level, "RiskLevel.");
            const districtName = typeof alert.district === "string" ? alert.district : "Unknown District";
            const triggerReason = typeof alert.trigger_reason === "string" ? alert.trigger_reason : JSON.stringify(alert.trigger_reason || "");
            const timeStr = typeof alert.timestamp === "string" ? alert.timestamp : String(alert.timestamp || "");

            return (
              <div
                key={alertId}
                className="bg-panel-container border border-red-700/80 p-3.5 rounded-sm space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hud pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-white">{districtName}</span>
                    <span className="px-2 py-0.5 rounded-sm bg-red-950/80 text-red-200 border border-red-700 text-[10px] font-semibold">
                      {riskLevel || "CRITICAL"} ({formatScore(alert.risk_score)} / 100)
                    </span>
                    <span className="text-zinc-300 text-[10px]">
                      {formatScore(alert.confidence_score)}% CONFIDENCE
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">{timeStr}</span>
                    <span className="px-2 py-0.5 rounded-sm text-[10px] font-semibold border bg-zinc-800 text-zinc-200 border-zinc-600">
                      {currentStatus}
                    </span>
                  </div>
                </div>

                <p className="text-zinc-300 text-xs font-sans">{triggerReason}</p>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1 font-mono">
                  <button
                    onClick={() => onSelectDistrict(districtName)}
                    className="text-white text-[11px] font-semibold hover:underline"
                  >
                    Inspect District Data →
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(alertId, "ACKNOWLEDGED")}
                      className="px-2.5 py-1 rounded-sm bg-black/40 border border-hud hover:border-zinc-500 text-zinc-300 text-[10px] font-semibold"
                    >
                      ACKNOWLEDGE
                    </button>
                    <button
                      onClick={() => handleAction(alertId, "DISPATCHED")}
                      className="px-2.5 py-1 rounded-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>APPROVE DISPATCH</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-4 bg-black/30 border border-hud rounded-sm text-center text-zinc-400 font-sans">
            No critical alerts auto-fired in current evaluation cycle.
          </div>
        )}
      </div>

      {/* System Audit Log */}
      <div className="bg-black/40 border border-hud p-3.5 rounded-sm space-y-2 font-mono text-xs">
        <div className="flex items-center gap-2 border-b border-hud pb-2 text-zinc-300 font-semibold">
          <History className="w-4 h-4 text-zinc-300" />
          <span>SUPERVISOR AGENT AUDIT LOG</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {auditLogs.map((log, idx) => {
            let logText = "";
            if (typeof log === "string") {
              logText = log;
            } else if (typeof log === "object" && log !== null) {
              const rScore = formatScore((log as any).risk_score);
              const cScore = formatScore((log as any).confidence_score);
              const district = cleanString((log as any).district) || "Unknown";
              const rLevel = cleanString((log as any).risk_level, "RiskLevel.") || "N/A";
              const status = cleanString((log as any).status, "AlertStatus.") || "EVALUATED";
              const isTriggered = (log as any).threshold_met;
              logText = `[${district}] Risk: ${rScore} (${rLevel}) | Confidence: ${cScore}% | Status: ${status}${isTriggered ? " - ALERT TRIGGERED" : ""}`;
            } else {
              logText = String(log || "");
            }

            return (
              <div key={idx} className="text-zinc-400 text-[11px] flex items-start gap-2">
                <span className="text-zinc-300">›</span>
                <span>{logText}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
