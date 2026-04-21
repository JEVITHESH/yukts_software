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
import { motion, AnimatePresence } from "motion/react";
import { useApp, PanelType } from "../store";

// --- Sub-Panels ---

const ExplorerPanel = () => {
  const { state, commands } = useApp();
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, type: string}[]>([]);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, file: any} | null>(null);

  const fetchFileList = useCallback(async () => {
    try {
      const response = await fetch('/api/files/list');
      if (response.ok) {
        const data = await response.json();
        setUploadedFiles(data.files);
      }
    } catch (err) {
      console.error("Failed to fetch file list:", err);
    }
  }, []);

  useEffect(() => {
    fetchFileList();
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('refresh-explorer', fetchFileList);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('refresh-explorer', fetchFileList);
    };
  }, [fetchFileList]);

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const content = (event.target?.result as string).split(',')[1]; // Get base64 part
          try {
            const response = await fetch('/api/files/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: `assets/${file.name}`,
                content: content,
                isBase64: true
              })
            });
            
            if (response.ok) {
              await fetchFileList(); // Refresh the list from server
              commands.execute("showToast", { message: `File ${file.name} uploaded successfully!`, type: "success" });
            } else {
              const err = await response.json();
              commands.execute("showToast", { message: `Upload failed: ${err.error}`, type: "error" });
            }
          } catch (err) {
            commands.execute("showToast", { message: "Network error during upload.", type: "error" });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleContextMenu = (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const deleteFile = async (fileName: string) => {
    try {
      const response = await fetch('/api/files/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
      if (response.ok) {
        await fetchFileList();
        commands.execute("showToast", { message: `Deleted ${fileName}`, type: "success" });
      }
    } catch (err) {
      commands.execute("showToast", { message: "Failed to delete file.", type: "error" });
    }
    setContextMenu(null);
  };

  const renameFile = async (oldName: string) => {
    const newName = prompt("Enter new name:", oldName);
    if (!newName || newName === oldName) return;
    try {
      const response = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName })
      });
      if (response.ok) {
        await fetchFileList();
        commands.execute("showToast", { message: `Renamed to ${newName}`, type: "success" });
      }
    } catch (err) {
      commands.execute("showToast", { message: "Failed to rename file.", type: "error" });
    }
    setContextMenu(null);
  };

  const copyPath = (fileName: string) => {
    // Return relative path from project root
    const relPath = `assets/${fileName}`;
    navigator.clipboard.writeText(relPath);
    commands.execute("showToast", { message: `Path copied: ${relPath}`, type: "success" });
    setContextMenu(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] relative">
      <div className="p-3 text-[11px] uppercase tracking-wider font-bold text-white/50 border-b border-[#1e1e1e] bg-[#2d2d2d] flex justify-between items-center">
        <span>Explorer</span>
        <div className="flex gap-2">
          <RefreshCw size={14} onClick={fetchFileList} className="hover:text-white cursor-pointer" />
          <FilePlus size={14} className="hover:text-white cursor-pointer" />
          <FolderPlus size={14} className="hover:text-white cursor-pointer" />
        </div>
      </div>

      {/* Assets/Uploads Section */}
      <div className="p-2 border-b border-[#1e1e1e]">
        <div className="px-2 py-1 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Assets & Data</span>
          <button 
            onClick={handleUpload}
            className="p-1 hover:bg-white/10 rounded group"
            title="Upload Files"
          >
            <Upload size={12} className="text-blue-400 group-hover:text-blue-300" />
          </button>
        </div>
        
        <div className="space-y-1">
          {uploadedFiles.length === 0 ? (
            <div 
              onClick={handleUpload}
              className="px-4 py-6 border-2 border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-white/5 cursor-pointer transition-all"
            >
              <Upload size={20} className="text-white/10" />
              <span className="text-[10px] text-white/20 font-medium">Click to upload files</span>
            </div>
          ) : (
            uploadedFiles.map((file, i) => {
              const ext = file.name.split('.').pop()?.toLowerCase();
              let Icon = FileText;
              let iconColor = "text-white/40";

              if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
                Icon = FileSpreadsheet;
                iconColor = "text-green-500/70";
              } else if (ext === 'json') {
                Icon = FileJson;
                iconColor = "text-yellow-400/70";
              } else if (['js', 'ts', 'tsx', 'jsx', 'py'].includes(ext || '')) {
                Icon = FileCode;
                iconColor = "text-blue-400/70";
              }

              return (
                <div 
                  key={i} 
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  onClick={() => {
                    commands.setActiveFile(file.name);
                    commands.switchToWorkflowCode();
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer group ${state.activeFile === file.name ? 'bg-[#37373d] ring-1 ring-blue-500/50' : 'hover:bg-[#37373d]'}`}
                >
                  <Icon size={14} className={iconColor} />
                  <span className="text-xs text-white/70 truncate">{file.name}</span>
                  <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100">
                     <button onClick={(e) => { e.stopPropagation(); deleteFile(file.name); }} className="p-1 hover:text-red-400">
                       <Trash2 size={12} />
                     </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Project Files Section */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-1 flex items-center gap-2 text-white/40 hover:text-white cursor-pointer">
          <ChevronDown size={14} />
          <span className="text-[11px] font-bold uppercase tracking-widest">Software-WEB</span>
        </div>
        <div className="mt-1">
          {[
            { name: 'main.py', icon: FileCode, color: 'text-blue-400' },
            { name: 'config.json', icon: FileJson, color: 'text-yellow-400' }
          ].map((file, i) => (
            <div 
              key={i} 
              onContextMenu={(e) => handleContextMenu(e, file)}
              onClick={() => {
                commands.setActiveFile(file.name);
                commands.switchToWorkflowCode();
              }}
              className={`flex items-center gap-2 px-6 py-1 rounded cursor-pointer group ${state.activeFile === file.name ? 'bg-[#37373d] ring-1 ring-blue-500/50' : 'hover:bg-[#37373d]'}`}
            >
              <file.icon size={14} className={file.color} />
              <span className="text-xs text-white/70">{file.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu Overlay */}
      {contextMenu && (
        <div 
          className="fixed bg-[#252526] border border-[#454545] rounded shadow-2xl py-1 z-[1000] min-w-[150px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => copyPath(contextMenu.file.name)}
            className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-blue-600 flex items-center gap-2"
          >
            <Copy size={12} />
            Copy Path
          </button>
          <button 
            onClick={() => renameFile(contextMenu.file.name)}
            className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-blue-600 flex items-center gap-2"
          >
            <Edit2 size={12} />
            Rename
          </button>
          <button 
            onClick={() => {
              commands.execute("analyzeProjectFile", `assets/${contextMenu.file.name}`);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-600 hover:text-white flex items-center gap-2 font-bold"
          >
            <Bot size={14} />
            Build Workflow with AI
          </button>
          <div className="h-[1px] bg-[#454545] my-1" />
          <button 
            onClick={() => deleteFile(contextMenu.file.name)}
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-500 hover:text-white flex items-center gap-2"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

const SearchPanel = () => {
  return (
    <div className="flex flex-col h-full bg-[#252526]">
      <div className="p-3 text-[11px] uppercase tracking-wider font-bold text-white/50 border-b border-[#1e1e1e] bg-[#2d2d2d]">Search</div>
      <div className="p-4 space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search" 
            className="w-full bg-[#3c3c3c] border border-[#454545] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Files to include</div>
        <input 
          type="text" 
          placeholder="e.g. *.ts, src/" 
          className="w-full bg-[#3c3c3c] border border-[#454545] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
};

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
  const { workflows, activeWorkflowId } = state;

  return (
    <div className="flex flex-col h-full bg-[#252526]">
      <div className="p-3 text-[11px] uppercase tracking-wider font-bold flex justify-between items-center text-white/50 border-b border-[#1e1e1e] bg-[#2d2d2d]">
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-blue-400" />
          <span>Workflow Explorer</span>
        </div>
        <Plus 
          size={14} 
          className="cursor-pointer hover:text-white transition-colors" 
          onClick={() => commands.execute("createNewWorkflow")}
          title="New Workflow"
        />
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-1.5 flex items-center justify-between hover:bg-[#37373d] cursor-pointer group">
          <div className="flex items-center gap-2">
            <ChevronDown size={14} className="text-white/40" />
            <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">My Workflows</span>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              commands.execute("createNewWorkflow");
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all flex items-center gap-1 text-[10px] font-bold uppercase"
          >
            <Plus size={12} />
            <span>New</span>
          </button>
        </div>
        
        <div className="mt-1 space-y-0.5">
          {Object.entries(workflows as Record<string, any>).map(([id, wf]) => (
            <div
              key={id}
              onClick={() => commands.execute("setActiveWorkflowId", id)}
              className={`flex items-center gap-3 py-2 px-6 cursor-pointer hover:bg-[#2a2d2e] group relative transition-colors ${activeWorkflowId === id ? "bg-[#37373d] text-white" : "text-white/60"}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${activeWorkflowId === id ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/10"}`} />
              <span className="text-sm truncate font-medium">{wf.name}</span>
              
              {activeWorkflowId === id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
              )}
              
              <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    commands.execute("setActiveWorkflowId", id);
                    commands.switchToWorkflowCode();
                  }}
                  title="View Python Code"
                  className="p-1 hover:bg-blue-500/20 rounded text-white/30 hover:text-blue-400 transition-colors"
                >
                  <Code size={12} />
                </button>
                <Settings size={12} className="text-white/30 hover:text-white" />
              </div>
            </div>
          ))}
          
          {Object.keys(workflows).length > 0 && (
            <div
              onClick={() => commands.execute("createNewWorkflow")}
              className="flex items-center gap-3 py-2.5 px-6 cursor-pointer hover:bg-[#2a2d2e] text-blue-400/60 hover:text-blue-400 transition-colors border-t border-white/5 mt-1 group"
            >
              <Plus size={14} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold uppercase tracking-widest">New Workflow</span>
            </div>
          )}
        </div>

        {Object.keys(workflows).length === 0 && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Zap size={24} className="text-white/10" />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-white/40 font-medium">No workflows found</div>
              <p className="text-[10px] text-white/20 leading-relaxed">Start by creating a new workflow to visualize your process.</p>
            </div>
            <button 
              onClick={() => commands.execute("createNewWorkflow")}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded border border-blue-600/30 transition-all"
            >
              Create New
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#1e1e1e] border-t border-[#1e1e1e]">
        <div className="flex items-center justify-between text-[10px] text-white/30 uppercase tracking-tighter">
          <span>Total Workflows</span>
          <span className="font-mono text-blue-400">{Object.keys(workflows).length}</span>
        </div>
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
      case "search": return <SearchPanel />;
      case "ai": return <AIPanel />;
      case "workflow": return <WorkflowPanel />;
      case "explorer": return <ExplorerPanel />;
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
