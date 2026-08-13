import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Zap,
  Filter,
  CheckCircle,
  XCircle,
  Play,
  Terminal,
  Activity,
  Layers,
} from 'lucide-react';
import { Alert, AlertStatus, Severity } from '../types';

interface IDSDetectionViewProps {
  alerts: Alert[];
  onAnalyzeIDS: (data: {
    sourceIp?: string;
    destIp?: string;
    protocol?: string;
    payloadSample?: string;
    packetRate?: number;
  }) => void;
  onUpdateAlertStatus: (id: string, status: AlertStatus) => void;
  onNavigateTab: (tab: string) => void;
}

export const IDSDetectionView: React.FC<IDSDetectionViewProps> = ({
  alerts,
  onAnalyzeIDS,
  onUpdateAlertStatus,
  onNavigateTab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  // Custom Simulator Form state
  const [simSourceIp, setSimSourceIp] = useState('192.168.1.188');
  const [simDestIp, setSimDestIp] = useState('10.0.0.10');
  const [simProtocol, setSimProtocol] = useState('TCP');
  const [simPayload, setSimPayload] = useState('GET /admin/config.php HTTP/1.1 - nmap scan');
  const [simRate, setSimRate] = useState('2400');

  const filteredAlerts = alerts.filter((a) => {
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
    if (selectedSeverity !== 'ALL' && a.severity !== selectedSeverity) return false;
    return true;
  });

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyzeIDS({
      sourceIp: simSourceIp,
      destIp: simDestIp,
      protocol: simProtocol,
      payloadSample: simPayload,
      packetRate: Number(simRate),
    });
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-400 border-rose-800';
      case 'HIGH':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'MEDIUM':
        return 'bg-yellow-950 text-yellow-400 border-yellow-800';
      default:
        return 'bg-blue-950 text-blue-400 border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>Intrusion Detection System (IDS Engine)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time rule signature evaluation & behavioral pattern recognition
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Suricata IDS Active
          </span>
        </div>
      </div>

      {/* IDS Signatures Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Port Scan Detector', status: 'ACTIVE', count: '142 rules' },
          { label: 'Brute Force Defense', status: 'ACTIVE', count: '88 rules' },
          { label: 'Traffic Spike Analyzer', status: 'ACTIVE', count: '64 rules' },
          { label: 'Exfiltration Sensor', status: 'ACTIVE', count: '52 rules' },
        ].map((rule) => (
          <div key={rule.label} className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase">{rule.label}</span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">{rule.status}</span>
            </div>
            <p className="text-sm font-bold font-mono text-slate-200 mt-1">{rule.count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active IDS Alerts Feed */}
        <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>IDS Intrusion Alerts Feed</span>
            </h2>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="PORT_SCAN">Port Scan</option>
                <option value="BRUTE_FORCE">Brute Force</option>
                <option value="TRAFFIC_SPIKE">Traffic Spike</option>
                <option value="EXFILTRATION">Exfiltration</option>
                <option value="PROTOCOL_ANOMALY">Protocol Anomaly</option>
              </select>

              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-300 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredAlerts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8 font-mono">No alerts matching filter options.</p>
            ) : (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg space-y-3 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-100">{alert.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(alert.severity)}`}>
                        {alert.severity}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded">
                        Score: {alert.anomalyScore}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{alert.threatType}</h3>
                    <p className="text-xs text-slate-400 mt-1">{alert.reason}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/60 p-2 rounded text-slate-300">
                    <div>
                      <span className="text-slate-500">Src:</span> {alert.sourceIp}
                    </div>
                    <div>
                      <span className="text-slate-500">Dst:</span> {alert.destIp}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs font-mono">
                    <span className="text-slate-400">
                      Status: <strong className="text-slate-200">{alert.status}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {alert.status === 'NEW' && (
                        <button
                          onClick={() => onUpdateAlertStatus(alert.id, 'INVESTIGATING')}
                          className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 rounded hover:bg-amber-900 transition cursor-pointer"
                        >
                          Investigate
                        </button>
                      )}
                      <button
                        onClick={() => onUpdateAlertStatus(alert.id, 'RESOLVED')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition cursor-pointer"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => onNavigateTab('ai-assistant')}
                        className="px-2 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded hover:bg-cyan-900 transition cursor-pointer flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3 text-cyan-400" />
                        AI Analysis
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Interactive Telemetry Signature Simulator Sandbox */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>IDS Signature Sandbox</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Input custom packet telemetry to test live rule evaluation
            </p>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-3 font-mono text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Source IP Address</label>
              <input
                type="text"
                value={simSourceIp}
                onChange={(e) => setSimSourceIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Destination Target IP</label>
              <input
                type="text"
                value={simDestIp}
                onChange={(e) => setSimDestIp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Protocol</label>
                <select
                  value={simProtocol}
                  onChange={(e) => setSimProtocol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                  <option value="DNS">DNS</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Packet Rate (pps)</label>
                <input
                  type="number"
                  value={simRate}
                  onChange={(e) => setSimRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Payload / Banner String</label>
              <textarea
                rows={3}
                value={simPayload}
                onChange={(e) => setSimPayload(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Evaluate Packet Signature</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
