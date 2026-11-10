import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tablet,
  X,
  Minimize2,
  Maximize2,
  Sliders,
  RefreshCw,
  Zap,
  Shield,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  Download,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Trash2,
  Terminal
} from 'lucide-react';
import { ThemeId, MSDLayoutManifest, SystemMetric } from '../../types/msd';
import { THEMES } from '../../constants/themes';
import { soundEngine } from '../../utils/audio';

interface HandheldDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  manifest: MSDLayoutManifest;
  onUpdateManifest: React.Dispatch<React.SetStateAction<MSDLayoutManifest>>;
  currentTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  metrics: Record<string, SystemMetric>;
  onUpdateMetric: (key: string, value: number) => void;
  anomalySimulated: boolean;
  onToggleAnomaly: () => void;
  onOpenVisualStudio: () => void;
}

export const HandheldDesigner: React.FC<HandheldDesignerProps> = ({
  isOpen,
  onClose,
  manifest,
  onUpdateManifest,
  currentTheme,
  onThemeChange,
  metrics,
  onUpdateMetric,
  anomalySimulated,
  onToggleAnomaly,
  onOpenVisualStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'schematic' | 'metrics' | 'theme' | 'macros' | 'actions'>('schematic');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const theme = THEMES[currentTheme] || THEMES['noir-dark'];

  // Macro Management state
  const [macros, setMacros] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('voxcon_custom_macros');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['ACKNOWLEDGED', 'RECEIVED', 'STANDBY'];
  });
  const [newMacroInput, setNewMacroInput] = useState<string>('');
  const [macroStatus, setMacroStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MACRO_PRESETS = [
    {
      id: 'default',
      name: 'Default Comms',
      macros: ['ACKNOWLEDGED', 'RECEIVED', 'STANDBY', 'AFFIRMATIVE', 'NEGATIVE']
    },
    {
      id: 'tactical',
      name: 'Tactical Alert',
      macros: ['SHIELDS UP', 'RED ALERT', 'TARGET LOCK', 'EVASIVE MANEUVER', 'STANDBY']
    },
    {
      id: 'flight',
      name: 'Flight Ops',
      macros: ['WARP ENGAGE', 'HELM VECTOR 1', 'SYSTEM DIAGNOSTIC', 'CARRIER LOCK', 'STATION KEEPING']
    },
    {
      id: 'sensors',
      name: 'Sensor Sweep',
      macros: ['FULL SCAN', 'SUBSPACE PING', 'SPECTRAL SWEEP', 'HAIL FREQUENCY', 'STATUS REPORT']
    }
  ];

  const saveMacros = (updated: string[]) => {
    setMacros(updated);
    try {
      localStorage.setItem('voxcon_custom_macros', JSON.stringify(updated));
      window.dispatchEvent(new Event('voxcon_macros_updated'));
    } catch (e) {}
  };

  const handleExportMacros = () => {
    soundEngine.playChime();
    const payload = {
      system: 'VOXCON',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      macros
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxcon-macros-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMacroStatus(`Exported ${macros.length} macros as JSON`);
    setTimeout(() => setMacroStatus(null), 3000);
  };

  const handleImportJsonClick = () => {
    fileInputRef.current?.click();
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        let importedList: string[] = [];

        if (Array.isArray(parsed)) {
          importedList = parsed.filter((item): item is string => typeof item === 'string');
        } else if (parsed && Array.isArray(parsed.macros)) {
          importedList = parsed.macros.filter((item): item is string => typeof item === 'string');
        } else if (parsed && typeof parsed === 'object') {
          importedList = Object.values(parsed).filter((item): item is string => typeof item === 'string');
        }

        const cleaned = Array.from(new Set(importedList.map((m) => m.trim().toUpperCase()).filter(Boolean)));
        if (cleaned.length === 0) {
          soundEngine.playToggle();
          setMacroStatus('Error: No valid macro strings found in file');
        } else {
          soundEngine.playChime();
          saveMacros(cleaned);
          setMacroStatus(`Imported ${cleaned.length} macros from JSON`);
        }
      } catch (err) {
        soundEngine.playToggle();
        setMacroStatus('Error: Invalid JSON file');
      }
      setTimeout(() => setMacroStatus(null), 3500);
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleApplyPreset = (presetMacros: string[], presetName: string) => {
    soundEngine.playChime();
    saveMacros(presetMacros);
    setMacroStatus(`Imported preset: ${presetName}`);
    setTimeout(() => setMacroStatus(null), 3000);
  };

  const handleAddMacro = () => {
    const trimmed = newMacroInput.trim().toUpperCase();
    if (!trimmed) return;
    if (macros.includes(trimmed)) return;
    soundEngine.playChime();
    const updated = [...macros, trimmed];
    saveMacros(updated);
    setNewMacroInput('');
  };

  const handleRemoveMacro = (index: number) => {
    soundEngine.playToggle();
    const updated = macros.filter((_, i) => i !== index);
    saveMacros(updated.length > 0 ? updated : ['ACKNOWLEDGED']);
  };

  const handleMoveMacro = (index: number, direction: 'up' | 'down') => {
    soundEngine.playToggle();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= macros.length) return;
    const updated = [...macros];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    saveMacros(updated);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-14 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl border-2 flex flex-col overflow-hidden font-mono-data select-none"
        style={{
          backgroundColor: theme.colors.bgObsidian || '#0f172a',
          borderColor: theme.colors.accent || '#38bdf8',
          boxShadow: `0 20px 25px -5px ${theme.colors.accent}22, 0 8px 10px -6px ${theme.colors.accent}11`,
        }}
      >
        {/* PADD Header */}
        <div 
          className="px-3 py-2 flex items-center justify-between border-b"
          style={{
            backgroundColor: theme.colors.bgSlate || '#1e293b',
            borderColor: theme.colors.border || '#334155',
          }}
        >
          <div className="flex items-center gap-2">
            <Tablet className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-extrabold tracking-wider text-slate-100">
              HANDHELD PADD INSPECTOR
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                soundEngine.playToggle();
                setIsMinimized(!isMinimized);
              }}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
              title={isMinimized ? 'Expand PADD' : 'Minimize PADD'}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playChime();
                onClose();
              }}
              className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
              title="Dock / Close Handheld PADD"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {!isMinimized && (
          <div className="flex flex-col flex-1 max-h-[70vh] overflow-y-auto">
            {/* Tab Navigation */}
            <div className="flex border-b bg-black/40 text-[10px]" style={{ borderColor: theme.colors.border }}>
              {[
                { id: 'schematic', label: 'Schematic' },
                { id: 'metrics', label: 'Telemetry' },
                { id: 'theme', label: 'Themes' },
                { id: 'macros', label: 'Macro Management' },
                { id: 'actions', label: 'Actions' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundEngine.playToggle();
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex-1 py-2 px-0.5 text-center font-semibold transition-colors border-b-2 truncate ${
                    activeTab === tab.id
                      ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-3.5 flex flex-col gap-4 text-xs">
              {activeTab === 'schematic' && (
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Schematic Configuration
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300">Active Layout Name</label>
                    <input
                      type="text"
                      value={manifest.name}
                      onChange={(e) =>
                        onUpdateManifest((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300">Schematic Core Type</label>
                    <select
                      value={manifest.msdCanvas.schematicType}
                      onChange={(e) => {
                        soundEngine.playChime();
                        const val = e.target.value as any;
                        onUpdateManifest((prev) => ({
                          ...prev,
                          msdCanvas: { ...prev.msdCanvas, schematicType: val },
                        }));
                      }}
                      className="bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="quantum_core">Quantum Core Matrix</option>
                      <option value="bridge_command">Bridge Command Center</option>
                      <option value="neural_lattice">Neural Lattice Array</option>
                      <option value="thermo_array">Thermo-Plasmic Array</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300">Stardate Identifier</label>
                    <input
                      type="text"
                      value={manifest.header.stardate}
                      onChange={(e) => {
                        const val = e.target.value;
                        onUpdateManifest((prev) => ({
                          ...prev,
                          header: { ...prev.header, stardate: val },
                        }));
                      }}
                      className="bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'metrics' && (
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Telemetry Override Controls
                  </div>
                  {Object.entries(metrics).map(([key, rawMetric]) => {
                    const metric = rawMetric as SystemMetric;
                    return (
                    <div key={key} className="flex flex-col gap-1 bg-white/5 p-2 rounded border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 font-semibold">{metric.label}</span>
                        <span className="text-cyan-400 font-mono font-bold">
                          {metric.value.toFixed(2)} {metric.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={metric.min}
                        max={metric.max}
                        step={(metric.max - metric.min) / 100}
                        value={metric.value}
                        onChange={(e) => onUpdateMetric(key, parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  );})}
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    LCARS & Tactical Theme Presets
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'noir-dark', name: 'Noir Dark' },
                      { id: 'quantum-cyan', name: 'Quantum Cyan' },
                      { id: 'aegis-amber', name: 'Aegis Amber' },
                      { id: 'hyperion-blue', name: 'Hyperion Blue' },
                      { id: 'obsidian-void', name: 'Obsidian Void' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          soundEngine.playChime();
                          onThemeChange(t.id as ThemeId);
                        }}
                        className={`p-2 rounded border text-left font-bold transition-all ${
                          currentTheme === t.id
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-black/30 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'macros' && (
                <div className="flex flex-col gap-3">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center justify-between">
                    <span>Macro Management</span>
                    <span className="text-cyan-400 font-mono">{macros.length} Active</span>
                  </div>

                  {/* Preset & Configuration Management */}
                  <div className="flex flex-col gap-2 p-2 bg-black/40 border border-slate-800 rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1">
                        <FileJson className="w-3 h-3 text-cyan-400" />
                        <span>Presets & Config</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleExportMacros}
                        className="flex items-center gap-1.5 py-1 px-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded text-[10px] font-bold transition-colors cursor-pointer"
                        title="Export current macro configuration as JSON"
                      >
                        <Download className="w-3 h-3 text-cyan-400" />
                        <span>EXPORT AS JSON</span>
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label 
                        htmlFor="macro-preset-file-input" 
                        className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3 text-emerald-400" />
                        <span>Import Macro Presets (.json):</span>
                      </label>
                      <input
                        id="macro-preset-file-input"
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json"
                        onChange={handleJsonFileUpload}
                        aria-label="Import macro presets"
                        className="block w-full text-[10px] text-slate-300 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-emerald-500/20 file:text-emerald-300 hover:file:bg-emerald-500/30 file:cursor-pointer border border-slate-700 rounded bg-black/50 p-1 cursor-pointer"
                      />
                    </div>

                    <div className="pt-1 border-t border-slate-800/80">
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                        Quick Setup Presets:
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {MACRO_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleApplyPreset(preset.macros, preset.name)}
                            className="px-2 py-1 bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/40 rounded text-left text-[10px] text-slate-300 hover:text-cyan-200 font-mono transition-colors truncate cursor-pointer"
                            title={`Load ${preset.macros.length} macros: ${preset.macros.join(', ')}`}
                          >
                            + {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Feedback Banner */}
                  {macroStatus && (
                    <div
                      className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 font-mono ${
                        macroStatus.startsWith('Error')
                          ? 'bg-red-500/20 border-red-500/50 text-red-300'
                          : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      }`}
                    >
                      {macroStatus.startsWith('Error') ? (
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                      )}
                      <span className="truncate">{macroStatus}</span>
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="NEW MACRO CMD (e.g. VECTOR-1)"
                      value={newMacroInput}
                      onChange={(e) => setNewMacroInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddMacro();
                      }}
                      className="flex-1 bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-cyan-400 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleAddMacro}
                      className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 font-bold rounded text-[11px] transition-colors cursor-pointer"
                    >
                      ADD
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {macros.map((macro, idx) => (
                      <div
                        key={macro}
                        className="flex items-center justify-between bg-white/5 border border-white/10 px-2.5 py-1.5 rounded text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono text-[9px]">#{idx + 1}</span>
                          <span className="text-slate-200 font-bold tracking-wide truncate max-w-[140px]">{macro}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveMacro(idx, 'up')}
                            className="p-1 rounded bg-black/40 hover:bg-white/10 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === macros.length - 1}
                            onClick={() => handleMoveMacro(idx, 'down')}
                            className="p-1 rounded bg-black/40 hover:bg-white/10 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveMacro(idx)}
                            className="p-1 rounded bg-red-500/10 hover:bg-red-500/30 text-red-400 transition-colors ml-1 cursor-pointer"
                            title="Remove Macro"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-[10px] text-slate-500 italic mt-1">
                    Changes instantly reorder and update the Quick Reply Comms Bar in the Live Comms Monitor.
                  </div>
                </div>
              )}

              {activeTab === 'actions' && (
                <div className="flex flex-col gap-2.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Quick Tactical Commands
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playChime();
                      onToggleAnomaly();
                    }}
                    className={`w-full py-2 px-3 rounded border flex items-center justify-center gap-2 font-bold transition-colors ${
                      anomalySimulated
                        ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                        : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{anomalySimulated ? 'CLEAR ANOMALY ALERT' : 'SIMULATE TACTICAL ANOMALY'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playChime();
                      onOpenVisualStudio();
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 flex items-center justify-center gap-2 font-bold transition-colors"
                  >
                    <Sliders className="w-4 h-4" />
                    <span>OPEN FULL UI BUILDER STUDIO</span>
                  </button>

                  <div className="text-[10px] text-slate-400 mt-2 text-center">
                    Handheld PADD v1.0 // Subspace Link Active
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
};
