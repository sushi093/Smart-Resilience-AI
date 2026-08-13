import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Filter,
  X,
  Zap,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Clock,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
  Eye,
} from 'lucide-react';
import { LogEntry, Severity } from '../types';

interface SIEMLogsViewProps {
  logs: LogEntry[];
  onSearchLogs: (query?: string, severity?: string, protocol?: string, startDate?: string, endDate?: string) => void;
  onNavigateTab: (tab: string) => void;
}

export type SortField = 'timestamp' | 'severity' | 'sourceIp' | 'destIp' | 'eventType' | 'action' | 'protocol';
export type SortDirection = 'asc' | 'desc';
export type DatePreset = 'ALL' | '1H' | '24H' | '7D' | 'CUSTOM';

const SEVERITY_WEIGHT: Record<string, number> = {
  CRITICAL: 5,
  HIGH: 4,
  MEDIUM: 3,
  LOW: 2,
  INFO: 1,
};

export const SIEMLogsView: React.FC<SIEMLogsViewProps> = ({
  logs,
  onSearchLogs,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedProtocol, setSelectedProtocol] = useState('ALL');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Advanced Sorting State
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Active Inspect Log Modal
  const [inspectLog, setInspectLog] = useState<LogEntry | null>(null);

  // Trigger backend query or local state sync
  const triggerFetch = (query: string, sev: string, proto: string, preset: DatePreset, start: string, end: string) => {
    let computedStart = start;
    let computedEnd = end;

    const now = new Date();
    if (preset === '1H') {
      computedStart = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      computedEnd = now.toISOString();
    } else if (preset === '24H') {
      computedStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      computedEnd = now.toISOString();
    } else if (preset === '7D') {
      computedStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      computedEnd = now.toISOString();
    } else if (preset === 'ALL') {
      computedStart = '';
      computedEnd = '';
    }

    onSearchLogs(query, sev, proto, computedStart, computedEnd);
  };

  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    triggerFetch(val, selectedSeverity, selectedProtocol, datePreset, startDate, endDate);
  };

  const handleSeverityChange = (sev: string) => {
    setSelectedSeverity(sev);
    triggerFetch(searchQuery, sev, selectedProtocol, datePreset, startDate, endDate);
  };

  const handleProtocolChange = (proto: string) => {
    setSelectedProtocol(proto);
    triggerFetch(searchQuery, selectedSeverity, proto, datePreset, startDate, endDate);
  };

  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    if (preset !== 'CUSTOM') {
      setStartDate('');
      setEndDate('');
    }
    triggerFetch(searchQuery, selectedSeverity, selectedProtocol, preset, preset === 'CUSTOM' ? startDate : '', preset === 'CUSTOM' ? endDate : '');
  };

  const handleCustomDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setDatePreset('CUSTOM');
    triggerFetch(searchQuery, selectedSeverity, selectedProtocol, 'CUSTOM', start, end);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('ALL');
    setSelectedProtocol('ALL');
    setDatePreset('ALL');
    setStartDate('');
    setEndDate('');
    setSortField('timestamp');
    setSortDirection('desc');
    onSearchLogs('', 'ALL', 'ALL', '', '');
  };

  // Toggle sorting by column click
  const handleColumnSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Process sorting locally for maximum UI responsiveness
  const sortedAndFilteredLogs = useMemo(() => {
    let result = [...logs];

    // Secondary client-side date filter safeguard if local custom dates are selected
    if (datePreset === 'CUSTOM') {
      if (startDate) {
        const startMs = new Date(startDate).getTime();
        if (!isNaN(startMs)) {
          result = result.filter((l) => new Date(l.timestamp).getTime() >= startMs);
        }
      }
      if (endDate) {
        const endMs = new Date(endDate).getTime();
        if (!isNaN(endMs)) {
          result = result.filter((l) => new Date(l.timestamp).getTime() <= endMs);
        }
      }
    } else if (datePreset === '1H') {
      const cutoff = Date.now() - 60 * 60 * 1000;
      result = result.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
    } else if (datePreset === '24H') {
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      result = result.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
    } else if (datePreset === '7D') {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
    }

    // Sort processing
    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'timestamp') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === 'severity') {
        const weightA = SEVERITY_WEIGHT[a.severity] || 0;
        const weightB = SEVERITY_WEIGHT[b.severity] || 0;
        comparison = weightA - weightB;
      } else if (sortField === 'sourceIp') {
        comparison = a.sourceIp.localeCompare(b.sourceIp);
      } else if (sortField === 'destIp') {
        comparison = a.destIp.localeCompare(b.destIp);
      } else if (sortField === 'eventType') {
        comparison = a.eventType.localeCompare(b.eventType);
      } else if (sortField === 'action') {
        comparison = a.action.localeCompare(b.action);
      } else if (sortField === 'protocol') {
        comparison = a.protocol.localeCompare(b.protocol);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [logs, sortField, sortDirection, datePreset, startDate, endDate]);

  // Statistics calculation
  const totalCount = sortedAndFilteredLogs.length;
  const criticalHighCount = sortedAndFilteredLogs.filter(
    (l) => l.severity === 'CRITICAL' || l.severity === 'HIGH'
  ).length;
  const blockedCount = sortedAndFilteredLogs.filter((l) => l.action === 'BLOCKED' || l.action === 'QUARANTINED').length;
  const blockedRatio = totalCount > 0 ? Math.round((blockedCount / totalCount) * 100) : 0;

  // CSV Export
  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'Source IP', 'Destination IP', 'Event Type', 'Protocol', 'Severity', 'Action', 'Status', 'Details'];
    const rows = sortedAndFilteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.sourceIp,
      l.destIp,
      `"${l.eventType.replace(/"/g, '""')}"`,
      l.protocol,
      l.severity,
      l.action,
      `"${l.status.replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIEM_Forensic_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-950 text-rose-400 border-rose-800';
      case 'HIGH':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'MEDIUM':
        return 'bg-yellow-950 text-yellow-400 border-yellow-800';
      case 'LOW':
        return 'bg-blue-950 text-blue-400 border-blue-800';
      default:
        return 'bg-slate-900 text-slate-400 border-slate-700';
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'BLOCKED':
        return 'bg-rose-950 text-rose-400 border border-rose-800';
      case 'FLAGGED':
        return 'bg-amber-950 text-amber-400 border border-amber-800';
      case 'QUARANTINED':
        return 'bg-purple-950 text-purple-400 border border-purple-800';
      default:
        return 'bg-emerald-950 text-emerald-400 border border-emerald-800';
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 hover:text-slate-300" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
    );
  };

  // Quick Preset Handlers
  const handleQuickPreset = (type: 'CRITICAL_BLOCKED' | 'AUTH' | 'RECON' | 'EXFIL') => {
    if (type === 'CRITICAL_BLOCKED') {
      setSelectedSeverity('CRITICAL');
      setSearchQuery('');
      triggerFetch('', 'CRITICAL', selectedProtocol, datePreset, startDate, endDate);
    } else if (type === 'AUTH') {
      setSearchQuery('password');
      setSelectedSeverity('ALL');
      triggerFetch('password', 'ALL', selectedProtocol, datePreset, startDate, endDate);
    } else if (type === 'RECON') {
      setSearchQuery('scan');
      setSelectedSeverity('ALL');
      triggerFetch('scan', 'ALL', selectedProtocol, datePreset, startDate, endDate);
    } else if (type === 'EXFIL') {
      setSearchQuery('exfiltration');
      setSelectedSeverity('ALL');
      triggerFetch('exfiltration', 'ALL', selectedProtocol, datePreset, startDate, endDate);
    }
  };

  const hasActiveFilters = searchQuery || selectedSeverity !== 'ALL' || selectedProtocol !== 'ALL' || datePreset !== 'ALL' || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>SIEM-Style Security Log Explorer</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized security event aggregation, multi-dimensional audit trail indexing, and date-range log forensics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-xs font-mono transition cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Filters</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Investigation Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Logs Displayed</span>
          <span className="text-lg font-bold font-mono text-slate-100 mt-0.5 block">{totalCount}</span>
          <span className="text-[10px] font-mono text-slate-500 block">Matched query criteria</span>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Critical / High Severity</span>
          <span className="text-lg font-bold font-mono text-rose-400 mt-0.5 block flex items-center gap-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            {criticalHighCount}
          </span>
          <span className="text-[10px] font-mono text-slate-500 block">Requires high-priority triage</span>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Mitigated / Blocked Events</span>
          <span className="text-lg font-bold font-mono text-purple-400 mt-0.5 block">
            {blockedCount} <span className="text-xs text-slate-500 font-normal">({blockedRatio}%)</span>
          </span>
          <span className="text-[10px] font-mono text-slate-500 block">Automated defense enforcement</span>
        </div>

        <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Date Filter Active</span>
          <span className="text-sm font-bold font-mono text-cyan-400 mt-1 block truncate">
            {datePreset === 'ALL' ? 'All Time History' : datePreset === 'CUSTOM' ? 'Custom Window' : `Last ${datePreset}`}
          </span>
          <span className="text-[10px] font-mono text-slate-500 block">Forensic investigation window</span>
        </div>
      </div>

      {/* Main Filter, Date-Range & Sorting Controls Toolbar */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
        {/* Top Row: Search & Dropdowns */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search logs by IP, event type, status, protocol, or payload string..."
              value={searchQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            {searchQuery && (
              <button
                onClick={() => handleQueryChange('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Severity & Protocol Selectors */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSeverity}
                onChange={(e) => handleSeverityChange(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
                <option value="INFO">Info</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <select
                value={selectedProtocol}
                onChange={(e) => handleProtocolChange(e.target.value)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Protocols</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="HTTPS">HTTPS</option>
                <option value="DNS">DNS</option>
                <option value="ICMP">ICMP</option>
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="timestamp">Sort: Timestamp</option>
                <option value="severity">Sort: Severity Rank</option>
                <option value="sourceIp">Sort: Source IP</option>
                <option value="destIp">Sort: Destination IP</option>
                <option value="eventType">Sort: Event Type</option>
                <option value="action">Sort: Action Taken</option>
              </select>
              <button
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="ml-1 p-0.5 hover:bg-slate-800 rounded text-cyan-400 cursor-pointer"
                title={`Toggle Sort Order (${sortDirection.toUpperCase()})`}
              >
                {sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Row: Date-Range Selection Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider mr-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Date Window:
            </span>

            {(['ALL', '1H', '24H', '7D', 'CUSTOM'] as DatePreset[]).map((p) => (
              <button
                key={p}
                onClick={() => handleDatePresetChange(p)}
                className={`px-2.5 py-1 rounded border text-xs font-mono transition cursor-pointer ${
                  datePreset === p
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {p === 'ALL' ? 'All Time' : p === '1H' ? 'Last 1 Hour' : p === '24H' ? 'Last 24 Hours' : p === '7D' ? 'Last 7 Days' : 'Custom Range'}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs (if CUSTOM is selected or active) */}
          {datePreset === 'CUSTOM' && (
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs bg-slate-950 p-2 rounded-lg border border-cyan-900/50">
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[10px]">Start:</span>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <span className="text-slate-600">to</span>

              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[10px]">End:</span>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Incident Preset Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-mono">
          <span className="text-slate-500 text-[10px] uppercase">Incident Presets:</span>
          <button
            onClick={() => handleQuickPreset('CRITICAL_BLOCKED')}
            className="px-2.5 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-[11px] transition cursor-pointer"
          >
            ⚡ Critical Events
          </button>
          <button
            onClick={() => handleQuickPreset('AUTH')}
            className="px-2.5 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/80 text-[11px] transition cursor-pointer"
          >
            🔑 Auth / Passwords
          </button>
          <button
            onClick={() => handleQuickPreset('RECON')}
            className="px-2.5 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 text-[11px] transition cursor-pointer"
          >
            🔍 Recon / Port Scans
          </button>
          <button
            onClick={() => handleQuickPreset('EXFIL')}
            className="px-2.5 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-800/80 text-[11px] transition cursor-pointer"
          >
            🚨 Exfiltration
          </button>
        </div>
      </div>

      {/* SIEM Log Interactive Table */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>
            Showing <strong className="text-slate-100">{sortedAndFilteredLogs.length}</strong> indexed log entries
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            Sorted by <strong className="text-cyan-300">{sortField}</strong> ({sortDirection.toUpperCase()})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 pb-2 select-none">
                <th
                  onClick={() => handleColumnSort('timestamp')}
                  className="py-2.5 px-2 hover:text-cyan-300 cursor-pointer transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Timestamp</span>
                    {renderSortIcon('timestamp')}
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('sourceIp')}
                  className="py-2.5 px-2 hover:text-cyan-300 cursor-pointer transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Source IP</span>
                    {renderSortIcon('sourceIp')}
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('destIp')}
                  className="py-2.5 px-2 hover:text-cyan-300 cursor-pointer transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Destination IP</span>
                    {renderSortIcon('destIp')}
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('eventType')}
                  className="py-2.5 px-2 hover:text-cyan-300 cursor-pointer transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Event Type</span>
                    {renderSortIcon('eventType')}
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('protocol')}
                  className="py-2.5 px-2 hover:text-cyan-300 cursor-pointer transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Protocol</span>
                    {renderSortIcon('protocol')}
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('severity')}
                  className="py-2.5 px-2 hover:text-cyan-300 cursor-pointer transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Severity</span>
                    {renderSortIcon('severity')}
                  </div>
                </th>
                <th
                  onClick={() => handleColumnSort('action')}
                  className="py-2.5 px-2 hover:text-cyan-300 cursor-pointer transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Action</span>
                    {renderSortIcon('action')}
                  </div>
                </th>
                <th className="py-2.5 px-2 text-right">Forensic Inspector</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sortedAndFilteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold">No log entries matched your date-range or filter query.</p>
                    <p className="text-xs text-slate-600 mt-1">Try expanding the date window or clearing search terms.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                sortedAndFilteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3 px-2 text-slate-400 whitespace-nowrap">
                      <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-600">{new Date(log.timestamp).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3 px-2 font-bold text-slate-200 whitespace-nowrap">{log.sourceIp}</td>
                    <td className="py-3 px-2 text-slate-300 whitespace-nowrap">{log.destIp}</td>
                    <td className="py-3 px-2 font-sans font-medium text-slate-100">
                      <div>{log.eventType}</div>
                      {log.details && (
                        <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">{log.details}</div>
                      )}
                    </td>
                    <td className="py-3 px-2 text-cyan-400 font-bold">{log.protocol}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => setInspectLog(log)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-300 border border-slate-700 hover:border-cyan-800 rounded text-[11px] transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3 text-cyan-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forensic Log Payload Inspector Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Log Payload Forensic Inspector</span>
              </h3>
              <button onClick={() => setInspectLog(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-400 text-[10px] uppercase">Log Event ID & ISO Time:</span>
                <p className="text-sm font-bold text-slate-100">{inspectLog.id}</p>
                <p className="text-[11px] text-cyan-400">{new Date(inspectLog.timestamp).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded border border-slate-800">
                <div>
                  <span className="text-slate-500">Source Host:</span> <p className="text-cyan-400 font-bold">{inspectLog.sourceIp}</p>
                </div>
                <div>
                  <span className="text-slate-500">Destination:</span> <p className="text-slate-200">{inspectLog.destIp}</p>
                </div>
                <div>
                  <span className="text-slate-500">Protocol & Port:</span> <p className="text-slate-200">{inspectLog.protocol} ({inspectLog.port || 'N/A'})</p>
                </div>
                <div>
                  <span className="text-slate-500">Severity Level:</span>{' '}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(inspectLog.severity)}`}>
                    {inspectLog.severity}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] uppercase">Event Type & Details:</span>
                <p className="font-bold text-slate-100 text-xs mb-1">{inspectLog.eventType}</p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-300 font-mono break-all text-[11px]">
                  {inspectLog.details || inspectLog.eventType}
                </div>
              </div>

              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px]">Security Action Status:</span>
                  <strong className="text-emerald-400">{inspectLog.action} ({inspectLog.status})</strong>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setInspectLog(null);
                  onNavigateTab('ai-assistant');
                }}
                className="px-3 py-1.5 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded hover:bg-cyan-900 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Analyze with AI</span>
              </button>
              <button
                onClick={() => setInspectLog(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
