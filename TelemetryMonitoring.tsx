import React, { useState, useEffect } from 'react';
import { Radio, Pause, Play, Activity, Cpu, HardDrive, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const TelemetryMonitoring: React.FC = () => {
  const [isLive, setIsLive] = useState(true);
  const [telemetryHistory, setTelemetryHistory] = useState<
    { time: string; pps: number; mbps: number; cpu: number; mem: number }[]
  >([]);

  useEffect(() => {
    // Generate initial history points
    const points = [];
    const now = Date.now();
    for (let i = 15; i >= 0; i--) {
      const t = new Date(now - i * 3000).toLocaleTimeString();
      points.push({
        time: t,
        pps: Math.floor(Math.random() * 400) + 1200,
        mbps: Math.floor(Math.random() * 80) + 140,
        cpu: Math.floor(Math.random() * 20) + 25,
        mem: Math.floor(Math.random() * 15) + 40,
      });
    }
    setTelemetryHistory(points);
  }, []);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      setTelemetryHistory((prev) => {
        const next = [
          ...prev.slice(1),
          {
            time: now,
            pps: Math.floor(Math.random() * 600) + 1100,
            mbps: Math.floor(Math.random() * 100) + 130,
            cpu: Math.floor(Math.random() * 25) + 28,
            mem: Math.floor(Math.random() * 10) + 42,
          },
        ];
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isLive]);

  const currentStats = telemetryHistory[telemetryHistory.length - 1] || {
    pps: 1420,
    mbps: 185,
    cpu: 32,
    mem: 45,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <span>Real-Time Telemetry & Session Monitoring</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Streaming packet throughput, bandwidth consumption, and gateway system metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded border transition cursor-pointer flex items-center gap-1.5 ${
              isLive
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                : 'bg-amber-950 text-amber-300 border-amber-800 hover:bg-amber-900'
            }`}
          >
            {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLive ? 'STREAMING LIVE' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry Meters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl font-mono">
          <span className="text-[10px] text-slate-400 uppercase">Packet Rate (pps)</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{currentStats.pps}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Packets per second</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl font-mono">
          <span className="text-[10px] text-slate-400 uppercase">Throughput (Mbps)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{currentStats.mbps}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Megabits per second</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl font-mono">
          <span className="text-[10px] text-slate-400 uppercase">Gateway CPU Load</span>
          <div className="text-2xl font-bold text-purple-400 mt-1">{currentStats.cpu}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">4-Core Intel Xeon</span>
        </div>

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl font-mono">
          <span className="text-[10px] text-slate-400 uppercase">Gateway RAM Usage</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">{currentStats.mem}%</div>
          <span className="text-[11px] text-slate-500 mt-1 block">16 GB DDR5 ECC</span>
        </div>
      </div>

      {/* Live Stream Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packet Rate Stream */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Packets / Sec Streaming Stream</span>
            </h2>
            <span className="text-xs font-mono text-cyan-400">{currentStats.pps} pps</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryHistory}>
                <defs>
                  <linearGradient id="ppsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="pps" stroke="#38bdf8" fillOpacity={1} fill="url(#ppsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput Stream */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Network Throughput (Mbps)</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400">{currentStats.mbps} Mbps</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryHistory}>
                <defs>
                  <linearGradient id="mbpsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="mbps" stroke="#34d399" fillOpacity={1} fill="url(#mbpsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
