import React, { useState } from 'react';
import { Server, Lock, Search, Filter, Cpu, Shield } from 'lucide-react';
import { Device } from '../types';

interface DeviceRiskViewProps {
  devices: Device[];
  onQuarantineDevice: (id: string) => void;
}

export const DeviceRiskView: React.FC<DeviceRiskViewProps> = ({ devices, onQuarantineDevice }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const filteredDevices = devices.filter((d) => {
    if (selectedType !== 'ALL' && d.type !== selectedType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.ip.includes(q) || d.mac.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <span>Enterprise Network Device Inventory & Risk Index</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Asset discovery, hardware telemetry, subnet assignments & isolation controls
          </p>
        </div>

        <span className="px-3 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-full font-mono text-xs">
          Total Discovered Assets: {devices.length}
        </span>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search assets by name, IP, or MAC address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none"
        >
          <option value="ALL">All Device Types</option>
          <option value="Firewall">Firewall</option>
          <option value="Router">Router</option>
          <option value="Core Switch">Core Switch</option>
          <option value="Web Server">Web Server</option>
          <option value="Database">Database</option>
          <option value="Workstation">Workstation</option>
          <option value="Security Sensor">Security Sensor</option>
        </select>
      </div>

      {/* Device Table */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="text-slate-400 border-b border-slate-800 pb-2">
              <th className="py-2.5 px-2">Device Name</th>
              <th className="py-2.5 px-2">IP Address</th>
              <th className="py-2.5 px-2">MAC Address</th>
              <th className="py-2.5 px-2">Type</th>
              <th className="py-2.5 px-2">Subnet / Zone</th>
              <th className="py-2.5 px-2">Risk Score</th>
              <th className="py-2.5 px-2">Open Alerts</th>
              <th className="py-2.5 px-2">Status</th>
              <th className="py-2.5 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {filteredDevices.map((dev) => (
              <tr key={dev.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-2 font-bold text-slate-100 font-sans">{dev.name}</td>
                <td className="py-3 px-2 font-bold text-cyan-400">{dev.ip}</td>
                <td className="py-3 px-2 text-slate-400">{dev.mac}</td>
                <td className="py-3 px-2 text-slate-300">{dev.type}</td>
                <td className="py-3 px-2 text-slate-400">{dev.subnet}</td>
                <td className="py-3 px-2">
                  <span
                    className={`font-bold ${
                      dev.riskScore > 70
                        ? 'text-rose-400'
                        : dev.riskScore > 40
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {dev.riskScore}
                  </span>
                </td>
                <td className="py-3 px-2 text-rose-400 font-bold">{dev.openAlerts}</td>
                <td className="py-3 px-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      dev.status === 'HEALTHY'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : dev.status === 'WARNING'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : dev.status === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-purple-950 text-purple-400 border border-purple-800'
                    }`}
                  >
                    {dev.status}
                  </span>
                </td>
                <td className="py-3 px-2 text-right">
                  <button
                    onClick={() => onQuarantineDevice(dev.id)}
                    className={`px-2.5 py-1 text-[11px] rounded font-bold border transition cursor-pointer ${
                      dev.status === 'QUARANTINED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                        : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
                    }`}
                  >
                    {dev.status === 'QUARANTINED' ? 'Release' : 'Quarantine'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
