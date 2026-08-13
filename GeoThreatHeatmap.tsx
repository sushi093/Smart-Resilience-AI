import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Globe,
  MapPin,
  ShieldAlert,
  Zap,
  Activity,
  Filter,
  Eye,
  RefreshCw,
  X,
  Layers,
  BarChart2,
  Lock,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
} from 'lucide-react';

export interface GeoRegionData {
  id: string;
  regionName: string;
  code: string;
  latitude: number;
  longitude: number;
  xPercent: number; // For canvas world grid placement
  yPercent: number;
  threatCount: number;
  criticalCount: number;
  highCount: number;
  topAttackVector: string;
  avgLatencyMs: number;
  originIpSample: string;
  asnName: string;
  threatVectors: { vector: string; count: number; intensity: number }[];
}

interface GeoThreatHeatmapProps {
  onNavigateTab?: (tab: string) => void;
}

const DEFAULT_REGIONS: GeoRegionData[] = [
  {
    id: 'reg-na',
    regionName: 'North America (US-East / US-West)',
    code: 'NA',
    latitude: 38.0,
    longitude: -97.0,
    xPercent: 22,
    yPercent: 35,
    threatCount: 3420,
    criticalCount: 42,
    highCount: 180,
    topAttackVector: 'Port Scanning & Recon',
    avgLatencyMs: 24,
    originIpSample: '185.220.101.4',
    asnName: 'AS14061 DigitalOcean',
    threatVectors: [
      { vector: 'Port Scanning', count: 1850, intensity: 85 },
      { vector: 'SYN Flood', count: 820, intensity: 60 },
      { vector: 'Auth Brute Force', count: 450, intensity: 40 },
      { vector: 'SQLi / XSS', count: 210, intensity: 25 },
      { vector: 'Exfiltration', count: 90, intensity: 15 },
    ],
  },
  {
    id: 'reg-eu',
    regionName: 'Western & Eastern Europe',
    code: 'EU',
    latitude: 50.0,
    longitude: 10.0,
    xPercent: 52,
    yPercent: 28,
    threatCount: 5890,
    criticalCount: 112,
    highCount: 430,
    topAttackVector: 'Distributed SYN Flood',
    avgLatencyMs: 88,
    originIpSample: '194.26.29.112',
    asnName: 'AS44477 Stark Industries EU',
    threatVectors: [
      { vector: 'Port Scanning', count: 1200, intensity: 55 },
      { vector: 'SYN Flood', count: 2900, intensity: 95 },
      { vector: 'Auth Brute Force', count: 980, intensity: 70 },
      { vector: 'SQLi / XSS', count: 510, intensity: 50 },
      { vector: 'Exfiltration', count: 300, intensity: 35 },
    ],
  },
  {
    id: 'reg-easia',
    regionName: 'East Asia (Tokyo / HK / Singapore)',
    code: 'EA',
    latitude: 35.0,
    longitude: 105.0,
    xPercent: 78,
    yPercent: 38,
    threatCount: 7120,
    criticalCount: 188,
    highCount: 610,
    topAttackVector: 'API Auth Brute Force & Credential Stuffing',
    avgLatencyMs: 142,
    originIpSample: '103.251.170.8',
    asnName: 'AS4134 China Telecom',
    threatVectors: [
      { vector: 'Port Scanning', count: 2100, intensity: 75 },
      { vector: 'SYN Flood', count: 1800, intensity: 70 },
      { vector: 'Auth Brute Force', count: 2150, intensity: 98 },
      { vector: 'SQLi / XSS', count: 720, intensity: 65 },
      { vector: 'Exfiltration', count: 350, intensity: 45 },
    ],
  },
  {
    id: 'reg-sasia',
    regionName: 'South Asia & India Subcontinent',
    code: 'SA',
    latitude: 20.0,
    longitude: 78.0,
    xPercent: 68,
    yPercent: 48,
    threatCount: 2840,
    criticalCount: 31,
    highCount: 145,
    topAttackVector: 'SQLi / Web Exploitation',
    avgLatencyMs: 110,
    originIpSample: '49.207.54.20',
    asnName: 'AS55836 Reliance Jio',
    threatVectors: [
      { vector: 'Port Scanning', count: 920, intensity: 45 },
      { vector: 'SYN Flood', count: 610, intensity: 35 },
      { vector: 'Auth Brute Force', count: 420, intensity: 30 },
      { vector: 'SQLi / XSS', count: 740, intensity: 80 },
      { vector: 'Exfiltration', count: 150, intensity: 20 },
    ],
  },
  {
    id: 'reg-sam',
    regionName: 'South America (Sao Paulo / Buenos Aires)',
    code: 'SAM',
    latitude: -15.0,
    longitude: -60.0,
    xPercent: 32,
    yPercent: 68,
    threatCount: 1950,
    criticalCount: 18,
    highCount: 92,
    topAttackVector: 'DNS Amplification & UDP Reflection',
    avgLatencyMs: 165,
    originIpSample: '177.136.240.5',
    asnName: 'AS28573 Claro SA',
    threatVectors: [
      { vector: 'Port Scanning', count: 610, intensity: 35 },
      { vector: 'SYN Flood', count: 780, intensity: 55 },
      { vector: 'Auth Brute Force', count: 310, intensity: 25 },
      { vector: 'SQLi / XSS', count: 170, intensity: 20 },
      { vector: 'Exfiltration', count: 80, intensity: 10 },
    ],
  },
  {
    id: 'reg-me',
    regionName: 'Middle East (Dubai / Riyadh)',
    code: 'ME',
    latitude: 25.0,
    longitude: 45.0,
    xPercent: 58,
    yPercent: 44,
    threatCount: 4110,
    criticalCount: 89,
    highCount: 290,
    topAttackVector: 'Encrypted Tunnel Exfiltration',
    avgLatencyMs: 125,
    originIpSample: '185.191.171.42',
    asnName: 'AS5384 Emirates Telecom',
    threatVectors: [
      { vector: 'Port Scanning', count: 910, intensity: 48 },
      { vector: 'SYN Flood', count: 1100, intensity: 62 },
      { vector: 'Auth Brute Force', count: 820, intensity: 58 },
      { vector: 'SQLi / XSS', count: 480, intensity: 45 },
      { vector: 'Exfiltration', count: 800, intensity: 92 },
    ],
  },
  {
    id: 'reg-afr',
    regionName: 'Africa (Cape Town / Lagos)',
    code: 'AFR',
    latitude: 8.0,
    longitude: 20.0,
    xPercent: 50,
    yPercent: 58,
    threatCount: 1420,
    criticalCount: 12,
    highCount: 64,
    topAttackVector: 'Botnet Probe Scanning',
    avgLatencyMs: 190,
    originIpSample: '197.210.8.15',
    asnName: 'AS29465 MTN Nigeria',
    threatVectors: [
      { vector: 'Port Scanning', count: 780, intensity: 52 },
      { vector: 'SYN Flood', count: 320, intensity: 28 },
      { vector: 'Auth Brute Force', count: 210, intensity: 22 },
      { vector: 'SQLi / XSS', count: 80, intensity: 12 },
      { vector: 'Exfiltration', count: 30, intensity: 8 },
    ],
  },
  {
    id: 'reg-oce',
    regionName: 'Oceania (Sydney / Auckland)',
    code: 'OCE',
    latitude: -25.0,
    longitude: 135.0,
    xPercent: 88,
    yPercent: 72,
    threatCount: 980,
    criticalCount: 6,
    highCount: 38,
    topAttackVector: 'Legacy TCP Probe',
    avgLatencyMs: 210,
    originIpSample: '139.130.4.5',
    asnName: 'AS1221 Telstra Corp',
    threatVectors: [
      { vector: 'Port Scanning', count: 520, intensity: 32 },
      { vector: 'SYN Flood', count: 210, intensity: 18 },
      { vector: 'Auth Brute Force', count: 140, intensity: 15 },
      { vector: 'SQLi / XSS', count: 80, intensity: 10 },
      { vector: 'Exfiltration', count: 30, intensity: 5 },
    ],
  },
];

export const GeoThreatHeatmap: React.FC<GeoThreatHeatmapProps> = ({ onNavigateTab }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const matrixSvgRef = useRef<SVGSVGElement | null>(null);

  // Filter & Display States
  const [viewMode, setViewMode] = useState<'SPATIAL_MAP' | 'MATRIX_HEATMAP' | 'VECTOR_BARS'>('SPATIAL_MAP');
  const [timeWindow, setTimeWindow] = useState<'1H' | '24H' | '7D'>('24H');
  const [minSeverity, setMinSeverity] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<GeoRegionData | null>(null);
  const [isLiveStream, setIsLiveStream] = useState<boolean>(true);
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  // Interactive D3 Tooltip State
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    title: string;
    subtitle: string;
    count: number;
    severity: string;
    topVector: string;
  } | null>(null);

  // Filtered regional data based on selection
  const processedRegions = useMemo(() => {
    let list = [...DEFAULT_REGIONS];
    if (minSeverity === 'CRITICAL') {
      list = list.map((r) => ({
        ...r,
        threatCount: r.criticalCount * 12,
      }));
    } else if (minSeverity === 'HIGH') {
      list = list.map((r) => ({
        ...r,
        threatCount: (r.criticalCount + r.highCount) * 8,
      }));
    }

    if (regionFilter !== 'ALL') {
      list = list.filter((r) => r.code === regionFilter);
    }

    return list;
  }, [minSeverity, regionFilter]);

  // Total counts for metric header
  const totalGeoThreats = useMemo(() => {
    return processedRegions.reduce((sum, r) => sum + r.threatCount, 0);
  }, [processedRegions]);

  const totalCriticalGeoThreats = useMemo(() => {
    return processedRegions.reduce((sum, r) => sum + r.criticalCount, 0);
  }, [processedRegions]);

  // ==========================================
  // D3 RENDERING EFFECT: SPATIAL GEOGRAPHIC MAP
  // ==========================================
  useEffect(() => {
    if (viewMode !== 'SPATIAL_MAP' || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 420;

    // Root Group
    const g = svg.append('g').attr('class', 'map-root');

    // Color Scale for Threat Intensity
    const maxThreats: number = d3.max(processedRegions, (d: GeoRegionData) => d.threatCount) ?? 1000;
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxThreats])
      .interpolator(d3.interpolateRgb('rgba(6, 182, 212, 0.3)', 'rgba(244, 63, 94, 0.95)'));

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, maxThreats])
      .range([10, 36]);

    // Draw Grid Lines in SVG
    const gridGroup = g.append('g').attr('class', 'bg-grid');
    for (let x = 0; x <= width; x += 40) {
      gridGroup
        .append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', height)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '2,4');
    }
    for (let y = 0; y <= height; y += 40) {
      gridGroup
        .append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width)
        .attr('y2', y)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '2,4');
    }

    // Target Corporate SOC Gateway Hub (US-East / Central Gateway)
    const targetX = width * 0.28;
    const targetY = height * 0.38;

    // Draw Central Corporate SOC Node
    const hubGroup = g.append('g').attr('class', 'hub-node');
    hubGroup
      .append('circle')
      .attr('cx', targetX)
      .attr('cy', targetY)
      .attr('r', 18)
      .attr('fill', 'rgba(6, 182, 212, 0.15)')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2);

    hubGroup
      .append('circle')
      .attr('cx', targetX)
      .attr('cy', targetY)
      .attr('r', 6)
      .attr('fill', '#06b6d4');

    hubGroup
      .append('text')
      .attr('x', targetX)
      .attr('y', targetY - 24)
      .attr('text-anchor', 'middle')
      .attr('fill', '#38bdf8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('SOC GATEWAY HUB [US-EAST]');

    // Draw D3 Curved Attack Arcs & Regional Nodes
    const nodesGroup = g.append('g').attr('class', 'region-nodes');

    processedRegions.forEach((region) => {
      const cx = (region.xPercent / 100) * width;
      const cy = (region.yPercent / 100) * height;
      const r = radiusScale(region.threatCount);
      const cellColor = colorScale(region.threatCount);

      // Curved Arc to Target Gateway Hub
      if (region.id !== 'reg-na') {
        const dx = targetX - cx;
        const dy = targetY - cy;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.1;

        nodesGroup
          .append('path')
          .attr('d', `M${cx},${cy}A${dr},${dr} 0 0,1 ${targetX},${targetY}`)
          .attr('fill', 'none')
          .attr('stroke', cellColor)
          .attr('stroke-width', region.criticalCount > 50 ? 2 : 1)
          .attr('stroke-opacity', 0.45)
          .attr('stroke-dasharray', '4,4');
      }

      // Pulse Animation Ring
      const nodeG = nodesGroup
        .append('g')
        .attr('class', 'region-point cursor-pointer')
        .on('click', () => setSelectedRegion(region))
        .on('mouseenter', (event) => {
          const [mx, my] = d3.pointer(event, svgRef.current);
          setTooltipData({
            x: mx,
            y: my,
            title: region.regionName,
            subtitle: `ASN: ${region.asnName}`,
            count: region.threatCount,
            severity: `${region.criticalCount} Critical / ${region.highCount} High`,
            topVector: region.topAttackVector,
          });
        })
        .on('mousemove', (event) => {
          const [mx, my] = d3.pointer(event, svgRef.current);
          setTooltipData((prev) => (prev ? { ...prev, x: mx, y: my } : null));
        })
        .on('mouseleave', () => {
          setTooltipData(null);
        });

      // Outer Heat Glow Ring
      nodeG
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', r * 1.4)
        .attr('fill', cellColor)
        .attr('opacity', 0.2);

      // Core Heat Bubble
      nodeG
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', r)
        .attr('fill', cellColor)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.8);

      // Region Code Text Label
      nodeG
        .append('text')
        .attr('x', cx)
        .attr('y', cy + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(region.code);

      // Threat Volume Badge
      nodeG
        .append('text')
        .attr('x', cx)
        .attr('y', cy + r + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(`${(region.threatCount / 1000).toFixed(1)}k attempts`);
    });
  }, [viewMode, processedRegions]);

  // ==========================================
  // D3 RENDERING EFFECT: MATRIX HEATMAP GRID
  // ==========================================
  useEffect(() => {
    if (viewMode !== 'MATRIX_HEATMAP' || !matrixSvgRef.current) return;

    const svg = d3.select(matrixSvgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 60, right: 30, bottom: 40, left: 160 };
    const width = 780 - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const attackTypes = [
      'Port Scanning',
      'SYN Flood',
      'Auth Brute Force',
      'SQLi / XSS',
      'Exfiltration',
    ];
    const regionNames = processedRegions.map((r) => r.code);

    // D3 Band Scales
    const xScale = d3.scaleBand().domain(attackTypes).range([0, width]).padding(0.08);
    const yScale = d3.scaleBand().domain(regionNames).range([0, height]).padding(0.08);

    // Color Scale for Matrix Cells
    const matrixColorScale = d3
      .scaleSequential()
      .domain([0, 3000])
      .interpolator(d3.interpolatePlasma);

    // X Axis Labels
    g.append('g')
      .attr('transform', `translate(0,-10)`)
      .selectAll('text')
      .data(attackTypes)
      .enter()
      .append('text')
      .attr('x', (d) => (xScale(d) || 0) + xScale.bandwidth() / 2)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('fill', '#06b6d4')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d) => d);

    // Y Axis Labels
    g.append('g')
      .selectAll('text')
      .data<GeoRegionData>(processedRegions)
      .enter()
      .append('text')
      .attr('x', -10)
      .attr('y', (d: GeoRegionData) => (yScale(d.code) || 0) + yScale.bandwidth() / 2 + 3)
      .attr('text-anchor', 'end')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text((d: GeoRegionData) => `${d.code} (${d.regionName.split(' ')[0]})`);

    // Render Heatmap Matrix Cells
    processedRegions.forEach((region) => {
      region.threatVectors.forEach((tv) => {
        const x = xScale(tv.vector);
        const y = yScale(region.code);

        if (x !== undefined && y !== undefined) {
          const cellColor = matrixColorScale(tv.count);

          const cellGroup = g
            .append('g')
            .attr('class', 'matrix-cell cursor-pointer')
            .on('click', () => setSelectedRegion(region))
            .on('mouseenter', (event) => {
              const [mx, my] = d3.pointer(event, matrixSvgRef.current);
              setTooltipData({
                x: mx,
                y: my,
                title: `${region.code} - ${tv.vector}`,
                subtitle: `Intrusion Attempts: ${tv.count.toLocaleString()}`,
                count: tv.count,
                severity: `Intensity Rating: ${tv.intensity}%`,
                topVector: region.topAttackVector,
              });
            })
            .on('mousemove', (event) => {
              const [mx, my] = d3.pointer(event, matrixSvgRef.current);
              setTooltipData((prev) => (prev ? { ...prev, x: mx, y: my } : null));
            })
            .on('mouseleave', () => setTooltipData(null));

          cellGroup
            .append('rect')
            .attr('x', x)
            .attr('y', y)
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('rx', 4)
            .attr('fill', cellColor)
            .attr('stroke', '#1e293b')
            .attr('stroke-width', 1);

          cellGroup
            .append('text')
            .attr('x', x + xScale.bandwidth() / 2)
            .attr('y', y + yScale.bandwidth() / 2 + 3)
            .attr('text-anchor', 'middle')
            .attr('fill', tv.count > 1500 ? '#ffffff' : '#cbd5e1')
            .attr('font-size', '10px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .text(tv.count);
        }
      });
    });
  }, [viewMode, processedRegions]);

  return (
    <div className="space-y-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl relative overflow-hidden">
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
              <Globe className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-mono">
              <span>Geographic Threat Spatial Heatmap</span>
              <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 rounded">
                D3.js Spatial Engine
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Real-time D3 visualization mapping global intrusion vector origins, regional anomaly densities, and active attack trajectory arcs.
          </p>
        </div>

        {/* Display Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('SPATIAL_MAP')}
              className={`px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'SPATIAL_MAP'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Spatial Grid</span>
            </button>
            <button
              onClick={() => setViewMode('MATRIX_HEATMAP')}
              className={`px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'MATRIX_HEATMAP'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>D3 Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('VECTOR_BARS')}
              className={`px-3 py-1 rounded text-xs transition cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'VECTOR_BARS'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Density Rank</span>
            </button>
          </div>

          {/* Time Window Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            {(['1H', '24H', '7D'] as const).map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`px-2.5 py-1 rounded text-[11px] transition cursor-pointer ${
                  timeWindow === tw
                    ? 'bg-slate-800 text-slate-100 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tw}
              </button>
            ))}
          </div>

          {/* Severity Threshold Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={minSeverity}
              onChange={(e) => setMinSeverity(e.target.value as any)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Threat Levels</option>
              <option value="HIGH">High + Critical</option>
              <option value="CRITICAL">Critical Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase block">Global Inbound Threats</span>
          <span className="text-lg font-bold text-cyan-400 block mt-0.5">
            {totalGeoThreats.toLocaleString()} <span className="text-xs text-slate-500 font-normal">attempts</span>
          </span>
          <span className="text-[10px] text-slate-500 block">Across 8 monitored geo-zones</span>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase block">Critical Infiltrations</span>
          <span className="text-lg font-bold text-rose-400 block mt-0.5 flex items-center gap-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            {totalCriticalGeoThreats.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">Immediate SOC quarantine priority</span>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase block">Top Threat Geo Origin</span>
          <span className="text-sm font-bold text-amber-400 block mt-1 truncate">
            East Asia (EA - 7.1k)
          </span>
          <span className="text-[10px] text-slate-500 block">Credential Stuffing / Auth Flood</span>
        </div>

        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
          <span className="text-[10px] text-slate-400 uppercase block">Live Telemetry Feed</span>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => setIsLiveStream(!isLiveStream)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                isLiveStream
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isLiveStream ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              {isLiveStream ? 'STREAM ACTIVE' : 'PAUSED'}
            </button>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Auto-refreshing spatial vectors</span>
        </div>
      </div>

      {/* Main Visualization Stage */}
      <div className="relative bg-slate-950 border border-slate-800/80 rounded-xl p-3 min-h-[420px] flex items-center justify-center overflow-x-auto">
        {/* SPATIAL WORLD GRID HEATMAP */}
        {viewMode === 'SPATIAL_MAP' && (
          <div className="w-full overflow-hidden relative">
            <svg
              ref={svgRef}
              viewBox="0 0 800 420"
              className="w-full h-auto max-h-[420px] select-none"
            ></svg>

            {/* Spatial Map Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2 font-mono text-[10px] flex items-center gap-3">
              <span className="text-slate-400">Heat Intensity:</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-cyan-500/50"></span>
                <span className="text-slate-300">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-500"></span>
                <span className="text-slate-300">Elevated</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-rose-500"></span>
                <span className="text-slate-300">Critical Density</span>
              </div>
            </div>
          </div>
        )}

        {/* D3 MATRIX HEATMAP */}
        {viewMode === 'MATRIX_HEATMAP' && (
          <div className="w-full overflow-hidden relative">
            <svg
              ref={matrixSvgRef}
              viewBox="0 0 780 360"
              className="w-full h-auto max-h-[380px] select-none"
            ></svg>
            <p className="text-[11px] font-mono text-slate-400 text-center mt-1">
              Click any matrix cell to inspect regional ASN payload data and execute regional firewall blocks.
            </p>
          </div>
        )}

        {/* D3 REGION VECTOR BARS */}
        {viewMode === 'VECTOR_BARS' && (
          <div className="w-full space-y-3 font-mono text-xs p-2">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 text-[11px]">
              <span>Geographic Region</span>
              <span>Primary Attack Vector</span>
              <span>Intrusion Volume Density</span>
              <span>Action</span>
            </div>

            {processedRegions
              .sort((a, b) => b.threatCount - a.threatCount)
              .map((region) => {
                const maxVal = 7500;
                const percent = Math.min(100, Math.round((region.threatCount / maxVal) * 100));

                return (
                  <div
                    key={region.id}
                    onClick={() => setSelectedRegion(region)}
                    className="p-3 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="sm:w-1/4">
                      <div className="font-bold text-slate-100">{region.regionName}</div>
                      <div className="text-[10px] text-slate-400">ASN: {region.asnName}</div>
                    </div>

                    <div className="sm:w-1/4 text-amber-400 font-bold text-[11px]">
                      {region.topAttackVector}
                    </div>

                    <div className="sm:w-1/3 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{region.threatCount.toLocaleString()} attempts</span>
                        <span className="text-rose-400 font-bold">{region.criticalCount} Critical</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRegion(region);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 text-cyan-300 border border-slate-700 hover:border-cyan-800 rounded text-[11px] transition flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* D3 Interactive Floating Tooltip */}
        {tooltipData && (
          <div
            className="pointer-events-none fixed z-50 bg-slate-950/95 border border-cyan-800/80 rounded-lg p-3 shadow-2xl font-mono text-xs max-w-xs space-y-1 text-slate-200"
            style={{
              left: Math.min(window.innerWidth - 220, tooltipData.x + 20),
              top: Math.min(window.innerHeight - 150, tooltipData.y + 20),
            }}
          >
            <div className="font-bold text-cyan-300 text-sm">{tooltipData.title}</div>
            <div className="text-[11px] text-slate-400">{tooltipData.subtitle}</div>
            <div className="text-amber-400 font-bold mt-1">
              Intrusion Attempts: {tooltipData.count.toLocaleString()}
            </div>
            <div className="text-[10px] text-rose-400">{tooltipData.severity}</div>
            <div className="text-[10px] text-slate-400 border-t border-slate-800 pt-1 mt-1">
              Top Vector: <strong className="text-slate-200">{tooltipData.topVector}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Regional Security Forensic Modal */}
      {selectedRegion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Regional Threat Forensic Inspector</span>
              </h3>
              <button
                onClick={() => setSelectedRegion(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Monitored Geo-Zone:</span>
                <p className="text-base font-bold text-slate-100">{selectedRegion.regionName}</p>
                <p className="text-[11px] text-cyan-400">
                  Coordinates: {selectedRegion.latitude}° N, {selectedRegion.longitude}° E
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded border border-slate-800">
                <div>
                  <span className="text-slate-500">Autonomous System (ASN):</span>
                  <p className="text-cyan-400 font-bold">{selectedRegion.asnName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Sample Rogue IP:</span>
                  <p className="text-rose-400 font-bold">{selectedRegion.originIpSample}</p>
                </div>
                <div>
                  <span className="text-slate-500">Average Ping Latency:</span>
                  <p className="text-slate-200">{selectedRegion.avgLatencyMs} ms</p>
                </div>
                <div>
                  <span className="text-slate-500">Critical Threat Density:</span>
                  <p className="text-rose-400 font-bold">{selectedRegion.criticalCount} Critical Events</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase block mb-1">
                  Intrusion Vector Breakdown:
                </span>
                <div className="space-y-1 bg-slate-950 p-3 rounded border border-slate-800">
                  {selectedRegion.threatVectors.map((tv) => (
                    <div key={tv.vector} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300">{tv.vector}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">{tv.count.toLocaleString()}</span>
                        <div className="w-16 bg-slate-800 h-1.5 rounded overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full"
                            style={{ width: `${tv.intensity}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedRegion(null);
                  if (onNavigateTab) onNavigateTab('ids');
                }}
                className="px-3 py-1.5 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded hover:bg-cyan-900 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Configure IDS Rules</span>
              </button>
              <button
                onClick={() => setSelectedRegion(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
