import {
  Alert,
  AlertStatus,
  AnomalyPrediction,
  DashboardSummary,
  Device,
  LogEntry,
  NetworkLink,
  NetworkNode,
  Packet,
  ProtocolIssue,
  Report,
  SecurityRisk,
  SystemSettings,
  RealNetworkSnapshot,
} from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getDashboard: () => fetchJson<DashboardSummary>('/api/dashboard'),

  getDevices: () => fetchJson<Device[]>('/api/devices'),

  quarantineDevice: async (id: string) => {
    const res = await fetchJson<{ message: string; device: Device }>(`/api/devices/${id}/quarantine`, {
      method: 'POST',
    });
    return res.device;
  },

  getTopology: () => fetchJson<{ nodes: NetworkNode[]; links: NetworkLink[] }>('/api/network/topology'),

  getAlerts: () => fetchJson<Alert[]>('/api/ids/alerts'),

  analyzeIDS: async (data: { sourceIp?: string; destIp?: string; protocol?: string; payloadSample?: string; packetRate?: number }) => {
    const res = await fetchJson<{ message: string; alert: Alert }>('/api/ids/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.alert;
  },

  updateAlertStatus: async (id: string, status: AlertStatus) => {
    const res = await fetchJson<{ message: string; alert: Alert }>(`/api/alerts/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.alert;
  },

  getLogs: () => fetchJson<LogEntry[]>('/api/logs'),

  searchLogs: (query?: string, severity?: string, protocol?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (severity) params.append('severity', severity);
    if (protocol) params.append('protocol', protocol);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return fetchJson<LogEntry[]>(`/api/logs/search?${params.toString()}`);
  },

  getSIEMLogs: (query?: string, severity?: string, protocol?: string, startDate?: string, endDate?: string) => {
    if (query || (severity && severity !== 'ALL') || (protocol && protocol !== 'ALL') || startDate || endDate) {
      return api.searchLogs(query, severity, protocol, startDate, endDate);
    }
    return api.getLogs();
  },

  getPackets: () => fetchJson<Packet[]>('/api/packets'),

  predictAnomaly: (features: Partial<AnomalyPrediction>) =>
    fetchJson<AnomalyPrediction>('/api/ml/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
    }),

  predictMLAnomaly: (features: Partial<AnomalyPrediction>) => api.predictAnomaly(features),

  getRiskMetrics: () =>
    fetchJson<{ metrics: SecurityRisk; protocolIssues: ProtocolIssue[] }>('/api/risk'),

  getSecurityRisk: async () => {
    const res = await api.getRiskMetrics();
    return res.metrics;
  },

  getProtocolIssues: async () => {
    const res = await api.getRiskMetrics();
    return res.protocolIssues;
  },

  getReports: () => fetchJson<Report[]>('/api/reports'),

  askAIAssistant: (prompt: string, context?: any) =>
    fetchJson<{ text: string; recommendations?: string[]; suggestedCommands?: string[] }>('/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        contextAlertId: typeof context === 'string' ? context : context?.contextAlertId,
      }),
    }),

  simulateAttack: (attackType: 'PORT_SCAN' | 'SYN_FLOOD' | 'EXFILTRATION') =>
    fetchJson<{ message: string; alert: Alert }>('/api/simulate/attack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attackType }),
    }),

  getSettings: () => fetchJson<SystemSettings>('/api/settings'),

  getRealNetworkStats: () => fetchJson<RealNetworkSnapshot>('/api/network/real-stats'),

  updateSettings: (settings: Partial<SystemSettings>) =>
    fetchJson<{ message: string; settings: SystemSettings }>('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }),

  toggleDemoMode: async (demoMode: boolean) => {
    const res = await api.updateSettings({ demoMode });
    return res.settings;
  },
};
