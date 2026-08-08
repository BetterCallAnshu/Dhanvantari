import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers } from "lucide-react";
import { DistrictSummary } from "../types";

interface IndiaRiskMapProps {
  districtSummaries: Record<string, DistrictSummary>;
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
}

// Real geographic lat/lng coordinates for India districts
const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; state: string }> = {
  "Kamrup Metropolitan": { lat: 26.1445, lng: 91.7362, state: "Assam" },
  Patna: { lat: 25.5941, lng: 85.1376, state: "Bihar" },
  Ernakulam: { lat: 9.9816, lng: 76.2999, state: "Kerala" },
  Wayanad: { lat: 11.6854, lng: 76.1320, state: "Kerala" },
  Pune: { lat: 18.5204, lng: 73.8567, state: "Maharashtra" },
  Chennai: { lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
  Ludhiana: { lat: 30.9010, lng: 75.8573, state: "Punjab" },
  Amritsar: { lat: 31.6340, lng: 74.8723, state: "Punjab" },
  Jalandhar: { lat: 31.3260, lng: 75.5762, state: "Punjab" },
  Patiala: { lat: 30.3398, lng: 76.3869, state: "Punjab" },
  "SAS Nagar (Mohali)": { lat: 30.6799, lng: 76.7221, state: "Punjab" },
  Chandigarh: { lat: 30.7333, lng: 76.7794, state: "Chandigarh UT" },
};

// Helper component to smoothly re-center map when selected district changes
const MapRecenter: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom(), { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
};

// Helper component to fit map bounds to all markers on load
const FitBounds: React.FC<{ bounds: L.LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map]);
  return null;
};

// Tile layer providers
const TILE_LAYERS = {
  openstreetmap: {
    name: "OpenStreetMap Standard",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  cartoDark: {
    name: "Dark Canvas (CartoDB)",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  cartoLight: {
    name: "Light Tactical (CartoDB)",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export const IndiaRiskMap: React.FC<IndiaRiskMapProps> = ({
  districtSummaries,
  selectedDistrict,
  onSelectDistrict,
}) => {
  const [activeTile, setActiveTile] = useState<keyof typeof TILE_LAYERS>("cartoDark");
  const [showCircles, setShowCircles] = useState<boolean>(true);

  const bounds = React.useMemo(() => {
    const allCoords = Object.values(DISTRICT_COORDINATES).map(c => [c.lat, c.lng] as [number, number]);
    return L.latLngBounds(allCoords);
  }, []);

  // Generate Leaflet DivIcons based on risk level
  const createDistrictIcon = (distName: string, riskScore: number, isSelected: boolean) => {
    let colorClass = "bg-zinc-700 border-zinc-500 text-zinc-300";

    if (riskScore >= 75) {
      colorClass = "bg-red-800 border-red-600 text-red-200";
    } else if (riskScore >= 60) {
      colorClass = "bg-red-900 border-red-700 text-red-300";
    }

    const ringScale = isSelected ? "ring-2 ring-zinc-200 scale-125" : "hover:scale-110";

    const html = `
      <div class="relative flex items-center justify-center group cursor-pointer font-sans">
        <div class="w-5 h-5 rounded-full border-2 ${colorClass} ${ringScale} flex items-center justify-center transition-all duration-300">
          <div class="w-1.5 h-1.5 bg-black rounded-full"></div>
        </div>
        <div class="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap px-1.5 py-0.5 rounded bg-black/90 border border-zinc-700 text-[10px] font-mono font-semibold text-white pointer-events-none">
          ${distName} <span class="text-zinc-400">[${riskScore.toFixed(0)}]</span>
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: "custom-district-marker",
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  const getCircleColor = (score: number) => {
    if (score >= 60) return "#991B1B";
    return "#52525B";
  };

  const currentCoords = DISTRICT_COORDINATES[selectedDistrict] || { lat: 20.5937, lng: 78.9629, state: "India" };
  const safeLat = isNaN(currentCoords.lat) ? 20.5937 : currentCoords.lat;
  const safeLng = isNaN(currentCoords.lng) ? 78.9629 : currentCoords.lng;
  const currentSummary = districtSummaries[selectedDistrict];

  return (
    <div className="bg-panel border border-hud rounded-sm p-4 relative flex flex-col h-full min-h-[480px] font-sans text-xs">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-hud">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-white tracking-wide">
            DISTRICT SURVEILLANCE GIS
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {/* Tile Switcher */}
          <div className="flex items-center bg-black/50 border border-hud rounded overflow-hidden">
            <button
              onClick={() => setActiveTile("cartoDark")}
              className={`px-2 py-1 text-[10px] transition-colors ${
                activeTile === "cartoDark" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Dark HUD
            </button>
            <button
              onClick={() => setActiveTile("openstreetmap")}
              className={`px-2 py-1 text-[10px] transition-colors ${
                activeTile === "openstreetmap" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              OpenStreetMap
            </button>
            <button
              onClick={() => setActiveTile("cartoLight")}
              className={`px-2 py-1 text-[10px] transition-colors ${
                activeTile === "cartoLight" ? "bg-zinc-800 text-white font-semibold" : "text-zinc-400 hover:text-white"
              }`}
            >
              Light
            </button>
          </div>

          <button
            onClick={() => setShowCircles(!showCircles)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-all ${
              showCircles
                ? "bg-zinc-800 border-zinc-600 text-white font-semibold"
                : "bg-black/40 border-hud text-zinc-400"
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>RADIAL HEAT</span>
          </button>
        </div>
      </div>

      {/* Leaflet Map Viewport */}
      <div className="relative flex-1 rounded border border-hud overflow-hidden min-h-[360px] z-0">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", minHeight: "360px", background: "#0a0e17" }}
          className="z-0"
        >
          <FitBounds bounds={bounds} />
          <TileLayer
            url={TILE_LAYERS[activeTile].url}
            attribution={TILE_LAYERS[activeTile].attribution}
            maxZoom={18}
          />

          <MapRecenter lat={safeLat} lng={safeLng} />

          {/* District Pins & Risk Radii */}
          {Object.entries(districtSummaries).map(([distName, summaryVal]) => {
            const summary = summaryVal as DistrictSummary;
            const coords = DISTRICT_COORDINATES[distName];
            if (!coords) return null;

            const isSelected = selectedDistrict === distName;
            const riskScore = summary.risk_score || 0;
            const radiusMeters = Math.max(25000, riskScore * 1200);

            return (
              <React.Fragment key={distName}>
                {/* Heatmap Circle */}
                {showCircles && (
                  <Circle
                    center={[coords.lat, coords.lng]}
                    radius={radiusMeters}
                    pathOptions={{
                      color: getCircleColor(riskScore),
                      fillColor: getCircleColor(riskScore),
                      fillOpacity: isSelected ? 0.25 : 0.12,
                      weight: isSelected ? 2 : 1,
                      dashArray: isSelected ? "4, 4" : undefined,
                    }}
                  />
                )}

                {/* District Marker */}
                <Marker
                  position={[coords.lat, coords.lng]}
                  icon={createDistrictIcon(distName, riskScore, isSelected)}
                  eventHandlers={{
                    click: () => onSelectDistrict(distName),
                  }}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 font-sans text-xs min-w-[180px]">
                      <div className="font-bold text-sm text-gray-900 border-b pb-1 mb-1 flex items-center justify-between">
                        <span>{distName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 font-mono text-gray-700">
                          {coords.state}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Risk Score:</span>
                          <span className="font-bold text-gray-900">{riskScore.toFixed(2)}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Level:</span>
                          <span className="font-bold text-gray-800">{summary.risk_level}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500 pt-1 border-t">
                          <span>Disease: {summary.sub_scores.disease.toFixed(0)}</span>
                          <span>Weather: {summary.sub_scores.weather.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Floating Active Inspector Bar */}
        {currentSummary && (
          <div className="absolute bottom-2 left-2 right-2 bg-panel/90 backdrop-blur-md border border-zinc-700 p-2.5 rounded font-mono text-xs z-[400] pointer-events-auto">
            <div className="flex items-center justify-between border-b border-hud pb-1 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white">
                  {currentSummary.district}
                </span>
                <span className="text-[10px] text-zinc-400">
                  ({currentCoords.state})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-[10px]">RISK INDEX:</span>
                <span className="font-bold text-white text-sm">
                  {currentSummary.risk_score.toFixed(2)}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold">
                  {currentSummary.risk_level}
                </span>
              </div>
            </div>

            {/* Sub score breakdown */}
            <div className="grid grid-cols-5 gap-1.5 text-[10px] text-center">
              <div className="bg-black/50 p-1 rounded border border-hud">
                <div className="text-zinc-400">DISEASE</div>
                <div className="font-semibold text-white">{currentSummary.sub_scores.disease.toFixed(0)}</div>
              </div>
              <div className="bg-black/50 p-1 rounded border border-hud">
                <div className="text-zinc-400">HOSPITAL</div>
                <div className="font-semibold text-white">{currentSummary.sub_scores.hospital.toFixed(0)}</div>
              </div>
              <div className="bg-black/50 p-1 rounded border border-hud">
                <div className="text-zinc-400">WEATHER</div>
                <div className="font-semibold text-white">{currentSummary.sub_scores.weather.toFixed(0)}</div>
              </div>
              <div className="bg-black/50 p-1 rounded border border-hud">
                <div className="text-zinc-400">PHARMACY</div>
                <div className="font-semibold text-white">{currentSummary.sub_scores.pharmacy.toFixed(0)}</div>
              </div>
              <div className="bg-black/50 p-1 rounded border border-hud">
                <div className="text-zinc-400">AQI</div>
                <div className="font-semibold text-zinc-300">{currentSummary.sub_scores.aqi.toFixed(0)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-hud gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-700" />
            CRITICAL / HIGH RISK (≥60)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
            STANDARD MONITORING (&lt;60)
          </span>
        </div>
        <div className="text-zinc-400">
          MAP POWERED BY OPENSTREETMAP & LEAFLET
        </div>
      </div>
    </div>
  );
};
