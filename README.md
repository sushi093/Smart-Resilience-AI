<div align="center">
  <img src="smartdefense_soc_logo_1786617094827.jpg" />
  <h1>Smart Resilience AI</h1>
  <p><b>Enterprise Network Security & Threat Intelligence Platform</b></p>
</div>
 🛡️ Smart Resilience AI
Enterprise Network Security & Threat Intelligence Platform

Smart Resilience AI is an enterprise-grade Network Intrusion Detection System (NIDS) and Security Operations Center (SOC) dashboard. It combines AI security analysis, Machine Learning anomaly detection, real-time threat mapping, and live network log auditing.

🔑 Key Features & Capabilities
1. 🤖 AI Security Copilot (Powered by Google Gemini)
Real-Time Threat Analysis: Analyzes live incident data and log streams using Google Gemini API to explain security events in plain English.

Automated Executive Reports: Generates executive-ready security summaries, incident impact assessments, and mitigation recommendations.

Interactive Security Assistant: A built-in AI chat interface where SOC analysts can query current network status, ask for triage steps, and investigate suspicious activity.

2. 🌍 D3 Geographic Threat Heatmap
Spatial World Grid View: Uses D3.js visualization to map active cyber threats and attack intensity across 8 global geo-zones (North America, Europe, East Asia, South Asia, Middle East, South America, Africa, Oceania).

Live Attack Trajectories: Visualizes curved D3 attack trajectory arcs from origin vectors directly to your central corporate SOC Gateway Hub.

Interactive Forensic Inspector: Modal window allowing security analysts to inspect regional ping latencies, sample rogue IP addresses, and trigger immediate firewall/mitigation rules.

Severity & Matrix Filters: Filter threats by severity (High, Critical), time window (1H, 24H, 7D), or view attack types via a D3 Intensity Matrix (Port Scanning, SYN Flood, Auth Brute Force, SQLi/XSS, Data Exfiltration).

3. 📊 Live SIEM Log Analysis & Auditing
Real-Time Stream Monitoring: Ingests and displays live SIEM security logs with severity tags (Info, Warning, High, Critical).

Automated Log Parsing: Classifies network protocols, source/destination IPs, flags anomalous behavior, and tracks response status.

4. 🕸️ Interactive Network Topology Visualizer
Node & Mesh Mapping: Provides a visual topology map of enterprise network assets (servers, databases, firewalls, endpoints).

Active Intrusion Highlighting: Instantly highlights compromised or targeted nodes in real time during active attack simulations.

5. ⚡ Machine Learning Anomaly Detection
Baseline Behavioral Profiling: Automatically detects deviation from normal traffic patterns.

Proactive Intrusion Detection: Identifies zero-day anomalies, unauthorized port scanning, brute-force access attempts, and data exfiltration patterns before escalation.

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

🏗️ System Architecture & Data Flow[ Incoming Network Logs / Sensors ]
                │
                ▼
      ┌──────────────────┐
      │   Express API    │ ◄─── Processes SIEM streams & raw logs
      └────────┬─────────┘
               │
      ┌────────┴─────────┐
      │ Gemini AI Engine │ ◄─── Performs threat reasoning & report synthesis
      └────────┬─────────┘
               │
               ▼
     ┌───────────────────┐
     │ React Front-End   │
     │  (D3.js + UI)     │ ◄─── Renders heatmaps, topologies & copilot UI
     └───────────────────┘
🛡️ Deep-Dive Module Breakdown1. Interactive D3.js Geo-Heatmap & Vector GridCurved Attack Arcs: Generates SVG bezier paths mapping real-time attack origins (e.g., Eastern Europe, East Asia) into your target SOC regional gateway.Vector Intensity Matrix: Categorizes attack frequency by technical classification:Layer 3/4: SYN Floods, UDP Amplification, ICMP Sweeps.Layer 7: SQL Injection (SQLi), Cross-Site Scripting (XSS), Auth Brute-Force, API Credential Stuffing.Mitigation Triggering: Allows security operators to execute active defense actions (e.g., IP Blacklisting, Rate-Limiting, Port Isolation) directly from regional modal views.2. Autonomous Gemini Copilot IntegrationNatural Language Incident Triage: Translates complex JSON log payloads into human-readable incident root-cause summaries.Playbook Generation: Recommends specific Incident Response (IR) steps compliant with security frameworks like NIST SP 800-61 or MITRE ATT&CK.Executive Summary Generator: Converts raw alert telemetry into structured Markdown executive reports for CISOs and IT management.3. ML Anomaly Engine & Threat TopologyBaseline Behavioral Tracking: Monitors node-to-node communications to establish normal network traffic baselines.Zero-Day & Exfiltration Alerts: Detects sudden bursts in outbound payload volume (potential data exfiltration) or unauthorized lateral movement between subnet nodes.Visual Topology Graph: Dynamic visual rendering showing active connections between endpoints, jump boxes, databases, and perimeter firewalls—highlighting affected assets in real time when breached.💡 Potential Extension Ideas for Your RepositoryIf you want to keep expanding the project on GitHub, consider adding:Webhook Alerting: Slack/Discord integrations to notify team members when high-severity alerts trigger.Exportable Audit Logs: Exporting filtered SIEM events as .csv or .json for compliance reporting.Custom Threat Rules: A UI tab allowing users to write custom Detection Rules (e.g., YARA / Sigma rules).
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
