import React, { useState } from 'react';
import { AlertTriangle, Shield, CheckCircle, XCircle, Lock, Zap, Search, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { Alert, AlertStatus, Severity } from '../types';

interface AlertsCenterViewProps {
  alerts: Alert[];
  onUpdateAlertStatus: (id: string, status: AlertStatus) => void;
  onNavigateTab: (tab: string) => void;
}

export const AlertsCenterView: React.FC<AlertsCenterViewProps> = ({
  alerts,
  onUpdateAlertStatus,
  onNavigateTab,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAlerts = alerts.filter((a) => {
    if (selectedStatus !== 'ALL' && a.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.id.toLowerCase().includes(q) ||
        a.threatType.toLowerCase().includes(q) ||
        a.sourceIp.includes(q) ||
        a.destIp.includes(q) ||
        a.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

  const handleExportCsv = () => {
    if (filteredAlerts.length === 0) return;
    const headers = [
      'ID',
      'Timestamp',
      'Severity',
      'Threat Type',
      'Status',
      'Source IP',
      'Source Host',
      'Destination IP',
      'Destination Host',
      'ML Confidence (%)',
      'Anomaly Score',
      'Reason',
      'Recommended Action',
    ];

    const rows = filteredAlerts.map((a) => [
      a.id,
      a.timestamp,
      a.severity,
      `"${a.threatType.replace(/"/g, '""')}"`,
      a.status,
      a.sourceIp,
      `"${(a.sourceDeviceName || '').replace(/"/g, '""')}"`,
      a.destIp,
      `"${(a.destDeviceName || '').replace(/"/g, '""')}"`,
      a.mlConfidence,
      a.anomalyScore,
      `"${a.reason.replace(/"/g, '""')}"`,
      `"${a.recommendedAction.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SOC_Alerts_${selectedStatus}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    if (filteredAlerts.length === 0) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(filteredAlerts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `SOC_Alerts_${selectedStatus}_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>SOC Alert Incident Management Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time incident triage, investigation tracking & automated mitigation triggers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            {['ALL', 'NEW', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded transition cursor-pointer ${
                  selectedStatus === status
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Export Action Group */}
          <div className="flex items-center gap-2 font-mono text-xs pl-2 border-l border-slate-800">
            <span className="text-slate-400 text-[11px] hidden sm:inline">Export ({filteredAlerts.length}):</span>
            <button
              onClick={handleExportCsv}
              disabled={filteredAlerts.length === 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded transition cursor-pointer flex items-center gap-1.5 font-bold"
              title="Export filtered alerts to CSV spreadsheet format"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              disabled={filteredAlerts.length === 0}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 rounded transition cursor-pointer flex items-center gap-1.5 font-bold"
              title="Export filtered alerts to JSON format"
            >
              <FileJson className="w-3.5 h-3.5 text-amber-400" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Filter alerts by IP, threat type, or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <p className="text-xs font-mono text-slate-500 text-center py-12">No alerts matching active filter parameters.</p>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl space-y-4 transition shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-slate-100 text-sm">{alert.id}</span>
                  <span className={`px-2 py-0.5 rounded font-bold border ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className="text-cyan-400 bg-cyan-950 border border-cyan-900 px-2 py-0.5 rounded">
                    ML Confidence: {alert.mlConfidence}%
                  </span>
                  <span className="text-purple-400 bg-purple-950 border border-purple-900 px-2 py-0.5 rounded">
                    Anomaly Score: {alert.anomalyScore}
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400">
                  <span>{new Date(alert.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-100">{alert.threatType}</h3>
                <p className="text-xs text-slate-300 mt-1">{alert.reason}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Source IP / Host:</span>
                  <span className="text-cyan-400 font-bold">{alert.sourceIp}</span>{' '}
                  <span className="text-slate-400">({alert.sourceDeviceName || 'External Subnet'})</span>
                </div>

                <div>
                  <span className="text-slate-500 block">Destination IP / Host:</span>
                  <span className="text-slate-200 font-bold">{alert.destIp}</span>{' '}
                  <span className="text-slate-400">({alert.destDeviceName || 'Internal Subnet'})</span>
                </div>
              </div>

              {/* Recommended Action Box */}
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-200 space-y-1">
                <span className="font-bold font-mono text-amber-400">SOC Recommended Mitigation Playbook:</span>
                <p>{alert.recommendedAction}</p>
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs font-mono text-slate-400">
                  Status: <strong className="text-slate-100 font-bold">{alert.status}</strong>
                </span>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  {alert.status === 'NEW' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'INVESTIGATING')}
                      className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 rounded transition cursor-pointer"
                    >
                      Investigate
                    </button>
                  )}

                  {alert.status !== 'RESOLVED' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'RESOLVED')}
                      className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded transition cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Resolve</span>
                    </button>
                  )}

                  {alert.status !== 'FALSE_POSITIVE' && (
                    <button
                      onClick={() => onUpdateAlertStatus(alert.id, 'FALSE_POSITIVE')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition cursor-pointer"
                    >
                      False Positive
                    </button>
                  )}

                  <button
                    onClick={() => onNavigateTab('ai-assistant')}
                    className="px-3 py-1.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ask AI Assistant</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
