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
import { AIChatPanel } from "../chat/AIChatPanel";

// --- Sub-Panels ---

// Explorer and Search panels removed as per user request

// AIPanel removed as per user request

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
        <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2 px-2">Yukta Workflow Files</h3>
        <div className="mt-1 space-y-0.5">
          {Object.entries(workflows as Record<string, any>).map(([id, wf]) => {
            const isExpanded = expandedFolders.includes(id) || activeWorkflowId === id;
            const isActive = activeWorkflowId === id;
            
            // Get files from nodes
            const nodeFiles = (wf.nodes || [])
              .filter((n: any) => ['agent', 'tool', 'host', 'config'].includes(n.type) && n.data?.fileName)
              .map((n: any) => ({
                name: n.data.fileName,
                type: n.type,
                nodeId: n.id
              }));

            const files = [
              { name: wf.fileName || "run.py", type: "orchestrator", nodeId: null },
              ...nodeFiles
            ];

            return (
              <div key={id} className="flex flex-col">
                <div
                  className={`flex items-center gap-2 py-1.5 px-3 cursor-pointer hover:bg-[#2a2d2e] group transition-colors ${isActive ? "bg-[#37373d] text-white" : "text-white/60"}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => {
                    commands.execute("setActiveWorkflowId", id);
                    toggleFolder(id);
                  }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <span className="text-xs truncate font-medium">{wf.folderName || wf.name}</span>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt("Enter new folder name:", wf.folderName || wf.name);
                        if (newName) commands.execute("renameFolder", { id, name: newName });
                      }}
                      className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete folder "${wf.folderName || wf.name}"?`)) commands.execute("deleteFolder", id);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded text-white/40 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
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
                          className={`flex items-center gap-2 py-1 px-3 hover:bg-[#2a2d2e] cursor-pointer transition-colors group/file ${file.type === 'orchestrator' ? "text-blue-400 font-semibold" : "text-white/40 hover:text-blue-400"}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => {
                            e.stopPropagation();
                            commands.execute("openYuktaFile", `${wf.folderName}/${file.name}`, file.nodeId);
                          }}>
                            {file.type === 'orchestrator' ? (
                              <Play size={12} className="text-blue-400" />
                            ) : (
                              <FileCode size={12} className="text-blue-500/50 group-hover/file:text-blue-400" />
                            )}
                            <span className="text-[11px] truncate">{file.name}</span>
                          </div>
                          
                          {file.type !== 'orchestrator' && (
                            <div className="hidden group-hover/file:flex items-center gap-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete file "${file.name}"?`)) commands.execute("deleteFile", { wfId: id, fileName: file.name, nodeId: file.nodeId });
                                }}
                                className="p-1 hover:bg-red-500/20 rounded text-white/20 hover:text-red-400"
                              >
                                <Trash2 size={10} />
                              </button>
                            </div>
                          )}
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
      case "workflow": return <WorkflowPanel />;
      case "assistant": return <AIChatPanel />;
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
