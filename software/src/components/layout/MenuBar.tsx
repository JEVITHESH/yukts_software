import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot } from "lucide-react";
import { useApp } from "../../store";

interface MenuItem {
  label: string;
  command?: () => void;
  shortcut?: string;
  divider?: boolean;
  subItems?: MenuItem[];
  checked?: boolean;
  enabled?: (state: any) => boolean;
}

interface Menu {
  label: string;
  items: MenuItem[];
}

export const MenuBar: React.FC = () => {
  const { commands, state } = useApp();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setActiveSubMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // if (state.mode !== "editor") return null;

  const menus: Menu[] = [
    {
      label: "File",
      items: [
        { label: "Create New Folder", command: () => commands.execute("createNewWorkflow"), shortcut: "Ctrl+N" },
        { label: "Save Workflow", command: () => commands.execute("saveWorkflow"), shortcut: "Ctrl+S" },
        { label: "Run in Terminal", command: () => commands.runActiveWorkflowInTerminal(), shortcut: "Ctrl+F5" },
        { divider: true, label: "" },
        { label: "Import Project (.agw)", command: () => commands.importWorkflow(), shortcut: "Ctrl+O" },
        { label: "Export Project (.agw)", command: () => commands.exportWorkflow(), shortcut: "Ctrl+E" },
      ],
    },
    {
      label: "Run",
      items: [
        { label: "Run Workflow (Internal)", command: () => commands.runWorkflow(), shortcut: "F5" },
        { label: "Run in Terminal (.py)", command: () => commands.runActiveWorkflowInTerminal(), shortcut: "Ctrl+F5" },
        { divider: true, label: "" },
        { label: "Stop Execution", command: () => commands.stopWorkflow(), shortcut: "Shift+F5" },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Command Palette...", command: () => commands.execute("openCommandPalette"), shortcut: "Ctrl+Shift+P" },
        { label: "Open View...", command: () => commands.execute("openView") },
        { divider: true, label: "" },
        { label: "Appearance", command: () => commands.execute("toggleAppearance") },
      ],
    },
    {
      label: "Help",
      items: [
        { label: "Welcome", command: () => commands.execute("showWelcome") },
        { label: "Documentation", command: () => commands.execute("openDocumentation") },
      ],
    },
    {
      label: "AI",
      items: [
        { label: "Open Chat", command: () => commands.execute("toggleAIChat"), shortcut: "Ctrl+Alt+A" },
        { divider: true, label: "" },
        { label: "Clear Chat History", command: () => commands.execute("clearAIChat") },
      ],
    },
    {
      label: "Terminal",
      items: [
        { label: "New Terminal", command: () => commands.execute("createTerminal"), shortcut: "Ctrl+Shift+`" },
        { label: "Delete Terminal", command: () => commands.execute("closeTerminal"), shortcut: "Ctrl+Shift+W" },
        { divider: true, label: "" },
        { label: "Clear Terminal", command: () => commands.execute("clearTerminal") },
        { label: "Restart Terminal", command: () => commands.execute("restartTerminal") },
      ],
    },
  ];

  const handleMenuClick = (label: string) => {
    setActiveMenu(activeMenu === label ? null : label);
    setActiveSubMenu(null);
  };

  const handleMouseEnter = (label: string) => {
    if (activeMenu) {
      setActiveMenu(label);
      setActiveSubMenu(null);
    }
  };

  return (
    <div ref={menuRef} className="flex items-center ml-4 gap-1 h-full z-[100] flex-1">
      <div className="flex items-center gap-1">
        {menus.map((menu) => (
          <div key={menu.label} className="relative h-full flex items-center">
            <button
              onClick={() => handleMenuClick(menu.label)}
              onMouseEnter={() => handleMouseEnter(menu.label)}
              className={`px-3 py-1 text-[13px] rounded transition-colors cursor-default h-8 flex items-center ${
                activeMenu === menu.label ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {menu.label}
            </button>

            <AnimatePresence>
              {activeMenu === menu.label && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.1 }}
                  className="absolute top-full left-0 w-64 bg-[#252526] border border-[#454545] shadow-2xl rounded-sm py-1 mt-0.5 z-[1000]"
                >
                  {menu.items.map((item, idx) =>
                    item.divider ? (
                      <div key={idx} className="h-[1px] bg-[#454545] my-1 mx-2" />
                    ) : (
                      <div key={idx} className="relative group/item">
                        {(() => {
                          const isEnabled = item.enabled ? item.enabled(state) : true;
                          return (
                            <button
                              disabled={!isEnabled}
                              onClick={() => {
                                if (!isEnabled) return;
                                if (item.subItems) {
                                  setActiveSubMenu(activeSubMenu === item.label ? null : item.label);
                                } else {
                                  item.command?.();
                                  setActiveMenu(null);
                                }
                              }}
                              onMouseEnter={() => isEnabled && item.subItems && setActiveSubMenu(item.label)}
                              className={`w-full text-left px-3 py-1.5 text-[13px] flex justify-between items-center group ${
                                isEnabled 
                                  ? "text-white/90 hover:bg-[#094771] hover:text-white" 
                                  : "text-white/20 cursor-default"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-4 flex justify-center">
                                  {item.checked && <span className="text-blue-400">✓</span>}
                                </span>
                                <span>{item.label}</span>
                              </div>
                              {item.shortcut && (
                                <span className={`text-[11px] ml-4 ${isEnabled ? "text-white/40 group-hover:text-white/60" : "text-white/10"}`}>
                                  {item.shortcut}
                                </span>
                              )}
                              {item.subItems && (
                                <span className={`text-[10px] ml-2 ${isEnabled ? "text-white/40 group-hover:text-white/60" : "text-white/10"}`}>▶</span>
                              )}
                            </button>
                          );
                        })()}

                        {/* Submenu */}
                        <AnimatePresence>
                          {item.subItems && activeSubMenu === item.label && (
                            <motion.div
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -5 }}
                              className="absolute left-full top-0 w-64 bg-[#252526] border border-[#454545] shadow-2xl rounded-sm py-1 z-[1001]"
                            >
                              {item.subItems.map((sub, sIdx) => {
                                const isSubEnabled = sub.enabled ? sub.enabled(state) : true;
                                return (
                                  <button
                                    key={sIdx}
                                    disabled={!isSubEnabled}
                                    onClick={() => {
                                      if (!isSubEnabled) return;
                                      sub.command?.();
                                      setActiveMenu(null);
                                      setActiveSubMenu(null);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-[13px] flex justify-between items-center ${
                                      isSubEnabled 
                                        ? "text-white/90 hover:bg-[#094771] hover:text-white" 
                                        : "text-white/20 cursor-default"
                                    }`}
                                  >
                                    <span className="truncate">{sub.label}</span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* AI Chat Toggle in Top Bar */}
      <div className="ml-auto flex items-center pr-4">
        <button 
          onClick={() => commands.execute("toggleAIChat")}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${
            state.isAIChatOpen 
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
              : "text-white/40 hover:text-white hover:bg-white/5"
          }`}
        >
          <Bot size={14} />
          AI Assistant
        </button>
      </div>
    </div>
  );
};
