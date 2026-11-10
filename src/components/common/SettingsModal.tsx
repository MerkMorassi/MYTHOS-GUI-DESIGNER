import React, { useState, useEffect } from 'react';
import { ThemeId } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { soundEngine } from '../../utils/audio';
import { Key, X, Eye, EyeOff, CheckCircle2, AlertTriangle, Shield, Sparkles, RefreshCw, Activity, Terminal, Check, Globe, Gauge, Zap } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
}) => {
  const theme = THEMES[currentTheme] || THEMES['noir-dark'];
  const [activeTab, setActiveTab] = useState<'config' | 'diagnostics'>('config');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  // Diagnostics state with rate limit tracking
  const [diagResult, setDiagResult] = useState<{
    status: 'idle' | 'success' | 'error';
    latencyMs?: number;
    details?: string;
    endpoint?: string;
    timestamp?: string;
    rateLimitRemaining?: string | null;
    rateLimitLimit?: string | null;
  }>({ status: 'idle' });

  useEffect(() => {
    if (isOpen) {
      try {
        const savedKey = localStorage.getItem('mythos_gemini_api_key') || '';
        setApiKeyInput(savedKey);
      } catch (e) {
        setApiKeyInput('');
      }
      setStatusMessage(null);
      setDiagResult({ status: 'idle' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        soundEngine.playToggle();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    soundEngine.playChime();
    const trimmed = apiKeyInput.trim();
    try {
      if (trimmed) {
        localStorage.setItem('mythos_gemini_api_key', trimmed);
        setStatusMessage({ text: 'Gemini API Key successfully saved to secure local storage.', type: 'success' });
      } else {
        localStorage.removeItem('mythos_gemini_api_key');
        setStatusMessage({ text: 'Gemini API Key removed. Using server environment fallback / heuristic mode.', type: 'info' });
      }
    } catch (e) {
      setStatusMessage({ text: 'Failed to save API key to local storage.', type: 'error' });
    }
  };

  const handleTestConnection = async () => {
    soundEngine.playChime();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setDiagResult({
        status: 'error',
        details: 'API Key missing. Please enter a valid Gemini API Key in the configuration tab.',
        timestamp: new Date().toLocaleTimeString(),
      });
      setStatusMessage({ text: 'Please enter a Gemini API Key to test.', type: 'error' });
      return;
    }

    setIsTesting(true);
    setDiagResult({ status: 'idle', details: 'Executing minimal request to Gemini v1beta endpoint...' });
    setStatusMessage({ text: 'Testing API Key connectivity...', type: 'info' });

    const startTime = performance.now();
    const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(trimmed)}`;

    try {
      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Diagnostic ping test." }] }]
        }),
      });

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      // Extract rate limit headers if present
      const remaining = res.headers.get('x-ratelimit-remaining') || res.headers.get('ratelimit-remaining') || null;
      const limit = res.headers.get('x-ratelimit-limit') || res.headers.get('ratelimit-limit') || null;

      const data = await res.json();

      if (res.ok && data.candidates) {
        setDiagResult({
          status: 'success',
          latencyMs,
          details: `Connection verified successfully (HTTP 200 OK). Model response received in ${latencyMs}ms.`,
          endpoint: 'generativelanguage.googleapis.com/v1beta',
          timestamp: new Date().toLocaleTimeString(),
          rateLimitRemaining: remaining,
          rateLimitLimit: limit,
        });
        setStatusMessage({ text: `API Key test passed (${latencyMs}ms latency).`, type: 'success' });
      } else {
        const errDetail = data?.error?.message || `HTTP error status ${res.status} ${res.statusText}`;
        setDiagResult({
          status: 'error',
          latencyMs,
          details: `Gemini API Error: ${errDetail}`,
          endpoint: 'generativelanguage.googleapis.com/v1beta',
          timestamp: new Date().toLocaleTimeString(),
          rateLimitRemaining: remaining,
          rateLimitLimit: limit,
        });
        setStatusMessage({ text: `API Key test failed: ${errDetail}`, type: 'error' });
      }
    } catch (err: unknown) {
      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);
      const errorMessage = err instanceof Error ? err.message : 'Network failure or CORS blocked request';
      setDiagResult({
        status: 'error',
        latencyMs,
        details: `Network Connectivity Error: ${errorMessage}`,
        endpoint: 'generativelanguage.googleapis.com/v1beta',
        timestamp: new Date().toLocaleTimeString(),
        rateLimitRemaining: null,
        rateLimitLimit: null,
      });
      setStatusMessage({ text: `Network test failed: ${errorMessage}`, type: 'error' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClear = () => {
    soundEngine.playToggle();
    setApiKeyInput('');
    try {
      localStorage.removeItem('mythos_gemini_api_key');
      setStatusMessage({ text: 'Gemini API Key cleared.', type: 'info' });
      setDiagResult({ status: 'idle' });
    } catch (e) {}
  };

  // Format check
  const trimmedKey = apiKeyInput.trim();
  const isKeyFormatValid = trimmedKey.startsWith('AIza') && trimmedKey.length >= 35;

  // Latency gauge calculation (max reference 1200ms)
  const currentLatency = diagResult.latencyMs ?? 0;
  const latencyPercentage = Math.min(100, Math.max(5, (currentLatency / 1200) * 100));
  const latencyColor = currentLatency === 0 ? 'bg-slate-700' : currentLatency < 350 ? 'bg-emerald-400' : currentLatency < 750 ? 'bg-amber-400' : 'bg-red-400';
  const latencyTextColor = currentLatency === 0 ? 'text-slate-400' : currentLatency < 350 ? 'text-emerald-300' : currentLatency < 750 ? 'text-amber-300' : 'text-red-300';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border-2 shadow-2xl flex flex-col overflow-hidden font-mono-data select-none"
        style={{
          backgroundColor: theme.colors.bgObsidian || '#0f172a',
          borderColor: theme.colors.accent || '#38bdf8',
          boxShadow: `0 25px 50px -12px ${theme.colors.accent}33`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-4 py-3 flex items-center justify-between border-b"
          style={{
            backgroundColor: theme.colors.bgSlate || '#1e293b',
            borderColor: theme.colors.border || '#334155',
          }}
        >
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 id="settings-modal-title" className="text-sm font-extrabold tracking-wider text-slate-100">
              SYSTEM SETTINGS // GEMINI API
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playToggle();
              onClose();
            }}
            className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Close Settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-black/40 text-xs" style={{ borderColor: theme.colors.border }}>
          <button
            type="button"
            onClick={() => {
              soundEngine.playToggle();
              setActiveTab('config');
            }}
            className={`flex-1 py-2.5 px-4 font-bold flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'config'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Key Configuration</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playToggle();
              setActiveTab('diagnostics');
            }}
            className={`flex-1 py-2.5 px-4 font-bold flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>API Diagnostics</span>
            {diagResult.status === 'success' && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {diagResult.status === 'error' && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex flex-col gap-4 text-xs text-slate-300">
          {activeTab === 'config' && (
            <>
              <div className="flex items-start gap-3 p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-lg">
                <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-cyan-300 uppercase tracking-wide">Secure API Gateway Integration</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Configure your Gemini API Key for client-side override. Works seamlessly on Vercel and local environments.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                  <span>Gemini API Key</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {apiKeyInput ? `${apiKeyInput.length} chars entered` : 'Not configured'}
                  </span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showKey ? 'text' : 'password'}
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full bg-black/60 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2.5 text-slate-100 font-mono text-xs pr-10 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playToggle();
                      setShowKey(!showKey);
                    }}
                    className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showKey ? 'Hide API Key' : 'Reveal API Key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 italic">Stored locally in browser localStorage (mythos_gemini_api_key).</span>
                  {apiKeyInput && (
                    <span className={isKeyFormatValid ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {isKeyFormatValid ? '✓ Format Valid' : '⚠ Verify Key Prefix (AIza...)'}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div
                  className={`p-2.5 rounded-lg border flex items-center gap-2 font-mono text-[11px] ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                      : statusMessage.type === 'error'
                      ? 'bg-red-500/15 border-red-500/40 text-red-300'
                      : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : statusMessage.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Sparkles className="w-4 h-4 shrink-0" />
                  )}
                  <span className="leading-tight">{statusMessage.text}</span>
                </div>
              )}
            </>
          )}

          {activeTab === 'diagnostics' && (
            <div className="flex flex-col gap-3.5">
              <div className="text-[11px] text-slate-400 leading-relaxed">
                Run connectivity diagnostics to verify that your Gemini API Key format is correct, test round-trip latency, and monitor API rate limit status.
              </div>

              {/* Status Indicator Card */}
              <div className="flex flex-col gap-2.5 p-3 bg-black/50 border border-slate-700 rounded-lg font-mono">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Diagnostic Status</span>
                  <div className="flex items-center gap-1.5">
                    {diagResult.status === 'success' && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-[10px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> SUCCESS
                      </span>
                    )}
                    {diagResult.status === 'error' && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/50 text-red-300 font-bold text-[10px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> ERROR
                      </span>
                    )}
                    {diagResult.status === 'idle' && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-bold text-[10px]">
                        READY TO TEST
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 text-[9px] uppercase">Key Format</span>
                    <span className={apiKeyInput ? (isKeyFormatValid ? 'text-emerald-400 font-bold truncate' : 'text-amber-400 font-bold truncate') : 'text-slate-500'}>
                      {apiKeyInput ? (isKeyFormatValid ? 'Valid' : 'Check Prefix') : 'None'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 text-[9px] uppercase">Rate Limit Status</span>
                    <span className="text-purple-300 font-bold flex items-center gap-1 truncate">
                      <Gauge className="w-3 h-3 text-purple-400 shrink-0" />
                      {diagResult.rateLimitRemaining !== undefined && diagResult.rateLimitRemaining !== null
                        ? `${diagResult.rateLimitRemaining}${diagResult.rateLimitLimit ? ` / ${diagResult.rateLimitLimit}` : ''}`
                        : 'Nominal (Active)'}
                    </span>
                  </div>
                </div>

                {/* Visual Latency Gauge Section */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Round-Trip Latency</span>
                    </span>
                    <span className={`font-mono font-extrabold text-xs ${latencyTextColor}`}>
                      {diagResult.latencyMs !== undefined ? `${diagResult.latencyMs} ms` : '— ms'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${latencyColor}`}
                      style={{ width: `${diagResult.latencyMs !== undefined ? latencyPercentage : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono">
                    <span>0ms (Fast)</span>
                    <span>600ms (Moderate)</span>
                    <span>1200ms+ (Slow)</span>
                  </div>
                </div>

                {diagResult.details && (
                  <div className="mt-1 p-2 rounded bg-white/5 border border-white/10 text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {diagResult.details}
                  </div>
                )}

                {diagResult.timestamp && (
                  <div className="text-[9px] text-slate-500 text-right">
                    Tested at {diagResult.timestamp}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Target: generativelanguage.googleapis.com</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !apiKeyInput.trim()}
                  className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 disabled:opacity-40 text-purple-300 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                  <span>TEST CONNECTION</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              {activeTab === 'config' && apiKeyInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  CLEAR
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playToggle();
                  onClose();
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSave();
                  onClose();
                }}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-lg text-xs transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                SAVE SETTINGS
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
