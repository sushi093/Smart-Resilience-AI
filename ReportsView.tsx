import React from 'react';
import { FileText, Download, Printer, CheckCircle, Shield } from 'lucide-react';
import { Report } from '../types';

interface ReportsViewProps {
  reports: Report[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ reports }) => {
  const currentReport = reports[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJson = () => {
    if (!currentReport) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentReport, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `${currentReport.id}_Executive_Security_Report.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentReport) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Executive & Technical Security Audit Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Compliance-ready security audit trails, resilience metrics & CISO executive summaries
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleDownloadJson}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Container */}
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl space-y-6 font-sans">
        {/* Report Title */}
        <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{currentReport.title}</h2>
            <p className="text-xs font-mono text-slate-400 mt-1">Generated at: {currentReport.generatedAt} | Period: {currentReport.period}</p>
          </div>
          <span className="px-3 py-1 bg-cyan-950 text-cyan-400 border border-cyan-800 rounded font-mono text-xs font-bold">
            CONFIDENTIAL SOC REPORT
          </span>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono uppercase text-cyan-400 font-bold">Executive Summary</h3>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-lg border border-slate-800">
            {currentReport.summaryText}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase">Packets Processed</span>
            <div className="text-lg font-bold text-slate-100 mt-1">{(currentReport.totalEvents / 1000000).toFixed(2)}M</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase">Threats Detected</span>
            <div className="text-lg font-bold text-amber-400 mt-1">{currentReport.threatsCount}</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase">Critical Incidents</span>
            <div className="text-lg font-bold text-rose-400 mt-1">{currentReport.criticalAlertsCount}</div>
          </div>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[10px] text-slate-400 uppercase">Resilience Index</span>
            <div className="text-lg font-bold text-emerald-400 mt-1">{currentReport.resilienceScore}%</div>
          </div>
        </div>

        {/* Top Anomalies & Risky Assets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 font-mono text-xs">
            <span className="text-xs uppercase font-bold text-slate-200 block">Top Logged Anomalies:</span>
            <ul className="space-y-2 list-disc list-inside text-slate-300">
              {currentReport.topAnomalies.map((anom, idx) => (
                <li key={idx}>{anom}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-3 font-mono text-xs">
            <span className="text-xs uppercase font-bold text-slate-200 block">Most Risky Network Assets:</span>
            <div className="space-y-2">
              {currentReport.mostRiskyDevices.map((dev) => (
                <div key={dev.ip} className="flex items-center justify-between p-2 bg-slate-900 rounded">
                  <span className="text-slate-200 font-bold">{dev.name} ({dev.ip})</span>
                  <span className="text-rose-400 font-bold">Risk {dev.riskScore}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-mono uppercase text-emerald-400 font-bold">Defensive Action Plan & Recommendations</h3>
          <div className="space-y-2 font-mono text-xs">
            {currentReport.recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-200 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
