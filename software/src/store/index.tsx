import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { MarkerType } from "@xyflow/react";

import Groq from "groq-sdk";



const getEnv = (key: string) => {
  try {
    const metaEnv = (import.meta as any).env;
    if (metaEnv && metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
    if (metaEnv && metaEnv[key]) return metaEnv[key];
  } catch(e) {}
  
  // Fallback to process.env (Server/CommonJS)
  try {
    return process.env[key];
  } catch(e) {}
  
  return "";
};

const GROQ_KEY = getEnv("GROQ_API_KEY");
const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY, dangerouslyAllowBrowser: true }) : null;

const AGENT_SYSTEM_PROMPT = `You are the Yukta Framework Orchestrator. 
Your task is to build autonomous multi-agent systems using the Yukta framework.

YUKTA COMPONENTS:
- Agent: The reasoning engine. Use 'from [module] import get_agent'.
- Tool: Specialized functions. Use 'tp.add_tool(create_custom_tool(...))'.
- Config: System settings. Use 'tp.config(...)'.
- Host: Deployment settings. Use 'tp.host(...)'.
- ToolProcessor: The central hub (tp = ToolProcessor()).

PROACTIVE IMPLEMENTATION RULE:
- NEVER ask if the user wants code. ALWAYS provide the full, working implementation for the orchestrator (run.py) AND every Agent and Tool you mention.
- Use a separate code block for each file.
- At the very top of each code block, include a marker: # [FILE: filename.py]

CODE STRUCTURE RULES:
1. DESIGN: Identify needed Agents, Tools, and Config.
2. MARKERS: You MUST prefix every Yukta component initialization in run.py with:
   # [AGENT] [node_id] [Agent Name] [filename.py]
   # [TOOL] [node_id] [Tool Name] [filename.py]
   # [CONFIG] [node_id] [Config Name] [filename.py]
   # [HOST] [node_id] [Host Name] [filename.py]
3. SEQUENTIAL LOGIC: Write code that reflects the flow. Use the shared ToolProcessor 'tp'.
4. IMPORTS: Always include necessary Yukta imports.

ERROR HANDLING AND FIXING:
- If a runtime error occurs, explain the root cause and provide the corrected code for the affected file(s).
- Ask for confirmation before re-running ONLY if the fix is destructive; otherwise, just provide the fix.

Example Output:
\`\`\`python
# [FILE: run.py]
from yukta import ToolProcessor, create_custom_tool, setup_logging
...
# [AGENT] agent_1 Researcher researcher.py
try:
    from researcher import get_agent
    r = get_agent()
    r.run("...")
except: pass
\`\`\`

\`\`\`python
# [FILE: researcher.py]
from yukta import YuktaFrameworkAgent
def get_agent():
    return YuktaFrameworkAgent(name="Researcher", ...)
\`\`\`
`;

export type AppMode = "workflow" | "workflow-code";
export type PanelType = "search" | "git" | "run" | "extensions" | "workflow" | "explorer" | "assistant" | null;

interface AppState {
  mode: AppMode;
  activePanel: PanelType;
  workspace: {
    name: string;
    folders: string[];
  };
  isTerminalOpen: boolean;
  isSidebarOpen: boolean;
  logs: string[];
  isRunning: boolean;
  settings: {
    theme: "dark" | "light";
    fontSize: number;
    autoSave: boolean;
    gridSnap: boolean;
    aiModel: string;
    wordWrap: boolean;
    autoLayout: boolean;
    temperature: number;
    accentColor: string;
    ollamaUrl: string;
    ollamaModel: string;
  };
  workflowErrors: string[];
  workflows: Record<string, { name: string; fileName: string; nodes: any[]; edges: any[] }>;
  activeWorkflowId: string | null;
  selectedNodeId: string | null;
  workflowCode: string;
  nodes: any[];
  edges: any[];
  isAIChatOpen: boolean;
  isAILoading: boolean;
  aiMessages: { role: "user" | "assistant"; content: string; analysis?: any }[];
  agentLogs: { type: "system" | "agent" | "error"; content: string; timestamp: number }[];
  activeNodeId: string | null;
  modal: {
    title: string;
    message: string;
    onConfirm: () => void;
  } | null;
  promptModal: {
    title: string;
    message: string;
    defaultValue?: string;
    onConfirm: (value: string) => void;
  } | null;
  sidePanelWidth: number;
  aiChatPanelWidth: number;
  workflowRightPanelWidth: number;
  expandedFolders: string[];
  explorerSearchQuery: string;
  activeBottomPanel: "terminal" | "output" | "debug";
  terminals: { id: string; name: string; logs: string[]; lastClearTime?: number; config?: { type: "local" | "ssh"; user?: string; host?: string; port?: string } }[];
  activeTerminalId: string;
  outputChannels: Record<string, string[]>;
  activeOutputChannel: string;
  debugState: {
    isRunning: boolean;
    breakpoints: number[];
    logs: string[];
  };
  bottomPanelHeight: number;
  editorInstance: any;
  isCodeDirty: boolean;
  activeFilePath: string | null;
  isSettingsOpen: boolean;
  aiPendingRequest: { prompt: string; isBuildRequest?: boolean; isCheckRequest?: boolean } | null;
}

const initialFiles = {};

const DEFAULT_SETTINGS = {
  theme: "dark" as const,
  fontSize: 14,
  autoSave: true,
  gridSnap: true,
  aiModel: "llama-3.3-70b-versatile",
  wordWrap: false,
  autoLayout: true,
  temperature: 0.7,
  accentColor: "#3b82f6",
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "llama3",
};

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<any>;
  commands: any;
}

export const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AppMode>("workflow");
  const [activePanel, setActivePanel] = useState<PanelType>("workflow");
  const [workspace, setWorkspace] = useState({ name: "Untitled Project", folders: ["src", "public"] });
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);
  const [workflowErrors, setWorkflowErrors] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const [workflows, setWorkflows] = useState<Record<string, { 
    name: string; 
    fileName: string; 
    code: string;
    nodes: any[]; 
    edges: any[] 
  }>>({});
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowCode, setWorkflowCode] = useState("");
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);
  const [isCodeDirty, setIsCodeDirty] = useState(false);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync state when activeWorkflowId changes
  React.useEffect(() => {
    if (activeWorkflowId && workflows[activeWorkflowId]) {
      console.log(`[Store] Switching to workflow: ${activeWorkflowId} (${workflows[activeWorkflowId].fileName})`);
      isInternalSyncRef.current = true;
      setNodes(workflows[activeWorkflowId].nodes || []);
      setEdges(workflows[activeWorkflowId].edges || []);
      setWorkflowCode(workflows[activeWorkflowId].code || "");
      setIsCodeDirty(false);
      setActiveFilePath(workflows[activeWorkflowId].fileName);
      
      // Reset internal sync after state update
      setTimeout(() => {
        isInternalSyncRef.current = false;
      }, 0);
    }
  }, [activeWorkflowId]); // Removed workflows dependency to prevent loops during internal updates

  // No initial workflow - workspace starts empty as per user request
  React.useEffect(() => {
    if (Object.keys(workflows).length === 0) {
      // Intentionally empty
    }
  }, []);

  // Settings & User State
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("ide-settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [modal, setModal] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [promptModal, setPromptModal] = useState<{ title: string; message: string; defaultValue?: string; onConfirm: (value: string) => void } | null>(null);
  const [sidePanelWidth, setSidePanelWidth] = useState(260);
  const [aiChatPanelWidth, setAiChatPanelWidth] = useState(320);
  const [workflowRightPanelWidth, setWorkflowRightPanelWidth] = useState(320);
  const [expandedFolders, setExpandedFolders] = useState<string[]>(["src"]);
  const [explorerSearchQuery, setExplorerSearchQuery] = useState("");
  const [activeBottomPanel, setActiveBottomPanel] = useState<"terminal" | "output">("terminal");
  const [terminals, setTerminals] = useState<{ id: string; name: string; logs: string[]; lastClearTime?: number; config?: { type: "local" | "ssh"; user?: string; host?: string; port?: string } }[]>([
    { id: "term-1", name: "bash", logs: ["Terminal ready."], lastClearTime: 0, config: { type: "local" } }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState("term-1");
  const [outputChannels, setOutputChannels] = useState<Record<string, string[]>>({
    "Workflow": [],
    "Tasks": [],
    "System": ["[System] IDE started."],
    "Build": []
  });
  const [activeOutputChannel, setActiveOutputChannel] = useState("Workflow");
  const [debugState, setDebugState] = useState({
    isRunning: false,
    breakpoints: [],
    logs: []
  });
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string; analysis?: any }[]>([]);
  const [agentLogs, setAgentLogs] = useState<{ type: "system" | "agent" | "error"; content: string; timestamp: number }[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [aiPendingRequest, setAiPendingRequest] = useState<{ prompt: string; isBuildRequest?: boolean; isCheckRequest?: boolean } | null>(null);

  const isInternalSyncRef = useRef(false);
  const lastGeneratedCodeRef = useRef("");

  const syncWorkflowToCode = useCallback((currentNodes: any[], currentEdges: any[]) => {
    if (isInternalSyncRef.current) return;
    
    // CRITICAL: Only sync if we are in workflow mode OR if the active file is the main run.py
    const activeWorkflow = activeWorkflowId ? workflows[activeWorkflowId] : null;
    const isMainFile = activeWorkflow && (!activeFilePath || activeFilePath === activeWorkflow.fileName);
    
    if (!isMainFile && mode === "workflow-code") {
      console.log("[Store] Skipping sync: Active file is not the main workflow file.");
      return;
    }

    console.log("[Store] Syncing workflow graph to code...");
    const generatedCode = generateCodeFromWorkflow(currentNodes, currentEdges);
    
    if (generatedCode !== workflowCode) {
      setWorkflowCode(generatedCode);
      lastGeneratedCodeRef.current = generatedCode;
      
      if (activeWorkflowId) {
        const wf = workflows[activeWorkflowId];
        setWorkflows(prev => ({
          ...prev,
          [activeWorkflowId]: { 
            ...prev[activeWorkflowId], 
            code: generatedCode,
            nodes: currentNodes,
            edges: currentEdges
          }
        }));

        // Rule: Automatically save the generated run.py file to disk
        if (wf && wf.folderName && wf.fileName) {
          const fullPath = `assets/${wf.folderName}/${wf.fileName}`;
          fetch("/api/files/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileName: fullPath, content: generatedCode })
          }).then(res => {
            if (res.ok) {
              console.log(`[Store] Automatically saved orchestrator to ${fullPath}`);
            }
          }).catch(err => {
            console.error("[Store] Failed to auto-save orchestrator:", err);
          });
        }
      }
    }
  }, [workflowCode, activeWorkflowId, workflows, activeFilePath, mode]);

  const generateCodeFromWorkflow = (nds: any[], eds: any[]) => {
    if (!nds || nds.length === 0) return "# Empty Workflow\n";
    
    let startNodes = nds.filter(n => !eds.some(e => e.target === n.id));
    
    // Fallback to all nodes if no roots found (cyclic)
    if (startNodes.length === 0 && nds.length > 0) {
      const startNode = nds.find(n => n.type === 'start') || nds[0];
      startNodes = [startNode];
    }
    
    if (startNodes.length === 0) return "# Error: No nodes found in workflow\n";

    const visited = new Set<string>();
    const lines: string[] = [];
    
    // 1. Imports and Setup
    lines.push("from yukta import ToolProcessor, create_custom_tool, setup_logging");
    lines.push("import logging");
    lines.push("import os");
    lines.push("");
    lines.push("# Initialize Logging");
    lines.push("setup_logging(level='INFO')");
    lines.push("");
    lines.push("# Initialize ToolProcessor");
    lines.push("tp = ToolProcessor()");
    lines.push("");
    lines.push("# --- Diagnostic Setup ---");
    lines.push("# Register Error Logger Tool");
    lines.push("try:");
    lines.push("    from error_logger_tool import log_error");
    lines.push("    tp.add_tool(create_custom_tool(");
    lines.push("        name=\"Error Logger\",");
    lines.push("        description=\"Logs system errors to a file for AI diagnostic analysis\",");
    lines.push("        parameters=[{\"name\": \"error_msg\", \"type\": \"string\"}],");
    lines.push("        function=log_error");
    lines.push("    ))");
    lines.push("except ImportError:");
    lines.push("    pass");
    lines.push("");
    lines.push("# Initialize Diagnostic Agent");
    lines.push("diag_agent = None");
    lines.push("try:");
    lines.push("    from diagnostic_agent import get_agent");
    lines.push("    diag_agent = get_agent()");
    lines.push("    diag_agent.tools_processor = tp");
    lines.push("except ImportError:");
    lines.push("    pass");
    lines.push("");
    
    // 2. Pre-register all Tools found in the workflow to the processor
    const toolNodes = nds.filter(n => n.type === 'tool');
    if (toolNodes.length > 0) {
      lines.push("# --- Tool Registration ---");
      toolNodes.forEach(n => {
        const toolModule = n.data.fileName?.replace('.py', '') || 'custom_tool';
        const funcName = n.data.function_name || 'process';
        lines.push(`# [TOOL] ${n.id} ${n.data.name || 'Tool'}`);
        lines.push(`try:`);
        lines.push(`    from ${toolModule} import ${funcName}`);
        lines.push(`    tp.add_tool(create_custom_tool(`);
        lines.push(`        name="${n.data.name || 'new_tool'}",`);
        lines.push(`        description="${(n.data.description || '').replace(/"/g, '\\"')}",`);
        lines.push(`        parameters=${JSON.stringify(n.data.parameters || [])},`);
        lines.push(`        function=${funcName}`);
        lines.push(`    ))`);
        lines.push(`    print(f"✓ Registered tool: ${n.data.name}")`);
        lines.push(`except ImportError:`);
        lines.push(`    print(f"✗ Could not import tool module: ${toolModule}")`);
        lines.push("");
      });
    }

    // 3. Workflow Traversal
    const traverse = (nodeId: string, indent = "") => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      const node = nds.find(n => n.id === nodeId);
      if (!node) return;

      switch (node.type) {
        case 'start':
          lines.push(`${indent}# --- Workflow Execution Started ---`);
          break;
        case 'config':
          lines.push(`${indent}# [CONFIG] ${node.id} ${node.data.name || 'Config'}`);
          lines.push(`${indent}tp.config(memory_type='${node.data.memory_type || 'buffer'}', logging_level='${node.data.logging_level || 'INFO'}')`);
          break;
        case 'host':
          lines.push(`${indent}# [HOST] ${node.id} ${node.data.name || 'Host'}`);
          lines.push(`${indent}tp.host(host='${node.data.host_address || '0.0.0.0'}', port=${node.data.port || 8000})`);
          break;
        case 'agent':
          const agentId = node.id.replace(/[^a-z0-9]/gi, '_');
          const agentModule = node.data.fileName?.replace('.py', '') || 'custom_agent';
          lines.push(`${indent}# [AGENT] ${node.id} ${node.data.agent_name || 'AI Assistant'}`);
          lines.push(`${indent}try:`);
          lines.push(`${indent}    from ${agentModule} import get_agent`);
          lines.push(`${indent}    agent_${agentId} = get_agent()`);
          lines.push(`${indent}    agent_${agentId}.tools_processor = tp`);
          lines.push(`${indent}    print(f"Agent ${node.data.agent_name || 'AI Assistant'} is running...")`);
          lines.push(`${indent}    agent_${agentId}.run("Execute the current task in the workflow context.")`);
          lines.push(`${indent}except ImportError:`);
          lines.push(`${indent}    print(f"✗ Could not import agent module: ${agentModule}")`);
          break;
        case 'condition':
          lines.push(`${indent}# [CONDITION] ${node.id}`);
          lines.push(`${indent}if ${node.data.condition || 'True'}:`);
          const trueEdges = eds.filter(e => e.source === nodeId && e.sourceHandle === 'true');
          trueEdges.forEach(e => traverse(e.target, indent + "    "));
          lines.push(`${indent}else:`);
          const falseEdges = eds.filter(e => e.source === nodeId && e.sourceHandle === 'false');
          falseEdges.forEach(e => traverse(e.target, indent + "    "));
          return;
        case 'for_loop':
          lines.push(`${indent}# [FOR LOOP] ${node.id}`);
          lines.push(`${indent}for ${node.data.item_var || 'item'} in ${node.data.collection || '[]'}:`);
          const loopEdges = eds.filter(e => e.source === nodeId);
          loopEdges.forEach(e => traverse(e.target, indent + "    "));
          return;
        case 'while_loop':
          lines.push(`${indent}# [WHILE LOOP] ${node.id}`);
          lines.push(`${indent}while ${node.data.condition || 'True'}:`);
          const wLoopEdges = eds.filter(e => e.source === nodeId);
          wLoopEdges.forEach(e => traverse(e.target, indent + "    "));
          return;
      }

      visited.add(nodeId);

      // Continue to next node for non-branching nodes
      const nextEdges = eds.filter(e => e.source === nodeId && (!e.sourceHandle || e.sourceHandle === 'main'));
      nextEdges.forEach(e => traverse(e.target, indent));
    };

    lines.push("\nif __name__ == '__main__':");
    lines.push("    try:");
    lines.push("        print('=== Yukta Workflow Execution ===')");
    startNodes.forEach(sn => traverse(sn.id, "        "));
    lines.push("        print('=== Workflow Completed Successfully ===')");
    lines.push("    except Exception as e:");
    lines.push("        print(f'\\n!!! CRITICAL ERROR: {str(e)}')");
    lines.push("        if diag_agent:");
    lines.push("            print('Triggering Diagnostic Agent...')");
    lines.push("            diag_agent.run(f'The system crashed with error: {str(e)}. Log this error using the Error Logger tool.')");
    lines.push("        else:");
    lines.push("            with open('error_report.txt', 'w') as f:");
    lines.push("                f.write(str(e))");
    
    // Add markers for tools at the end or top to ensure they are discovered by parser
    lines.push("\n# --- Yukta Framework Node Markers ---");
    toolNodes.forEach(n => {
      const toolModule = n.data.fileName?.replace('.py', '') || 'custom_tool';
      lines.push(`# [TOOL] ${n.id} ${n.data.name || 'Tool'} ${n.data.fileName || (toolModule + '.py')}`);
    });
    
    return lines.join("\n");
  };

  // Automated Sync Effect
  useEffect(() => {
    if (nodes.length > 0 && !isInternalSyncRef.current) {
        syncWorkflowToCode(nodes, edges);
    }
  }, [nodes, edges, syncWorkflowToCode]);

  const commands = {
    //execute removed to avoid duplicate logic

    // Mode Switching
    switchToWorkflow: () => {
      setMode("workflow");
      // When going back to graph, ensure the "main" code is ready for the next time we enter code mode
      if (activeWorkflowId) {
        const wf = workflows[activeWorkflowId];
        if (wf) {
          const mainPath = wf.folderName ? `${wf.folderName}/${wf.fileName}` : wf.fileName;
          setActiveFilePath(mainPath);
          setWorkflowCode(wf.code || "");
        }
      }
    },
    switchToWorkflowCode: () => {
      setMode("workflow-code");
      // If no file is open, open the main one
      if (activeWorkflowId) {
        const wf = workflows[activeWorkflowId];
        if (wf) {
          // If activeFilePath is null or doesn't belong to this workflow, open the main file
          const mainFilePath = wf.folderName ? `${wf.folderName}/${wf.fileName}` : wf.fileName;
          if (!activeFilePath || (wf.folderName && !activeFilePath.startsWith(wf.folderName))) {
            commands.openYuktaFile(mainFilePath);
          }
        }
      }
    },
    
    // Panel Management
    setActivePanel: (panel: PanelType) => {
      if (activePanel === panel && isSidebarOpen) {
        setIsSidebarOpen(false);
      } else {
        setActivePanel(panel);
        setIsSidebarOpen(true);
        if (panel === "workflow") setMode("workflow");
      }
    },
    setMode: (m: AppMode) => setMode(m),

    // Folder Management
    createNewFolder: (parentPath?: string) => {
      commands.openPromptModal({
        title: "New Folder",
        message: "Enter folder name:",
        defaultValue: parentPath ? `${parentPath}/` : "",
        onConfirm: (name) => {
          if (!name) return;
          setWorkspace(prev => ({ ...prev, folders: [...prev.folders, name] }));
          setExpandedFolders(prev => [...new Set([...prev, name])]);
        }
      });
    },
    toggleFolder: (folderPath: string) => {
      setExpandedFolders(prev => 
        prev.includes(folderPath) 
          ? prev.filter(f => f !== folderPath) 
          : [...prev, folderPath]
      );
    },
    refreshExplorer: () => {
      console.log("Refreshing explorer...");
      setLogs(prev => [...prev, "[System] Refreshing workspace..."]);
    },
    openFolder: () => {
      commands.openPromptModal({
        title: "Open Folder",
        message: "Enter folder path to open:",
        onConfirm: (folder) => {
          if (!folder) return;
          setWorkspace(prev => ({ ...prev, folders: [...prev.folders, folder] }));
          setActivePanel("workflow");
        }
      });
    },
    openWorkspace: (file?: string) => {
      console.log("Opening workspace:", file || "default");
      setWorkspace({ name: "Restored Workspace", folders: ["src", "lib", "components"] });
    },
    addFolderToWorkspace: () => {
      commands.openPromptModal({
        title: "Add Folder",
        message: "Folder to add:",
        onConfirm: (folder) => {
          if (folder) setWorkspace(prev => ({ ...prev, folders: [...prev.folders, folder] }));
        }
      });
    },
    toggleAutoSave: () => {
      const newValue = !settings.autoSave;
      commands.updateSetting("autoSave", newValue);
    },
    closeWindow: () => {
      window.location.reload();
    },
    openPromptModal: (config: { title: string; message: string; defaultValue?: string; onConfirm: (value: string) => void }) => {
      setPromptModal(config);
    },

    // UI Toggles
    toggleTerminal: () => setIsTerminalOpen(prev => !prev),
    toggleSidebar: () => setIsSidebarOpen(prev => !prev),
    switchBottomPanel: (panel: "terminal" | "output") => {
      setActiveBottomPanel(panel);
      setIsTerminalOpen(true);
    },
    setBottomPanelHeight: (height: number) => setBottomPanelHeight(height),
    setSidePanelWidth: (width: number) => setSidePanelWidth(width),

    // Settings & User Commands
    updateSetting: (key: string, value: any) => {
      setSettings((prev: any) => {
        const next = { ...prev, [key]: value };
        localStorage.setItem("ide-settings", JSON.stringify(next));
        return next;
      });
    },
    toggleAIChat: () => commands.setActivePanel("assistant"),
    clearAIChat: () => setAiMessages([]),
    toggleSettings: () => setIsSettingsOpen(prev => !prev),
    closeSettings: () => setIsSettingsOpen(false),
    updateSettings: (newSettings: any) => setSettings((prev: any) => ({ ...prev, ...newSettings })),
    validatePythonCode: (code: string) => {
      const errors: string[] = [];
      const lines = code.split('\n');
      
      // 1. Basic Indentation check
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        
        const indent = line.match(/^\s*/)?.[0].length || 0;
        if (indent % 4 !== 0) {
          errors.push(`Line ${i+1}: Indentation should be 4 spaces (found ${indent}).`);
        }
      });

      // 2. Colon check
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        
        const isBlockStart = /^(def|if|elif|else|while|for|class|try|except|finally)\b/.test(trimmed);
        if (isBlockStart && !trimmed.endsWith(':') && !trimmed.includes(':#')) {
           errors.push(`Line ${i+1}: Missing colon ':' at the end of '${trimmed.split(' ')[0]}' statement.`);
        }
      });

      // 3. Parentheses check
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push(`Mismatch in parentheses: ${openParens} open vs ${closeParens} closed.`);
      }

      // 4. Bracket check
      const openBrackets = (code.match(/\[/g) || []).length;
      const closeBrackets = (code.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        errors.push(`Mismatch in square brackets: ${openBrackets} open vs ${closeBrackets} closed.`);
      }

      return errors;
    },
    sendAIMessage: async (content: string, forceChoice?: 'clear' | 'reuse') => {
      const lowerContent = content.toLowerCase();
      const isBuildRequest = /build|create|write|implement|make|generate|code for|script for|program|workflow for|fix|resolve|correct|repair/i.test(content);
      const isCheckRequest = /check|verify|analyze|explain|debug/i.test(content);
      
      // Rule: If nodes already exist, ask the user whether to clear or reuse
      if (nodes.length > 0 && !forceChoice && (isBuildRequest || isCheckRequest)) {
        setAiPendingRequest({ prompt: content, isBuildRequest, isCheckRequest });
        setAiMessages(prev => [...prev, 
          { role: "user", content: content, timestamp: Date.now() },
          { 
            role: "assistant", 
            content: "⚠️ **Existing Workflow Detected**\n\nI see you already have nodes in your workspace. Would you like me to **Clear** the current workflow and start fresh, or **Reuse** the existing nodes and build on top of them?",
            analysis: { intentType: "choice-required" },
            timestamp: Date.now() 
          }
        ]);
        return;
      }

      if (forceChoice === 'clear') {
        setNodes([]);
        setEdges([]);
        setWorkflowCode("");
        setIsCodeDirty(false);
      }
      
      setAiPendingRequest(null);
      setIsAILoading(true);

      const newMessage = { 
        role: "user" as const, 
        content,
        timestamp: Date.now()
      };
      
      // Don't add user message again if it was already added during choice prompt
      if (!forceChoice) {
        setAiMessages(prev => [...prev, newMessage]);
      }

      if (content.trim().toLowerCase() === "/status") {
        const ollamaUrl = (settings as any).ollamaUrl || "http://localhost:11434";
        const groqApiKey = (settings as any).groqApiKey || GROQ_KEY || "";
        
        let statusText = "🔍 **Yukta AI Status Check**\n\n";
        
        try {
          const start = Date.now();
          const ollamaRes = await fetch(`${ollamaUrl}/api/tags`).catch(() => null);
          const end = Date.now();
          
          if (ollamaRes && ollamaRes.ok) {
            statusText += `✅ **Ollama:** Online (${end - start}ms)\n   - URL: ${ollamaUrl}\n   - Model: ${(settings as any).ollamaModel || "llama3"}\n`;
          } else {
            statusText += `❌ **Ollama:** Offline\n   - Attempted: ${ollamaUrl}\n`;
          }
        } catch(e) {
          statusText += `❌ **Ollama:** Error (${(e as any).message})\n`;
        }
        
        if (groqApiKey) {
          statusText += `✅ **Groq:** Key Configured\n`;
        } else {
          statusText += `⚠️ **Groq:** No Key Found (Fallback disabled)\n`;
        }
        
        setAiMessages(prev => [...prev, { role: "assistant", content: statusText, timestamp: Date.now() }]);
        setIsAILoading(false);
        return;
      }

      // Full system prompt shown in UI
      const systemPromptText = AGENT_SYSTEM_PROMPT;

      const mandatoryInstruction = "\n\n(IMPORTANT: You MUST include the full Python code for this request in a ```python ... ``` block. Use variable assignment, if/else, and loops as needed.)";

      const finalPromptContent = content + (isBuildRequest || isCheckRequest ? mandatoryInstruction : "");

      try {
        const hasInput = lowerContent.includes("input") || lowerContent.includes("enter") || lowerContent.includes("ask");
        const hasCondition = lowerContent.includes("if") || lowerContent.includes("check") || lowerContent.includes("even") || lowerContent.includes("odd") || lowerContent.includes("compare");
        const hasLoop = lowerContent.includes("loop") || lowerContent.includes("repeat") || lowerContent.includes("while") || lowerContent.includes("for");
        const hasDB = lowerContent.includes("database") || lowerContent.includes("sql") || lowerContent.includes("save") || lowerContent.includes("store");
        const hasAPI = lowerContent.includes("api") || lowerContent.includes("weather") || lowerContent.includes("fetch") || lowerContent.includes("http");

        let agentAnalysis = "";
        let nodesUsed: string[] = ["Start", "End"];
        let customNodeNeeded = "";
        let intentType = "query";

        // Determine if user gave code or a workflow request
        const looksLikeCode = /def |import |print\(|#/.test(content);
        const looksLikeWorkflow = /node|workflow|step|pipeline|trigger|action/i.test(content);

        if (isBuildRequest || looksLikeWorkflow) {
          intentType = "build";
          agentAnalysis = `USER NEED: ${content.substring(0, 100)}...\nAGENT THINKING: Detected Yukta orchestration request → mapping to Agents and Tools and generating Python orchestrator.`;
          nodesUsed.push("Yukta Agent Node");
          nodesUsed.push("Yukta Tool Node");
        } else if (looksLikeCode) {
          intentType = "code-to-workflow";
          agentAnalysis = `USER NEED: Convert provided code to structured workflow.\nAGENT THINKING: Code pattern detected → parsing into step-by-step node graph.`;
        } else {
          agentAnalysis = `USER NEED: ${content.substring(0, 100)}\nAGENT THINKING: Architectural query — providing structured guidance.`;
        }

        let aiResponseText = "";
        
        const groqApiKey = (settings as any).groqApiKey || GROQ_KEY || "";
        const ollamaUrl = (settings as any).ollamaUrl || "http://localhost:11434";
        const ollamaModel = (settings as any).ollamaModel || "llama3";

        try {
          // ─── Try Ollama First ───────────────────────────────────────────────
          const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: ollamaModel,
              messages: [
                { role: "system", content: systemPromptText },
                ...aiMessages.map((m: any) => ({ role: m.role, content: m.content })),
                { role: "user", content: `Current Workflow Code:\n\`\`\`python\n${workflowCode}\n\`\`\`\n\nUser Request: ${finalPromptContent}` }
              ],
              stream: false,
              options: {
                temperature: (settings as any).temperature || 0.5,
              }
            })
          });

          if (ollamaResponse.ok) {
            const data = await ollamaResponse.json();
            aiResponseText = data.message?.content || "No response from Ollama.";
          } else {
            throw new Error(`Ollama responded with status: ${ollamaResponse.status}`);
          }
        } catch (ollamaErr: any) {
          console.warn("Ollama connection failed, attempting Groq fallback...", ollamaErr);
          
          if (groqApiKey) {
            try {
              const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${groqApiKey}`
                },
                body: JSON.stringify({
                  model: "llama-3.3-70b-versatile",
                  messages: [
                    { role: "system", content: systemPromptText },
                    ...aiMessages.map((m: any) => ({ role: m.role, content: m.content })),
                    { role: "user", content: `Current Workflow Code:\n\`\`\`python\n${workflowCode}\n\`\`\`\n\nUser Request: ${finalPromptContent}` }
                  ],
                  temperature: 0.5,
                  max_tokens: 2048
                })
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Groq API Error: ${response.status} — ${(errorData as any).error?.message || response.statusText}`);
              }

              const data = await response.json();
              aiResponseText = data.choices ? data.choices[0].message.content : "No response from AI.";
            } catch (e: any) {
              console.error("Groq Fetch Error:", e);
              aiResponseText = `⚠️ Connection Error:\nOllama: ${ollamaErr.message}\nGroq: ${e.message}\n\nPlease ensure Ollama is running at ${ollamaUrl} or verify your Groq API key.`;
            }
          } else {
            aiResponseText = `⚠️ No AI Service Available:\nOllama failed to connect at ${ollamaUrl}. Please ensure it's running with 'ollama serve'.\n\nAlternatively, add a Groq API key in Settings for cloud-based intelligence.`;
          }
        }

        // Extract all Python code blocks from AI response
        const codeBlocks: { fileName: string, code: string }[] = [];
        const pythonBlockRegex = /```python\n?([\s\S]*?)```/g;
        let pMatch;
        while ((pMatch = pythonBlockRegex.exec(aiResponseText)) !== null) {
          const rawCode = pMatch[1].trim();
          const fileMarkerMatch = rawCode.match(/^#\s*\[FILE:\s*([\w.]+)\s*\]/m);
          const fileName = fileMarkerMatch ? fileMarkerMatch[1] : (codeBlocks.length === 0 ? "run.py" : "");
          codeBlocks.push({ fileName, code: rawCode });
        }

        // Fallback for generic blocks if no python blocks found
        if (codeBlocks.length === 0) {
          const genericBlockRegex = /```\n?([\s\S]*?)```/g;
          let gMatch;
          while ((gMatch = genericBlockRegex.exec(aiResponseText)) !== null) {
             const rawCode = gMatch[1].trim();
             if (rawCode.includes("def ") || rawCode.includes("import ") || rawCode.includes("#")) {
               const fileMarkerMatch = rawCode.match(/^#\s*\[FILE:\s*([\w.]+)\s*\]/m);
               const fileName = fileMarkerMatch ? fileMarkerMatch[1] : (codeBlocks.length === 0 ? "run.py" : "");
               codeBlocks.push({ fileName, code: rawCode });
             }
          }
        }

        const runCodeObj = codeBlocks.find(b => b.fileName === "run.py") || codeBlocks[0];
        let extractedCode = runCodeObj ? runCodeObj.code : "";
        
        // If still no code, try the line-by-line heuristic as a last resort
        if (!extractedCode) {
          const lines = aiResponseText.split("\n");
          const codeLines: string[] = [];
          let foundLikelyCode = false;
          
          for (const line of lines) {
            const l = line.trim();
            if (!l) {
              if (foundLikelyCode) codeLines.push(line);
              continue;
            }
            
            const isCodeLike = 
              l.includes("=") || l.includes("print(") || l.includes("def ") || 
              l.includes("import ") || l.includes("if ") || l.includes("elif ") || 
              l.includes("else:") || l.includes("for ") || l.includes("while ") || 
              l.startsWith("#") || l.startsWith("'''") || l.startsWith("\"\"\"") ||
              line.startsWith("    ") || line.startsWith("\t");

            if (isCodeLike) {
              foundLikelyCode = true;
              codeLines.push(line);
            } else if (foundLikelyCode) {
              if (l.split(" ").length > 8 && !l.includes("(")) break;
              codeLines.push(line);
            }
          }
          
          if (codeLines.length >= 1) {
            extractedCode = codeLines.join("\n").trim();
            codeBlocks.push({ fileName: "run.py", code: extractedCode });
          }
        }

        if (extractedCode) {
          // 1. Parse the extracted code to workflow nodes/edges immediately
          const { nodes: newNodes, edges: newEdges } = commands.parseCodeToWorkflow(extractedCode);

          // 2. Determine target workflow ID
          let targetWorkflowId = activeWorkflowId;
          const isNewWorkflow = !targetWorkflowId;
          let folderName = "";

          if (isNewWorkflow) {
            targetWorkflowId = `wf-${Date.now()}`;
            folderName = `AI_Project_${Date.now().toString().slice(-4)}`;
            setWorkspace(prev => ({ ...prev, folders: [...prev.folders, folderName] }));
            setExpandedFolders(prev => [...new Set([...prev, targetWorkflowId!])]);
          } else {
            const wf = workflows[targetWorkflowId!];
            if (wf && wf.folderName) folderName = wf.folderName;
          }

          // 3. Update all related states in a coordinated way
          // We set workflowCode first. Then update nodes/edges.
          // Because syncWorkflowToCode is in a useEffect on nodes/edges,
          // we should be careful about order.
          
          if (isCodeDirty) {
            agentAnalysis += "\n⚠️ Code skipped: You have manual edits. Click 'Sync to Visuals' or 'Reset' to allow AI updates.";
            setLogs(prev => [...prev, "[AI] Code update skipped to preserve manual edits."]);
          } else {
            setWorkflowCode(extractedCode);
            setWorkflowErrors(commands.validatePythonCode(extractedCode));
            setNodes(newNodes);
            setEdges(newEdges);

            setWorkflows((prev: any) => {
              const updatedWorkflows = { ...prev };
              const existing = updatedWorkflows[targetWorkflowId!];
              const fName = isNewWorkflow ? folderName : existing?.folderName;
              
              updatedWorkflows[targetWorkflowId!] = { 
                name: isNewWorkflow ? "AI Generated Workflow" : (existing?.name || "AI Updated Workflow"), 
                folderName: fName,
                fileName: existing?.fileName || `run.py`,
                code: extractedCode,
                nodes: newNodes, 
                edges: newEdges 
              };
              return updatedWorkflows;
            });

            if (isNewWorkflow) {
              setActiveWorkflowId(targetWorkflowId!);
            }
            
            // Switch to code view so the user can see the generated code
            setMode("workflow-code");
            setActivePanel("ai"); // Keep AI chat open
            
            agentAnalysis += "\n✅ AI Logic Ready: Workflow and Python code generated.";
            setIsCodeDirty(false); // AI generated code is fresh

            // Create physical files
            if (folderName) {
              // 0. Provision Diagnostic Infrastructure
              commands.provisionDiagnosticFiles(folderName);

              // 1. Create main run.py
              fetch("/api/files/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: `assets/${folderName}/run.py`, content: extractedCode })
              }).catch(console.error);

              // 2. Iterate through parsed nodes and create their physical files if they are Yukta nodes
              newNodes.forEach((node: any) => {
                const isYuktaNode = ['agent', 'tool', 'config', 'host', 'diagnostic'].includes(node.type);
                if (isYuktaNode) {
                  // Ensure they have a fileName
                  if (!node.data.fileName) {
                    const label = node.data.label?.replace(/\s+/g, '_').toLowerCase() || node.type;
                    node.data.fileName = `${label}_${Date.now().toString().slice(-4)}.py`;
                  }

                  // Look for specific code for this file from the AI response blocks
                  const specificCodeObj = codeBlocks.find(b => b.fileName === node.data.fileName);
                  if (specificCodeObj) {
                    node.data.code = specificCodeObj.code;
                  }

                  // Create the file
                  commands.createYuktaFile(node.type as any, node.data.fileName, node.data, node.id, folderName);
                }
              });
            }
          }
        }

        const assistantMessage = {
          role: "assistant" as const,
          content: aiResponseText,
          timestamp: Date.now(),
          analysis: {
            systemPrompt: systemPromptText,
            intentType,
            humanRequirement: content,
            agentAnalysis,
            nodesUsed,
            customNodeNeeded,
            codeGenerated: codeBlocks.length > 0,
            errors: extractedCode ? commands.validatePythonCode(extractedCode) : []
          }
        };

        setAiMessages(prev => [...prev, assistantMessage]);
        setIsAILoading(false);
      } catch (error: any) {
        console.error("AI System Critical Error:", error);
        setIsAILoading(false);
        setAiMessages(prev => [...prev, { 
          role: "assistant", 
          content: `⚠️ Internal Error: ${error.message}. The Yukta engine encountered a critical failure.`,
          timestamp: Date.now()
        }]);
        setLogs(prev => [...prev, `[AI Error] ${error.message}`]);
      }
    },

    analyzeProjectFile: async (filePath: string) => {
      commands.addAgentLog("system", `Agent is analyzing file: ${filePath}`);
      setActivePanel("ai");
      setIsAILoading(true);
      
      try {
        // We'll use a hypothetical /api/files/read or similar. 
        // For now, let's assume we can fetch it.
        const response = await fetch(`/api/files/read?path=${encodeURIComponent(filePath)}`);
        if (!response.ok) throw new Error("Failed to read file from server.");
        
        const data = await response.json();
        const isBinary = data.isBinary;
        const fileContent = data.content || "";
        const fileExt = filePath.split('.').pop()?.toLowerCase();

        let promptText = `I have a file at path "${filePath}" with the following content:\n\n${isBinary ? "[Binary data - see instructions below]" : fileContent.substring(0, 5000)}\n\nPlease analyze this file and build a complete workflow to process its data.`;
        
        if (fileExt === 'csv' || fileExt === 'xlsx' || fileExt === 'xls') {
          promptText = `I have uploaded a data file: ${filePath}.\nType: ${isBinary ? 'Binary Excel' : 'Text CSV'}\n\nTASK: Create a workflow that reads this file using pandas, iterates through rows, and generates Python code. If binary, use 'engine="openpyxl"'.\n\nFile Path to use: "assets/${filePath.split('/').pop()}"`;
        } else if (fileExt === 'json') {
          promptText = `I have uploaded a JSON file: ${filePath}.\n\nContent:\n${fileContent.substring(0, 3000)}\n\nTASK: Create a workflow that parses this JSON file and processes its data. Generate the Python code to read and analyze it.`;
        } else if (fileExt === 'txt' || fileExt === 'md') {
          promptText = `I have uploaded a text file: ${filePath}.\n\nContent:\n${fileContent.substring(0, 3000)}\n\nTASK: Create a workflow that reads this text file and performs analysis on its content.`;
        }

        await commands.sendAIMessage(promptText);
      } catch (err: any) {
        setIsAILoading(false);
        commands.addAgentLog("error", `Analysis failed: ${err.message}`);
        setAiMessages(prev => [...prev, { 
          role: "assistant", 
          content: `❌ I couldn't analyze the file "${filePath}". Error: ${err.message}`,
          timestamp: Date.now()
        }]);
      }
    },

    clearAIChat: () => {
      setAiMessages([{ role: "assistant", content: "Chat cleared. How can I help you?" }]);
      setAiPendingRequest(null);
    },

    // Workflow Actions
    setNodes: (nds: any) => {
      setNodes(prev => {
        const next = typeof nds === 'function' ? nds(prev) : nds;
        const result = Array.isArray(next) ? next : prev;
        
        // Node changes now ONLY affect the visual state, never the code.
        // This enforces the 'Code as Source of Truth' guideline.

        // Sync back to workflows map
        if (activeWorkflowId) {
          setWorkflows(prevWfs => ({
            ...prevWfs,
            [activeWorkflowId]: { ...prevWfs[activeWorkflowId], nodes: result }
          }));
        }

        return result;
      });
    },
    setEdges: (eds: any) => {
      setEdges(prev => {
        const next = typeof eds === 'function' ? eds(prev) : eds;
        const result = Array.isArray(next) ? next : prev;
        
        // Edge changes now ONLY affect the visual state, never the code.

        // Sync back to workflows map
        if (activeWorkflowId) {
          setWorkflows(prevWfs => ({
            ...prevWfs,
            [activeWorkflowId]: { ...prevWfs[activeWorkflowId], edges: result }
          }));
        }

        return result;
      });
    },
    setSelectedNodeId,
    setWorkflowCode: (code: string) => {
        setWorkflowCode(code);
        setIsCodeDirty(true);
        
        // Revalidate code for errors
        const errors = commands.validatePythonCode(code);
        setWorkflowErrors(errors);
        
        // Sync back to workflows map
        if (activeWorkflowId) {
          setWorkflows(prevWfs => ({
            ...prevWfs,
            [activeWorkflowId]: { ...prevWfs[activeWorkflowId], code: code }
          }));
        }
    },
    setCodeDirty: (dirty: boolean) => setIsCodeDirty(dirty),
    syncWorkflowToCode: (nds: any[], eds: any[]) => syncWorkflowToCode(nds, eds),
    
    // Pure parser that returns nodes and edges without side effects
    parseCodeToWorkflow: (code: string) => {
      const newNodes: any[] = [];
      const newEdges: any[] = [];
      if (!code || !code.trim()) return { nodes: newNodes, edges: newEdges };

      try {
        let processedLines = code.split("\n");
        const defIndex = processedLines.findIndex(l => /^def\s+\w+/.test(l.trim()));
        if (defIndex !== -1) {
          const defLine = processedLines[defIndex];
          const defIndent = defLine.search(/\S/);
          let blockEnd = processedLines.length;
          for(let i = defIndex + 1; i < processedLines.length; i++) {
             const line = processedLines[i];
             if (line.trim() && line.search(/\S/) <= defIndent) {
                blockEnd = i;
                break;
             }
          }
          const body = processedLines.slice(defIndex + 1, blockEnd)
            .map(l => l.startsWith("    ") ? l.slice(4) : l.startsWith("\t") ? l.slice(1) : l);
          processedLines = [...body, ...processedLines.slice(blockEnd)];
        }

        const lines = processedLines;
        let nodeCount = 0;
        const indentLevelCounts: Record<number, number> = {};

        const getPos = (indent = 0) => {
          const depth = (indent / 4);
          const indexInSequence = nodeCount;
          nodeCount++;
          
          // More compact spacing
          const x = indexInSequence * 260; 
          const y = 100 + (depth * 150);
          return { x, y };
        };

        const addEdge = (from: string, to: string, label?: string, sourceHandle?: string) => {
          // Avoid duplicate edges
          if (newEdges.find(e => e.source === from && e.target === to && e.sourceHandle === sourceHandle)) return;
          
          newEdges.push({
            id: `e-${from}-${to}-${sourceHandle || 'main'}-${Math.random().toString(36).substr(2, 4)}`,
            source: from, 
            target: to, 
            sourceHandle: sourceHandle || 'main',
            targetHandle: 'input',
            label, 
            type: "smoothstep", 
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "#4f46e5" },
            style: { stroke: "#4f46e5", strokeWidth: 2, opacity: 0.6 }
          });
        };

        let previousNodeId: string | null = null;

        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("def ")) return;
          
          // Only process lines with Yukta markers OR explicit initialization
          const isMarker = trimmed.startsWith("# [AGENT]") || trimmed.startsWith("# [TOOL]") || trimmed.startsWith("# [CONFIG]") || trimmed.startsWith("# [HOST]");
          const isInit = /=\s*(get_agent|Agent|Tool|Config|Host)\(/.test(trimmed) || /tp\.(add_tool|config|host)\(/.test(trimmed);
          
          if (!isMarker && !isInit) return;
          
          let nodeId = `node-${idx}-${Math.random().toString(36).substr(2, 4)}`;
          let type = "custom";
          let data: any = { label: trimmed, synced: true };

          if (isMarker) {
            const parts = trimmed.split(" ");
            const markerType = parts[1].replace("[", "").replace("]", "").toLowerCase();
            type = markerType;
            nodeId = parts[2] || nodeId;
            
            // Format: # [TYPE] [id] [Name...] [filename.py]
            // We assume the last part is filename if it ends in .py
            let nameParts = parts.slice(3);
            let fileName = "";
            if (nameParts.length > 0 && nameParts[nameParts.length - 1].endsWith(".py")) {
              fileName = nameParts.pop()!;
            }
            
            const name = nameParts.join(" ") || markerType.charAt(0).toUpperCase() + markerType.slice(1);
            data = { 
              ...data, 
              label: name,
              fileName: fileName || `${name.toLowerCase().replace(/\s+/g, '_')}.py`,
              agent_name: name,
              name: name
            };
          } else {
            // Heuristic for implicit initialization
            if (/get_agent|Agent/.test(trimmed)) type = "agent";
            else if (/add_tool|Tool/.test(trimmed)) type = "tool";
            else if (/config|Config/.test(trimmed)) type = "config";
            else if (/host|Host/.test(trimmed)) type = "host";

            const match = trimmed.match(/(\w+)\s*=/);
            const name = match ? match[1] : type.charAt(0).toUpperCase() + type.slice(1);
            data = { 
              ...data, 
              label: name,
              fileName: `${name.toLowerCase()}_${type}.py`,
              agent_name: name,
              name: name
            };
          }

          newNodes.push({ id: nodeId, type, position: getPos(newNodes.length), data });

          if (previousNodeId) {
             addEdge(previousNodeId, nodeId);
          }
          previousNodeId = nodeId;
        });

        // Final End node - Removed for Yukta compatibility


      } catch (e) {
        console.error("Parse error:", e);
      }
      return { nodes: newNodes, edges: newEdges };
    },

    syncCodeToWorkflow: (code: string) => {
      isInternalSyncRef.current = true;
      const { nodes: newNodes, edges: newEdges } = commands.parseCodeToWorkflow(code);
      if (newNodes.length > 0) {
        setNodes(newNodes);
        setEdges(newEdges);
        lastGeneratedCodeRef.current = code; // Mark this as the current code state
        
        if (activeWorkflowId) {
          setWorkflows(prev => ({
            ...prev,
            [activeWorkflowId]: { 
              ...prev[activeWorkflowId], 
              nodes: newNodes, 
              edges: newEdges,
              code: code,
              fileName: activeFilePath || prev[activeWorkflowId].fileName
            }
          }));
        }
        setIsCodeDirty(false); // Successfully synced to visuals, no longer 'dirty' relative to visuals
        setTimeout(() => { isInternalSyncRef.current = false; }, 200);
        return true;
      }
      isInternalSyncRef.current = false;
      return false;
    },

    setActiveWorkflowId: (id: string) => {
      setActiveWorkflowId(id);
      const wf = workflows[id];
      if (wf) {
        setActiveFilePath(wf.fileName);
      }
      setMode("workflow");
      setActivePanel("workflow");
    },
    openYuktaFile: async (filePath: string, nodeId?: string) => {
      const fullPath = filePath.startsWith('assets/') ? filePath : `assets/${filePath}`;
      console.log(`[Store] Opening Yukta file: ${fullPath}`);
      try {
        const response = await fetch(`/api/files/read?path=${encodeURIComponent(fullPath)}`);
        if (!response.ok) throw new Error("Failed to read file.");
        const data = await response.json();
        
        isInternalSyncRef.current = true;
        setWorkflowCode(data.content || "");
        setActiveFilePath(filePath);
        if (nodeId) setSelectedNodeId(nodeId);
        setMode("workflow-code");
        setIsCodeDirty(false);
        
        // Use a slightly longer timeout to ensure re-render completes before allowing sync
        setTimeout(() => { 
          isInternalSyncRef.current = false; 
          console.log(`[Store] File loaded and sync protection released for ${filePath}`);
        }, 300);
      } catch (err) {
        console.error("Error opening file:", err);
        setAgentLogs(prev => [...prev, { type: "error", content: `Failed to open file: ${filePath}`, timestamp: Date.now() }]);
      }
    },

    saveWorkflow: async () => {
      if (!activeWorkflowId) return;
      const wf = workflows[activeWorkflowId];
      if (!wf) return;

      const fileName = activeFilePath || wf.fileName || `${wf.name.replace(/\s+/g, '_')}.py` || "workflow.py";
      
      try {
        await fetch("/api/files/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName, content: workflowCode })
        });
        
        setWorkflows(prev => ({
          ...prev,
          [activeWorkflowId]: { 
            ...prev[activeWorkflowId], 
            nodes, 
            edges, 
            fileName,
            code: workflowCode 
          }
        }));
        setAgentLogs(prev => [...prev, { type: "system", content: `Workflow and code synced to ${fileName}`, timestamp: Date.now() }]);
      } catch (err) {
        console.error("Save error:", err);
      }
    },
    createYuktaFile: async (type: 'agent' | 'tool' | 'run' | 'config' | 'host', fileName: string, data: any = {}, nodeId?: string, overrideFolder?: string) => {
      let folderPath = overrideFolder;
      if (!folderPath) {
        if (!activeWorkflowId) return;
        const wf = workflows[activeWorkflowId];
        if (!wf || !wf.folderName) return;
        folderPath = wf.folderName;
      }

      const fullPath = `assets/${folderPath}/${fileName}`;
      console.log(`[Store] Creating Yukta ${type} file: ${fullPath} with data:`, data);
      
      let content = data.code || "";
      if (content) {
        // Skip template generation if explicit code is provided
      } else if (type === 'agent') {
        content = `from yukta import AgentBuilder, SystemPrompt, AgentConfig
import logging

def get_agent():
    """
    Creates and returns a Yukta Agent instance.
    The ToolProcessor will be linked automatically in the orchestrator.
    """
    config = AgentConfig(
        log_level=logging.${data.log_level || 'INFO'},
        verbose=${data.verbose ? 'True' : 'False'},
        auto_save_chat=${data.auto_save_chat ? 'True' : 'False'}
    )
    
    # Use AgentBuilder for structured creation
    agent = AgentBuilder()\\
        .with_name("${data.agent_name || 'Yukta Agent'}")\\
        .with_system_prompt(SystemPrompt("default", "${(data.system_prompt || 'You are a helpful assistant.').replace(/"/g, '\\"')}"))\\
        .with_config(config)\\
        .build()
        
    return agent

if __name__ == "__main__":
    # Test execution
    agent = get_agent()
    print(f"Agent {agent.agent_name} initialized and ready.")
`;
      } else if (type === 'tool') {
        content = `from yukta import Tool, ToolParameter, ToolType

def ${data.function_name || 'process'}(**kwargs):
    """
    ${(data.description || 'A custom Yukta tool.').replace(/"/g, '\\"')}
    """
    print(f"Executing tool ${data.name || 'new_tool'} with args: {kwargs}")
    return True

def get_tool():
    """
    Returns a configured Yukta Tool instance.
    """
    params = []
    # Parameters can be defined here based on data.parameters
    
    return Tool(
        name="${(data.name || 'new_tool').replace(/"/g, '\\"')}",
        description="${(data.description || '').replace(/"/g, '\\"')}",
        function=${data.function_name || 'process'},
        parameters=params,
        tool_type=ToolType.${(data.tool_type || 'custom').toUpperCase()}
    )
`;
      } else if (type === 'run') {
        content = `import sys
import os

# Add the current directory to path to allow relative imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import config
    from yukta import setup_logging
    import logging
except ImportError:
    print("Warning: config.py or yukta framework not found. Ensure yukta is installed.")

def main():
    print("=== Yukta Workflow Execution ===")
    # Initialize agents and tools here
    # Example:
    # from agent_xxxx import get_agent
    # agent = get_agent()
    # result = agent.invoke("Hello!")
    # print(result)

if __name__ == "__main__":
    main()
`;
      } else if (type === 'config') {
        content = `from yukta import Config
import logging

# Global Yukta Configuration
YUKTA_CONFIG = {
    "api_key": "${data.api_key || ''}",
    "base_url": "${data.base_url || ''}",
    "log_level": logging.${data.logging_level || 'INFO'},
}

def setup():
    """Setup the global environment."""
    logging.basicConfig(level=YUKTA_CONFIG["log_level"])
    print("Yukta environment configured.")

if __name__ == "__main__":
    setup()
`;
      } else if (type === 'host') {
        content = `from yukta import YuktaFrameworkAgent
import uvicorn

# Host Configuration for MCP/API services
HOST = "${data.host_address || '0.0.0.0'}"
PORT = ${data.port || 8000}

def serve():
    print(f"Starting Yukta Host on {HOST}:{PORT}...")
    # Logic to start an API server or MCP host goes here

if __name__ == "__main__":
    serve()
`;
      }

      try {
        await fetch("/api/files/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: fullPath, content })
        });

        // Mark the node as synced in the UI
        if (nodeId) {
          setNodes(nds => nds.map(n => 
            n.id === nodeId ? { ...n, data: { ...n.data, synced: true } } : n
          ));
        }

        setAgentLogs(prev => [...prev, { 
          type: "system", 
          content: `Yukta ${type} file created/updated: ${fullPath}`, 
          timestamp: Date.now() 
        }]);
      } catch (err) {
        console.error("Failed to create Yukta file:", err);
      }
    },
    addAgentLog: (type: "system" | "agent" | "error", content: string) => {
      setAgentLogs(prev => [...prev, { type, content, timestamp: Date.now() }]);
    },
    clearAgentLogs: () => setAgentLogs([]),
    runWorkflow: async () => {
      // Rule 3: All code must execute via terminal environment.
      // Redirecting visual run to terminal execution for consistency and compliance.
      commands.runActiveWorkflowInTerminal();
    },
    runActiveWorkflowInTerminal: async () => {
      if (!activeWorkflowId) return;
      const wf = workflows[activeWorkflowId];
      if (!wf || !wf.folderName) return;

      // 1. Force Save to Disk
      await commands.saveWorkflow();

      // 2. Open Terminal
      setActiveBottomPanel("terminal");
      setIsTerminalOpen(true);

      // 3. Prepare Command
      // Navigate to folder and run run.py
      const folderPath = `assets/${wf.folderName}`;
      // Use ; which is universal for PowerShell and Bash. 
      // CMD uses & but PowerShell is the default on Windows now.
      const command = `if ($PWD.Path -notlike "*${wf.folderName}") { cd "assets/${wf.folderName}" }; python run.py\r`;

      window.dispatchEvent(new CustomEvent("terminal-send-command", {
        detail: { id: activeTerminalId, command }
      }));
      
      setAgentLogs(prev => [...prev, { 
        type: "system", 
        content: `Executing workflow in folder: ${wf.folderName}`, 
        timestamp: Date.now() 
      }]);

      // Automated Error Check: Poll for error_report.txt after 3 seconds
      setTimeout(() => {
        commands.checkActiveWorkflowForErrors();
      }, 3000);
    },

    checkActiveWorkflowForErrors: async () => {
      if (!activeWorkflowId) return;
      const wf = workflows[activeWorkflowId];
      if (!wf || !wf.folderName) return;

      const errorFilePath = `assets/${wf.folderName}/error_report.txt`;
      
      try {
        const response = await fetch(`/api/files/read?path=${encodeURIComponent(errorFilePath)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.content && data.content.trim()) {
            const errorContent = data.content.trim();
            setAgentLogs(prev => [...prev, { 
              type: "error", 
              content: `Diagnostic Agent detected a crash. Report found in ${wf.folderName}/error_report.txt`, 
              timestamp: Date.now() 
            }]);

            // Automatically notify AI Assistant about the error
            setIsAIChatOpen(true);
            setActivePanel("ai");
            
            // We send a "hidden" message to the AI to trigger the fix loop
            // But we display it nicely to the user
            commands.sendAIMessage(`[SYSTEM ERROR DETECTED]: The workflow crashed with the following error:\n\n${errorContent}\n\nPlease explain this error to me and ask if you should fix it.`);
            
            // Clear the error file so we don't keep detecting the same error
            await fetch("/api/files/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: errorFilePath, content: "" })
            });
          }
        }
      } catch (err) {
        // Error file likely doesn't exist yet, which is fine
      }
    },

    provisionDiagnosticFiles: async (folderName: string) => {
      const diagAgentCode = `from yukta import YuktaFrameworkAgent

def get_agent():
    return YuktaFrameworkAgent(
        name="Diagnostic Agent",
        role="Error analysis and logging",
        goals=["Catch runtime errors and log them to error_report.txt using the Error Logger tool."],
        backstory="A specialized agent designed to ensure system stability by monitoring crashes."
    )
`;
      const errorLoggerCode = `import os

def log_error(error_msg: str):
    """Logs the error message to error_report.txt."""
    try:
        with open("error_report.txt", "w") as f:
            f.write(error_msg)
        print(f"Error logged to error_report.txt")
        return True
    except Exception as e:
        print(f"Failed to log error: {e}")
        return False
`;

      await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: `assets/${folderName}/diagnostic_agent.py`, content: diagAgentCode })
      });

      await fetch("/api/files/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: `assets/${folderName}/error_logger_tool.py`, content: errorLoggerCode })
      });
    },

    stopWorkflow: () => {
      setIsRunning(false);
      setActiveNodeId(null);
      setAgentLogs(prev => [...prev, { type: "system", content: "Workflow execution stopped by user.", timestamp: Date.now() }]);
    },
    clearWorkflow: () => {
      setNodes([]);
      setEdges([]);
    },


    // Selection & Edit Actions
    setEditorInstance: (instance: any) => setEditorInstance(instance),
    undoAction: () => editorInstance?.trigger('keyboard', 'undo', null),
    redoAction: () => editorInstance?.trigger('keyboard', 'redo', null),
    cutSelection: () => editorInstance?.trigger('keyboard', 'editor.action.clipboardCutAction', null),
    copySelection: () => editorInstance?.trigger('keyboard', 'editor.action.clipboardCopyAction', null),
    pasteClipboard: () => editorInstance?.trigger('keyboard', 'editor.action.clipboardPasteAction', null),
    findInFile: () => editorInstance?.trigger('keyboard', 'actions.find', null),
    replaceInFile: () => editorInstance?.trigger('keyboard', 'editor.action.startFindReplaceAction', null),
    selectAll: () => editorInstance?.trigger('keyboard', 'editor.action.selectAll', null),
    expandSelection: () => editorInstance?.trigger('keyboard', 'editor.action.smartSelect.expand', null),
    
    // Go/Help
    goToSymbol: () => editorInstance?.trigger('keyboard', 'editor.action.gotoSymbol', null),
    openDocs: () => window.open("https://github.com", "_blank"),
    showWelcome: () => setModal({
      title: "Welcome",
      message: "This is a full-featured workflow code editor. Use the AI Assistant to generate code, explain snippets, or optimize your workflow.",
      onConfirm: () => setModal(null)
    }),
    showAbout: () => setModal({
      title: "About",
      message: "Workflow Studio v1.0.0. Built with React, Monaco Editor, and advanced AI models.",
      onConfirm: () => setModal(null)
    }),
    openDocumentation: () => window.open("https://github.com", "_blank"),
    showAllCommands: () => editorInstance?.trigger('keyboard', 'editor.action.quickCommand', null),
    loadExampleWorkflow: async () => {
      const name = "Example_Project";
      const folderName = "Example_Project";
      const id = `wf-example-${Date.now()}`;
      
      const runCode = `# Main Entry Point
from agent_alpha import agent_run
from tool_beta import process

print("--- Starting Example Project ---")
agent_run()
if process():
    print("--- Example Project Completed Successfully ---")
`;
      const agentCode = `# Agent Alpha
def agent_run():
    print("Agent Alpha is analyzing the task...")
    return True
`;
      const toolCode = `# Tool Beta
def process():
    print("Tool Beta is performing a specialized operation...")
    return True
`;

      try {
        // Create folder and files
        await fetch("/api/files/save", { method: "POST", headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ fileName: `${folderName}/run.py`, content: runCode }) });
        await fetch("/api/files/save", { method: "POST", headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ fileName: `${folderName}/agent_alpha.py`, content: agentCode }) });
        await fetch("/api/files/save", { method: "POST", headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ fileName: `${folderName}/tool_beta.py`, content: toolCode }) });

        // Update state
        setWorkflows(prev => ({
          ...prev,
          [id]: { 
            name, 
            folderName, 
            fileName: `${folderName}/run.py`, 
            code: runCode, 
            nodes: [
              { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { label: 'Start' } },
              { id: 'agent-1', type: 'agent', position: { x: 250, y: 0 }, data: { fileName: 'agent_alpha.py', label: 'Alpha Agent' } },
              { id: 'tool-1', type: 'tool', position: { x: 500, y: 0 }, data: { fileName: 'tool_beta.py', functionName: 'process', label: 'Beta Tool' } }
            ], 
            edges: [
              { id: 'e1', source: 'start', target: 'agent-1', animated: true },
              { id: 'e2', source: 'agent-1', target: 'tool-1', animated: true }
            ] 
          }
        }));

        setActiveWorkflowId(id);
        setMode("workflow");
        setAgentLogs(prev => [...prev, { type: "system", content: "Example project structure built in assets/Example_Project/", timestamp: Date.now() }]);
      } catch (err) {
        console.error("Failed to load example:", err);
      }
    },
    closeModal: () => setModal(null),
    closePromptModal: () => setPromptModal(null),
    
    // View Actions
    openCommandPalette: () => editorInstance?.trigger('keyboard', 'editor.action.quickCommand', null),
    openView: () => {
      commands.openPromptModal({
        title: "Open View",
        message: "Open view (explorer, search, workflow, ai):",
        onConfirm: (view) => {
          if (view) commands.setActivePanel(view as any);
        }
      });
    },
    toggleAppearance: () => {
      const newTheme = settings.theme === "dark" ? "light" : "dark";
      commands.updateSetting("theme", newTheme);
    },
    changeLayout: () => {
      setIsSidebarOpen(prev => !prev);
    },

    // Terminal Commands
    createTerminal: (config: { type: "local" | "ssh", user?: string, host?: string, port?: string } = { type: "local" }) => {
      const id = `term-${Date.now()}`;
      const name = config.type === "ssh" ? `ssh:${config.user}@${config.host}` : "bash";
      setTerminals(prev => [...prev, { id, name, logs: [`Terminal ${id} started.`], config }]);
      setActiveTerminalId(id);
      setIsTerminalOpen(true);
    },
    createSshTerminal: () => {
      commands.openPromptModal({
        title: "SSH Junction",
        message: "Enter SSH Username:",
        defaultValue: "USER",
        onConfirm: (user) => {
          if (!user) return;
          commands.openPromptModal({
            title: "SSH Junction",
            message: "Enter SSH Host:",
            defaultValue: "localhost",
            onConfirm: (host) => {
              if (!host) return;
              commands.openPromptModal({
                title: "SSH Junction",
                message: "Enter SSH Port (optional):",
                defaultValue: "22",
                onConfirm: (port) => {
                  commands.createTerminal({ type: "ssh", user, host, port: port || "22" });
                }
              });
            }
          });
        }
      });
    },
    closeTerminal: (id?: string) => {
      const targetId = id || activeTerminalId;
      setTerminals(prev => {
        const next = prev.filter(t => t.id !== targetId);
        if (next.length === 0) {
          setIsTerminalOpen(false);
          const defaultTermId = "term-1";
          setActiveTerminalId(defaultTermId);
          return [{ id: defaultTermId, name: "bash", logs: [] }];
        }
        if (activeTerminalId === targetId) setActiveTerminalId(next[next.length - 1].id);
        return next;
      });
    },
    switchTerminal: (id: string) => setActiveTerminalId(id),
    splitTerminal: () => {
      console.log("Split terminal requested");
      commands.createTerminal();
    },
    runCommand: (command: string) => {
      setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, logs: [...t.logs, `> ${command}`, `Executing: ${command}...`, "Command finished."] } : t));
    },
    clearTerminal: () => {
      setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, logs: [], lastClearTime: Date.now() } : t));
    },
    restartTerminal: () => {
      setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, logs: ["Terminal restarted."] } : t));
    },

    // Output Commands
    setOutputChannel: (channel: string) => setActiveOutputChannel(channel),
    appendOutput: (channel: string, message: string) => {
      setOutputChannels(prev => ({ ...prev, [channel]: [...(prev[channel] || []), message] }));
    },
    clearOutput: () => {
      setOutputChannels(prev => ({ ...prev, [activeOutputChannel]: [] }));
    },

    // Debug Commands
    startDebugging: () => setDebugState(prev => ({ ...prev, isRunning: true, logs: [...prev.logs, "[Debug] Session started."] })),
    stopDebugging: () => setDebugState(prev => ({ ...prev, isRunning: false, logs: [...prev.logs, "[Debug] Session stopped."] })),
    toggleBreakpoint: (line: number) => {
      setDebugState(prev => ({
        ...prev,
        breakpoints: prev.breakpoints.includes(line) ? prev.breakpoints.filter(b => b !== line) : [...prev.breakpoints, line]
      }));
    },
    clearAllBreakpoints: () => setDebugState(prev => ({ ...prev, breakpoints: [] })),
    logDebugMessage: (message: string) => setDebugState(prev => ({ ...prev, logs: [...prev.logs, `[Debug] ${message}`] })),

    // Shared Panel Commands - Handled above
    setAiChatPanelWidth: (width: number) => setAiChatPanelWidth(width),
    setWorkflowRightPanelWidth: (width: number) => setWorkflowRightPanelWidth(width),
    exportWorkflow: () => {
      const wfId = activeWorkflowId;
      if (!wfId || !workflows[wfId]) {
        alert("Select a workflow to export first.");
        return;
      }
      
      const wf = workflows[wfId];
      const exportData = {
        name: wf.name,
        nodes: nodes,
        edges: edges,
        generatedCode: workflowCode,
        exportedAt: new Date().toISOString()
      };
      
      try {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${wf.name.replace(/\s+/g, "_") || "workflow"}.agw`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setAgentLogs(prev => [...prev, { 
          type: "system", 
          content: `Workflow "${wf.name}" exported successfully.`, 
          timestamp: Date.now() 
        }]);
      } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to export workflow.");
      }
    },
    importWorkflow: () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,.agw";
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (loadEvent: any) => {
          try {
            const data = JSON.parse(loadEvent.target.result);
            if (!data.nodes || !data.edges) {
              throw new Error("Invalid workflow file format. Missing nodes or edges.");
            }
            
            // Create a new workflow from imported data
            const id = `wf-imported-${Date.now()}`;
            const name = data.name || "Imported Workflow";
            const fileName = `${name.replace(/\s+/g, "_")}.py`;
            
            setWorkflows(prev => ({
              ...prev,
              [id]: { 
                name, 
                fileName, 
                nodes: data.nodes, 
                edges: data.edges,
                code: data.generatedCode || data.code || ""
              }
            }));
            
            setActiveWorkflowId(id);
            setNodes(data.nodes);
            setEdges(data.edges);
            if (data.generatedCode) setWorkflowCode(data.generatedCode);
            else if (data.code) setWorkflowCode(data.code);
            
            setAgentLogs(prev => [...prev, { 
              type: "system", 
              content: `Workflow "${name}" imported successfully.`, 
              timestamp: Date.now() 
            }]);
          } catch (err) {
            console.error("Import failed:", err);
            setAgentLogs(prev => [...prev, { 
              type: "error", 
              content: "Failed to import workflow: " + (err as Error).message, 
              timestamp: Date.now() 
            }]);
            alert("Failed to import workflow: " + (err as Error).message);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    },
    createNewWorkflow: (callback?: (id: string, folderName?: string) => void) => {
      commands.openPromptModal({
        title: "Create New Folder",
        message: "Enter folder name:",
        defaultValue: "New_Folder",
        onConfirm: async (name) => {
          if (!name) {
            if (callback) callback("");
            return;
          }
          const id = `wf-${Date.now()}`;
          const folderName = name.trim().replace(/\s+/g, "_");
          const runPyPath = `assets/${folderName}/run.py`;
          
          try {
            await fetch("/api/files/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: runPyPath, content: "# Generated by Yukta Workflow\n\n" })
            });
          } catch (e) {
            console.error("Failed to create initial run.py file", e);
          }

          setWorkflows(prev => ({
            ...prev,
            [id]: { 
              name: name.trim(), 
              folderName,
              fileName: "run.py", 
              code: "# Generated by Yukta Workflow\n\n",
              nodes: [], 
              edges: [] 
            }
          }));
          setActiveWorkflowId(id);
          setActiveFilePath(runPyPath);
          setExpandedFolders(prev => [...new Set([...prev, id])]);
          setMode("workflow");
          setAgentLogs(prev => [...prev, { 
            type: "system", 
            content: `New folder structure created: assets/${folderName}/`, 
            timestamp: Date.now() 
          }]);
          if (callback) callback(id, folderName);
        }
      });
    },

    renameFolder: async ({ id, name }: { id: string, name: string }) => {
      const wf = workflows[id];
      if (!wf) return;
      const oldName = wf.folderName;
      const newFolderName = name.trim().replace(/\s+/g, "_");
      
      try {
        const res = await fetch("/api/files/rename", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldName, newName: newFolderName })
        });
        
        if (res.ok) {
          setWorkflows(prev => {
            const next = { ...prev };
            next[id] = { ...next[id], name, folderName: newFolderName };
            return next;
          });
          setAgentLogs(prev => [...prev, { type: "system", content: `Renamed folder to ${newFolderName}`, timestamp: Date.now() }]);
        }
      } catch (err) {
        console.error("Failed to rename folder:", err);
      }
    },

    deleteFolder: async (id: string) => {
      const wf = workflows[id];
      if (!wf) return;
      
      try {
        // Backend doesn't have recursive delete folder yet, but we can try to delete individual files or just clear from state
        // For now, let's assume the user just wants it gone from the UI/Workspace
        setWorkflows(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        if (activeWorkflowId === id) setActiveWorkflowId(null);
        setAgentLogs(prev => [...prev, { type: "system", content: `Removed folder ${wf.folderName} from workspace`, timestamp: Date.now() }]);
      } catch (err) {
        console.error("Failed to delete folder:", err);
      }
    },

    deleteFile: async ({ wfId, fileName, nodeId }: { wfId: string, fileName: string, nodeId?: string }) => {
      const wf = workflows[wfId];
      if (!wf) return;
      
      try {
        const res = await fetch("/api/files/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: `assets/${wf.folderName}/${fileName}` })
        });
        
        if (res.ok) {
          // If it was linked to a node, remove the node too
          if (nodeId) {
            setNodes(prev => prev.filter(n => n.id !== nodeId));
          }
          
          setAgentLogs(prev => [...prev, { type: "system", content: `Deleted file ${fileName}`, timestamp: Date.now() }]);
        }
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    },
    
    revalidateActiveWorkflow: () => {
      const errors = commands.validatePythonCode(workflowCode);
      setWorkflowErrors(errors);
    },

    // Generic Execute Wrapper
    execute: (commandName: string, ...args: any[]) => {
      if ((commands as any)[commandName]) {
        return (commands as any)[commandName](...args);
      }
      console.warn(`Command not found: ${commandName}`);
    },
  };

  const state: AppState = {
    mode,
    activePanel,
    workspace,
    isTerminalOpen,
    isSidebarOpen,
    logs,
    isRunning,
    settings,
    workflows,
    activeWorkflowId,
    selectedNodeId,
    workflowCode,
    nodes,
    edges,
    isCodeDirty,
    activeFilePath,
    isAIChatOpen,
    isAILoading,
    aiMessages,
    agentLogs,
    activeNodeId,
    modal,
    sidePanelWidth,
    aiChatPanelWidth,
    workflowRightPanelWidth,
    expandedFolders,
    explorerSearchQuery,
    activeBottomPanel,
    terminals,
    activeTerminalId,
    outputChannels,
    activeOutputChannel,
    debugState,
    bottomPanelHeight,
    promptModal,
    editorInstance,
    workflowErrors,
    aiPendingRequest,
  };

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch: () => {}, // Not using reducer for now to keep it simple
      commands,
      // Pass setters for components that need them (or wrap in commands)
      setIsSidebarOpen,
      setLogs,
      setEditorInstance,
      setNodes,
      setEdges
    } as any}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

