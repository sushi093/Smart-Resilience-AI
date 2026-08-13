import React, { useState } from 'react';
import { Search, Eye, Shield, AlertTriangle, Layers, Terminal, Wifi, CheckCircle2 } from 'lucide-react';
import { Packet, Severity } from '../types';

interface PacketAnalysisViewProps {
  packets: Packet[];
}

export const PacketAnalysisView: React.FC<PacketAnalysisViewProps> = ({ packets }) => {
  const [filterRealOnly, setFilterRealOnly] = useState<boolean>(false);
  const filteredPackets = filterRealOnly
    ? packets.filter((p) => p.id.startsWith('real-pkt-') || p.payloadPreview.includes('[REAL TRAFFIC]'))
    : packets;

  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(filteredPackets[0] || packets[0] || null);

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
            <Search className="w-5 h-5 text-cyan-400" />
            <span>Packet Capture & Protocol Inspector (Defensive Pcap)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep packet inspection, live express request interceptor, and hex dump analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterRealOnly(!filterRealOnly)}
            className={`px-3 py-1 rounded-full font-mono text-xs border transition flex items-center gap-1.5 cursor-pointer ${
              filterRealOnly
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>{filterRealOnly ? 'Showing Real Captured Traffic' : 'Filter Live Real Packets'}</span>
          </button>
          <span className="px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full font-mono text-xs">
            Promiscuous Mode Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Packets Table */}
        <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Captured Packet Buffer ({filteredPackets.length} Packets)</span>
            </h2>
            {filterRealOnly && (
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 border border-emerald-800 rounded">
                Live HTTP Requests Intercepted
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-2">
                  <th className="py-2">Pkt ID</th>
                  <th className="py-2">Source</th>
                  <th className="py-2">Destination</th>
                  <th className="py-2">Proto</th>
                  <th className="py-2">Flags</th>
                  <th className="py-2">Length</th>
                  <th className="py-2">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPackets.map((pkt) => {
                  const isReal = pkt.id.startsWith('real-pkt-') || pkt.payloadPreview.includes('[REAL TRAFFIC]');
                  return (
                    <tr
                      key={pkt.id}
                      onClick={() => setSelectedPacket(pkt)}
                      className={`hover:bg-slate-800/60 transition cursor-pointer ${
                        selectedPacket?.id === pkt.id ? 'bg-slate-800/90 text-cyan-300 font-bold' : ''
                      }`}
                    >
                      <td className="py-2.5 font-bold flex items-center gap-1">
                        {isReal && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>}
                        <span>{pkt.id}</span>
                      </td>
                      <td className="py-2.5">{pkt.source}</td>
                      <td className="py-2.5">{pkt.destination}</td>
                      <td className="py-2.5 text-cyan-400">{pkt.protocol}</td>
                      <td className="py-2.5 text-amber-300">{pkt.flags}</td>
                      <td className="py-2.5">{pkt.length} B</td>
                      <td className="py-2.5">
                        {isReal ? (
                          <span className="px-2 py-0.5 rounded text-[10px] border bg-emerald-950 text-emerald-300 border-emerald-800 font-bold">
                            REAL
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] border ${getSeverityBadge(pkt.risk)}`}>
                            {pkt.risk}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Deep Packet Inspector & Hex Dump */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Deep Packet Inspector</span>
          </h2>

          {selectedPacket ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Packet ID:</span>
                  <span className="text-slate-100 font-bold">{selectedPacket.id}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Timestamp:</span>
                  <span className="text-slate-300">{new Date(selectedPacket.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Protocol:</span>
                  <span className="text-cyan-400">{selectedPacket.protocol}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TTL (Time To Live):</span>
                  <span className="text-slate-300">{selectedPacket.ttl || 64}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>TCP/UDP Flags:</span>
                  <span className="text-amber-400">{selectedPacket.flags}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block mb-1">Payload Frame Preview:</span>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-slate-300 text-[11px] font-mono break-all">
                  {selectedPacket.payloadPreview}
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block mb-1">Raw Hex Dump View:</span>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded text-emerald-400 text-[10px] font-mono leading-relaxed break-all">
                  {selectedPacket.hexDump || '45 00 00 3c 1a 2b 40 00 40 06 7c 8a c0 a8 01 19 0a 00 00 0a 01 bb 00'}
                </div>
              </div>

              {selectedPacket.isAnomaly && (
                <div className="p-2.5 bg-rose-950/80 border border-rose-800/80 rounded text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Anomalous header framing detected by packet analyzer.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 font-mono text-xs">
              <Search className="w-8 h-8 stroke-1 mb-2" />
              <p>Select a packet row to view header fields & raw hex dump.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
