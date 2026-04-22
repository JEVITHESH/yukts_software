import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useApp } from "../../store";
import { 
  Code, 
  AlertCircle, 
  Layout, 
  Save, 
  Play, 
  ChevronLeft,
  Terminal,
  FileCode,
  Download,
  Layers,
  Bot,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const WorkflowCodeEditor: React.FC = () => {
  const { state, commands } = useApp();
  const { workflowCode, isRunning, activeWorkflowId, workflows, activeFilePath } = state;
  const [codeError, setCodeError] = useState<string | null>(null);
  const isSyncingRef = useRef(false);

  const activeWorkflow = activeWorkflowId ? workflows[activeWorkflowId] : null;
  const activeWorkflowName = activeWorkflow?.name || "Untitled Workflow";

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined || isSyncingRef.current) return;
    
    // Always update the code state
    commands.setWorkflowCode(value);
    
    // Only sync back to visual graph if we are editing the main workflow file (run.py)
    const isMainWorkflowFile = activeWorkflow && activeFilePath === activeWorkflow.fileName;
    
    if (isMainWorkflowFile) {
      isSyncingRef.current = true;
      const success = commands.syncCodeToWorkflow(value);
      if (success) {
        setCodeError(null);
      }
      setTimeout(() => { isSyncingRef.current = false; }, 100);
    }
  };

  const handleManualSync = () => {
    const success = commands.syncCodeToWorkflow(workflowCode);
    if (success) {
      setCodeError(null);
      commands.addAgentLog("system", "Workflow visuals updated from code.");
    } else {
      setCodeError("Failed to build workflow. Please check your syntax.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0d0d0e] transition-all duration-500">
      {/* Premium Header */}
      <div className="h-14 bg-[#141415]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shadow-[0_4px_30px_rgba(0,0,0,0.3)] z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => commands.switchToWorkflow()}
            className="p-2 hover:bg-white/5 rounded-xl text-white/50 hover:text-white transition-all group"
            title="Back to Graph"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="flex items-center gap-3 py-1 px-3 bg-white/5 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <FileCode size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-white uppercase tracking-tighter">{activeWorkflowName}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/30 font-mono">{activeFilePath || "workflow.py"}</span>
                <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AnimatePresence>
            {codeError && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 text-red-400 text-[10px] font-bold bg-red-400/10 px-4 py-2 rounded-xl border border-red-400/20 shadow-[0_0_20px_rgba(248,113,113,0.1)]"
              >
                <AlertCircle size={14} />
                {codeError}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <AnimatePresence>
              {state.isCodeDirty && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-2"
                >
                  <button 
                    onClick={handleManualSync}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                    title="Update visual graph from code"
                  >
                    <Layout size={14} />
                    Sync to Visuals
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              onClick={() => {
                handleManualSync();
                commands.runActiveWorkflowInTerminal();
              }}
              className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] active:scale-95"
              title="Build & Run in terminal"
            >
              <Play size={14} fill="currentColor" />
              Run
            </button>
            <button 
              onClick={() => commands.exportWorkflow()}
              className="group flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-white/5 hover:border-white/20 active:scale-95"
              title="Export Project (.agw)"
            >
              <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Immersive Editor Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Abstract Background Decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-600/30 blur-[150px] rounded-full" />
          <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600/20 blur-[150px] rounded-full" />
        </div>

        <div className="flex-1 flex flex-col relative z-10">
          <div className="flex-1 px-4 py-2">
            <div className="h-full rounded-2xl overflow-hidden border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <Editor
                key={activeFilePath || 'no-file'}
                height="100%"
                defaultLanguage="python"
                path={activeFilePath || 'run.py'}
                theme="vs-dark"
                value={workflowCode}
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: true, scale: 0.8, side: 'right' },
                  fontSize: 15,
                  scrollBeyondLastLine: true,
                  automaticLayout: true,
                  padding: { top: 30, bottom: 30 },
                  lineNumbers: 'on',
                  renderLineHighlight: 'all',
                  cursorBlinking: 'expand',
                  smoothScrolling: true,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontWeight: '400',
                  lineHeight: 24,
                  letterSpacing: 0.5,
                  cursorStyle: 'line-thin',
                  renderWhitespace: 'none',
                  guides: { indentation: true },
                }}
              />
            </div>
          </div>
          
          {/* Futuristic Status Bar */}
          <div className="h-10 bg-[#141415] border-t border-white/5 text-white/40 flex items-center px-6 text-[10px] justify-between font-mono tracking-tight uppercase">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-blue-400 font-black">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                <span>Runtime: Python 3.10.x</span>
              </div>
              <div className="w-[1px] h-3 bg-white/10" />
              <div className="flex items-center gap-2">
                <Code size={12} />
                <span>Encoding: UTF-8</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <span>Ln 1, Col 1</span>
                <span>Spaces: 4</span>
              </div>
              <div className="flex items-center gap-2">
                {state.isCodeDirty ? (
                  <div className="flex items-center gap-2 text-amber-500 font-black">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <span>Unsynced Changes</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-500 font-black">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span>Synced with Visuals</span>
                  </div>
                )}
              </div>
              <div className="w-[1px] h-3 bg-white/10" />
              <div className="px-2 py-0.5 bg-white/5 rounded text-white/20 border border-white/5">
                Ready
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
