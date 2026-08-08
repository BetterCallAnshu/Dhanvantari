import React, { useState } from "react";
import { FlaskConical, X, Zap } from "lucide-react";

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSimulate: (params: {
    district: string;
    disease_score: number;
    weather_score: number;
    hospital_score: number;
    spike_type?: string;
  }) => void;
  isSimulating: boolean;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onTriggerSimulate,
  isSimulating,
}) => {
  const [district, setDistrict] = useState<string>("Kamrup Metropolitan");
  const [spikeType, setSpikeType] = useState<string>("vector_borne");
  const [diseaseScore, setDiseaseScore] = useState<number>(92.0);
  const [weatherScore, setWeatherScore] = useState<number>(88.0);
  const [hospitalScore, setHospitalScore] = useState<number>(85.0);

  const handleSpikeTypeChange = (typeStr: string) => {
    setSpikeType(typeStr);
    if (typeStr === "vector_borne") {
      setDiseaseScore(92);
      setWeatherScore(88);
      setHospitalScore(85);
    } else if (typeStr === "water_borne") {
      setDiseaseScore(94);
      setWeatherScore(92);
      setHospitalScore(80);
    } else if (typeStr === "respiratory") {
      setDiseaseScore(88);
      setWeatherScore(95);
      setHospitalScore(90);
    } else if (typeStr === "heatwave") {
      setDiseaseScore(82);
      setWeatherScore(98);
      setHospitalScore(85);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerSimulate({
      district,
      disease_score: diseaseScore,
      weather_score: weatherScore,
      hospital_score: hospitalScore,
      spike_type: spikeType,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-panel border border-zinc-700 rounded-sm w-full max-w-lg p-5 space-y-4 shadow-2xl font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hud pb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-zinc-300" />
            <h3 className="font-semibold text-sm text-white tracking-wide">
              SURVEILLANCE SPIKE INJECTION SIMULATOR
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-sm border border-transparent hover:border-hud"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-zinc-300 text-xs font-sans">
          Inject simulated outbreak signals (Dengue/Cholera spikes, extreme precipitative weather,
          or hospital IPD bed surges) to observe real-time risk re-ranking, Gemini reasoning, and
          autonomous alert triggers.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono">
          {/* District Select */}
          <div className="space-y-1">
            <label className="text-zinc-400 font-semibold block">TARGET DISTRICT:</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-black/60 border border-hud text-white p-2 rounded-sm focus:border-zinc-500 focus:outline-none"
            >
              <option value="Kamrup Metropolitan">Kamrup Metropolitan (Assam)</option>
              <option value="Patna">Patna (Bihar)</option>
              <option value="Ernakulam">Ernakulam (Kerala)</option>
              <option value="Wayanad">Wayanad (Kerala)</option>
              <option value="Pune">Pune (Maharashtra)</option>
              <option value="Chennai">Chennai (Tamil Nadu)</option>
              <option value="Ludhiana">Ludhiana (Punjab)</option>
              <option value="Amritsar">Amritsar (Punjab)</option>
              <option value="Jalandhar">Jalandhar (Punjab)</option>
              <option value="Patiala">Patiala (Punjab)</option>
              <option value="SAS Nagar (Mohali)">SAS Nagar / Mohali (Punjab)</option>
              <option value="Chandigarh">Chandigarh (Chandigarh UT)</option>
            </select>
          </div>

          {/* Spike Profile Select */}
          <div className="space-y-1">
            <label className="text-zinc-400 font-semibold block">SIMULATION PROFILE / OUTBREAK MODEL:</label>
            <select
              value={spikeType}
              onChange={(e) => handleSpikeTypeChange(e.target.value)}
              className="w-full bg-black/60 border border-hud text-white p-2 rounded-sm focus:border-zinc-500 focus:outline-none font-semibold"
            >
              <option value="vector_borne">Vector-Borne Outbreak Watch (Dengue/Malaria)</option>
              <option value="water_borne">Water-Borne Gastroenteritis Outbreak (Cholera/ADD)</option>
              <option value="respiratory">Respiratory Illness Surge (AQI Spike/SARI/Flu)</option>
              <option value="heatwave">Extreme Heatwave & Dehydration Crisis</option>
            </select>
          </div>

          {/* Disease Outbreak Score Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-300">
              <label className="font-semibold">DISEASE OUTBREAK SPIKE SCORE:</label>
              <span className="text-white font-bold">{diseaseScore.toFixed(0)} / 100</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={diseaseScore}
              onChange={(e) => setDiseaseScore(Number(e.target.value))}
              className="w-full accent-zinc-300 cursor-pointer"
            />
          </div>

          {/* Extreme Weather Score Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-300">
              <label className="font-semibold">WEATHER & VECTOR RISK SCORE:</label>
              <span className="text-white font-bold">{weatherScore.toFixed(0)} / 100</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={weatherScore}
              onChange={(e) => setWeatherScore(Number(e.target.value))}
              className="w-full accent-zinc-300 cursor-pointer"
            />
          </div>

          {/* Hospital Surge Score Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-300">
              <label className="font-semibold">HOSPITAL SURGE & ICU LOAD SCORE:</label>
              <span className="text-white font-bold">{hospitalScore.toFixed(0)} / 100</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={hospitalScore}
              onChange={(e) => setHospitalScore(Number(e.target.value))}
              className="w-full accent-zinc-300 cursor-pointer"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-hud">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-sm bg-black/40 border border-hud text-zinc-400 hover:text-white"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSimulating}
              className="px-4 py-1.5 rounded-sm bg-red-900 hover:bg-red-800 text-white font-semibold flex items-center gap-1.5 transition-all border border-red-700 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{isSimulating ? "INJECTING SPIKE..." : "TRIGGER SPIKE"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
