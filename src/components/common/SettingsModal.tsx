import React, { useState, useEffect } from 'react';
import { ThemeId } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { soundEngine } from '../../utils/audio';
import { Key, X, Eye, EyeOff, CheckCircle2, AlertTriangle, Shield, Sparkles, RefreshCw } from 'lucide-react';

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
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedKey = localStorage.getItem('mythos_gemini_api_key') || '';
        setApiKeyInput(savedKey);
      } catch (e) {
        setApiKeyInput('');
      }
      setStatusMessage(null);
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

  const handleTestKey = async () => {
    soundEngine.playChime();
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setStatusMessage({ text: 'Please enter a Gemini API Key to test.', type: 'error' });
      return;
    }

    setIsTesting(true);
    setStatusMessage({ text: 'Testing API Key against MythOS server proxy...', type: 'info' });

    try {
      const res = await fetch('/api/theme/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': trimmed,
        },
        body: JSON.stringify({
          images: [],
          cssCode: '/* test ping */',
          notes: 'API Key connectivity test',
          targetName: 'Test Theme',
        }),
      });

      const data = await res.json();
      if (res.ok && data.theme) {
        setStatusMessage({ text: 'API Key connection verified successfully! Gemini generative gateway active.', type: 'success' });
      } else {
        throw new Error(data.error || `Server responded with status ${res.status}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
      setStatusMessage({ text: `API Key test failed: ${errorMessage}`, type: 'error' });
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
    } catch (e) {}
  };

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
              SYSTEM SETTINGS // GEMINI API KEY
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

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 text-xs text-slate-300">
          <div className="flex items-start gap-3 p-3 bg-cyan-950/20 border border-cyan-500/30 rounded-lg">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-bold text-cyan-300 uppercase tracking-wide">Secure API Gateway Integration</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Configure your Gemini API Key for client-side override. When provided, requests to Theme Forge, Telemetry Diagnostic Analyzer, and Audio Transcription proxy securely through server endpoints using your key.
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
            <span className="text-[10px] text-slate-500 italic">
              Stored locally in browser localStorage (mythos_gemini_api_key). Never exposed publicly.
            </span>
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !apiKeyInput.trim()}
                className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 disabled:opacity-40 text-purple-300 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>TEST KEY</span>
              </button>
              {apiKeyInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  CLEAR
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
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
