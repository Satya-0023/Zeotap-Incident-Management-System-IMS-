import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export default api;

export interface WorkItem {
  id: string;
  componentId: string;
  componentType: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  firstSignalAt: string;
  signalCount: number;
  mttrSeconds: number | null;
  rca?: RCA;
}

export interface RCA {
  id: string;
  workItemId: string;
  rootCauseCategory: string;
  startTime: string;
  endTime: string;
  fixDescription: string;
  preventionSteps: string;
  submittedAt: string;
}

export interface Signal {
  id: string;
  componentId: string;
  componentType: string;
  timestamp: string;
  message: string;
}
