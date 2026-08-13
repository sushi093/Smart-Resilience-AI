import React, { useState } from 'react';
import {
  Shield,
  Activity,
  Server,
  AlertTriangle,
  Cpu,
  FileText,
  Search,
  Settings,
  Terminal,
  Layers,
  Network,
  Radio,
  BarChart3,
  Flame,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  demoMode: boolean;
  onToggleDemoMode: () => void;
  criticalAlertCount: number;
  onSimulateAttack: (type: 'PORT_SCAN' | 'SYN_FLOOD' | 'EXFILTRATION') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  demoMode,
  onToggleDemoMode,
  criticalAlertCount,
  onSimulateAttack,
}) => {
  const [showSimMenu, setShowSimMenu] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'topology', label: 'Topology', icon: Network },
    { id: 'ids', label: 'IDS Engine', icon: Shield },
    { id: 'ml-anomaly', label: 'ML Anomaly', icon: Cpu },
    { id: 'telemetry', label: 'Telemetry', icon: Radio },
    { id: 'siem-logs', label: 'SIEM Logs', icon: FileText },
    { id: 'packet-analysis', label: 'Packet Inspector', icon: Search },
    { id: 'protocol-security', label: 'TCP/IP Security', icon: Layers },
    { id: 'risk-engine', label: 'Risk Engine', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: criticalAlertCount },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Terminal, highlight: true },
    { id: 'device-risk', label: 'Device Inventory', icon: Server },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      {/* Top Banner for Demo Mode */}
      {demoMode && (
        <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-1 text-xs font-mono text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-semibold tracking-wider">DEMO DATA — NOT LIVE NETWORK TRAFFIC</span>
            <span className="hidden sm:inline text-amber-400/80">| Synthetic telemetry generator active</span>
          </div>
          <button
            onClick={onToggleDemoMode}
            className="text-[11px] underline hover:text-amber-200 transition cursor-pointer"
          >
            Switch Mode
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="relative p-0.5 bg-gradient-to-br from-cyan-500 via-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform duration-200">
              <div className="w-9 h-9 rounded-[10px] overflow-hidden bg-slate-950 flex items-center justify-center border border-cyan-500/30">
                <img
                  src="/src/assets/images/simple_resilience_logo_1786617819530.jpg"
                  alt="Smart Resilience AI Logo"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent group-hover:text-cyan-300 transition-colors">
                  Smart Resilience AI
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80 rounded shadow-sm">
                  SOC v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Enterprise Autonomous Cyber Defense</p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-3">
            {/* Quick Simulate Attack Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSimMenu(!showSimMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium font-mono text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/80 rounded-md transition cursor-pointer shadow-sm"
              >
                <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Simulate Event</span>
              </button>

              {showSimMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 p-1 font-sans text-xs">
                  <div className="px-3 py-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Inject Telemetry Attack
                  </div>
                  <button
                    onClick={() => {
                      onSimulateAttack('SYN_FLOOD');
                      setShowSimMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded flex items-center justify-between cursor-pointer"
                  >
                    <span>TCP SYN Flood</span>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded">CRITICAL</span>
                  </button>
                  <button
                    onClick={() => {
                      onSimulateAttack('PORT_SCAN');
                      setShowSimMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded flex items-center justify-between cursor-pointer"
                  >
                    <span>Port Scan Sweep</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded">HIGH</span>
                  </button>
                  <button
                    onClick={() => {
                      onSimulateAttack('EXFILTRATION');
                      setShowSimMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded flex items-center justify-between cursor-pointer"
                  >
                    <span>Data Exfiltration</span>
                    <span className="text-[10px] font-mono text-rose-400 bg-rose-950 px-1.5 py-0.5 rounded">CRITICAL</span>
                  </button>
                </div>
              )}
            </div>

            {/* AI Assistant Quick Trigger */}
            <button
              onClick={() => setActiveTab('ai-assistant')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 rounded-md transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline font-mono">Ask AI SOC</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Scrollable Row */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                } ${item.highlight ? 'border border-cyan-500/30' : ''}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono font-bold bg-rose-600 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
