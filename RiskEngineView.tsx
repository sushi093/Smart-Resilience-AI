import React, { useState } from 'react';
import { Activity, Shield, CheckCircle, Sliders, Zap } from 'lucide-react';
import { SecurityRisk } from '../types';

interface RiskEngineViewProps {
  data: SecurityRisk | null;
  onNavigateTab: (tab: string) => void;
}

export const RiskEngineView: React.FC<RiskEngineViewProps> = ({ data, onNavigateTab }) => {
  const [mitigateIps, setMitigateIps] = useState(false);
  const [quarantineHosts, setQuarantineHosts] = useState(false);
  const [enableSynProxy, setEnableSynProxy] = useState(false);

  if (!data) return null;

  // What-if simulated score reduction calculation
  let simulatedScore = data.overallScore;
  if (mitigateIps) simulatedScore = Math.max(10, simulatedScore - 25);
  if (quarantineHosts) simulatedScore = Math.max(10, simulatedScore - 30);
  if (enableSynProxy) simulatedScore = Math.max(10, simulatedScore - 15);

  const getRiskColor = (score: number) => {
    if (score > 80) return 'text-rose-400 border-rose-800 bg-rose-950/80';
    if (score > 60) return 'text-amber-400 border-amber-800 bg-amber-950/80';
    if (score > 30) return 'text-yellow-400 border-yellow-800 bg-yellow-950/80';
    return 'text-emerald-400 border-emerald-800 bg-emerald-950/80';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Centralized Security Risk & Resilience Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Algorithmic scoring combining threat severity, ML anomalies, asset criticality & event frequency
          </p>
        </div>
      </div>

      {/* Main Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Risk Score Card */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">System Risk Index</span>
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${getRiskColor(simulatedScore)}`}>
              {simulatedScore > 80 ? 'CRITICAL' : simulatedScore > 60 ? 'HIGH' : simulatedScore > 30 ? 'MEDIUM' : 'LOW'}
            </span>
          </div>

          <div className="text-center py-4">
            <div className="text-6xl font-extrabold font-mono tracking-tight text-slate-100">
              {simulatedScore} <span className="text-2xl text-slate-500 font-normal">/ 100</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              {mitigateIps || quarantineHosts || enableSynProxy
                ? `Simulated Risk Reduced by ${data.overallScore - simulatedScore} points!`
                : 'Current Unmitigated Security Risk Score'}
            </p>
          </div>

          {/* Mathematical Factors Breakdown */}
          <div className="space-y-2 border-t border-slate-800 pt-4 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Threat Severity Factor:</span>
              <span className="text-rose-400">+{data.threatSeverityContribution}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>ML Anomaly Score Factor:</span>
              <span className="text-purple-400">+{data.anomalyScoreContribution}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Asset Criticality Index:</span>
              <span className="text-amber-400">+{data.assetCriticalityContribution}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Event Frequency Impulse:</span>
              <span className="text-cyan-400">+{data.eventFrequencyContribution}</span>
            </div>
          </div>
        </div>

        {/* System Resilience Score Card */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400">System Resilience Rating</span>
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              SOC READY
            </span>
          </div>

          <div className="text-center py-4">
            <div className="text-6xl font-extrabold font-mono tracking-tight text-emerald-400">
              {data.resilienceScore.overall}%
            </div>
            <p className="text-xs text-slate-400 mt-2 font-mono">4-Pillar SOC Resilience Measurement</p>
          </div>

          {/* 4 Pillars */}
          <div className="space-y-2 border-t border-slate-800 pt-4 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Detection Capability:</span>
              <span className="text-emerald-400">{data.resilienceScore.detectionCapability}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Response Readiness:</span>
              <span className="text-cyan-400">{data.resilienceScore.responseReadiness}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Network Visibility:</span>
              <span className="text-emerald-400">{data.resilienceScore.networkVisibility}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Recovery Readiness:</span>
              <span className="text-blue-400">{data.resilienceScore.recoveryReadiness}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* What-If Risk Simulation Controls */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4 font-mono text-xs">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Interactive Risk Mitigation Simulator</span>
        </h2>
        <p className="text-slate-400">
          Toggle automated response controls to evaluate prospective risk score improvements
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <label className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-3 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={mitigateIps}
              onChange={(e) => setMitigateIps(e.target.checked)}
              className="accent-cyan-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-200 block">Block External Malicious IPs</span>
              <span className="text-[11px] text-slate-400 font-sans">Drops 185.220.101.4 & WAN botnet traffic</span>
            </div>
          </label>

          <label className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-3 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={quarantineHosts}
              onChange={(e) => setQuarantineHosts(e.target.checked)}
              className="accent-cyan-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-200 block">Isolate Finance Workstation</span>
              <span className="text-[11px] text-slate-400 font-sans">Quarantines 192.168.1.25 exfiltration source</span>
            </div>
          </label>

          <label className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-3 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableSynProxy}
              onChange={(e) => setEnableSynProxy(e.target.checked)}
              className="accent-cyan-500 w-4 h-4"
            />
            <div>
              <span className="font-bold text-slate-200 block">Activate Edge SYN Proxy</span>
              <span className="text-[11px] text-slate-400 font-sans">Mitigates TCP half-open connection flood</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
