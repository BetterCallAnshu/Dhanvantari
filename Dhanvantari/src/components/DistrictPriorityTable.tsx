import React from "react";
import { DistrictSummary, CycleState } from "../types";
import { DistrictPriorityIntelligenceDashboard } from "./DistrictPriorityIntelligenceDashboard";

interface DistrictPriorityTableProps {
  districtSummaries: Record<string, DistrictSummary>;
  rankedDistricts: string[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  onSelectTab: (tab: string) => void;
  cycleState?: CycleState;
}

export const DistrictPriorityTable: React.FC<DistrictPriorityTableProps> = ({
  districtSummaries,
  rankedDistricts,
  selectedDistrict,
  onSelectDistrict,
  onSelectTab,
  cycleState,
}) => {
  return (
    <DistrictPriorityIntelligenceDashboard
      districtSummaries={districtSummaries}
      rankedDistricts={rankedDistricts}
      selectedDistrict={selectedDistrict}
      onSelectDistrict={onSelectDistrict}
      onSelectTab={onSelectTab}
      cycleState={cycleState}
    />
  );
};


