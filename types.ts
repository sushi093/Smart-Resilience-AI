export type Severity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'NEW' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';

export type DeviceType = 'Firewall' | 'Router' | 'Core Switch' | 'Web Server' | 'Database' | 'Workstation' | 'Security Sensor' | 'IoT Device' | 'Gateway' | 'Loopback' | 'Host NIC';

export type DeviceStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'OFFLINE' | 'QUARANTINED';

export interface Device {
  id: string;
  name: string;
  ip: string;
  mac: string;
  type: DeviceType;
  status: DeviceStatus;
  riskScore: number;
  openAlerts: number;
  lastActivity: string;
  os?: string;
  subnet: string;
  bytesIn: number;
  bytesOut: number;
  cpuUsage: number;
  memUsage: number;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: DeviceType;
  ip: string;
  status: DeviceStatus;
  riskScore: number;
  alertsCount: number;
  layer: 'WAN' | 'DMZ' | 'CORE' | 'INTERNAL' | 'SECURE_ZONE';
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  label?: string;
  trafficRate: string;
  status: 'ACTIVE' | 'DEGRADED' | 'BLOCKED';
}

export interface Alert {
  id: string;
  timestamp: string;
  threatType: string;
  sourceIp: string;
  sourceDeviceName?: string;
  destIp: string;
  destDeviceName?: string;
  protocol: string;
  severity: Severity;
  mlConfidence: number;
  status: AlertStatus;
  reason: string;
  recommendedAction: string;
  anomalyScore: number;
  category: 'PORT_SCAN' | 'BRUTE_FORCE' | 'EXFILTRATION' | 'TRAFFIC_SPIKE' | 'UNAUTHORIZED_ACCESS' | 'PROTOCOL_ANOMALY' | 'ZERO_DAY';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  sourceIp: string;
  destIp: string;
  eventType: string;
  protocol: string;
  severity: Severity;
  action: 'PASSED' | 'BLOCKED' | 'FLAGGED' | 'QUARANTINED';
  status: string;
  port?: number;
  details?: string;
}

export interface Packet {
  id: string;
  timestamp: string;
  source: string;
  destination: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTP' | 'HTTPS' | 'ARP';
  length: number;
  flags: string;
  risk: Severity;
  payloadPreview: string;
  srcPort: number;
  dstPort: number;
  ttl: number;
  hexDump?: string;
  isAnomaly?: boolean;
}

export interface AnomalyPrediction {
  sourceIp: string;
  destIp: string;
  srcPort: number;
  dstPort: number;
  protocol: string;
  packetCount: number;
  byteCount: number;
  durationMs: number;
  failedConnCount: number;
  reqFrequency: number;
  trafficRateMbps: number;
  anomalyScore: number; // 0.0 to 1.0
  classification: 'Normal' | 'Suspicious' | 'Malicious' | 'Unknown Anomaly';
  riskLevel: Severity;
  confidence: number; // e.g. 94%
  reason: string;
  recommendedAction: string;
  topFeatures: { name: string; impact: number }[];
}

export interface SecurityRisk {
  overallScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threatSeverityContribution: number;
  anomalyScoreContribution: number;
  assetCriticalityContribution: number;
  eventFrequencyContribution: number;
  historicalEventContribution: number;
  resilienceScore: {
    overall: number;
    detectionCapability: number;
    responseReadiness: number;
    networkVisibility: number;
    recoveryReadiness: number;
  };
}

export interface ProtocolIssue {
  id: string;
  protocol: 'TCP' | 'IP' | 'ARP' | 'DNS';
  title: string;
  issue: string;
  severity: Severity;
  affectedDevice: string;
  evidence: string;
  recommendedMitigation: string;
}

export interface SystemInterfaceStats {
  name: string;
  ip: string;
  mac: string;
  netmask: string;
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxErrs: number;
  txErrs: number;
}

export interface RealNetworkSnapshot {
  timestamp: string;
  isRealData: boolean;
  activeInterfacesCount: number;
  interfaces: SystemInterfaceStats[];
  totalRxBytes: number;
  totalTxBytes: number;
  totalRxPackets: number;
  totalTxPackets: number;
  inboundMbps: number;
  outboundMbps: number;
  packetsPerSecond: number;
  latencyMs: number;
  dnsLookupMs: number;
  activeSocketsCount: number;
  listeningPorts: number[];
}

export interface TrafficTrendData {
  time: string;
  inboundMbps: number;
  outboundMbps: number;
  totalPackets: number;
  latencyMs: number;
}

export interface AlertHistoryData {
  time: string;
  portScan: number;
  bruteForce: number;
  exfiltration: number;
  synFlood: number;
  unauthorized: number;
  totalAlerts: number;
}

export interface AlertStatusData {
  status: string;
  count: number;
  color: string;
}

export interface DashboardSummary {
  networkStatus: 'SECURE' | 'WARNING' | 'CRITICAL';
  activeDevices: number;
  packetsAnalyzed: number;
  threatsDetected: number;
  criticalAlerts: number;
  anomaliesDetected: number;
  resilienceScore: number;
  overallRiskScore: number;
  demoMode: boolean;
  threatsOverTime: { time: string; threats: number; anomalies: number }[];
  severityDistribution: { name: string; value: number; color: string }[];
  protocolDistribution: { name: string; percentage: number }[];
  topSourceIps: { ip: string; deviceName: string; eventCount: number; risk: Severity }[];
  trafficTrends?: TrafficTrendData[];
  alertHistory?: AlertHistoryData[];
  alertStatusBreakdown?: AlertStatusData[];
}

export interface Report {
  id: string;
  title: string;
  generatedAt: string;
  period: string;
  summaryText: string;
  totalEvents: number;
  threatsCount: number;
  criticalAlertsCount: number;
  topAnomalies: string[];
  mostRiskyDevices: { name: string; ip: string; riskScore: number }[];
  resilienceScore: number;
  recommendations: string[];
}

export interface SystemSettings {
  demoMode: boolean;
  portScanThreshold: number;
  bruteForceThreshold: number;
  trafficSpikeMultiplier: number;
  anomalySensitivity: number; // 0.05 to 0.3
  autoBlockCritical: boolean;
  simulatedAttackRate: 'LOW' | 'MEDIUM' | 'HIGH' | 'OFF';
  retentionDays: number;
}

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  recommendations?: string[];
  suggestedCommands?: string[];
}
