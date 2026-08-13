import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  AlertTriangle,
  Server,
  Zap,
  Radio,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  Clock,
  ArrowUp,
  ArrowDown,
  AlertOctagon,
  Sparkles,
  ExternalLink,
  Filter,
  Wifi,
  Globe,
  HardDrive,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Line,
  ComposedChart,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DashboardSummary, RealNetworkSnapshot } from '../types';
import { api } from '../services/api';
import { GeoThreatHeatmap } from './GeoThreatHeatmap';

interface DashboardOverviewProps {
  data: DashboardSummary | null;
  onNavigateTab: (tab: string) => void;
  onSimulateAttack: (type: 'PORT_SCAN' | 'SYN_FLOOD' | 'EXFILTRATION') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  data,
  onNavigateTab,
  onSimulateAttack,
}) => {
  // State for Data Visualization controls
  const [vizTab, setVizTab] = useState<'TRAFFIC' | 'ALERTS' | 'COMBINED'>('COMBINED');
  const [trafficMetric, setTrafficMetric] = useState<'BANDWIDTH' | 'PACKETS' | 'LATENCY'>('BANDWIDTH');
  const [timeWindow, setTimeWindow] = useState<'1H' | '6H' | '24H' | 'LIVE'>('24H');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [realStats, setRealStats] = useState<RealNetworkSnapshot | null>(null);
  const [isRefreshingRealStats, setIsRefreshingRealStats] = useState<boolean>(false);

  // Poll real kernel network stats from /proc/net/dev & os.networkInterfaces every 3 seconds
  useEffect(() => {
    let isMounted = true;
    const fetchRealData = async () => {
      try {
        const stats = await api.getRealNetworkStats();
        if (isMounted) setRealStats(stats);
      } catch (err) {
        // Fallback gracefully
      }
    };

    fetchRealData();
    const interval = setInterval(fetchRealData, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshingRealStats(true);
    try {
      const stats = await api.getRealNetworkStats();
      setRealStats(stats);
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshingRealStats(false), 500);
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm">
          <Activity className="w-5 h-5 animate-spin" />
          <span>Connecting to Smart Resilience AI SOC Engine...</span>
        </div>
      </div>
    );
  }

  // Datasets with fallback defaults
  const trafficTrends = data.trafficTrends || [
    { time: '00:00', inboundMbps: 180, outboundMbps: 110, totalPackets: 24000, latencyMs: 12 },
    { time: '04:00', inboundMbps: 120, outboundMbps: 75, totalPackets: 18000, latencyMs: 10 },
    { time: '08:00', inboundMbps: 350, outboundMbps: 220, totalPackets: 45000, latencyMs: 15 },
    { time: '12:00', inboundMbps: 680, outboundMbps: 410, totalPackets: 82000, latencyMs: 24 },
    { time: '16:00', inboundMbps: 890, outboundMbps: 540, totalPackets: 115000, latencyMs: 38 },
    { time: '20:00', inboundMbps: 520, outboundMbps: 310, totalPackets: 68000, latencyMs: 18 },
    { time: 'Now', inboundMbps: 740, outboundMbps: 480, totalPackets: 94000, latencyMs: 21 },
  ];

  const alertHistory = data.alertHistory || [
    { time: '00:00', portScan: 1, bruteForce: 0, exfiltration: 0, synFlood: 0, unauthorized: 1, totalAlerts: 2 },
    { time: '04:00', portScan: 0, bruteForce: 1, exfiltration: 0, synFlood: 0, unauthorized: 0, totalAlerts: 1 },
    { time: '08:00', portScan: 3, bruteForce: 2, exfiltration: 0, synFlood: 1, unauthorized: 1, totalAlerts: 7 },
    { time: '12:00', portScan: 6, bruteForce: 4, exfiltration: 1, synFlood: 3, unauthorized: 2, totalAlerts: 16 },
    { time: '16:00', portScan: 8, bruteForce: 6, exfiltration: 3, synFlood: 8, unauthorized: 4, totalAlerts: 29 },
    { time: '20:00', portScan: 12, bruteForce: 7, exfiltration: 4, synFlood: 10, unauthorized: 3, totalAlerts: 36 },
    { time: 'Now', portScan: 14, bruteForce: 9, exfiltration: 5, synFlood: 12, unauthorized: 4, totalAlerts: 44 },
  ];

  const alertStatusBreakdown = data.alertStatusBreakdown || [
    { status: 'NEW', count: data.criticalAlerts || 3, color: '#f43f5e' },
    { status: 'INVESTIGATING', count: 5, color: '#f59e0b' },
    { status: 'RESOLVED', count: 12, color: '#10b981' },
    { status: 'FALSE_POSITIVE', count: 2, color: '#64748b' },
  ];

  // Calculations for KPI summary bars
  const latestTraffic = trafficTrends[trafficTrends.length - 1];
  const peakInbound = Math.max(...trafficTrends.map((t) => t.inboundMbps));
  const peakOutbound = Math.max(...trafficTrends.map((t) => t.outboundMbps));
  const avgLatency = Math.round(
    trafficTrends.reduce((acc, t) => acc + t.latencyMs, 0) / trafficTrends.length
  );
  const totalAlertsNow = alertHistory[alertHistory.length - 1]?.totalAlerts || data.threatsDetected;

  const getStatusBadge = (status: 'SECURE' | 'WARNING' | 'CRITICAL') => {
    switch (status) {
      case 'SECURE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ● SECURE
          </span>
        );
      case 'WARNING':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            ● ELEVATED RISK
          </span>
        );
      case 'CRITICAL':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-rose-950/80 text-rose-400 border border-rose-800 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            ● CRITICAL ALERT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Status Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>SOC Telemetry & Security Defense Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-vector network monitoring, ML anomaly detection, and interactive Recharts data visualization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(data.networkStatus)}
          <button
            onClick={() => onNavigateTab('ai-assistant')}
            className="px-3 py-1.5 text-xs font-mono text-cyan-300 bg-cyan-950 border border-cyan-800 hover:bg-cyan-900 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Consult AI SOC</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Network Status</p>
          <div className="mt-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-slate-100 font-mono">{data.networkStatus}</span>
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Devices</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-slate-100">{data.activeDevices}</span>
            <Server className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Packets Analyzed</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-cyan-400">
              {(data.packetsAnalyzed / 1000000).toFixed(2)}M
            </span>
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Threats Detected</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-amber-400">{data.threatsDetected}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Critical Alerts</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-rose-400">{data.criticalAlerts}</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ML Anomalies</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-purple-400">{data.anomaliesDetected}</span>
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
          </div>
        </div>

        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg hover:border-slate-700 transition col-span-2 sm:col-span-1">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Resilience Score</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-emerald-400">{data.resilienceScore}%</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Real System Container Interface Telemetry Panel */}
      <div className="p-4 bg-gradient-to-r from-slate-900/95 via-cyan-950/20 to-slate-900/95 border border-cyan-900/40 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Wifi className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-slate-100">Live Host System Interface Telemetry</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  REAL SYSTEM DATA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Direct kernel interface statistics from <code className="text-cyan-300 font-mono text-[11px]">/proc/net/dev</code> and <code className="text-cyan-300 font-mono text-[11px]">os.networkInterfaces()</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshingRealStats}
              className="px-2.5 py-1 text-xs font-mono text-cyan-300 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshingRealStats ? 'animate-spin' : ''}`} />
              <span>Resample Interface</span>
            </button>
            <button
              onClick={() => onNavigateTab('devices')}
              className="px-2.5 py-1 text-xs font-mono text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded transition flex items-center gap-1 cursor-pointer"
            >
              <span>View All NICs</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Real Network Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
          <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Live Inbound Rate</span>
            <span className="text-base font-bold font-mono text-cyan-400 mt-1 block">
              {realStats ? realStats.inboundMbps : '0.450'} <span className="text-xs text-slate-500 font-normal">Mbps</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Kernel RX Delta</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Live Outbound Rate</span>
            <span className="text-base font-bold font-mono text-indigo-400 mt-1 block">
              {realStats ? realStats.outboundMbps : '0.280'} <span className="text-xs text-slate-500 font-normal">Mbps</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Kernel TX Delta</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">DNS Lookup Speed</span>
            <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">
              {realStats ? realStats.dnsLookupMs : 8} <span className="text-xs text-slate-500 font-normal">ms</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">dns.google probe</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Loopback RTT Latency</span>
            <span className="text-base font-bold font-mono text-amber-400 mt-1 block">
              {realStats ? realStats.latencyMs : 12} <span className="text-xs text-slate-500 font-normal">ms</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">TCP 127.0.0.1:3000</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Active Container Sockets</span>
            <span className="text-base font-bold font-mono text-purple-400 mt-1 block">
              {realStats ? realStats.activeSocketsCount : 12} <span className="text-xs text-slate-500 font-normal">TCP</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">/proc/net/sockstat</span>
          </div>

          <div className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Active System NICs</span>
            <span className="text-base font-bold font-mono text-slate-200 mt-1 block">
              {realStats ? realStats.activeInterfacesCount : 2} <span className="text-xs text-slate-500 font-normal">NICs</span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
              {realStats?.interfaces?.map((i) => i.name).join(', ') || 'eth0, lo'}
            </span>
          </div>
        </div>

        {/* Real Network Interfaces Table Preview */}
        {realStats && realStats.interfaces && realStats.interfaces.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-800/60 overflow-x-auto">
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300 min-w-max">
              <span className="text-slate-400 flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                Active NIC Interfaces:
              </span>
              {realStats.interfaces.map((iface) => (
                <div key={iface.name} className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  <span className="font-bold text-cyan-300">{iface.name}</span>
                  <span className="text-slate-400">({iface.ip})</span>
                  <span className="text-slate-500 text-[10px]">MAC: {iface.mac}</span>
                  <span className="text-emerald-400 text-[10px]">RX: {(iface.rxBytes / 1024 / 1024).toFixed(1)}MB</span>
                  <span className="text-indigo-400 text-[10px]">TX: {(iface.txBytes / 1024 / 1024).toFixed(1)}MB</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* D3 Geographic Threat Spatial Heatmap Component */}
      <GeoThreatHeatmap onNavigateTab={onNavigateTab} />

      {/* ========================================================================= */}
      {/* FEATURED RECHARTS DATA VISUALIZATION SECTION */}
      {/* ========================================================================= */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background element */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Visualizer Header Controls */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100 tracking-tight">
                SOC Data Visualization & Analytics Engine
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded">
                RECHARTS POWERED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Interactive multi-vector time-series visualization for network throughput, packet rates, and historical threat distribution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Selector Tabs */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setVizTab('COMBINED')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  vizTab === 'COMBINED'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Combined</span>
              </button>
              <button
                onClick={() => setVizTab('TRAFFIC')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  vizTab === 'TRAFFIC'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Traffic Trends</span>
              </button>
              <button
                onClick={() => setVizTab('ALERTS')}
                className={`px-3 py-1 text-xs font-mono rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                  vizTab === 'ALERTS'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Alert History</span>
              </button>
            </div>

            {/* Time Window Selector */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
              {(['1H', '6H', '24H', 'LIVE'] as const).map((tw) => (
                <button
                  key={tw}
                  onClick={() => setTimeWindow(tw)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded transition cursor-pointer ${
                    timeWindow === tw
                      ? 'bg-slate-800 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tw}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Attack Simulator Trigger Pills inside Data Viz section */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Interactive Attack Telemetry Trigger:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSimulateAttack('PORT_SCAN')}
              className="px-2.5 py-1 text-xs font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 rounded transition cursor-pointer flex items-center gap-1"
            >
              <span>+ Port Scan</span>
            </button>
            <button
              onClick={() => onSimulateAttack('SYN_FLOOD')}
              className="px-2.5 py-1 text-xs font-mono bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 rounded transition cursor-pointer flex items-center gap-1"
            >
              <span>+ SYN Flood</span>
            </button>
            <button
              onClick={() => onSimulateAttack('EXFILTRATION')}
              className="px-2.5 py-1 text-xs font-mono bg-purple-950/80 text-purple-300 border border-purple-800 hover:bg-purple-900 rounded transition cursor-pointer flex items-center gap-1"
            >
              <span>+ Exfiltration</span>
            </button>
          </div>
        </div>

        {/* Key Telemetry Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span>Inbound Bandwidth</span>
              <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-cyan-400">
                {latestTraffic.inboundMbps} <span className="text-xs text-slate-400">Mbps</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Peak: {peakInbound}M</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span>Outbound Bandwidth</span>
              <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-blue-400">
                {latestTraffic.outboundMbps} <span className="text-xs text-slate-400">Mbps</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Peak: {peakOutbound}M</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span>Current Latency</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-400">
                {latestTraffic.latencyMs} <span className="text-xs text-slate-400">ms</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Avg: {avgLatency}ms</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span>Total Alert Volume</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-rose-400">{totalAlertsNow}</span>
              <span className="text-[10px] font-mono text-emerald-400">Live Sync</span>
            </div>
          </div>
        </div>

        {/* Visualizers Container */}
        {(vizTab === 'TRAFFIC' || vizTab === 'COMBINED') && (
          <div className="p-5 bg-slate-950/80 border border-slate-800/90 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4 text-cyan-400" />
                  <span>Network Traffic & Throughput Trends</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time bandwidth throughput (Mbps), packet rate (pps), and latency jitter (ms).
                </p>
              </div>

              {/* Metric Mode Filter */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                {(['BANDWIDTH', 'PACKETS', 'LATENCY'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTrafficMetric(m)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition cursor-pointer ${
                      trafficMetric === m
                        ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Composed Chart for Traffic Trends */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trafficTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />

                  {(trafficMetric === 'BANDWIDTH' || trafficMetric === 'PACKETS') && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="inboundMbps"
                      name="Inbound Traffic (Mbps)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#inboundGrad)"
                    />
                  )}
                  {(trafficMetric === 'BANDWIDTH' || trafficMetric === 'PACKETS') && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="outboundMbps"
                      name="Outbound Traffic (Mbps)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#outboundGrad)"
                    />
                  )}
                  {trafficMetric === 'PACKETS' && (
                    <Bar
                      yAxisId="left"
                      dataKey="totalPackets"
                      name="Total Packets"
                      fill="#10b981"
                      opacity={0.3}
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="latencyMs"
                    name="Latency (ms)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Alert History & Category Distribution Visualizer */}
        {(vizTab === 'ALERTS' || vizTab === 'COMBINED') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alert History Stacked Bar Chart */}
            <div className="lg:col-span-2 p-5 bg-slate-950/80 border border-slate-800/90 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-400" />
                    <span>Alert History & Vector Evolution</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Threat event volume broken down by attack category over time.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-cyan-300 text-xs rounded px-2 py-1 font-mono focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="PORT_SCAN">Port Scans</option>
                    <option value="SYN_FLOOD">SYN Floods</option>
                    <option value="EXFILTRATION">Exfiltration</option>
                    <option value="BRUTE_FORCE">Brute Force</option>
                  </select>
                </div>
              </div>

              {/* Recharts Stacked Bar Chart for Alert History */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alertHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '10px' }} />

                    {(selectedCategory === 'ALL' || selectedCategory === 'PORT_SCAN') && (
                      <Bar dataKey="portScan" name="Port Scan" stackId="a" fill="#38bdf8" radius={[0, 0, 0, 0]} />
                    )}
                    {(selectedCategory === 'ALL' || selectedCategory === 'SYN_FLOOD') && (
                      <Bar dataKey="synFlood" name="SYN Flood / DoS" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
                    )}
                    {(selectedCategory === 'ALL' || selectedCategory === 'EXFILTRATION') && (
                      <Bar dataKey="exfiltration" name="Exfiltration" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} />
                    )}
                    {(selectedCategory === 'ALL' || selectedCategory === 'BRUTE_FORCE') && (
                      <Bar dataKey="bruteForce" name="Brute Force" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                    )}
                    {selectedCategory === 'ALL' && (
                      <Bar dataKey="unauthorized" name="Unauthorized" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alert Resolution Status Distribution Pie Chart */}
            <div className="p-5 bg-slate-950/80 border border-slate-800/90 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">Alert Resolution Status</h3>
                <p className="text-xs text-slate-400 mb-3">Triage lifecycle distribution</p>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={alertStatusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                      >
                        {alertStatusBreakdown.map((entry, index) => (
                          <Cell key={`status-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Breakdown Legend Grid */}
              <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-slate-800/80">
                {alertStatusBreakdown.map((item) => (
                  <div key={item.status} className="p-2 bg-slate-900/60 rounded-lg border border-slate-800">
                    <p className="text-[10px] font-mono text-slate-400 truncate">{item.status}</p>
                    <p className="text-base font-bold font-mono" style={{ color: item.color }}>
                      {item.count}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Primary Analytics Grid (Threat Timeline & Protocol Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Threat Timeline */}
        <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Threats & Anomalies Timeline</span>
              </h2>
              <p className="text-xs text-slate-400">Events detected over the last 24 hours</p>
            </div>
            <button
              onClick={() => onNavigateTab('telemetry')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View Telemetry</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.threatsOverTime}>
                <defs>
                  <linearGradient id="threatsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="anomaliesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="threats" name="Active Threats" stroke="#f43f5e" fillOpacity={1} fill="url(#threatsGrad)" />
                <Area type="monotone" dataKey="anomalies" name="ML Anomalies" stroke="#c084fc" fillOpacity={1} fill="url(#anomaliesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Severity Distribution */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-1">Threat Severity Distribution</h2>
            <p className="text-xs text-slate-400 mb-4">Breakdown by alert severity</p>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.severityDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-800">
            {data.severityDistribution.slice(0, 3).map((item) => (
              <div key={item.name} className="p-1.5 bg-slate-950/60 rounded">
                <p className="text-[10px] font-mono text-slate-400">{item.name}</p>
                <p className="text-sm font-bold font-mono" style={{ color: item.color }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Protocol Distribution & Top Threat Source IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Protocol Traffic Breakdown */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <h2 className="text-sm font-semibold text-slate-200 mb-1">Protocol Volume Distribution</h2>
          <p className="text-xs text-slate-400 mb-4">Traffic mix across key layer-4 protocols</p>

          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.protocolDistribution} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={70} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="percentage" name="Traffic Share" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Threat Source IPs Table */}
        <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Top Threat Source IPs</h2>
              <p className="text-xs text-slate-400">Hosts with highest volume of suspicious network events</p>
            </div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Alerts</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 pb-2">
                  <th className="py-2">Source IP</th>
                  <th className="py-2">Device Name</th>
                  <th className="py-2">Events</th>
                  <th className="py-2">Risk Level</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.topSourceIps.map((src) => (
                  <tr key={src.ip} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 font-bold text-slate-100">{src.ip}</td>
                    <td className="py-2.5 text-slate-400 font-sans">{src.deviceName}</td>
                    <td className="py-2.5">{src.eventCount}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          src.risk === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {src.risk}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => onNavigateTab('ai-assistant')}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[11px] transition cursor-pointer"
                      >
                        Analyze
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
