import React, { useState, useEffect } from 'react';
import api, { WorkItem } from '../api/client';
import { Clock, Activity, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardProps {
  onSelect: (incident: WorkItem) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onSelect }) => {
  const [incidents, setIncidents] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const response = await api.get('/incidents');
      setIncidents(response.data.incidents);
    } catch (error) {
      console.error('Failed to fetch incidents', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="flex justify-center p-12"><Activity className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Active Incidents</h2>
        <span className="text-slate-400 text-sm">{incidents.length} total</span>
      </div>

      <div className="grid gap-4">
        {incidents.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-400 rounded-xl">
            No active incidents detected.
          </div>
        ) : (
          incidents.map((incident) => (
            <div
              key={incident.id}
              onClick={() => onSelect(incident)}
              className="glass-card p-5 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-all group border-l-4"
              style={{ borderLeftColor: incident.priority === 'P0' ? '#ef4444' : incident.priority === 'P2' ? '#eab308' : '#3b82f6' }}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${incident.priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                      {incident.priority}
                    </span>
                    <h3 className="font-semibold text-lg">{incident.componentId}</h3>
                  </div>
                  <p className="text-slate-400 text-sm flex items-center gap-1">
                    <Clock size={14} />
                    {formatDistanceToNow(new Date(incident.firstSignalAt))} ago • {incident.signalCount} signals
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    incident.status === 'OPEN' ? 'status-open' : 
                    incident.status === 'INVESTIGATING' ? 'status-investigating' : 
                    'status-resolved'
                  }`}>
                    {incident.status}
                  </div>
                  <ChevronRight className="text-slate-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
