import React, { useState } from 'react';
import { Layers, Shield, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { ProtocolIssue } from '../types';

interface ProtocolSecurityViewProps {
  issues: ProtocolIssue[];
  onNavigateTab: (tab: string) => void;
}

export const ProtocolSecurityView: React.FC<ProtocolSecurityViewProps> = ({
  issues,
  onNavigateTab,
}) => {
  const [selectedProto, setSelectedProto] = useState<string>('ALL');

  const filteredIssues =
    selectedProto === 'ALL' ? issues : issues.filter((i) => i.protocol === selectedProto);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>TCP/IP Protocol Security & Misconfiguration Analyzer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Defensive evaluation of TCP, IP, ARP, and DNS protocol behavior
          </p>
        </div>

        {/* Proto Filter Tabs */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {['ALL', 'TCP', 'IP', 'ARP', 'DNS'].map((proto) => (
            <button
              key={proto}
              onClick={() => setSelectedProto(proto)}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                selectedProto === proto
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {proto}
            </button>
          ))}
        </div>
      </div>

      {/* Protocol Matrix Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">TCP Layer Analysis</span>
          <h3 className="text-sm font-bold text-slate-100">SYN Flags & Handshakes</h3>
          <p className="text-xs text-slate-400">Monitors half-open connection saturation, window sizes, and RST bursts.</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">IP Layer Analysis</span>
          <h3 className="text-sm font-bold text-slate-100">Addressing & Routing</h3>
          <p className="text-xs text-slate-400">Detects spoofed source subnets, unusual egress volumes, and TTL anomalies.</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">ARP Layer Analysis</span>
          <h3 className="text-sm font-bold text-slate-100">IP/MAC Binding Table</h3>
          <p className="text-xs text-slate-400">Identifies gratuitous ARP replies, MAC conflicts, and gateway poisoning.</p>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[10px] font-mono text-slate-400 uppercase">DNS Layer Analysis</span>
          <h3 className="text-sm font-bold text-slate-100">Tunneling & Queries</h3>
          <p className="text-xs text-slate-400">Inspects high-entropy subdomains, unusual TXT lookups, and rogue resolvers.</p>
        </div>
      </div>

      {/* Protocol Issues List */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Detected Protocol Misconfigurations & Anomalies</span>
        </h2>

        <div className="space-y-4">
          {filteredIssues.map((iss) => (
            <div key={iss.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="px-2 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-bold">
                    {iss.protocol}
                  </span>
                  <span className="font-bold text-slate-100">{iss.title}</span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    iss.severity === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : iss.severity === 'HIGH'
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : 'bg-yellow-950 text-yellow-400 border-yellow-800'
                  }`}
                >
                  {iss.severity}
                </span>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <p>
                  <strong>Affected Asset:</strong> <span className="font-mono text-cyan-400">{iss.affectedDevice}</span>
                </p>
                <p>
                  <strong>Issue Summary:</strong> {iss.issue}
                </p>
                <p className="font-mono text-slate-400">
                  <strong>Evidence:</strong> {iss.evidence}
                </p>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-mono block text-emerald-400">Recommended Defensive Mitigation:</strong>
                  <span>{iss.recommendedMitigation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
