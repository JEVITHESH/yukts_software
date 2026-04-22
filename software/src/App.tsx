import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Bot,
  Wrench,
  Code2,
  Database,
  Layers,
  Play,
  Settings2,
  Trash2,
  X,
  ChevronRight,
  ChevronDown,
  FileCode,
  FileJson,
  FileText,
  Search,
  GitBranch,
  Bug,
  Blocks,
  Terminal as TerminalIcon,
  Cpu,
  Monitor,
  Plus,
  Info,
  AlertCircle,
  Loader2,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from 'motion/react';
import Editor from "@monaco-editor/react";
import { AppProvider, useApp, AppMode } from "./store";
import { MenuBar } from "./components/layout/MenuBar";
import { Sidebar } from "./components/layout/Sidebar";
import { SidePanel } from "./components/layout/SidePanel";
import { BottomPanel } from "./components/layout/BottomPanel";
import { AIChatPanel } from "./components/chat/AIChatPanel";
import { ConfirmationModal } from "./components/modals/ConfirmationModal";
import { PromptModal } from "./components/modals/PromptModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { WorkflowBuilder } from "./components/workflow/WorkflowBuilder";
import { WorkflowCodeEditor } from "./components/workflow/WorkflowCodeEditor";

// --- Workflow Page Component ---
const WorkflowPage = () => {
  return (
    <div className="h-full w-full">
      <WorkflowBuilder />
    </div>
  );
};

// --- Workflow Code Page Component ---
const WorkflowCodePage = () => {
  return (
    <div className="h-full w-full">
      <WorkflowCodeEditor />
    </div>
  );
};

// --- Main Layout Component ---
const MainLayout = () => {
  const { state, commands } = useApp();
  const { mode } = state;

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "2") {
        e.preventDefault();
        commands.switchToWorkflow();
      } else if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        commands.toggleSidebar();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        commands.closeTerminal();
      } else if (e.ctrlKey && e.shiftKey && e.key === "`") {
        e.preventDefault();
        commands.createTerminal();
      } else if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        commands.toggleTerminal();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        commands.setActivePanel("workflow");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commands]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      {/* Top Navigation Bar */}
      <header className="h-12 bg-[#2d2d2d] border-b border-[#1e1e1e] flex items-center px-4 justify-between z-50">
        <div className="flex items-center gap-4 h-full">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Cpu size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">AI STUDIO</span>
          </div>
          
          {/* VS Code Style Menu Bar */}
          <MenuBar />

          <div className="h-4 w-[1px] bg-white/10 mx-2" />
          <nav className="flex gap-1">
            <button
              onClick={commands.switchToWorkflow}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${(mode === "workflow" || mode === "workflow-code") ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            >
              <Zap size={14} />
              Workflow
              <span className="text-[10px] opacity-30 ml-1">Ctrl+2</span>
            </button>
            <button
              onClick={commands.toggleTerminal}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${state.isTerminalOpen ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"}`}
            >
              <TerminalIcon size={14} />
              Terminal
              <span className="text-[10px] opacity-30 ml-1">Ctrl+`</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Connected</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <SidePanel />
        <main className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {mode === "workflow" ? (
              <motion.div
                key="workflow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <WorkflowPage />
              </motion.div>
            ) : (
              <motion.div
                key="workflow-code"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <WorkflowCodePage />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        <BottomPanel key="bottom-panel" />
        <ConfirmationModal key="confirmation-modal" />
        <PromptModal key="prompt-modal" />
        <SettingsModal key="settings-modal" />
      </AnimatePresence>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
