import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Card from './components/Card';
import axios from 'axios' ; 
import './App.css';

interface InsightsResponse {
  temp: number;
  hum: number;
  soil: number;
  crops?: string[];
  fertilizers?: string[];
  llm_advice: string;
  last_updated: string | null;
}

const EC2_INSIGHTS_URL = 'http://YOUR_EC2_PUBLIC_IP:3000/insights';

function App() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<InsightsResponse>(EC2_INSIGHTS_URL,{
        timeout: 4000 
      });
      setData(res.data) ; 
      setIsConnected(true) ; 
      setErrorMsg(null) ; 
    } catch (err) {
      setIsConnected(false);
      setErrorMsg('Unable to reach EC2 backend. Check that Flask is running on port 3000 with CORS enabled.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 5000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

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

        {/* Section 1: LLM Input (Live Sensor Telemetry from Robo-Car) */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Live Field Telemetry
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex items-center justify-between transition-all duration-200 hover:border-slate-500 ">
              <div>
                <p className="text-xs text-slate-400">Ambient Temperature</p>
                <p className="text-3xl font-bold text-rose-400 mt-1">
                  {data ? `${data.temp.toFixed(1)} °C` : '--'}
                </p>
              </div>
              <span className="text-2xl">🌡️</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex items-center justify-between transition-all duration-200 hover:border-slate-500 ">
              <div>
                <p className="text-xs text-slate-400">Air Humidity</p>
                <p className="text-3xl font-bold text-sky-400 mt-1">
                  {data ? `${data.hum.toFixed(0)} %` : '--'}
                </p>
              </div>
              <span className="text-2xl">💧</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex items-center justify-between transition-all duration-200 hover:border-slate-500 ">
              <div>
                <p className="text-xs text-slate-400">Soil Moisture</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">
                  {data ? `${data.soil} %` : '--'}
                </p>
              </div>
              <span className="text-2xl">🌿</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex items-center justify-between transition-all duration-200 hover:border-slate-500 ">
              <div>
                <p className="text-xs text-slate-400">Nitrogen</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">
                  {data ? `${data.soil} %` : '--'}
                </p>
              </div>
              <span className="text-2xl">🌿</span>
            </div>  

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex items-center justify-between transition-all duration-200 hover:border-slate-500 ">
              <div>
                <p className="text-xs text-slate-400">Potassium</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">
                  {data ? `${data.soil} %` : '--'}
                </p>
              </div>
              <span className="text-2xl">🌿</span>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex items-center justify-between transition-all duration-200 hover:border-slate-500 ">
              <div>
                <p className="text-xs text-slate-400">Phosphorus</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">
                  {data ? `${data.soil} %` : '--'}
                </p>
              </div>
              <span className="text-2xl">🌿</span>
            </div>
          </div>
        </section>

        {/* Section 2: Main Crops & Fertilizer Cards (LLM Structured Output) */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            AI Agronomist Recommendations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              title="Recommended Crops"
              subtitle="Best suited for current soil moisture & climate"
              icon="🌾"
              accent="emerald"
              items={data?.crops ?? []}
              emptyText="No crop recommendations yet. Waiting for telemetry..."
            />

            <Card
              title="Fertilizer & Nutrient Plan"
              subtitle="Suggested soil amendments & NPK schedule"
              icon="🧪"
              accent="amber"
              items={data?.fertilizers ?? []}
              emptyText="No fertilizer recommendations yet. Waiting for telemetry..."
            />
          </div>
        </section>

        {/* Section 3: Detailed LLM Summary */}
        <section>
          <Card
            title="Agronomist Field Summary"
            subtitle="Real-time irrigation & crop stress analysis"
            icon="🤖"
            accent="sky"
          >
            <p className="text-slate-200 whitespace-pre-line">
              {data?.llm_advice || 'Waiting for first sensor packet from Agro-Bot...'}
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
}

export default App;