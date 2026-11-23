interface NavbarProps {
  isConnected: boolean;
  isLoading: boolean;
  lastUpdated: string | null;
  onRefresh: () => void;
}

const Navbar = ({ isConnected, isLoading, lastUpdated, onRefresh }: NavbarProps) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
            🌱
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Agro-Bot <span className="text-emerald-400">Telemetry</span>
            </h1>
            <p className="text-xs text-slate-400">ESP32 Field Rover &amp; LangChain Agronomist</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-slate-400 hidden md:inline">
              Synced: {lastUpdated}
            </span>
          )}

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-red-pulse-dark'
              }`}
            />
            {isConnected ? 'EC2 Online' : 'EC2 Offline'}
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? 'Syncing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;