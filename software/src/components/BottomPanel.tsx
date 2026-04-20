import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Terminal as TerminalIcon, 
  Bug, 
  ScrollText, 
  ChevronDown, 
  ChevronRight,
  Search, 
  Ban, 
  Play, 
  Square, 
  RotateCcw, 
  ArrowRight, 
  ArrowDown, 
  ArrowUp, 
  MoreHorizontal,
  Lock,
  Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "../store";

import { Terminal } from "./Terminal";

const TerminalTab = () => {
  const { state, commands } = useApp();
  const { terminals, activeTerminalId, settings, activeBottomPanel } = state;

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center px-4 py-1 border-b ${settings.theme === "light" ? "bg-slate-100 border-slate-200" : "bg-[#252526] border-[#3c3c3c]"}`}>
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {terminals.map(t => (
            <div 
              key={t.id}
              onClick={() => commands.execute("switchTerminal", t.id)}
              className={`flex items-center gap-2 px-3 py-1 text-xs cursor-pointer transition-colors ${
                activeTerminalId === t.id 
                  ? settings.theme === "light" ? "bg-white text-blue-600" : "bg-[#1e1e1e] text-white" 
                  : "hover:bg-white/5 text-white/50"
              }`}
            >
              <TerminalIcon size={12} />
              <span>{t.name}</span>
              <button
                className="ml-2 p-0.5 hover:bg-white/10 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  commands.execute("closeTerminal", t.id);
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button 
            onClick={() => commands.execute("createTerminal")}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-white/10"
            title="New Local Terminal"
          >
            <Plus size={14} />
            <span className="text-[10px] font-bold">LOCAL</span>
          </button>
          <button 
            onClick={() => commands.execute("createSshTerminal")}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors border border-white/10"
            title="New SSH Terminal"
          >
            <Plus size={14} className="text-blue-400" />
            <span className="text-[10px] font-bold text-blue-400">SSH</span>
          </button>
          <button 
            onClick={() => commands.execute("clearTerminal")}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            title="Clear Terminal"
          >
            <Trash2 size={14} />
            <span className="text-[10px] font-bold">CLEAR</span>
          </button>
        </div>
      </div>
      <div className="flex-1 bg-[#1e1e1e] relative">
        {terminals.map(t => (
          <div 
            key={t.id} 
            className={`absolute inset-0 ${activeTerminalId === t.id ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
          >
            <Terminal id={t.id} active={activeBottomPanel === "terminal" && activeTerminalId === t.id} />
          </div>
        ))}
      </div>
    </div>
  );
};

const OutputTab = () => {
  const { state, commands } = useApp();
  const { outputChannels, activeOutputChannel, settings } = state;
  const logs = outputChannels[activeOutputChannel] || [];
  const [isLocked, setIsLocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLocked && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isLocked]);

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center px-4 py-1 border-b ${settings.theme === "light" ? "bg-slate-100 border-slate-200" : "bg-[#252526] border-[#3c3c3c]"}`}>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>Show output from:</span>
          <select 
            value={activeOutputChannel}
            onChange={(e) => commands.execute("setOutputChannel", e.target.value)}
            className="bg-[#3c3c3c] border border-[#454545] rounded px-2 py-0.5 text-white outline-none"
          >
            {Object.keys(outputChannels).map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Ban size={14} className="cursor-pointer hover:text-white text-white/50" onClick={() => commands.execute("clearOutput")} title="Clear Output" />
          {isLocked ? (
            <Lock size={14} className="cursor-pointer text-blue-400" onClick={() => setIsLocked(false)} title="Unlock Scroll" />
          ) : (
            <Unlock size={14} className="cursor-pointer hover:text-white text-white/50" onClick={() => setIsLocked(true)} title="Lock Scroll" />
          )}
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-[#1e1e1e] text-white/70 whitespace-pre-wrap"
      >
        {logs.map((log, i) => {
          const isError = log.includes("ERROR:");
          return (
            <div key={i} className={`py-0.5 ${isError ? "text-red-400 font-bold" : ""}`}>
              {log}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DebugTab = () => {
  const { state, commands } = useApp();
  const { debugState, settings } = state;
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [debugState.logs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      commands.execute("logDebugMessage", `Evaluated: ${input}`);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center px-4 py-1 border-b ${settings.theme === "light" ? "bg-slate-100 border-slate-200" : "bg-[#252526] border-[#3c3c3c]"}`}>
        <div className="flex items-center gap-3">
          {debugState.isRunning ? (
            <>
              <Square size={14} className="text-red-500 cursor-pointer" onClick={() => commands.execute("stopDebugging")} />
              <RotateCcw size={14} className="text-green-500 cursor-pointer" onClick={() => commands.execute("startDebugging")} />
              <ArrowRight size={14} className="text-blue-400 cursor-pointer" title="Step Over" />
              <ArrowDown size={14} className="text-blue-400 cursor-pointer" title="Step Into" />
              <ArrowUp size={14} className="text-blue-400 cursor-pointer" title="Step Out" />
            </>
          ) : (
            <Play size={14} className="text-green-500 cursor-pointer" onClick={() => commands.execute("startDebugging")} />
          )}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Ban size={14} className="cursor-pointer hover:text-white text-white/50" onClick={() => commands.execute("clearAllBreakpoints")} title="Clear Breakpoints" />
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-[#1e1e1e] text-white/70"
      >
        {debugState.logs.map((log, i) => (
          <div key={i} className="py-0.5 border-b border-white/5 last:border-none">
            {log}
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <ChevronRight size={14} className="text-blue-400" />
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Evaluate expression..."
            className="bg-transparent border-none outline-none flex-1 text-white" 
          />
        </div>
      </div>
    </div>
  );
};

export const BottomPanel: React.FC = () => {
  const { state, commands } = useApp();
  const { isTerminalOpen, activeBottomPanel, bottomPanelHeight, settings } = state;
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resizeRef = useRef<number | null>(null);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        if (resizeRef.current) return;
        resizeRef.current = requestAnimationFrame(() => {
          // Account for the 24px footer (h-6)
          const footerHeight = 24;
          const newHeight = window.innerHeight - e.clientY - footerHeight;
          if (newHeight > 40 && newHeight < window.innerHeight * 0.8) {
            commands.execute("setBottomPanelHeight", newHeight);
          }
          resizeRef.current = null;
        });
      }
    },
    [isResizing, commands]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => resize(e);
    const handleMouseUp = () => stopResizing();

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
    };
  }, [isResizing, resize, stopResizing]);

  const renderContent = () => {
    switch (activeBottomPanel) {
      case "terminal": return <TerminalTab />;
      default: return null;
    }
  };

  return (
    <AnimatePresence>
      {isTerminalOpen && (
        <motion.div 
          initial={{ height: 0 }}
          animate={{ height: bottomPanelHeight }}
          exit={{ height: 0 }}
          transition={isResizing ? { duration: 0 } : { duration: 0.15 }}
          className={`border-t flex flex-col overflow-hidden relative z-40 ${
            settings.theme === "light" ? "bg-slate-50 border-slate-200" : "bg-[#1e1e1e] border-[#3c3c3c]"
          }`}
        >
          {/* Resize Handle - Larger hit area */}
          <div 
            onMouseDown={startResizing}
            className={`absolute top-0 left-0 right-0 h-1.5 cursor-row-resize z-50 transition-colors ${
              isResizing ? "bg-blue-500" : "hover:bg-blue-500/50"
            }`}
          />

          <div className={`flex px-4 border-b items-center h-9 ${
            settings.theme === "light" ? "bg-slate-100 border-slate-200" : "bg-[#1e1e1e] border-[#3c3c3c]"
          }`}>
            {[
              { id: "terminal", label: "TERMINAL" }
            ].map(tab => (
              <div 
                key={tab.id}
                onClick={() => commands.execute("switchBottomPanel", tab.id)}
                className={`px-4 h-full flex items-center text-[11px] font-bold tracking-wider cursor-pointer transition-all ${
                  activeBottomPanel === tab.id 
                    ? settings.theme === "light" ? "border-b-2 border-blue-600 text-blue-600" : "border-b-2 border-white text-white" 
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab.label}
              </div>
            ))}
            
            <div className="ml-auto flex items-center gap-2">
              <button 
                onClick={() => commands.execute("toggleTerminal")} 
                className="flex items-center gap-1 px-2 py-1 hover:bg-black/10 rounded text-white/40 hover:text-white transition-colors"
                title="Close Panel"
              >
                <span className="text-[10px] font-bold">CLOSE</span>
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
