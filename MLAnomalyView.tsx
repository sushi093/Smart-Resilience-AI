import React, { useState } from 'react';
import { Cpu, Play, BarChart2, Shield, Activity, RefreshCw } from 'lucide-react';
import { AnomalyPrediction } from '../types';

interface MLAnomalyViewProps {
  onPredictAnomaly: (params: Partial<AnomalyPrediction>) => Promise<AnomalyPrediction>;
}

export const MLAnomalyView: React.FC<MLAnomalyViewProps> = ({ onPredictAnomaly }) => {
  const [sourceIp, setSourceIp] = useState('192.168.1.45');
  const [destIp, setDestIp] = useState('10.0.0.20');
  const [packetCount, setPacketCount] = useState(1450);
  const [byteCount, setByteCount] = useState(890000);
  const [durationMs, setDurationMs] = useState(1100);
  const [failedConnCount, setFailedConnCount] = useState(18);
  const [reqFrequency, setReqFrequency] = useState(210);
  const [dstPort, setDstPort] = useState(5432);

  const [prediction, setPrediction] = useState<AnomalyPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunInference = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await onPredictAnomaly({
        sourceIp,
        destIp,
        srcPort: 51200,
        dstPort: Number(dstPort),
        protocol: 'TCP',
        packetCount: Number(packetCount),
        byteCount: Number(byteCount),
        durationMs: Number(durationMs),
        failedConnCount: Number(failedConnCount),
        reqFrequency: Number(reqFrequency),
      });
      setPrediction(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <span>Machine Learning Anomaly Detection Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Unsupervised Isolation Forest & Multi-variate behavioral feature scoring
          </p>
        </div>

        <span className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-800 rounded-full font-mono text-xs flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          Model: Isolation Forest v3
        </span>
      </div>

      {/* ML Pipeline Flowchart */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-3">
          ML Pipeline Architecture Flow
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs font-mono">
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">Network Telemetry</div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">Data Preprocessing</div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">Feature Extraction</div>
          <div className="p-2.5 bg-purple-950 border border-purple-800 text-purple-300 font-bold rounded">ML Model</div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">Anomaly Score</div>
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">Risk Classification</div>
          <div className="p-2.5 bg-rose-950 border border-rose-800 text-rose-300 font-bold rounded">Security Alert</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: ML Predictor Form */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Real-Time Inference Sandbox</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Adjust telemetry feature parameters to trigger model prediction</p>
          </div>

          <form onSubmit={handleRunInference} className="space-y-3 text-xs font-mono">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 block mb-1">Source IP</label>
                <input
                  type="text"
                  value={sourceIp}
                  onChange={(e) => setSourceIp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Target IP</label>
                <input
                  type="text"
                  value={destIp}
                  onChange={(e) => setDestIp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Failed Connections Count</span>
                <span className="text-cyan-400 font-bold">{failedConnCount}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={failedConnCount}
                onChange={(e) => setFailedConnCount(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Request Frequency (req/s)</span>
                <span className="text-cyan-400 font-bold">{reqFrequency}</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                value={reqFrequency}
                onChange={(e) => setReqFrequency(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Packet Burst Count</span>
                <span className="text-cyan-400 font-bold">{packetCount}</span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                value={packetCount}
                onChange={(e) => setPacketCount(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Destination Port</label>
              <select
                value={dstPort}
                onChange={(e) => setDstPort(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200"
              >
                <option value={80}>Port 80 (HTTP)</option>
                <option value={443}>Port 443 (HTTPS)</option>
                <option value={22}>Port 22 (SSH)</option>
                <option value={5432}>Port 5432 (PostgreSQL DB)</option>
                <option value={3389}>Port 3389 (RDP Remote)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold rounded transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run ML Model Inference</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: ML Output Card */}
        <div className="lg:col-span-2 p-5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <span>ML Anomaly Score & Decision Breakdown</span>
          </h2>

          {prediction ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Model Anomaly Score</span>
                  <div className="text-3xl font-extrabold font-mono text-purple-400 mt-1">
                    {prediction.anomalyScore.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Classification: <strong className="text-rose-400">{prediction.classification}</strong></p>
                </div>

                <div className="flex flex-col sm:items-end font-mono text-xs space-y-1">
                  <span className="text-slate-400">Risk Level: <strong className="text-amber-400">{prediction.riskLevel}</strong></span>
                  <span className="text-slate-400">Confidence: <strong className="text-emerald-400">{prediction.confidence}%</strong></span>
                  <span className="text-slate-400">Traffic Rate: <strong className="text-cyan-400">{prediction.trafficRateMbps} Mbps</strong></span>
                </div>
              </div>

              {/* Reasoning */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
                <span className="font-mono text-slate-400">Model Decision Logic:</span>
                <p className="text-slate-200">{prediction.reason}</p>
              </div>

              {/* Top Influencing Features */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400">Top Feature Contributions:</span>
                {prediction.topFeatures.map((feat) => (
                  <div key={feat.name} className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs font-mono flex items-center justify-between">
                    <span className="text-slate-200">{feat.name}</span>
                    <span className="text-purple-400 font-bold">+{(feat.impact * 100).toFixed(0)}% Impact</span>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className="p-3 bg-purple-950/60 border border-purple-800/80 rounded text-xs space-y-1 text-purple-200">
                <span className="font-bold font-mono">Recommended Automated Defense:</span>
                <p>{prediction.recommendedAction}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 font-mono text-xs space-y-2">
              <Cpu className="w-10 h-10 stroke-1 text-purple-400/60" />
              <p>Run ML Model Inference to view real-time anomaly scores & decision trees.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
