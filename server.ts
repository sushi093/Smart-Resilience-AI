import express from 'express';
import path from 'path';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import {
  Alert,
  AlertStatus,
  AnomalyPrediction,
  DashboardSummary,
  Device,
  LogEntry,
  NetworkLink,
  NetworkNode,
  Packet,
  ProtocolIssue,
  Report,
  SecurityRisk,
  Severity,
  SystemSettings,
} from './src/types.js';
import { getLatestRealNetworkSnapshot, sampleRealNetworkData } from './src/services/realNetworkEngine.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Express Middleware: Real Network Packet Interceptor
app.use((req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/' || req.path.endsWith('.html')) {
    const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const clientIp = rawIp.split(',')[0].trim().replace(/^::ffff:/, '');
    const remotePort = req.socket.remotePort || Math.floor(Math.random() * 40000) + 10000;
    const bodyLength = parseInt((req.headers['content-length'] as string) || '0', 10);
    const pktLength = bodyLength > 0 ? bodyLength + 150 : req.url.length + 180;

    const realPacket: Packet = {
      id: `real-pkt-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      source: `${clientIp}:${remotePort}`,
      destination: `10.0.0.1:3000`,
      protocol: (req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'HTTPS' : 'TCP') as any,
      length: pktLength,
      flags: 'ACK, PSH',
      risk: 'INFO',
      payloadPreview: `[REAL TRAFFIC] ${req.method} ${req.path} (${req.headers['user-agent']?.slice(0, 30) || 'Client'})`,
      srcPort: remotePort,
      dstPort: 3000,
      ttl: 64,
      hexDump: Buffer.from(`${req.method} ${req.path}`).toString('hex').slice(0, 36),
      isAnomaly: false,
    };

    packets.unshift(realPacket);
    if (packets.length > 100) packets.pop();
  }
  next();
});

// Initialize Google GenAI client lazily or with safety fallback
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    try {
      genAIClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.error('Failed to initialize GoogleGenAI client:', e);
    }
  }
  return genAIClient;
}

// System State
let systemSettings: SystemSettings = {
  demoMode: true,
  portScanThreshold: 15,
  bruteForceThreshold: 10,
  trafficSpikeMultiplier: 2.5,
  anomalySensitivity: 0.15,
  autoBlockCritical: true,
  simulatedAttackRate: 'MEDIUM',
  retentionDays: 30,
};

// Seed Devices Data
let devices: Device[] = [
  {
    id: 'dev-1',
    name: 'Enterprise Edge Firewall',
    ip: '10.0.0.1',
    mac: '00:1A:2B:3C:4D:01',
    type: 'Firewall',
    status: 'HEALTHY',
    riskScore: 12,
    openAlerts: 0,
    lastActivity: 'Just now',
    os: 'PaloAlto PAN-OS 10.2',
    subnet: '10.0.0.0/24',
    bytesIn: 45209320,
    bytesOut: 38920110,
    cpuUsage: 28,
    memUsage: 42,
  },
  {
    id: 'dev-2',
    name: 'Core Perimeter Router',
    ip: '10.0.0.254',
    mac: '00:1A:2B:3C:4D:02',
    type: 'Router',
    status: 'HEALTHY',
    riskScore: 15,
    openAlerts: 0,
    lastActivity: '1 min ago',
    os: 'Cisco IOS-XE 17.6',
    subnet: '10.0.0.0/24',
    bytesIn: 89012300,
    bytesOut: 76543100,
    cpuUsage: 35,
    memUsage: 51,
  },
  {
    id: 'dev-3',
    name: 'Main L3 Switch',
    ip: '10.0.0.2',
    mac: '00:1A:2B:3C:4D:03',
    type: 'Core Switch',
    status: 'HEALTHY',
    riskScore: 8,
    openAlerts: 0,
    lastActivity: 'Just now',
    os: 'Arista EOS 4.28',
    subnet: '10.0.0.0/24',
    bytesIn: 124500000,
    bytesOut: 118900000,
    cpuUsage: 19,
    memUsage: 38,
  },
  {
    id: 'dev-4',
    name: 'Primary Web Server Cluster',
    ip: '10.0.0.10',
    mac: '02:42:AC:11:00:02',
    type: 'Web Server',
    status: 'CRITICAL',
    riskScore: 88,
    openAlerts: 8,
    lastActivity: 'Just now',
    os: 'Ubuntu 22.04 LTS / Nginx 1.24',
    subnet: '10.0.0.0/24 (DMZ)',
    bytesIn: 18920100,
    bytesOut: 5210900,
    cpuUsage: 89,
    memUsage: 78,
  },
  {
    id: 'dev-5',
    name: 'PostgreSQL DB Primary',
    ip: '10.0.0.20',
    mac: '02:42:AC:11:00:03',
    type: 'Database',
    status: 'WARNING',
    riskScore: 62,
    openAlerts: 3,
    lastActivity: '2 mins ago',
    os: 'Debian 12 / PostgreSQL 16',
    subnet: '10.0.10.0/24 (Secure)',
    bytesIn: 8901200,
    bytesOut: 14209100,
    cpuUsage: 64,
    memUsage: 82,
  },
  {
    id: 'dev-6',
    name: 'Finance Workstation PC-01',
    ip: '192.168.1.25',
    mac: '70:85:C2:A1:B2:C3',
    type: 'Workstation',
    status: 'CRITICAL',
    riskScore: 82,
    openAlerts: 4,
    lastActivity: 'Just now',
    os: 'Windows 11 Enterprise',
    subnet: '192.168.1.0/24',
    bytesIn: 12091000,
    bytesOut: 45091200,
    cpuUsage: 71,
    memUsage: 65,
  },
  {
    id: 'dev-7',
    name: 'Dev Workstation PC-02',
    ip: '192.168.1.45',
    mac: '70:85:C2:A1:B2:C4',
    type: 'Workstation',
    status: 'WARNING',
    riskScore: 54,
    openAlerts: 2,
    lastActivity: '4 mins ago',
    os: 'Ubuntu 24.04 Desktop',
    subnet: '192.168.1.0/24',
    bytesIn: 3201000,
    bytesOut: 8910200,
    cpuUsage: 45,
    memUsage: 55,
  },
  {
    id: 'dev-8',
    name: 'SOC Smart IDS Sensor',
    ip: '10.0.0.5',
    mac: '00:1A:2B:3C:4D:05',
    type: 'Security Sensor',
    status: 'HEALTHY',
    riskScore: 5,
    openAlerts: 0,
    lastActivity: 'Just now',
    os: 'Suricata / Security Onion',
    subnet: '10.0.0.0/24',
    bytesIn: 98012300,
    bytesOut: 1200000,
    cpuUsage: 31,
    memUsage: 48,
  },
];

// Seed Alerts Data
let alerts: Alert[] = [
  {
    id: 'ALT-801',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    threatType: 'SYN Flood / TCP Anomaly',
    sourceIp: '185.220.101.4',
    sourceDeviceName: 'External Host (WAN)',
    destIp: '10.0.0.10',
    destDeviceName: 'Primary Web Server Cluster',
    protocol: 'TCP',
    severity: 'CRITICAL',
    mlConfidence: 96,
    status: 'NEW',
    reason: 'Abnormal rate of incomplete 3-way TCP handshakes (SYN with no ACK) exceeding baseline by 450%.',
    recommendedAction: 'Apply rate limiting on Edge Firewall or drop IP 185.220.101.4 via SYN proxy rules.',
    anomalyScore: 0.94,
    category: 'TRAFFIC_SPIKE',
  },
  {
    id: 'ALT-802',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    threatType: 'Rapid Horizontal Port Scan',
    sourceIp: '192.168.1.45',
    sourceDeviceName: 'Dev Workstation PC-02',
    destIp: '10.0.0.20',
    destDeviceName: 'PostgreSQL DB Primary',
    protocol: 'TCP',
    severity: 'HIGH',
    mlConfidence: 91,
    status: 'INVESTIGATING',
    reason: 'Connection attempts across 142 distinct TCP ports within 10 seconds detected by IDS engine.',
    recommendedAction: 'Inspect Workstation 192.168.1.45 for unauthorized nmap or recon processes.',
    anomalyScore: 0.88,
    category: 'PORT_SCAN',
  },
  {
    id: 'ALT-803',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    threatType: 'SSH Brute Force Attempt',
    sourceIp: '192.168.1.25',
    sourceDeviceName: 'Finance Workstation PC-01',
    destIp: '10.0.0.10',
    destDeviceName: 'Primary Web Server Cluster',
    protocol: 'TCP (22)',
    severity: 'HIGH',
    mlConfidence: 94,
    status: 'NEW',
    reason: '28 failed SSH authentication attempts within 45 seconds using invalid usernames.',
    recommendedAction: 'Enforce Fail2ban jail on Web Server and temporarily quarantine IP 192.168.1.25.',
    anomalyScore: 0.89,
    category: 'BRUTE_FORCE',
  },
  {
    id: 'ALT-804',
    timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
    threatType: 'Potential Data Exfiltration',
    sourceIp: '192.168.1.25',
    sourceDeviceName: 'Finance Workstation PC-01',
    destIp: '45.33.32.156',
    destDeviceName: 'Unknown External Storage IP',
    protocol: 'HTTPS (443)',
    severity: 'CRITICAL',
    mlConfidence: 93,
    status: 'NEW',
    reason: 'Outbound upload volume exceeded 4.2 GB in 12 minutes to an unclassified external IP.',
    recommendedAction: 'Isolate Workstation 192.168.1.25 immediately and conduct memory dump inspection.',
    anomalyScore: 0.95,
    category: 'EXFILTRATION',
  },
  {
    id: 'ALT-805',
    timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
    threatType: 'ARP Spoofing / Poisoning Indicator',
    sourceIp: '192.168.1.99',
    sourceDeviceName: 'Unregistered MAC Address',
    destIp: '10.0.0.254',
    destDeviceName: 'Core Perimeter Router',
    protocol: 'ARP',
    severity: 'MEDIUM',
    mlConfidence: 87,
    status: 'RESOLVED',
    reason: 'Multiple gratuitous ARP replies claiming Router IP 10.0.0.254 associated with MAC 70:85:C2:99:AA.',
    recommendedAction: 'Enable Dynamic ARP Inspection (DAI) and static IP-MAC bindings on L3 switches.',
    anomalyScore: 0.76,
    category: 'PROTOCOL_ANOMALY',
  },
  {
    id: 'ALT-806',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    threatType: 'DNS Tunneling Query Pattern',
    sourceIp: '10.0.0.10',
    sourceDeviceName: 'Primary Web Server Cluster',
    destIp: '8.8.8.8',
    destDeviceName: 'Google Public DNS',
    protocol: 'DNS (UDP 53)',
    severity: 'HIGH',
    mlConfidence: 89,
    status: 'FALSE_POSITIVE',
    reason: 'High entropy domain queries with long base64 encoded prefixes (e.g., x8f2a1z.c2server.top).',
    recommendedAction: 'Block rogue TXT/CNAME query patterns and inspect server processes for DNS malware.',
    anomalyScore: 0.81,
    category: 'ZERO_DAY',
  },
];

// Seed Logs Data
let logs: LogEntry[] = [
  {
    id: 'log-1001',
    timestamp: new Date().toISOString(),
    sourceIp: '185.220.101.4',
    destIp: '10.0.0.10',
    eventType: 'TCP SYN Flood Packet Batch',
    protocol: 'TCP',
    severity: 'CRITICAL',
    action: 'BLOCKED',
    status: 'Blocked by Edge Firewall Rule #104',
    port: 80,
    details: 'SYN packet burst rate = 8,400 pps (Threshold: 1,500 pps)',
  },
  {
    id: 'log-1002',
    timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
    sourceIp: '192.168.1.45',
    destIp: '10.0.0.20',
    eventType: 'TCP Port Sweep (Ports 20-1024)',
    protocol: 'TCP',
    severity: 'HIGH',
    action: 'FLAGGED',
    status: 'Logged by Suricata IDS',
    port: 5432,
    details: 'Probed ports: 21, 22, 80, 443, 3306, 5432, 8080 in 800ms',
  },
  {
    id: 'log-1003',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    sourceIp: '192.168.1.25',
    destIp: '10.0.0.10',
    eventType: 'SSH Failed Login Attempt',
    protocol: 'TCP',
    severity: 'HIGH',
    action: 'FLAGGED',
    status: 'PAM Authentication Failure',
    port: 22,
    details: 'User: admin_root, IP: 192.168.1.25, Attempt 28/30',
  },
  {
    id: 'log-1004',
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    sourceIp: '10.0.0.10',
    destIp: '10.0.0.20',
    eventType: 'Database SQL Query Batch',
    protocol: 'TCP',
    severity: 'INFO',
    action: 'PASSED',
    status: 'Authorized TLS Session',
    port: 5432,
    details: 'SELECT * FROM client_accounts WHERE status = active',
  },
  {
    id: 'log-1005',
    timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
    sourceIp: '192.168.1.25',
    destIp: '45.33.32.156',
    eventType: 'High Volume Outbound Transfer',
    protocol: 'HTTPS',
    severity: 'CRITICAL',
    action: 'FLAGGED',
    status: 'Under Investigation',
    port: 443,
    details: 'Transferred 4,210 MB encrypted payload to non-whitelisted ASN',
  },
  {
    id: 'log-1006',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    sourceIp: '10.0.0.1',
    destIp: '10.0.0.2',
    eventType: 'OSPF Router Hello Packet',
    protocol: 'ICMP',
    severity: 'INFO',
    action: 'PASSED',
    status: 'Normal Core Network Operation',
    port: 0,
    details: 'OSPF adjacency verify success',
  },
  {
    id: 'log-1007',
    timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
    sourceIp: '10.0.0.10',
    destIp: '8.8.8.8',
    eventType: 'DNS Anomaly Query Pattern',
    protocol: 'DNS',
    severity: 'MEDIUM',
    action: 'FLAGGED',
    status: 'Anomalous Query Entropy',
    port: 53,
    details: 'Query TXT prefix length > 120 chars: a9f3.exfil.domain.com',
  },
  {
    id: 'log-1008',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    sourceIp: '192.168.1.100',
    destIp: '10.0.0.1',
    eventType: 'HTTPS Management Login Success',
    protocol: 'HTTPS',
    severity: 'LOW',
    action: 'PASSED',
    status: 'MFA Verified Admin Session',
    port: 443,
    details: 'Admin user sushmeth logged in from trusted subnet',
  },
];

// Seed Packets Data
let packets: Packet[] = [
  {
    id: 'pkt-9001',
    timestamp: new Date().toISOString(),
    source: '185.220.101.4:49152',
    destination: '10.0.0.10:80',
    protocol: 'TCP',
    length: 64,
    flags: 'SYN',
    risk: 'CRITICAL',
    payloadPreview: '[SYN] Seq=142091002 Win=65535 MSS=1460 SACK_PERM',
    srcPort: 49152,
    dstPort: 80,
    ttl: 48,
    hexDump: '45 00 00 40 1c 2f 40 00 30 06 b2 e1 b9 dc 65 04 0a 00 00 0a c0 00 00 50 08 7b 12 3a 00 00 00 00 80 02 ff ff c3 2d 00 00',
    isAnomaly: true,
  },
  {
    id: 'pkt-9002',
    timestamp: new Date(Date.now() - 500).toISOString(),
    source: '192.168.1.45:51200',
    destination: '10.0.0.20:5432',
    protocol: 'TCP',
    length: 54,
    flags: 'SYN',
    risk: 'HIGH',
    payloadPreview: '[SYN] Seq=89012301 Win=1024 Port Probe',
    srcPort: 51200,
    dstPort: 5432,
    ttl: 64,
    hexDump: '45 00 00 36 2a 12 40 00 40 06 8a 10 c0 a8 01 2d 0a 00 00 14 c8 00 15 38 05 4e 31 0d 00 00 00 00 80 02 04 00 a2 11 00 00',
    isAnomaly: true,
  },
  {
    id: 'pkt-9003',
    timestamp: new Date(Date.now() - 1200).toISOString(),
    source: '10.0.0.10:443',
    destination: '192.168.1.25:58912',
    protocol: 'HTTPS',
    length: 1420,
    flags: 'ACK, PSH',
    risk: 'LOW',
    payloadPreview: 'TLSv1.3 Application Data [Encrypted Record Payload]',
    srcPort: 443,
    dstPort: 58912,
    ttl: 62,
    hexDump: '17 03 03 05 80 00 00 00 00 00 00 00 01 a1 b2 c3 d4 e5 f6 a7 b8 c9 d0 e1 f2 a3 b4 c5 d6 e7 f8 a9 b0 c1 d2 e3 f4 a5 b6 c7 d8',
    isAnomaly: false,
  },
  {
    id: 'pkt-9004',
    timestamp: new Date(Date.now() - 2500).toISOString(),
    source: '10.0.0.10:53',
    destination: '8.8.8.8:53',
    protocol: 'DNS',
    length: 188,
    flags: 'UDP',
    risk: 'HIGH',
    payloadPreview: 'Query: TXT z8a1b2c3d4e5.command-control.sub.org',
    srcPort: 53,
    dstPort: 53,
    ttl: 58,
    hexDump: '00 00 01 00 00 01 00 00 00 00 00 00 18 7a 38 61 31 32 63 33 64 34 35 0f 63 6f 6d 6d 61 6e 64 2d 63 6f 6e 74 72 6f 6c 00 00 10 00 01',
    isAnomaly: true,
  },
  {
    id: 'pkt-9005',
    timestamp: new Date(Date.now() - 4000).toISOString(),
    source: '192.168.1.99',
    destination: 'FF:FF:FF:FF:FF:FF',
    protocol: 'ARP',
    length: 42,
    flags: 'REPLY',
    risk: 'MEDIUM',
    payloadPreview: 'Gratuitous ARP: 10.0.0.254 is at 70:85:C2:99:AA',
    srcPort: 0,
    dstPort: 0,
    ttl: 0,
    hexDump: '00 01 08 00 06 04 00 02 70 85 c2 99 aa 0a 00 00 fe ff ff ff ff ff ff 0a 00 00 fe',
    isAnomaly: true,
  },
];

// Seed Protocol Issues
let protocolIssues: ProtocolIssue[] = [
  {
    id: 'iss-1',
    protocol: 'TCP',
    title: 'SYN Flood / Half-Open Connection Saturation',
    issue: 'High volume of TCP SYN packets received without completing 3-way handshake.',
    severity: 'CRITICAL',
    affectedDevice: 'Primary Web Server Cluster (10.0.0.10)',
    evidence: 'Incomplete handshake ratio = 89.4% over 5-minute sampling window.',
    recommendedMitigation: 'Enable TCP SYN Cookies on host OS (sysctl -w net.ipv4.tcp_syncookies=1) and activate edge SYN proxy.',
  },
  {
    id: 'iss-2',
    protocol: 'ARP',
    title: 'Duplicate IP / Gratuitous ARP Poisoning Risk',
    issue: 'Unsolicited ARP announcements modifying switch MAC binding tables.',
    severity: 'MEDIUM',
    affectedDevice: 'Core Perimeter Router (10.0.0.254)',
    evidence: 'MAC 70:85:C2:99:AA claiming 10.0.0.254 which conflicts with router default hardware MAC.',
    recommendedMitigation: 'Enable Dynamic ARP Inspection (DAI) on switch access ports and assign static gateway bindings.',
  },
  {
    id: 'iss-3',
    protocol: 'DNS',
    title: 'High-Entropy DNS Exfiltration Vector',
    issue: 'Outbound DNS queries containing structured base64 payloads to suspicious TLDs.',
    severity: 'HIGH',
    affectedDevice: 'Primary Web Server Cluster (10.0.0.10)',
    evidence: '64 queries matching regex pattern ^[a-zA-Z0-9]{32,}\\.c2server\\.top.',
    recommendedMitigation: 'Configure DNS sinkhole, enforce internal recursive DNS server policy, and block external port 53 UDP/TCP.',
  },
  {
    id: 'iss-4',
    protocol: 'IP',
    title: 'Unusual Outbound IP Subnet Upload Spike',
    issue: 'Excessive data transfer to unrated public IP addresses without prior TLS handshake certificates.',
    severity: 'CRITICAL',
    affectedDevice: 'Finance Workstation PC-01 (192.168.1.25)',
    evidence: '4.21 GB transferred over single HTTPS socket to ASN 20473 within 12 minutes.',
    recommendedMitigation: 'Apply egress filtering firewall rules restricting workstation traffic to authenticated cloud endpoints.',
  },
];

// Helper: Calculate Risk & Resilience
function calculateSecurityMetrics(): SecurityRisk {
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED' && a.status !== 'FALSE_POSITIVE').length;
  const highCount = alerts.filter((a) => a.severity === 'HIGH' && a.status !== 'RESOLVED' && a.status !== 'FALSE_POSITIVE').length;
  const mediumCount = alerts.filter((a) => a.severity === 'MEDIUM' && a.status !== 'RESOLVED' && a.status !== 'FALSE_POSITIVE').length;

  const threatSeverityContrib = Math.min(40, criticalCount * 12 + highCount * 6 + mediumCount * 2);
  const anomalyContrib = Math.min(25, alerts.length * 2.5);
  const assetContrib = 18; // Critical assets under alert
  const eventFreqContrib = 12;
  const historicalContrib = 3;

  const totalScore = Math.min(100, Math.round(threatSeverityContrib + anomalyContrib + assetContrib + eventFreqContrib + historicalContrib));

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (totalScore > 80) riskLevel = 'CRITICAL';
  else if (totalScore > 60) riskLevel = 'HIGH';
  else if (totalScore > 30) riskLevel = 'MEDIUM';

  const detectionCap = 92;
  const responseReady = Math.max(50, 95 - criticalCount * 6 - highCount * 3);
  const netVis = 90;
  const recoveryReady = Math.max(60, 88 - criticalCount * 4);

  const resilienceOverall = Math.round((detectionCap + responseReady + netVis + recoveryReady) / 4);

  return {
    overallScore: totalScore,
    riskLevel,
    threatSeverityContribution: threatSeverityContrib,
    anomalyScoreContribution: anomalyContrib,
    assetCriticalityContribution: assetContrib,
    eventFrequencyContribution: eventFreqContrib,
    historicalEventContribution: historicalContrib,
    resilienceScore: {
      overall: resilienceOverall,
      detectionCapability: detectionCap,
      responseReadiness: responseReady,
      networkVisibility: netVis,
      recoveryReadiness: recoveryReady,
    },
  };
}

// Background Simulated Data Generator (When Demo Mode is Active)
setInterval(() => {
  if (!systemSettings.demoMode) return;

  const chance = Math.random();
  if (chance > 0.4) {
    // Generate a new log
    const sampleIps = ['192.168.1.25', '192.168.1.45', '10.0.0.10', '185.220.101.4', '45.33.32.156', '10.0.0.20'];
    const srcIp = sampleIps[Math.floor(Math.random() * sampleIps.length)];
    const dstIp = sampleIps[Math.floor(Math.random() * sampleIps.length)];
    const protocols = ['TCP', 'UDP', 'ICMP', 'HTTPS', 'DNS'];
    const proto = protocols[Math.floor(Math.random() * protocols.length)];

    const isAnomaly = Math.random() < systemSettings.anomalySensitivity * 2;
    const severity: Severity = isAnomaly ? (Math.random() > 0.6 ? 'HIGH' : 'CRITICAL') : 'INFO';

    const newLog: LogEntry = {
      id: `log-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      sourceIp: srcIp,
      destIp: dstIp,
      eventType: isAnomaly ? 'Anomalous Connection Request' : 'Standard Network Session',
      protocol: proto,
      severity: severity,
      action: isAnomaly ? 'FLAGGED' : 'PASSED',
      status: isAnomaly ? 'Automated Anomaly Tag' : 'Session Completed',
      port: Math.floor(Math.random() * 60000) + 1024,
      details: isAnomaly ? 'High byte ratio per connection interval detected by ML model' : 'Normal packet handshake verified',
    };

    logs.unshift(newLog);
    if (logs.length > 100) logs.pop();

    // Generate packet
    const newPacket: Packet = {
      id: `pkt-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      source: `${srcIp}:${Math.floor(Math.random() * 50000) + 1024}`,
      destination: `${dstIp}:443`,
      protocol: proto as any,
      length: Math.floor(Math.random() * 1200) + 64,
      flags: proto === 'TCP' ? (isAnomaly ? 'SYN, FIN' : 'ACK, PSH') : 'DATA',
      risk: severity,
      payloadPreview: isAnomaly ? '[Suspicious Header Flags] Length mismatch' : '[TLS Handshake] Key Exchange Record',
      srcPort: Math.floor(Math.random() * 50000) + 1024,
      dstPort: 443,
      ttl: 64,
      hexDump: '45 00 00 3c 1a 2b 40 00 40 06 7c 8a c0 a8 01 19 0a 00 00 0a 01 bb 00',
      isAnomaly,
    };
    packets.unshift(newPacket);
    if (packets.length > 80) packets.pop();
  }
}, 4000);

// API ROUTES
app.get('/api/network/real-stats', (req, res) => {
  const snapshot = getLatestRealNetworkSnapshot();
  res.json(snapshot);
});

app.get('/api/dashboard', (req, res) => {
  const realSnap = getLatestRealNetworkSnapshot();
  const metrics = calculateSecurityMetrics();
  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length;
  const threatsCount = alerts.filter((a) => a.status !== 'RESOLVED' && a.status !== 'FALSE_POSITIVE').length;
  const anomaliesCount = alerts.filter((a) => a.anomalyScore > 0.7).length;

  let netStatus: 'SECURE' | 'WARNING' | 'CRITICAL' = 'SECURE';
  if (metrics.overallScore > 75) netStatus = 'CRITICAL';
  else if (metrics.overallScore > 40) netStatus = 'WARNING';

  // Use real interface byte counts + packet buffer length
  const realPacketsTotal = realSnap.totalRxPackets + realSnap.totalTxPackets + packets.length;

  const dashboard: DashboardSummary = {
    networkStatus: netStatus,
    activeDevices: devices.filter((d) => d.status !== 'OFFLINE').length,
    packetsAnalyzed: realPacketsTotal > 0 ? realPacketsTotal : 1284500 + packets.length * 15,
    threatsDetected: threatsCount,
    criticalAlerts: criticalCount,
    anomaliesDetected: anomaliesCount,
    resilienceScore: metrics.resilienceScore.overall,
    overallRiskScore: metrics.overallScore,
    demoMode: systemSettings.demoMode,
    threatsOverTime: [
      { time: '00:00', threats: 2, anomalies: 1 },
      { time: '04:00', threats: 1, anomalies: 0 },
      { time: '08:00', threats: 5, anomalies: 2 },
      { time: '12:00', threats: 12, anomalies: 4 },
      { time: '16:00', threats: 18, anomalies: 8 },
      { time: '20:00', threats: 24, anomalies: 12 },
      { time: 'Now', threats: threatsCount, anomalies: anomaliesCount },
    ],
    severityDistribution: [
      { name: 'CRITICAL', value: alerts.filter((a) => a.severity === 'CRITICAL').length, color: '#ef4444' },
      { name: 'HIGH', value: alerts.filter((a) => a.severity === 'HIGH').length, color: '#f97316' },
      { name: 'MEDIUM', value: alerts.filter((a) => a.severity === 'MEDIUM').length, color: '#eab308' },
      { name: 'LOW', value: alerts.filter((a) => a.severity === 'LOW').length, color: '#3b82f6' },
      { name: 'INFO', value: 8, color: '#10b981' },
    ],
    protocolDistribution: [
      { name: 'TCP', percentage: 54 },
      { name: 'HTTPS', percentage: 22 },
      { name: 'UDP', percentage: 12 },
      { name: 'DNS', percentage: 8 },
      { name: 'ARP/ICMP', percentage: 4 },
    ],
    topSourceIps: [
      { ip: '185.220.101.4', deviceName: 'External Host (WAN)', eventCount: 142, risk: 'CRITICAL' },
      { ip: '192.168.1.25', deviceName: 'Finance Workstation PC-01', eventCount: 88, risk: 'CRITICAL' },
      { ip: '192.168.1.45', deviceName: 'Dev Workstation PC-02', eventCount: 45, risk: 'HIGH' },
      { ip: '10.0.0.10', deviceName: 'Primary Web Server Cluster', eventCount: 29, risk: 'MEDIUM' },
    ],
    trafficTrends: [
      { time: '00:00', inboundMbps: 180, outboundMbps: 110, totalPackets: 24000, latencyMs: 12 },
      { time: '04:00', inboundMbps: 120, outboundMbps: 75, totalPackets: 18000, latencyMs: 10 },
      { time: '08:00', inboundMbps: 350, outboundMbps: 220, totalPackets: 45000, latencyMs: 15 },
      { time: '12:00', inboundMbps: 680, outboundMbps: 410, totalPackets: 82000, latencyMs: 24 },
      { time: '16:00', inboundMbps: 890, outboundMbps: 540, totalPackets: 115000, latencyMs: 38 },
      { time: '20:00', inboundMbps: 520, outboundMbps: 310, totalPackets: 68000, latencyMs: 18 },
      {
        time: 'Now (Real Interface)',
        inboundMbps: Math.max(0.01, realSnap.inboundMbps),
        outboundMbps: Math.max(0.01, realSnap.outboundMbps),
        totalPackets: realSnap.packetsPerSecond,
        latencyMs: realSnap.latencyMs,
      },
    ],
    alertHistory: [
      { time: '00:00', portScan: 1, bruteForce: 0, exfiltration: 0, synFlood: 0, unauthorized: 1, totalAlerts: 2 },
      { time: '04:00', portScan: 0, bruteForce: 1, exfiltration: 0, synFlood: 0, unauthorized: 0, totalAlerts: 1 },
      { time: '08:00', portScan: 3, bruteForce: 2, exfiltration: 0, synFlood: 1, unauthorized: 1, totalAlerts: 7 },
      { time: '12:00', portScan: 6, bruteForce: 4, exfiltration: 1, synFlood: 3, unauthorized: 2, totalAlerts: 16 },
      { time: '16:00', portScan: 8, bruteForce: 6, exfiltration: 3, synFlood: 8, unauthorized: 4, totalAlerts: 29 },
      { time: '20:00', portScan: 12, bruteForce: 7, exfiltration: 4, synFlood: 10, unauthorized: 3, totalAlerts: 36 },
      { time: 'Now', portScan: alerts.filter(a => a.category === 'PORT_SCAN').length, bruteForce: alerts.filter(a => a.category === 'BRUTE_FORCE').length, exfiltration: alerts.filter(a => a.category === 'EXFILTRATION').length, synFlood: alerts.filter(a => a.category === 'TRAFFIC_SPIKE').length, unauthorized: alerts.filter(a => a.category === 'UNAUTHORIZED_ACCESS').length, totalAlerts: alerts.length },
    ],
    alertStatusBreakdown: [
      { status: 'NEW', count: alerts.filter((a) => a.status === 'NEW').length, color: '#f43f5e' },
      { status: 'INVESTIGATING', count: alerts.filter((a) => a.status === 'INVESTIGATING').length, color: '#f59e0b' },
      { status: 'RESOLVED', count: alerts.filter((a) => a.status === 'RESOLVED').length, color: '#10b981' },
      { status: 'FALSE_POSITIVE', count: alerts.filter((a) => a.status === 'FALSE_POSITIVE').length, color: '#64748b' },
    ],
  };

  res.json(dashboard);
});

app.get('/api/devices', (req, res) => {
  const realSnap = getLatestRealNetworkSnapshot();
  const realInterfaceDevices: Device[] = realSnap.interfaces.map((iface, index) => ({
    id: `real-dev-${iface.name}`,
    name: `Container NIC (${iface.name}) [REAL]`,
    ip: iface.ip,
    mac: iface.mac,
    type: iface.name === 'lo' ? 'Loopback' : 'Host NIC',
    status: 'HEALTHY',
    riskScore: 5,
    openAlerts: 0,
    lastActivity: 'Active Now',
    os: `Linux Host Kernel (${os.platform()} ${os.arch()})`,
    subnet: `${iface.ip}/${iface.netmask}`,
    bytesIn: iface.rxBytes,
    bytesOut: iface.txBytes,
    cpuUsage: Math.round(os.loadavg()[0] * 10) || 12,
    memUsage: Math.round((1 - os.freemem() / os.totalmem()) * 100),
  }));

  res.json([...realInterfaceDevices, ...devices]);
});

app.post('/api/devices/:id/quarantine', (req, res) => {
  const { id } = req.params;
  const dev = devices.find((d) => d.id === id);
  if (!dev) return res.status(404).json({ error: 'Device not found' });

  dev.status = dev.status === 'QUARANTINED' ? 'HEALTHY' : 'QUARANTINED';
  if (dev.status === 'QUARANTINED') dev.riskScore = Math.max(10, dev.riskScore - 40);

  res.json({ message: `Device status changed to ${dev.status}`, device: dev });
});

app.get('/api/network/topology', (req, res) => {
  const nodes: NetworkNode[] = [
    { id: 'wan-1', label: 'Internet (WAN)', type: 'Gateway', ip: '0.0.0.0/0', status: 'HEALTHY', riskScore: 20, alertsCount: 1, layer: 'WAN', x: 100, y: 150 },
    { id: 'fw-1', label: 'Edge Firewall', type: 'Firewall', ip: '10.0.0.1', status: 'HEALTHY', riskScore: 12, alertsCount: 0, layer: 'DMZ', x: 300, y: 150 },
    { id: 'router-1', label: 'Core Router', type: 'Router', ip: '10.0.0.254', status: 'HEALTHY', riskScore: 15, alertsCount: 0, layer: 'CORE', x: 500, y: 150 },
    { id: 'switch-1', label: 'Main L3 Switch', type: 'Core Switch', ip: '10.0.0.2', status: 'HEALTHY', riskScore: 8, alertsCount: 0, layer: 'CORE', x: 700, y: 150 },
    { id: 'web-1', label: 'Web Server Cluster', type: 'Web Server', ip: '10.0.0.10', status: 'CRITICAL', riskScore: 88, alertsCount: 8, layer: 'DMZ', x: 450, y: 350 },
    { id: 'db-1', label: 'PostgreSQL DB Primary', type: 'Database', ip: '10.0.0.20', status: 'WARNING', riskScore: 62, alertsCount: 3, layer: 'SECURE_ZONE', x: 650, y: 350 },
    { id: 'work-1', label: 'Finance PC-01', type: 'Workstation', ip: '192.168.1.25', status: 'CRITICAL', riskScore: 82, alertsCount: 4, layer: 'INTERNAL', x: 850, y: 350 },
    { id: 'work-2', label: 'Dev PC-02', type: 'Workstation', ip: '192.168.1.45', status: 'WARNING', riskScore: 54, alertsCount: 2, layer: 'INTERNAL', x: 950, y: 220 },
    { id: 'sensor-1', label: 'Smart IDS Sensor', type: 'Security Sensor', ip: '10.0.0.5', status: 'HEALTHY', riskScore: 5, alertsCount: 0, layer: 'CORE', x: 700, y: 30 },
  ];

  const links: NetworkLink[] = [
    { source: 'wan-1', target: 'fw-1', label: '10 Gbps WAN Link', trafficRate: '240 Mbps', status: 'ACTIVE' },
    { source: 'fw-1', target: 'router-1', label: 'Trunk Vlan 100', trafficRate: '180 Mbps', status: 'ACTIVE' },
    { source: 'router-1', target: 'switch-1', label: 'Internal Core Bus', trafficRate: '450 Mbps', status: 'ACTIVE' },
    { source: 'fw-1', target: 'web-1', label: 'DMZ Segment', trafficRate: '95 Mbps', status: 'DEGRADED' },
    { source: 'switch-1', target: 'db-1', label: 'Private DB Vlan 20', trafficRate: '35 Mbps', status: 'ACTIVE' },
    { source: 'switch-1', target: 'work-1', label: 'Office Subnet 192.168.1.0', trafficRate: '120 Mbps', status: 'DEGRADED' },
    { source: 'switch-1', target: 'work-2', label: 'Dev Subnet 192.168.1.0', trafficRate: '45 Mbps', status: 'ACTIVE' },
    { source: 'switch-1', target: 'sensor-1', label: 'SPAN / Mirror Port', trafficRate: '850 Mbps', status: 'ACTIVE' },
  ];

  res.json({ nodes, links });
});

app.get('/api/ids/alerts', (req, res) => {
  res.json(alerts);
});

app.post('/api/ids/analyze', (req, res) => {
  const { sourceIp, destIp, protocol, payloadSample, packetRate } = req.body;

  const isHighRate = packetRate && Number(packetRate) > 1000;
  const isScan = payloadSample && payloadSample.toLowerCase().includes('nmap');
  const isBrute = payloadSample && payloadSample.toLowerCase().includes('failed password');

  const anomalyScore = isHighRate ? 0.92 : isScan ? 0.88 : isBrute ? 0.85 : 0.45;
  const severity: Severity = anomalyScore > 0.85 ? 'CRITICAL' : anomalyScore > 0.7 ? 'HIGH' : 'LOW';

  const alert: Alert = {
    id: `ALT-${Math.floor(Math.random() * 900) + 100}`,
    timestamp: new Date().toISOString(),
    threatType: isHighRate ? 'Network Traffic Surge / DoS Pattern' : isScan ? 'Automated Reconnaissance Sweep' : 'Manual Telemetry Trigger',
    sourceIp: sourceIp || '192.168.1.110',
    sourceDeviceName: 'Analyzed Target IP',
    destIp: destIp || '10.0.0.10',
    destDeviceName: 'Target Protected Asset',
    protocol: protocol || 'TCP',
    severity,
    mlConfidence: Math.floor(Math.random() * 10) + 88,
    status: 'NEW',
    reason: isHighRate
      ? `Rate of ${packetRate} pps exceeds baseline threshold significantly.`
      : `Packet signature analysis detected suspicious behavior pattern in payload.`,
    recommendedAction: 'Restrict incoming traffic from source host and verify endpoint security logs.',
    anomalyScore,
    category: isHighRate ? 'TRAFFIC_SPIKE' : isScan ? 'PORT_SCAN' : 'PROTOCOL_ANOMALY',
  };

  alerts.unshift(alert);
  res.json({ message: 'Telemetry analyzed successfully', alert });
});

app.post('/api/alerts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: AlertStatus };

  const alert = alerts.find((a) => a.id === id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  alert.status = status;
  res.json({ message: `Alert status updated to ${status}`, alert });
});

app.get('/api/logs', (req, res) => {
  res.json(logs);
});

app.get('/api/logs/search', (req, res) => {
  const { query, severity, protocol, startDate, endDate } = req.query;

  let filtered = [...logs];
  if (query && typeof query === 'string') {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.sourceIp.includes(q) ||
        l.destIp.includes(q) ||
        l.eventType.toLowerCase().includes(q) ||
        l.status.toLowerCase().includes(q) ||
        (l.details && l.details.toLowerCase().includes(q))
    );
  }
  if (severity && typeof severity === 'string' && severity !== 'ALL') {
    filtered = filtered.filter((l) => l.severity === severity);
  }
  if (protocol && typeof protocol === 'string' && protocol !== 'ALL') {
    filtered = filtered.filter((l) => l.protocol.toUpperCase() === protocol.toUpperCase());
  }

  if (startDate && typeof startDate === 'string' && startDate.trim() !== '') {
    const startMs = new Date(startDate).getTime();
    if (!isNaN(startMs)) {
      filtered = filtered.filter((l) => new Date(l.timestamp).getTime() >= startMs);
    }
  }

  if (endDate && typeof endDate === 'string' && endDate.trim() !== '') {
    const endMs = new Date(endDate).getTime();
    if (!isNaN(endMs)) {
      filtered = filtered.filter((l) => new Date(l.timestamp).getTime() <= endMs);
    }
  }

  res.json(filtered);
});

app.get('/api/packets', (req, res) => {
  res.json(packets);
});

// Machine Learning Anomaly Detection Scoring Endpoint
app.post('/api/ml/predict', (req, res) => {
  const {
    sourceIp = '192.168.1.45',
    destIp = '10.0.0.20',
    srcPort = 51200,
    dstPort = 5432,
    protocol = 'TCP',
    packetCount = 1250,
    byteCount = 890000,
    durationMs = 1200,
    failedConnCount = 15,
    reqFrequency = 180,
  } = req.body;

  // Isolation Forest / Anomaly scoring logic simulation
  let score = 0.1;
  const topFeatures: { name: string; impact: number }[] = [];

  if (failedConnCount > 10) {
    score += 0.35;
    topFeatures.push({ name: 'Failed Connection Count', impact: 0.35 });
  }
  if (reqFrequency > 100) {
    score += 0.25;
    topFeatures.push({ name: 'Request Frequency (req/s)', impact: 0.25 });
  }
  if (packetCount > 1000 && durationMs < 2000) {
    score += 0.2;
    topFeatures.push({ name: 'Packet Burst Intensity', impact: 0.2 });
  }
  if (dstPort === 22 || dstPort === 3389 || dstPort === 5432) {
    score += 0.12;
    topFeatures.push({ name: 'Sensitive Service Port Access', impact: 0.12 });
  }

  score = Math.min(0.99, Number(score.toFixed(2)));

  let classification: 'Normal' | 'Suspicious' | 'Malicious' | 'Unknown Anomaly' = 'Normal';
  let riskLevel: Severity = 'LOW';

  if (score > 0.8) {
    classification = 'Malicious';
    riskLevel = 'CRITICAL';
  } else if (score > 0.6) {
    classification = 'Suspicious';
    riskLevel = 'HIGH';
  } else if (score > 0.4) {
    classification = 'Unknown Anomaly';
    riskLevel = 'MEDIUM';
  }

  const prediction: AnomalyPrediction = {
    sourceIp,
    destIp,
    srcPort,
    dstPort,
    protocol,
    packetCount,
    byteCount,
    durationMs,
    failedConnCount,
    reqFrequency,
    trafficRateMbps: Number(((byteCount * 8) / (durationMs / 1000) / 1000000).toFixed(2)),
    anomalyScore: score,
    classification,
    riskLevel,
    confidence: Math.min(98, Math.round(score * 100 + 12)),
    reason:
      score > 0.6
        ? `Abnormal multi-variate feature vector detected: High request frequency (${reqFrequency} req/s) combined with ${failedConnCount} failed connection attempts.`
        : 'Feature parameters align with baseline enterprise traffic profiles.',
    recommendedAction:
      score > 0.6
        ? 'Isolate source host, review endpoint process tree, and apply firewall rate limit.'
        : 'No immediate action required. Continue routine telemetry recording.',
    topFeatures: topFeatures.length > 0 ? topFeatures : [{ name: 'Baseline Protocol Standard', impact: 0.05 }],
  };

  res.json(prediction);
});

app.get('/api/risk', (req, res) => {
  const metrics = calculateSecurityMetrics();
  res.json({
    metrics,
    protocolIssues,
  });
});

app.get('/api/reports', (req, res) => {
  const report: Report = {
    id: `REP-${new Date().toISOString().slice(0, 10)}`,
    title: 'Smart Resilience AI — Daily Executive Security Report',
    generatedAt: new Date().toLocaleString(),
    period: 'Last 24 Hours',
    summaryText:
      'During the monitoring period, Smart Resilience AI processed 1,284,500 packets across 8 key network nodes. A total of 37 threat events were logged, resulting in 5 critical alerts requiring Tier-2/Tier-3 SOC intervention.',
    totalEvents: 1284500,
    threatsCount: alerts.length,
    criticalAlertsCount: alerts.filter((a) => a.severity === 'CRITICAL').length,
    topAnomalies: [
      'TCP SYN Flood against Primary Web Server Cluster (10.0.0.10)',
      'High-volume outbound data exfiltration from Finance Workstation (192.168.1.25)',
      'Horizontal Port Reconnaissance from Dev Workstation (192.168.1.45)',
    ],
    mostRiskyDevices: devices
      .filter((d) => d.riskScore > 50)
      .map((d) => ({ name: d.name, ip: d.ip, riskScore: d.riskScore })),
    resilienceScore: calculateSecurityMetrics().resilienceScore.overall,
    recommendations: [
      'Apply edge firewall rate-limiting rules to block IP 185.220.101.4.',
      'Perform endpoint detection scan on Finance PC-01 (192.168.1.25) to verify data transfer integrity.',
      'Enable TCP SYN cookies across all Linux server hosts in the DMZ segment.',
      'Enforce static ARP table entries on switch VLAN 100 to prevent gateway spoofing.',
    ],
  };

  res.json([report]);
});

// AI Cybersecurity Assistant Endpoint
app.post('/api/assistant', async (req, res) => {
  const { prompt, contextAlertId } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const targetedAlert = contextAlertId ? alerts.find((a) => a.id === contextAlertId) : null;

  try {
    const ai = getGenAI();
    if (ai) {
      const systemInstruction = `You are the Smart Resilience AI Assistant, a Senior Tier-3 SOC Analyst & Cybersecurity Expert.
You help security analysts inspect intrusion alerts, understand TCP/IP protocol anomalies, analyze machine learning anomaly scores, and formulate defensive remediation steps.

Guidelines:
1. Provide defensive, authorized security guidance only.
2. Structure responses cleanly with markdown headings, bullet points, and code blocks for security commands (e.g. iptables, tcpdump, ufw, sysctl, or pfSense firewall rules).
3. Be direct, authoritative, professional, and clear.
4. When asked about specific alerts or devices, reference the current network state context provided in the prompt.

Current System Context:
- Active Alerts: ${alerts.length} total (${alerts.filter((a) => a.severity === 'CRITICAL').length} CRITICAL)
- Top Risky Devices: ${devices
        .filter((d) => d.riskScore > 50)
        .map((d) => `${d.name} (${d.ip}) - Risk ${d.riskScore}`)
        .join(', ')}
${targetedAlert ? `- Context Alert #${targetedAlert.id}: ${targetedAlert.threatType} from ${targetedAlert.sourceIp} to ${targetedAlert.destIp} (Severity: ${targetedAlert.severity}, Anomaly Score: ${targetedAlert.anomalyScore})` : ''}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const text = response.text || 'No response generated from AI engine.';

      return res.json({
        text,
        recommendations: [
          'Verify source IP in threat intelligence database',
          'Apply firewall drop rule on perimeter router',
          'Isolate affected internal host to prevent lateral movement',
        ],
        suggestedCommands: [
          `sudo iptables -A INPUT -s ${targetedAlert ? targetedAlert.sourceIp : '185.220.101.4'} -j DROP`,
          `sudo tcpdump -nn -i eth0 src host ${targetedAlert ? targetedAlert.sourceIp : '185.220.101.4'} -c 100`,
        ],
      });
    }
  } catch (err) {
    console.error('Error invoking Gemini via GenAI SDK:', err);
  }

  // Graceful Local AI Security Intelligence Fallback
  let responseText = `### Smart Resilience Security Analysis & Incident Guidance

Based on your prompt: **"${prompt}"** and current telemetry context:

#### 1. Threat Identification
The system has evaluated network telemetry and identified key vectors:
- **Primary Concern**: Suspicious TCP connection patterns and elevated anomaly scores across edge interfaces.
- **Affected Subnets**: DMZ (\`10.0.0.0/24\`) & Internal Workstation VLAN (\`192.168.1.0/24\`).

#### 2. Recommended Immediate Actions
1. **Perimeter Firewall Rule**:
   \`\`\`bash
   # Block malicious source host
   sudo ufw deny from 185.220.101.4 to any
   sudo iptables -I INPUT 1 -s 185.220.101.4 -j DROP
   \`\`\`

2. **Mitigate SYN Flood Saturation**:
   \`\`\`bash
   # Enable SYN cookies in sysctl
   sudo sysctl -w net.ipv4.tcp_syncookies=1
   sudo sysctl -w net.ipv4.tcp_max_syn_backlog=4096
   \`\`\`

3. **Packet Capture Inspection**:
   \`\`\`bash
   # Capture first 100 packets for pcap evidence
   sudo tcpdump -nn -i eth0 'tcp[tcpflags] & tcp-syn != 0' -w syn_flood_investigation.pcap
   \`\`\`

#### 3. Long-term Prevention
- Implement 802.1X NAC on workstation ports.
- Enforce strict egress bandwidth controls on non-standard ports.
`;

  res.json({
    text: responseText,
    recommendations: [
      'Isolate compromised host using Smart Resilience quarantine',
      'Review authentication logs in SIEM Log Explorer',
      'Update Snort/Suricata IDS signatures',
    ],
    suggestedCommands: ['sudo ufw deny from 185.220.101.4 to any', 'sudo sysctl -w net.ipv4.tcp_syncookies=1'],
  });
});

// Settings Endpoints
app.get('/api/settings', (req, res) => {
  res.json(systemSettings);
});

app.post('/api/settings', (req, res) => {
  systemSettings = { ...systemSettings, ...req.body };
  res.json({ message: 'Settings updated successfully', settings: systemSettings });
});

// Trigger Simulated Attack Event
app.post('/api/simulate/attack', (req, res) => {
  const { attackType } = req.body;

  let newAlert: Alert;
  if (attackType === 'PORT_SCAN') {
    newAlert = {
      id: `ALT-${Math.floor(Math.random() * 800) + 200}`,
      timestamp: new Date().toISOString(),
      threatType: 'Simulated Rapid Port Scan',
      sourceIp: '192.168.1.188',
      sourceDeviceName: 'Untrusted Guest Workstation',
      destIp: '10.0.0.10',
      destDeviceName: 'Primary Web Server Cluster',
      protocol: 'TCP',
      severity: 'HIGH',
      mlConfidence: 94,
      status: 'NEW',
      reason: '250 port probe connections detected within 5 seconds.',
      recommendedAction: 'Quarantine host 192.168.1.188 and inspect guest subnet logs.',
      anomalyScore: 0.89,
      category: 'PORT_SCAN',
    };
  } else if (attackType === 'SYN_FLOOD') {
    newAlert = {
      id: `ALT-${Math.floor(Math.random() * 800) + 200}`,
      timestamp: new Date().toISOString(),
      threatType: 'Simulated SYN Flood Attack',
      sourceIp: '198.51.100.42',
      sourceDeviceName: 'External Botnet IP',
      destIp: '10.0.0.1',
      destDeviceName: 'Enterprise Edge Firewall',
      protocol: 'TCP',
      severity: 'CRITICAL',
      mlConfidence: 97,
      status: 'NEW',
      reason: '12,000 pps SYN flood burst targetting firewall WAN interface.',
      recommendedAction: 'Activate edge SYN proxy and enable cloud DDoS scrub.',
      anomalyScore: 0.98,
      category: 'TRAFFIC_SPIKE',
    };
  } else {
    newAlert = {
      id: `ALT-${Math.floor(Math.random() * 800) + 200}`,
      timestamp: new Date().toISOString(),
      threatType: 'Simulated Data Exfiltration Attempt',
      sourceIp: '192.168.1.25',
      sourceDeviceName: 'Finance Workstation PC-01',
      destIp: '203.0.113.89',
      destDeviceName: 'Untrusted External IP',
      protocol: 'HTTPS',
      severity: 'CRITICAL',
      mlConfidence: 95,
      status: 'NEW',
      reason: '1.8 GB outbound data burst detected in 3 minutes.',
      recommendedAction: 'Immediate device quarantine and endpoint forensic snapshot.',
      anomalyScore: 0.96,
      category: 'EXFILTRATION',
    };
  }

  alerts.unshift(newAlert);
  res.json({ message: 'Simulated attack injected into telemetry pipeline', alert: newAlert });
});

// Vite Middleware for Development / Static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart Resilience AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
