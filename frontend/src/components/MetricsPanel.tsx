import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { BarChart3, LineChart } from 'lucide-react';

const MetricsPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await api.get('/metrics');
      setMetrics(response.data);
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <LineChart size={20} className="text-indigo-400" />
          Signals per Minute
        </h3>
        <div className="space-y-2">
          {metrics.signalsPerMinute.map((m: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-500 w-16">{m._id.split(' ')[1]}</span>
              <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (m.count / 100) * 100)}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-slate-300 w-8">{m.count}</span>
            </div>
          ))}
          {metrics.signalsPerMinute.length === 0 && <p className="text-slate-500 text-sm">Waiting for signal data...</p>}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 size={20} className="text-amber-400" />
          Severity Distribution
        </h3>
        <div className="flex items-end gap-2 h-40 pt-4">
          {['P0', 'P1', 'P2', 'P3'].map(p => {
            const count = metrics.incidentsPerSeverity.find((s: any) => s.priority === p)?.count || 0;
            const max = Math.max(...metrics.incidentsPerSeverity.map((s: any) => parseInt(s.count))) || 1;
            return (
              <div key={p} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-1000 ${
                    p === 'P0' ? 'bg-red-500' : p === 'P2' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ height: `${(count / max) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                ></div>
                <div className="text-xs font-bold text-slate-500">{p} ({count})</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MetricsPanel;
