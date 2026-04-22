import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Settings, 
  Cpu, 
  Cloud, 
  Save, 
  Globe,
  Monitor,
  Zap,
  Info
} from "lucide-react";
import { useApp } from "../../store";

export const SettingsModal: React.FC = () => {
  const { state, commands } = useApp();
  const { isSettingsOpen, settings } = state;

  const [formData, setFormData] = useState({
    ollamaUrl: settings.ollamaUrl || "http://localhost:11434",
    ollamaModel: settings.ollamaModel || "llama3",
    groqApiKey: (settings as any).groqApiKey || "",
    temperature: settings.temperature || 0.7,
  });

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    commands.updateSettings(formData);
    commands.closeSettings();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={commands.closeSettings}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-xl bg-[#1e1e1e] border border-[#3c3c3c] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
              <Settings className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Yukta System Settings</h2>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Framework Configuration · v2.0</p>
            </div>
          </div>
          <button 
            onClick={commands.closeSettings}
            className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Section: Local AI (Ollama) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-blue-400">
              <Monitor size={16} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Local AI (Ollama)</h3>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Configure your local Ollama instance. This is the preferred way to run Yukta privately.
            </p>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">Ollama URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input 
                    type="text"
                    value={formData.ollamaUrl}
                    onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                    placeholder="http://localhost:11434"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">Model Name</label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                  <input 
                    type="text"
                    value={formData.ollamaModel}
                    onChange={(e) => setFormData({ ...formData, ollamaModel: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                    placeholder="llama3, deepseek-coder, etc."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Section: Cloud AI (Groq) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Cloud size={16} />
              <h3 className="text-sm font-bold uppercase tracking-wider">Cloud AI Fallback (Groq)</h3>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              If Ollama is offline, Yukta will fallback to Groq if an API key is provided.
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">Groq API Key</label>
              <div className="relative">
                <Zap className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                <input 
                  type="password"
                  value={formData.groqApiKey}
                  onChange={(e) => setFormData({ ...formData, groqApiKey: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-blue-500/50 outline-none transition-all"
                  placeholder="gsk_..."
                />
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-white/5" />

          {/* Section: Advanced */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-white/30 uppercase tracking-widest ml-1">Generation Settings</h3>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="space-y-1">
                <span className="text-sm text-white font-medium block">Temperature</span>
                <span className="text-[10px] text-white/20 block">Controls randomness (0 = deterministic, 1 = creative)</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-24 accent-blue-500"
                />
                <span className="text-xs font-mono text-blue-400 w-8">{formData.temperature}</span>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex gap-3">
            <Info className="text-blue-400 flex-shrink-0" size={18} />
            <p className="text-[11px] text-blue-300/60 leading-normal">
              Local AI requires Ollama to be running. You can verify your connection by typing <code className="text-blue-400 font-bold">/status</code> in the AI Chat.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 bg-white/5">
          <button 
            onClick={commands.closeSettings}
            className="px-6 py-2 rounded-xl text-sm font-bold text-white/40 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
};
