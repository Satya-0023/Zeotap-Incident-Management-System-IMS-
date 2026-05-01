import React, { useState } from 'react';
import api, { WorkItem } from '../api/client';
import { Send, CheckCircle2 } from 'lucide-react';

interface RCAFormProps {
  incident: WorkItem;
  onComplete: () => void;
}

const RCAForm: React.FC<RCAFormProps> = ({ incident, onComplete }) => {
  const [formData, setFormData] = useState({
    rootCauseCategory: '',
    startTime: incident.firstSignalAt,
    endTime: new Date().toISOString(),
    fixDescription: '',
    preventionSteps: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (incident.status === 'CLOSED' || incident.rca) {
    const rca = incident.rca || {
      rootCauseCategory: 'Unknown',
      fixDescription: 'N/A',
      preventionSteps: 'N/A'
    };
    
    return (
      <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-lg space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold">
          <CheckCircle2 size={20} /> RCA Submitted
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Category</div>
          <div className="text-slate-200">{rca.rootCauseCategory}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Fix Applied</div>
          <div className="text-slate-200">{rca.fixDescription}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase font-bold mb-1">Prevention</div>
          <div className="text-slate-200">{rca.preventionSteps}</div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post(`/incidents/${incident.id}/rca`, formData);
      await api.patch(`/incidents/${incident.id}/status`, { status: 'CLOSED' });
      onComplete();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit RCA');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Category</label>
          <select 
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            value={formData.rootCauseCategory}
            onChange={e => setFormData({...formData, rootCauseCategory: e.target.value})}
          >
            <option value="">Select Category</option>
            <option value="CODE_BUG">Code Bug</option>
            <option value="INFRA_FAILURE">Infra Failure</option>
            <option value="MISCONFIGURATION">Misconfiguration</option>
            <option value="CAPACITY_ISSUE">Capacity Issue</option>
            <option value="EXTERNAL_DEPENDENCY">External Dependency</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-400">Fix Implementation Details</label>
        <textarea 
          required
          minLength={10}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none h-24"
          placeholder="What steps were taken to resolve the incident?"
          value={formData.fixDescription}
          onChange={e => setFormData({...formData, fixDescription: e.target.value})}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-400">Prevention Steps</label>
        <textarea 
          required
          minLength={10}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none h-24"
          placeholder="How will we prevent this from happening again?"
          value={formData.preventionSteps}
          onChange={e => setFormData({...formData, preventionSteps: e.target.value})}
        />
      </div>

      <button 
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 p-3 rounded-lg font-bold transition-all disabled:opacity-50"
      >
        <Send size={18} /> {submitting ? 'Submitting...' : 'Submit RCA & Close Incident'}
      </button>
    </form>
  );
};

export default RCAForm;
