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

const AGENT_SYSTEM_PROMPT = `You are the Antigravity Autonomous Workflow Orchestrator. 
Your task is to organize a multi-agent swarm to solve user requests through a visual workflow and Python code.

SWARM STRUCTURE:
- 'agent-main': The central brain for orchestration, delegation, and complex reasoning.
- 'agent-data': Expert in file parsing (CSV, Excel), data cleaning, and statistical analysis.
- 'agent-script': Expert in logic, math, custom algorithms, and system transformations.
- 'agent-search': Expert in web retrieval, knowledge gathering, and documentation search.
- 'agent-action': Expert in final output actions like email, notifications, or database writes.

RULES:
1. DESIGN FIRST: Analyze the request and determine which agents are needed.
2. STRUCTURE: Map the task to a flow: Start -> Agents/Nodes -> End.
3. CODE: Always output the full Python code in a \`\`\`python ... \`\`\` block. 
4. SYNTAX: Use clear variable names. For Agent tasks, use comments like:
   # AI Agent Task: agent-data: Load excel file
   df = pd.read_excel('assets/data.xlsx')
5. HYBRID: You can mix standard Python (if/else, loops) with specialized Agent calls.
6. NO TRIVIAL CODE: If the user asks for a workflow, build a robust multi-node system.

Example Logic:
Thinking: The user wants to analyze a file and then notify them. I will use 'agent-data' for analysis and 'agent-action' for notification...
\`\`\`python
# AI Agent Task: agent-data: Analyze the excel file
import pandas as pd
df = pd.read_excel('assets/data.xlsx')
summary = df.describe().to_string()

# AI Agent Task: agent-action: Send the summary via mail
print(f"Summary: {summary}")
# mail.send(to="admin@example.com", body=summary)
\`\`\`
`;

export type AppMode = "workflow" | "workflow-code";
export type PanelType = "search" | "git" | "run" | "extensions" | "ai" | "workflow" | "explorer" | null;

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
  };
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

  // Sync state when activeWorkflowId changes
  React.useEffect(() => {
    if (activeWorkflowId && workflows[activeWorkflowId]) {
      console.log(`[Store] Switching to workflow: ${activeWorkflowId} (${workflows[activeWorkflowId].fileName})`);
      isInternalSyncRef.current = true;
      setNodes(workflows[activeWorkflowId].nodes || []);
      setEdges(workflows[activeWorkflowId].edges || []);
      setWorkflowCode(workflows[activeWorkflowId].code || "");
      setIsCodeDirty(false);
      
      // Reset internal sync after state update
      setTimeout(() => {
        isInternalSyncRef.current = false;
      }, 0);
    }
  }, [activeWorkflowId]); // Removed workflows dependency to prevent loops during internal updates

  // Ensure initial workflow if none exists
  React.useEffect(() => {
    if (Object.keys(workflows).length === 0) {
      const id = "wf-default";
      setWorkflows({
        [id]: { 
          name: "Default Workflow", 
          fileName: "workflow.py", 
          code: "# Default Workflow\n\nprint('Hello Workflow!')\n",
          nodes: [], 
          edges: [] 
        }
      });
      setActiveWorkflowId(id);
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

  const isInternalSyncRef = useRef(false);
  const lastGeneratedCodeRef = useRef("");

  const syncWorkflowToCode = useCallback(() => {
    // DISABLING Workflow-to-Code synchronization.
    // User code is now the absolute Source of Truth.
    return;
  }, []); 


  const commands = {
    execute: (commandName: string, ...args: any[]) => {
      if (commands[commandName as keyof typeof commands]) {
        return (commands[commandName as keyof typeof commands] as Function)(...args);
      }
      console.warn(`Command "${commandName}" not found.`);
    },

    // Mode Switching
    switchToWorkflow: () => setMode("workflow"),
    switchToWorkflowCode: () => setMode("workflow-code"),
    
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

    // Settings & User Commands
    updateSetting: (key: string, value: any) => {
      setSettings((prev: any) => {
        const next = { ...prev, [key]: value };
        localStorage.setItem("ide-settings", JSON.stringify(next));
        return next;
      });
    },
    toggleAIChat: () => setIsAIChatOpen(prev => !prev),
    sendAIMessage: async (content: string) => {
      const lowerContent = content.toLowerCase();
      const isBuildRequest = /build|create|write|implement|make|generate|code for|script for|program|workflow for/i.test(content);
      const isCheckRequest = /check|verify|analyze|explain|debug/i.test(content);
      
      const newMessage = { 
        role: "user" as const, 
        content,
        timestamp: Date.now()
      };
      
      setAiMessages(prev => [...prev, newMessage]);
      setIsAILoading(true);

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
          agentAnalysis = `USER NEED: ${content.substring(0, 100)}...\nAGENT THINKING: Detected workflow/build request → mapping to execution graph and generating Python code.`;
          if (hasInput) nodesUsed.push("Input Node (input())");
          if (hasCondition) nodesUsed.push("Condition Node (if/elif/else)");
          if (hasLoop) nodesUsed.push("Loop Node (for/while)");
          if (hasDB) nodesUsed.push("Database Node (SQL/Storage)");
          nodesUsed.push("Display Node (print())");
          if (hasAPI) {
            customNodeNeeded = "HttpRequestNode (Custom) — fetches external API data";
            nodesUsed.push("Custom: HTTP Request Node");
          }
        } else if (looksLikeCode) {
          intentType = "code-to-workflow";
          agentAnalysis = `USER NEED: Convert provided code to structured workflow.\nAGENT THINKING: Code pattern detected → parsing into step-by-step node graph.`;
        } else {
          agentAnalysis = `USER NEED: ${content.substring(0, 100)}\nAGENT THINKING: Architectural query — providing structured guidance.`;
        }

        let aiResponseText = "";
        
        const groqApiKey = (settings as any).groqApiKey || GROQ_KEY || "";

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
            aiResponseText = `⚠️ Connection Error: ${e.message}\n\nPlease verify your Groq API key in Settings.`;
          }
        } else {
          aiResponseText = "⚠️ No Groq API key configured. Please add your Groq API key in Settings to activate Antigravity's intelligence.";
        }

        // Extract Python code block from AI response and push to editor + workflow canvas
        // 1. Try standard triple backticks first
        let codeMatch = aiResponseText.match(/```python\n?([\s\S]*?)```/);
        
        // 2. Fallback: Try any ``` block
        if (!codeMatch) {
          codeMatch = aiResponseText.match(/```\n?([\s\S]*?)```/);
        }

        // 3. Last resort: If the response starts with code-like tokens or is mostly code
        let extractedCode = "";
        if (codeMatch && codeMatch[1]) {
          extractedCode = codeMatch[1].trim();
        } else {
          // Heuristic: Check if the response contains code-like patterns
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
              l.includes("=") || 
              l.includes("print(") || 
              l.includes("def ") || 
              l.includes("import ") ||
              l.includes("if ") ||
              l.includes("elif ") ||
              l.includes("else:") ||
              l.includes("for ") ||
              l.includes("while ") ||
              l.startsWith("#") ||
              l.startsWith("'''") ||
              l.startsWith("\"\"\"") ||
              line.startsWith("    ") || 
              line.startsWith("\t");

            if (isCodeLike) {
              foundLikelyCode = true;
              codeLines.push(line);
            } else if (foundLikelyCode) {
              // If we already found code and hit a non-code line, stop if it looks like a long sentence
              if (l.split(" ").length > 8 && !l.includes("(")) {
                break;
              }
              codeLines.push(line);
            }
          }
          
          if (codeLines.length >= 1) {
            extractedCode = codeLines.join("\n").trim();
          }
        }

        if (extractedCode) {
          // 1. Parse the extracted code to workflow nodes/edges immediately
          const { nodes: newNodes, edges: newEdges } = commands.parseCodeToWorkflow(extractedCode);

          // 2. Determine target workflow ID
          let targetWorkflowId = activeWorkflowId;
          const isNewWorkflow = !targetWorkflowId;
          if (isNewWorkflow) {
            targetWorkflowId = `wf-${Date.now()}`;
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
            setNodes(newNodes);
            setEdges(newEdges);

            setWorkflows((prev: any) => {
              const updatedWorkflows = { ...prev };
              const existing = updatedWorkflows[targetWorkflowId!];
              
              updatedWorkflows[targetWorkflowId!] = { 
                name: isNewWorkflow ? "AI Generated Workflow" : (existing?.name || "AI Updated Workflow"), 
                fileName: existing?.fileName || `Workflow_${Date.now().toString().slice(-4)}.py`,
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
            codeGenerated: !!(codeMatch && codeMatch[1])
          }
        };

        setAiMessages(prev => [...prev, assistantMessage]);
        setIsAILoading(false);
      } catch (error: any) {
        console.error("AI System Critical Error:", error);
        setIsAILoading(false);
        setAiMessages(prev => [...prev, { 
          role: "assistant", 
          content: `⚠️ Internal Error: ${error.message}. The Antigravity engine encountered a critical failure.`,
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

    clearAIChat: () => setAiMessages([{ role: "assistant", content: "Chat cleared. How can I help you?" }]),

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

        const startId = "node-start";
        newNodes.push({ id: startId, type: "start", position: { x: -100, y: 300 }, data: { label: "Start" } });
        
        const lastNodeAtIndent: Record<number, string> = { 0: startId };
        // Stack tracks: { indent level, node ID to connect from, handle to connect from }
        const stack: { indent: number; nodeId: string; handle?: string }[] = [];
        let pendingJoins: string[] = [];

        lines.forEach((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("def ")) return;
          if (trimmed.startsWith("#") && !trimmed.startsWith("# AI Agent Task:")) return;
          
          const indent = line.search(/\S/);
          
          // Pop from stack when indent decreases
          while (stack.length > 0 && stack[stack.length - 1].indent > indent) {
            const exited = stack.pop();
            if (exited) pendingJoins.push(exited.nodeId);
          }

          let nodeId = `node-${idx}-${Math.random().toString(36).substr(2, 4)}`;
          let type = "custom";
          let data: any = { label: trimmed };

          if (trimmed.startsWith("if ") || trimmed.startsWith("elif ") || trimmed.startsWith("else:")) {
            const isIf = trimmed.startsWith("if ");
            const isElse = trimmed.startsWith("else:");
            let condition = !isElse ? trimmed.replace(/^(if|elif)\s*/, "").replace(/:$/, "").trim() : "else";
            
            const existingCondNodeId = lastNodeAtIndent[indent];
            const existingCondNode = newNodes.find(n => n.id === existingCondNodeId && n.type === "condition");

            if (!isIf && existingCondNode) {
              const bId = isElse ? "else" : `elif-${idx}`;
              existingCondNode.data.branches = existingCondNode.data.branches || [];
              if (!existingCondNode.data.branches.find((b: any) => b.id === bId)) {
                existingCondNode.data.branches.push({ type: isElse ? "else" : "elif", condition, id: bId });
              }
              stack.push({ indent: indent + 4, nodeId: existingCondNode.id, handle: bId });
              return;
            }
            
            type = "condition";
            data = { 
              label: `If ${condition}`, 
              condition, 
              branches: [
                { type: "if", condition, id: "if" },
                { type: "else", condition: "else", id: "else" }
              ] 
            };
            nodeId = `node-cond-${idx}`;
            stack.push({ indent: indent + 4, nodeId, handle: "if" });
          } else if (trimmed.startsWith("print(")) {
            type = "display";
          } else if (/^\w+\s*=\s*(int|float|str)?\(?input\(/.test(trimmed)) {
            type = "input";
          } else if (trimmed.includes("=") && !trimmed.includes("==")) {
            type = "variable";
          } else if (trimmed.startsWith("for ") || trimmed.startsWith("while ")) {
            type = "loop";
            nodeId = `node-loop-${idx}`;
            stack.push({ indent: indent + 4, nodeId, handle: "body" });
          } else if (trimmed.startsWith("# AI Agent Task:") || trimmed.toLowerCase().includes("agent-") || trimmed.includes("orchestrator")) {
            const taskContent = trimmed.replace("# AI Agent Task:", "").trim();
            const lowerTask = taskContent.toLowerCase();
            
            if (lowerTask.includes("agent-data")) type = "agent-data";
            else if (lowerTask.includes("agent-script")) type = "agent-script";
            else if (lowerTask.includes("agent-search")) type = "agent-search";
            else if (lowerTask.includes("agent-action")) type = "agent-action";
            else type = "agent-main";
            
            data = { 
                label: type.replace("agent-", "").toUpperCase() + " AGENT", 
                taskDescription: taskContent,
                task: taskContent
            };
          }

          newNodes.push({ id: nodeId, type, position: getPos(indent), data });

          // Connect from stack context or previous node at this level
          if (stack.length > 0) {
            const context = stack[stack.length - 1];
            addEdge(context.nodeId, nodeId, undefined, context.handle);
            context.nodeId = nodeId;
            context.handle = "main";
          } else {
            const parentId = lastNodeAtIndent[indent] || lastNodeAtIndent[0];
            if (parentId && parentId !== nodeId) {
              addEdge(parentId, nodeId);
            }
          }

          // CRITICAL: Merge points from all branches that just ended
          if (pendingJoins.length > 0) {
            pendingJoins.forEach(pid => {
              if (pid !== nodeId) addEdge(pid, nodeId);
            });
            pendingJoins = [];
          }

          lastNodeAtIndent[indent] = nodeId;
        });

        // Final End node
        const lastInFlow = lastNodeAtIndent[0];
        if (lastInFlow && lastInFlow !== startId) {
          const endId = "node-end";
          newNodes.push({ 
            id: endId, 
            type: "end", 
            position: { x: (nodeCount) * 260, y: 100 }, 
            data: { label: "End" } 
          });
          addEdge(lastInFlow, endId);
        }

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
              code: code 
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
      setMode("workflow");
      setActivePanel("workflow");
    },
    createNewWorkflow: () => {
      commands.openPromptModal({
        title: "New Workflow",
        message: "Enter a name for your new workflow (e.g., DataAnalysis):",
        defaultValue: `Workflow_${Date.now().toString().slice(-4)}`,
        onConfirm: async (name) => {
          if (!name || name.trim() === "") return;
          
          console.log(`[Store] Creating new workflow: ${name}`);
          const fileName = name.endsWith(".py") ? name : `${name.replace(/\s+/g, '_')}.py`;
          const id = `wf-${Date.now()}`;
          const initialCode = "# " + name + " - Generated Workflow\n\nimport time\n\nprint('Starting workflow for " + name + "...')\n# Your logic goes here\n";
          
          try {
            console.log(`[Store] Saving initial file: ${fileName} to backend...`);
            const response = await fetch("/api/files/save", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName, content: initialCode })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Server responded with ${response.status}: ${errorText}`);
            }

            console.log(`[Store] File saved. Updating application state for ID: ${id}`);
            
            // Set flag to prevent synchronization loops
            isInternalSyncRef.current = true;
            
            // Update workflows list
            setWorkflows(prev => ({
              ...prev,
              [id]: { 
                name, 
                fileName, 
                code: initialCode,
                nodes: [], 
                edges: [] 
              }
            }));
            
            // Clear current working state to ensure no carryover
            setNodes([]);
            setEdges([]);
            setWorkflowCode(initialCode);
            setIsCodeDirty(false);
            
            // Activate the new workflow
            setActiveWorkflowId(id);
            setMode("workflow");
            setActivePanel("workflow");
            
            setAgentLogs(prev => [...prev, { 
              type: "system", 
              content: `New workflow "${name}" created and saved as ${fileName}`, 
              timestamp: Date.now() 
            }]);

            // Release the sync lock after a state reconciliation cycle
            setTimeout(() => {
              isInternalSyncRef.current = false;
              console.log("[Store] Internal sync lock released.");
            }, 100);

          } catch (err: any) {
            console.error("Failed to create workflow:", err);
            setModal({
              title: "Creation Failed",
              message: `Could not create workflow on server: ${err.message}. Please check if the backend server is running.`,
              onConfirm: () => setModal(null)
            });
          }
        }
      });
    },
    saveWorkflow: async () => {
      if (!activeWorkflowId) return;
      const wf = workflows[activeWorkflowId];
      if (!wf) return;

      const fileName = wf.fileName || `${wf.name.replace(/\s+/g, '_')}.py` || "workflow.py";
      
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
      if (!wf) return;

      // Ensure fileName exists
      const fileName = wf.fileName || `${wf.name.replace(/\s+/g, '_')}.py` || "workflow.py";

      // 1. Force Save to Disk
      await commands.saveWorkflow();

      // 2. Open Terminal
      setActiveBottomPanel("terminal");
      setIsTerminalOpen(true);

      // Rule 4: Intelligent Input Handling
      // Collect inputs from the workflow UI to pass to the terminal
      const inputNodes = nodes.filter(n => n.type === 'input');
      const inputValues = inputNodes
        .map(n => n.data.value || "")
        .filter(v => v !== "");

      // 3. Send command (Wait a bit for the save to complete if needed)
      // Rule 3: Execution command should be generated automatically.
      let command = "";
      
      if (inputValues.length > 0) {
        // Pass input directly as Arguments or Stdin (using echo for piping into stdin)
        const inputStr = inputValues.join("\\n");
        command = `echo -e "${inputStr}" | python assets/${fileName}\r`;
      } else {
        command = `python assets/${fileName}\r`;
      }

      window.dispatchEvent(new CustomEvent("terminal-send-command", {
        detail: { id: activeTerminalId, command }
      }));
      
      setAgentLogs(prev => [...prev, { 
        type: "system", 
        content: `Rule 3: Execution command generated: ${command.trim()}`, 
        timestamp: Date.now() 
      }]);
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

    // Shared Panel Commands
    switchBottomPanel: (panel: "terminal" | "output") => {
      setActiveBottomPanel(panel);
      setIsTerminalOpen(true);
    },
    setBottomPanelHeight: (height: number) => setBottomPanelHeight(height),
    setSidePanelWidth: (width: number) => setSidePanelWidth(width),
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
    isCodeDirty,
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

