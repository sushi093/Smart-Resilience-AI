import React, { useState } from 'react';
import {
  Server,
  Shield,
  Radio,
  Lock,
  Globe,
  Database,
  Monitor,
  Activity,
  AlertTriangle,
  X,
  Zap,
} from 'lucide-react';
import { NetworkNode, NetworkLink } from '../types';

interface NetworkTopologyProps {
  nodes: NetworkNode[];
  links: NetworkLink[];
  onQuarantineDevice: (id: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const NetworkTopology: React.FC<NetworkTopologyProps> = ({
  nodes,
  links,
  onQuarantineDevice,
  onNavigateTab,
}) => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>('ALL');

  const filteredNodes =
    selectedLayer === 'ALL' ? nodes : nodes.filter((n) => n.layer === selectedLayer);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'text-emerald-400 border-emerald-500/60 bg-emerald-950/80 shadow-emerald-500/20';
      case 'WARNING':
        return 'text-amber-400 border-amber-500/60 bg-amber-950/80 shadow-amber-500/20';
      case 'CRITICAL':
        return 'text-rose-400 border-rose-500/60 bg-rose-950/80 shadow-rose-500/20 animate-pulse';
      case 'QUARANTINED':
        return 'text-purple-400 border-purple-500/60 bg-purple-950/80 shadow-purple-500/20';
      default:
        return 'text-slate-400 border-slate-700 bg-slate-900';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'Gateway':
        return Globe;
      case 'Firewall':
        return Shield;
      case 'Router':
      case 'Core Switch':
        return Radio;
      case 'Web Server':
        return Server;
      case 'Database':
        return Database;
      case 'Workstation':
        return Monitor;
      case 'Security Sensor':
        return Activity;
      default:
        return Server;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Layer Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span>Interactive Network Topology Map</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time node status, layer isolation, and link telemetry mapping
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          {['ALL', 'WAN', 'DMZ', 'CORE', 'INTERNAL', 'SECURE_ZONE'].map((layer) => (
            <button
              key={layer}
              onClick={() => setSelectedLayer(layer)}
              className={`px-2.5 py-1 rounded transition cursor-pointer ${
                selectedLayer === layer
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Canvas Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Visual Graph View */}
        <div className="lg:col-span-3 p-6 bg-slate-950 border border-slate-800 rounded-xl relative min-h-[500px] overflow-hidden flex flex-col justify-between">
          {/* Subtle Canvas Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          {/* Map Header Overlay */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Healthy
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Warning
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span> Critical Threat
              </span>
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span> Quarantined
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500">Live Telemetry Synchronized</span>
          </div>

          {/* Interactive Topology Nodes Layout */}
          <div className="relative z-10 my-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredNodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              const isSelected = selectedNode?.id === node.id;
              const isCritical = node.status === 'CRITICAL';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer shadow-lg relative ${getStatusColor(
                    node.status
                  )} ${isSelected ? 'ring-2 ring-cyan-400 scale-[1.02]' : 'hover:scale-[1.01]'}`}
                >
                  {/* Layer Badge */}
                  <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 text-[9px] font-mono bg-slate-900/90 text-slate-400 rounded border border-slate-800">
                    {node.layer}
                  </span>

                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{node.label}</h3>
                      <p className="text-xs font-mono text-slate-400">{node.ip}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Risk Score</span>
                    <span
                      className={`font-bold ${
                        node.riskScore > 70
                          ? 'text-rose-400'
                          : node.riskScore > 40
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {node.riskScore} / 100
                    </span>
                  </div>

                  {node.alertsCount > 0 && (
                    <div className="mt-2 text-center text-[11px] font-mono text-rose-300 bg-rose-950/80 border border-rose-800/80 rounded py-1 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>{node.alertsCount} Active Alerts</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Links Summary Footer */}
          <div className="relative z-10 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Interconnect Links: {links.length} active trunks</span>
            <span>Click any node to inspect telemetry details</span>
          </div>
        </div>

        {/* Selected Node Inspector Drawer */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Node Inspector</span>
                </h2>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">Device Name</span>
                <p className="text-base font-bold text-slate-100 mt-0.5">{selectedNode.label}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">IP Address</span>
                  <p className="font-bold text-cyan-400 mt-1">{selectedNode.ip}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Layer Zone</span>
                  <p className="font-bold text-slate-200 mt-1">{selectedNode.layer}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Status</span>
                  <p className="font-bold text-emerald-400 mt-1">{selectedNode.status}</p>
                </div>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Risk Score</span>
                  <p
                    className={`font-bold mt-1 ${
                      selectedNode.riskScore > 70
                        ? 'text-rose-400'
                        : selectedNode.riskScore > 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedNode.riskScore}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Open Alerts:</span>
                  <span className="font-mono text-rose-400 font-bold">{selectedNode.alertsCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Type:</span>
                  <span className="font-mono text-slate-200">{selectedNode.type}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onQuarantineDevice(selectedNode.id)}
                  className={`w-full py-2 px-3 text-xs font-mono font-bold rounded border transition cursor-pointer flex items-center justify-center gap-2 ${
                    selectedNode.status === 'QUARANTINED'
                      ? 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950 hover:bg-rose-900 text-rose-300 border-rose-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {selectedNode.status === 'QUARANTINED' ? 'Release Host Isolation' : 'Quarantine Host Isolation'}
                  </span>
                </button>

                <button
                  onClick={() => onNavigateTab('ai-assistant')}
                  className="w-full py-2 px-3 text-xs font-mono text-cyan-300 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 rounded transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Analyze Node with AI</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500 space-y-2">
              <Radio className="w-8 h-8 stroke-1" />
              <p className="text-xs font-mono">Select a device node from the topology graph to inspect its telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
