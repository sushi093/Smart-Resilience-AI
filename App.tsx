import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { NetworkTopology } from './components/NetworkTopology';
import { IDSDetectionView } from './components/IDSDetectionView';
import { MLAnomalyView } from './components/MLAnomalyView';
import { TelemetryMonitoring } from './components/TelemetryMonitoring';
import { SIEMLogsView } from './components/SIEMLogsView';
import { PacketAnalysisView } from './components/PacketAnalysisView';
import { ProtocolSecurityView } from './components/ProtocolSecurityView';
import { RiskEngineView } from './components/RiskEngineView';
import { AlertsCenterView } from './components/AlertsCenterView';
import { DeviceRiskView } from './components/DeviceRiskView';
import { AIAssistantView } from './components/AIAssistantView';
import { ReportsView } from './components/ReportsView';

import { api } from './services/api';
import {
  DashboardSummary,
  NetworkNode,
  NetworkLink,
  Alert,
  LogEntry,
  Packet,
  ProtocolIssue,
  Device,
  SecurityRisk,
  Report,
  AssistantMessage,
  AlertStatus,
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [demoMode, setDemoMode] = useState<boolean>(true);

  // Core Application Telemetry State
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [issues, setIssues] = useState<ProtocolIssue[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [risk, setRisk] = useState<SecurityRisk | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [aiMessages, setAiMessages] = useState<AssistantMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Greetings Analyst. Smart Resilience AI SOC Engine is operational. How may I assist with incident triage, log forensics, or protocol vulnerability analysis today?',
      timestamp: new Date().toLocaleTimeString(),
      suggestedCommands: [
        'iptables -A INPUT -s 185.220.101.4 -j DROP',
        'tcpdump -i eth0 -n "tcp[tcpflags] & (tcp-syn) != 0"',
      ],
    },
  ]);

  // Initial Data Fetch
  const loadInitialData = useCallback(async () => {
    try {
      const [
        dashRes,
        topoRes,
        alertsRes,
        logsRes,
        pktsRes,
        issuesRes,
        devsRes,
        riskRes,
        repRes,
      ] = await Promise.all([
        api.getDashboard(),
        api.getTopology(),
        api.getAlerts(),
        api.getSIEMLogs(),
        api.getPackets(),
        api.getProtocolIssues(),
        api.getDevices(),
        api.getSecurityRisk(),
        api.getReports(),
      ]);

      setDashboardData(dashRes);
      setNodes(topoRes.nodes);
      setLinks(topoRes.links);
      setAlerts(alertsRes);
      setLogs(logsRes);
      setPackets(pktsRes);
      setIssues(issuesRes);
      setDevices(devsRes);
      setRisk(riskRes);
      setReports(repRes);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Real-time Polling Interval when Demo Mode is active
  useEffect(() => {
    if (!demoMode) return;

    const interval = setInterval(async () => {
      try {
        const [dashRes, alertsRes, logsRes, pktsRes] = await Promise.all([
          api.getDashboard(),
          api.getAlerts(),
          api.getSIEMLogs(),
          api.getPackets(),
        ]);
        setDashboardData(dashRes);
        setAlerts(alertsRes);
        setLogs(logsRes);
        setPackets(pktsRes);
      } catch (e) {
        // quiet catch
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [demoMode]);

  // Handler: Toggle Demo Mode
  const handleToggleDemoMode = async () => {
    try {
      const updated = await api.toggleDemoMode(!demoMode);
      setDemoMode(updated.demoMode);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Simulate Attack
  const handleSimulateAttack = async (attackType: 'PORT_SCAN' | 'SYN_FLOOD' | 'EXFILTRATION') => {
    try {
      const result = await api.simulateAttack(attackType);
      await loadInitialData();
      alert(`[DEMO MODE] Triggered ${attackType} Attack Simulation: ${result.message}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Quarantine Device
  const handleQuarantineDevice = async (id: string) => {
    try {
      const updatedDevice = await api.quarantineDevice(id);
      setDevices((prev) => prev.map((d) => (d.id === id ? updatedDevice : d)));
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: updatedDevice.status as any } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Update Alert Status
  const handleUpdateAlertStatus = async (id: string, status: AlertStatus) => {
    try {
      const updated = await api.updateAlertStatus(id, status);
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Custom IDS Analysis
  const handleAnalyzeIDS = async (data: any) => {
    try {
      const alertCreated = await api.analyzeIDS(data);
      if (alertCreated) {
        setAlerts((prev) => [alertCreated, ...prev]);
        setActiveTab('alerts');
      } else {
        alert('Packet evaluated: No rule signatures violated.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: ML Predict Anomaly
  const handlePredictAnomaly = async (params: any) => {
    return await api.predictMLAnomaly(params);
  };

  // Handler: Search SIEM Logs
  const handleSearchLogs = async (query?: string, severity?: string, protocol?: string, startDate?: string, endDate?: string) => {
    try {
      const filtered = await api.getSIEMLogs(query, severity, protocol, startDate, endDate);
      setLogs(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Send AI Message
  const handleSendAIMessage = async (prompt: string) => {
    const userMsg: AssistantMessage = {
      id: `m-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString(),
    };
    setAiMessages((prev) => [...prev, userMsg]);

    try {
      const res = await api.askAIAssistant(prompt, { alerts, dashboardData });
      const aiMsg: AssistantMessage = {
        id: `m-ai-${Date.now()}`,
        sender: 'assistant',
        text: res.text,
        timestamp: new Date().toLocaleTimeString(),
        suggestedCommands: res.suggestedCommands,
      };
      setAiMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: AssistantMessage = {
        id: `m-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Error processing query with Gemini server SDK. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setAiMessages((prev) => [...prev, errorMsg]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-tech-grid text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top SOC Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        demoMode={demoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onSimulateAttack={handleSimulateAttack}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            data={dashboardData}
            onNavigateTab={setActiveTab}
            onSimulateAttack={handleSimulateAttack}
          />
        )}

        {activeTab === 'topology' && (
          <NetworkTopology
            nodes={nodes}
            links={links}
            onQuarantineDevice={handleQuarantineDevice}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'ids' && (
          <IDSDetectionView
            alerts={alerts}
            onAnalyzeIDS={handleAnalyzeIDS}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'ml-anomaly' && (
          <MLAnomalyView onPredictAnomaly={handlePredictAnomaly} />
        )}

        {activeTab === 'telemetry' && <TelemetryMonitoring />}

        {activeTab === 'siem-logs' && (
          <SIEMLogsView
            logs={logs}
            onSearchLogs={handleSearchLogs}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'packets' && <PacketAnalysisView packets={packets} />}

        {activeTab === 'protocol-security' && (
          <ProtocolSecurityView issues={issues} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'risk-engine' && (
          <RiskEngineView data={risk} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'alerts' && (
          <AlertsCenterView
            alerts={alerts}
            onUpdateAlertStatus={handleUpdateAlertStatus}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'devices' && (
          <DeviceRiskView devices={devices} onQuarantineDevice={handleQuarantineDevice} />
        )}

        {activeTab === 'ai-assistant' && (
          <AIAssistantView messages={aiMessages} onSendMessage={handleSendAIMessage} />
        )}

        {activeTab === 'reports' && <ReportsView reports={reports} />}
      </main>

      {/* Bottom Status Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-3 px-6 text-center text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img
            src="/src/assets/images/simple_resilience_logo_1786617819530.jpg"
            alt="Smart Resilience Logo"
            referrerPolicy="no-referrer"
            className="w-4 h-4 rounded object-cover border border-cyan-800/80"
          />
          <span className="text-slate-300 font-bold">Smart Resilience AI v3.2 Enterprise Edition</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Status: SOC AGENT ONLINE | KERNEL INTERFACE LIVE</span>
        </div>
      </footer>
    </div>
  );
}
export default App;
