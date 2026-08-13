import React, { useState } from 'react';
import { Terminal, Send, Zap, Bot, User, Shield, Copy, Check } from 'lucide-react';
import { AssistantMessage } from '../types';

interface AIAssistantViewProps {
  messages: AssistantMessage[];
  onSendMessage: (prompt: string) => Promise<void>;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({ messages, onSendMessage }) => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const promptChips = [
    'Why was alert ALT-801 generated?',
    'Explain the TCP SYN flood anomaly.',
    'How can I mitigate data exfiltration on 192.168.1.25?',
    'Summarize today\'s security threats & resilience.',
    'Give me iptables rules to drop IP 185.220.101.4.',
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;
    setInputPrompt('');
    setLoading(true);
    try {
      await onSendMessage(text);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-xl gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span>Smart Resilience AI Assistant (SOC Copilot)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Senior Tier-3 SOC analyst assistant powered by Gemini 3.6 Flash for incident triage & playbook guidance
          </p>
        </div>

        <span className="px-3 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-full font-mono text-xs flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          Server-Side Gemini Model Active
        </span>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
        <span className="text-slate-400">Quick Analyst Questions:</span>
        {promptChips.map((chip) => (
          <button
            key={chip}
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-700 text-slate-300 hover:text-cyan-300 rounded transition cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Conversation Box */}
      <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-xl min-h-[450px] max-h-[600px] overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 p-4 rounded-xl font-sans ${
              msg.sender === 'user' ? 'bg-slate-950 border border-slate-800 ml-12' : 'bg-slate-900 border border-slate-800 mr-12'
            }`}
          >
            <div
              className={`p-2 rounded-lg shrink-0 ${
                msg.sender === 'user' ? 'bg-cyan-950 text-cyan-400' : 'bg-purple-950 text-purple-400'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-200 w-full overflow-hidden">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-slate-800 pb-1">
                <span>{msg.sender === 'user' ? 'SOC Analyst' : 'Smart Resilience AI Assistant'}</span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Formatted Text */}
              <div className="whitespace-pre-wrap text-slate-200">{msg.text}</div>

              {/* Suggested Commands if any */}
              {msg.suggestedCommands && msg.suggestedCommands.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/80 font-mono">
                  <span className="text-[10px] text-cyan-400 uppercase font-bold block">
                    Recommended CLI Defensive Commands:
                  </span>
                  {msg.suggestedCommands.map((cmd) => (
                    <div
                      key={cmd}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded flex items-center justify-between gap-2 text-emerald-400 font-mono text-[11px]"
                    >
                      <span className="break-all">{cmd}</span>
                      <button
                        onClick={() => handleCopy(cmd)}
                        className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer shrink-0"
                      >
                        {copiedCmd === cmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl mr-12 text-cyan-400 font-mono text-xs">
            <Zap className="w-4 h-4 animate-spin" />
            <span>Smart Resilience AI is analyzing security telemetry & formulating playbook...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputPrompt);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask Smart Resilience AI Assistant about any alert, anomaly, or firewall command..."
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading || !inputPrompt.trim()}
          className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition cursor-pointer flex items-center gap-2 text-xs font-mono"
        >
          <span>Send Query</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
