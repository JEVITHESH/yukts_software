import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { 
  X, 
  ChevronDown, 
  ChevronRight,
  FileCode, 
  FileJson, 
  FileText, 
  Search, 
  GitBranch, 
  Play, 
  Blocks, 
  Bot, 
  MoreHorizontal,
  Plus,
  RefreshCw,
  FolderPlus,
  FilePlus,
  Terminal,
  Send,
  Trash2,
  Edit2,
  Copy,
  ExternalLink,
  Layers,
  Zap,
  Settings,
  Code,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';
import { useApp, PanelType } from "../../store";

// --- Sub-Panels ---

// Explorer and Search panels removed as per user request

const AIPanel = () => {
  const { state, commands } = useApp();
  const { aiMessages, mode } = state;
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages]);

  const handleSend = () => {
    if (!input.trim()) return;
    commands.execute("sendAIMessage", input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 text-[11px] uppercase tracking-wider font-bold text-white/50">AI Agent</div>
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {aiMessages.length === 0 ? (
          <div className="text-xs text-white/30 italic text-center mt-10">
            Ask me anything about your {mode === "workflow" ? "workflow" : "code"}.
          </div>
        ) : (
          aiMessages.map((msg, i) => (
            <div 
              key={i} 
              className={`p-3 rounded-lg text-sm ${
                msg.role === "assistant" 
                  ? "bg-[#3c3c3c] text-white/90" 
                  : "bg-blue-600/20 border border-blue-500/30 text-blue-100"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-50">
                {msg.role}
              </div>
              {msg.content}
            </div>
          ))
        )}
      </div>
      <div className="p-4 border-t border-[#454545]">
        <div className="relative">
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={mode === "workflow" ? "Ask about workflow..." : "Ask about code..."} 
            className="w-full bg-[#3c3c3c] border border-[#454545] rounded-lg px-3 py-2 pr-10 text-sm text-white focus:outline-none focus:border-blue-500 resize-none h-20"
          />
          <button 
            onClick={handleSend}
            className="absolute bottom-2 right-2 p-1.5 bg-blue-600 rounded-md text-white hover:bg-blue-500 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const WorkflowPanel = () => {
  const { state, commands } = useApp();
  const { workflows, activeWorkflowId, expandedFolders } = state;

  const toggleFolder = (id: string) => {
    commands.execute("toggleFolder", id);
  };

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      <div className="p-3 border-b border-[#1e1e1e] bg-[#2d2d2d]">
        <button 
          onClick={() => commands.execute("createNewWorkflow")}
          className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded border border-blue-600/30 transition-all group"
        >
          <FolderPlus size={16} className="group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Create New Folder</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="mt-1 space-y-0.5">
          {Object.entries(workflows as Record<string, any>).map(([id, wf]) => {
            const isExpanded = expandedFolders.includes(id) || activeWorkflowId === id;
            const isActive = activeWorkflowId === id;
            
            // Get files from nodes
            const nodeFiles = (wf.nodes || [])
              .filter((n: any) => ['agent', 'tool'].includes(n.type) && n.data?.fileName)
              .map((n: any) => ({
                name: n.data.fileName,
                type: n.type,
                nodeId: n.id
              }));

            // Always ensure run.py (the orchestrator) is at the top
            const files = [
              { name: wf.fileName || "run.py", type: "orchestrator", nodeId: null },
              ...nodeFiles
            ];

            return (
              <div key={id} className="flex flex-col">
                <div
                  onClick={() => {
                    commands.execute("setActiveWorkflowId", id);
                    toggleFolder(id);
                  }}
                  className={`flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-[#2a2d2e] group transition-colors ${isActive ? "bg-[#37373d] text-white" : "text-white/60"}`}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="text-xs truncate font-medium">{wf.folderName || wf.name}</span>
                </div>
                
                {isExpanded && (
                  <div className="ml-4 border-l border-white/5 pl-2 space-y-0.5 mt-0.5">
                    {files.length === 0 ? (
                      <div className="py-2 px-4 text-[10px] text-white/20 italic">
                        No files generated yet. Drag a node to start.
                      </div>
                    ) : (
                      files.map((file: any, i: number) => (
                        <div 
                          key={i}
                          onClick={(e) => {
                            e.stopPropagation();
                            commands.execute("openYuktaFile", `${wf.folderName}/${file.name}`, file.nodeId);
                          }}
                          className={`flex items-center gap-2 py-1 px-3 hover:bg-[#2a2d2e] cursor-pointer transition-colors group/file ${file.type === 'orchestrator' ? "text-blue-400 font-semibold" : "text-white/40 hover:text-blue-400"}`}
                        >
                          {file.type === 'orchestrator' ? (
                            <Play size={12} className="text-blue-400" />
                          ) : (
                            <FileCode size={12} className="text-blue-500/50 group-hover/file:text-blue-400" />
                          )}
                          <span className="text-[11px] truncate">{file.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(workflows).length === 0 && (
          <div className="p-8 text-center space-y-2 opacity-30">
            <FolderPlus size={32} className="mx-auto mb-2" />
            <div className="text-[10px] uppercase font-bold tracking-widest">No Folders</div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main SidePanel Component ---

export const SidePanel: React.FC = () => {
  const { state, commands } = useApp();
  const { activePanel, isSidebarOpen, sidePanelWidth } = state;
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
          const newWidth = e.clientX - 48; // 48px is the width of the Sidebar
          if (newWidth > 150 && newWidth < 600) {
            commands.execute("setSidePanelWidth", newWidth);
          }
          resizeRef.current = null;
        });
      }
    },
    [isResizing, commands]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const renderPanel = () => {
    switch (activePanel) {
      case "ai": return <AIPanel />;
      case "workflow": return <WorkflowPanel />;
      default: return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isSidebarOpen && activePanel && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: sidePanelWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={isResizing ? { duration: 0 } : { duration: 0.15, ease: "easeInOut" }}
          className="bg-[#252526] border-r border-[#1e1e1e] flex flex-col h-full overflow-hidden relative z-40 group/panel"
        >
          <div className="flex-1 overflow-hidden">
            {renderPanel()}
          </div>
          
          {/* Resize Handle */}
          <div
            onMouseDown={startResizing}
            className={`absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-50 ${
              isResizing ? "bg-blue-500" : "hover:bg-blue-500/30"
            }`}
          />

          {/* Close button */}
          <button 
            onClick={() => commands.toggleSidebar()}
            className="absolute top-3 right-3 p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
