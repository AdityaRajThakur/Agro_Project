import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Card from './components/Card';
import axios from 'axios';
import './App.css';

interface CropRecommendationRow {
  crop: string;
  suitability: 'High' | 'Moderate' | 'Conditional' | string;
  fertilizer_plan: string;
  dosage_kg_ha: string;
  application_stage: string;
  notes: string;
}

interface InsightsResponse {
  temp: number | null;
  hum: number | null;
  soil: number | null;
  N: number | null;
  P: number | null;
  K: number | null;
  Ph: number | null;
  soil_status?: string;
  recommendations?: CropRecommendationRow[];
  llm_advice: string;
  last_updated: string | null;
}

const EC2_INSIGHTS_URL = 'http://54.144.97.82/insights';

const formatVal = (val: number | null | undefined, decimals = 1, unit = '') => {
  if (val === null || val === undefined || Number.isNaN(Number(val))) return '--';
  return `${Number(val).toFixed(decimals)}${unit ? ` ${unit}` : ''}`;
};

const getSuitabilityBadge = (level: string) => {
  const normalized = level.toLowerCase();
  if (normalized.includes('high')) {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  }
  if (normalized.includes('moderate')) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  }
  return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
};

function App() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<InsightsResponse>(EC2_INSIGHTS_URL, {
        timeout: 4000,
      });
      setData(res.data);
      setIsConnected(true);
      setErrorMsg(null);
    } catch (err) {
      setIsConnected(false);
      setErrorMsg(
        'Unable to reach EC2 backend (http://54.144.97.82). Check that Flask is running on port 80 with CORS enabled.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 5000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  const rows = data?.recommendations ?? [];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        isConnected={isConnected}
        isLoading={isLoading}
        lastUpdated={data?.last_updated ?? null}
        onRefresh={fetchInsights}
      />

      <main className="max-w-6xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        {errorMsg && (
          <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* Section 1: Live Sensor Telemetry (Climate + Soil Chemistry) */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Live Field Telemetry (Black Soil · Rabi Season)
            </h2>
            {data?.soil_status && (
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                {data.soil_status}
              </span>
            )}
          </div>

          {/* Row 1: Real-Time ESP32 Sensors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex items-center justify-between transition-all duration-200 hover:border-rose-500/40">
              <div>
                <p className="text-xs text-slate-400">Ambient Temperature</p>
                <p className="text-3xl font-bold text-rose-400 mt-1">
                  {formatVal(data?.temp, 1, '°C')}
                </p>
              </div>
              <span className="text-2xl">🌡️</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex items-center justify-between transition-all duration-200 hover:border-sky-500/40">
              <div>
                <p className="text-xs text-slate-400">Air Humidity</p>
                <p className="text-3xl font-bold text-sky-400 mt-1">
                  {formatVal(data?.hum, 0, '%')}
                </p>
              </div>
              <span className="text-2xl">💧</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex items-center justify-between transition-all duration-200 hover:border-emerald-500/40">
              <div>
                <p className="text-xs text-slate-400">Soil Moisture</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">
                  {formatVal(data?.soil, 0, '%')}
                </p>
              </div>
              <span className="text-2xl">🌱</span>
            </div>
          </div>

          {/* Row 2: Soil Nutrient & pH Profile */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center justify-between transition-all duration-200 hover:border-amber-500/40">
              <div>
                <p className="text-xs text-slate-400">Nitrogen (N)</p>
                <p className="text-2xl font-bold text-amber-300 mt-1">
                  {formatVal(data?.N, 1)}
                  <span className="text-xs font-normal text-slate-400 ml-1">kg/ha</span>
                </p>
              </div>
              <span className="text-xl">🧪</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center justify-between transition-all duration-200 hover:border-purple-500/40">
              <div>
                <p className="text-xs text-slate-400">Phosphorus (P)</p>
                <p className="text-2xl font-bold text-purple-300 mt-1">
                  {formatVal(data?.P, 1)}
                  <span className="text-xs font-normal text-slate-400 ml-1">kg/ha</span>
                </p>
              </div>
              <span className="text-xl">⚗️</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center justify-between transition-all duration-200 hover:border-cyan-500/40">
              <div>
                <p className="text-xs text-slate-400">Potassium (K)</p>
                <p className="text-2xl font-bold text-cyan-300 mt-1">
                  {formatVal(data?.K, 1)}
                  <span className="text-xs font-normal text-slate-400 ml-1">kg/ha</span>
                </p>
              </div>
              <span className="text-xl">🪨</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 flex items-center justify-between transition-all duration-200 hover:border-indigo-500/40">
              <div>
                <p className="text-xs text-slate-400">Soil pH</p>
                <p className="text-2xl font-bold text-indigo-300 mt-1">
                  {formatVal(data?.Ph, 2)}
                </p>
              </div>
              <span className="text-xl">⚖️</span>
            </div>
          </div>
        </section>

        {/* Section 2: Crop & Fertilizer Recommendation Table */}
        <section>
          <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/20 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Recommended Crops &amp; Fertilizer Schedule
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI-calculated dosages adjusted for measured NPK, pH, moisture, and climate
                </p>
              </div>
              <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-lg">
                🌾
              </span>
            </div>

            {rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-5 font-semibold">Crop</th>
                      <th className="py-3.5 px-4 font-semibold">Suitability</th>
                      <th className="py-3.5 px-4 font-semibold">Fertilizer Plan</th>
                      <th className="py-3.5 px-4 font-semibold">Dosage (kg/ha)</th>
                      <th className="py-3.5 px-4 font-semibold">Application Stage</th>
                      <th className="py-3.5 px-5 font-semibold">Agronomic Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-sm">
                    {rows.map((row, index) => (
                      <tr
                        key={`${row.crop}-${index}`}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-4 px-5 font-semibold text-white whitespace-nowrap">
                          {row.crop}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSuitabilityBadge(
                              row.suitability
                            )}`}
                          >
                            {row.suitability}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-amber-200 font-medium">
                          {row.fertilizer_plan}
                        </td>
                        <td className="py-4 px-4 text-emerald-300 font-mono text-xs">
                          {row.dosage_kg_ha}
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {row.application_stage}
                        </td>
                        <td className="py-4 px-5 text-slate-400 text-xs leading-relaxed max-w-xs">
                          {row.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-slate-400">
                Waiting for the next 30-second LLM evaluation from EC2 to populate the table...
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Detailed LLM Field Advisory */}
        <section>
          <Card
            title="Agronomist Field Summary"
            subtitle="Real-time irrigation, sowing window & crop stress analysis"
            icon="🤖"
            accent="sky"
          >
            <p className="text-slate-200 whitespace-pre-line leading-relaxed">
              {data?.llm_advice || 'Waiting for first sensor packet from Agro-Bot...'}
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default App;