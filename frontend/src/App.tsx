import { useState } from 'react';
import { ShieldAlert, LayoutDashboard, Settings, Bell } from 'lucide-react';
import Dashboard from './components/Dashboard';
import IncidentDetail from './components/IncidentDetail';
import MetricsPanel from './components/MetricsPanel';
import { WorkItem } from './api/client';

function App() {
  const [selectedIncident, setSelectedIncident] = useState<WorkItem | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Sidebar / Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <ShieldAlert className="text-white" size={24} />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase">Zeotap IMS</span>
            </div>
            
            <div className="flex items-center gap-6">
              <button className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                <LayoutDashboard size={18} /> Dashboard
              </button>
              <button className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                <Bell size={18} /> Alerts
              </button>
              <button className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                <Settings size={18} /> Settings
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!selectedIncident ? (
          <>
            <MetricsPanel />
            <Dashboard onSelect={setSelectedIncident} />
          </>
        ) : (
          <IncidentDetail 
            incident={selectedIncident} 
            onBack={() => setSelectedIncident(null)} 
            onUpdate={() => setSelectedIncident(null)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-slate-600 text-sm">
        Zeotap SRE Intern Assignment • Built by Satya • 2026
      </footer>
    </div>
  );
}

export default App;
