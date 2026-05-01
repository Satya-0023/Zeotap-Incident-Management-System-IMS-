import React, { useState, useEffect } from 'react';
import api, { WorkItem, Signal } from '../api/client';
import { ArrowLeft, MessageSquare, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import RCAForm from './RCAForm';

interface IncidentDetailProps {
  incident: WorkItem;
  onBack: () => void;
  onUpdate: () => void;
}

const IncidentDetail: React.FC<IncidentDetailProps> = ({ incident, onBack, onUpdate }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [showSignals, setShowSignals] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchSignals = async () => {
      const response = await api.get(`/incidents/${incident.id}/signals`);
      setSignals(response.data.signals);
    };
    fetchSignals();
  }, [incident.id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.patch(`/incidents/${incident.id}/status`, { status: newStatus });
      onUpdate();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold mb-2">{incident.componentId}</h2>
          <div className="flex gap-3 items-center">
            <span className="text-slate-400">{incident.componentType}</span>
            <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
            <span className="text-slate-400">Created {format(new Date(incident.firstSignalAt), 'MMM d, HH:mm:ss')}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {incident.status === 'OPEN' && (
            <button 
              disabled={updating}
              onClick={() => handleStatusChange('INVESTIGATING')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Start Investigation
            </button>
          )}
          {incident.status === 'INVESTIGATING' && (
            <button 
              disabled={updating}
              onClick={() => handleStatusChange('RESOLVED')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Resolve Incident
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Signals Section */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div 
              className="p-4 bg-slate-800/50 flex justify-between items-center cursor-pointer"
              onClick={() => setShowSignals(!showSignals)}
            >
              <div className="flex items-center gap-2 font-semibold">
                <Terminal size={18} className="text-indigo-400" />
                Raw Signals ({incident.signalCount})
              </div>
              {showSignals ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
            </div>
            {showSignals && (
              <div className="p-0 max-h-96 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/50 text-slate-500">
                    <tr>
                      <th className="p-3 font-medium">Timestamp</th>
                      <th className="p-3 font-medium">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {signals.map((s, i) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="p-3 whitespace-nowrap font-mono text-xs text-slate-400">
                          {format(new Date(s.timestamp), 'HH:mm:ss.SSS')}
                        </td>
                        <td className="p-3">{s.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* RCA Section */}
          {(incident.status === 'RESOLVED' || incident.status === 'CLOSED') && (
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageSquare className="text-emerald-400" />
                Root Cause Analysis
              </h3>
              <RCAForm incident={incident} onComplete={onUpdate} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Stats</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-xs text-slate-500">Severity</div>
                <div className={`text-xl font-bold priority-${incident.priority.toLowerCase()}`}>{incident.priority}</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <div className="text-xs text-slate-500">MTTR</div>
                <div className="text-xl font-bold text-white">
                  {incident.mttrSeconds ? `${Math.floor(incident.mttrSeconds / 60)}m ${incident.mttrSeconds % 60}s` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;
