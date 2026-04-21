import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  addEdge,
  Panel,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Handle,
  Position,
  MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from '../store';
import { 
  Play, 
  Save, 
  Trash2, 
  Plus, 
  Database, 
  Mail, 
  Zap,
  Settings,
  X,
  ChevronLeft,
  RefreshCw,
  Layout,
  GitBranch,
  Activity,
  Code,
  FileText,
  PlayCircle,
  Clock,
  Terminal,
  MessageSquare,
  History,
  Sparkles,
  Layers,
  HelpCircle,
  Table,
  Spline,
  ArrowUpDown,
  Server,
  Download,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const BaseNode = ({ data, type, icon: Icon, color }: any) => (
  <div className={`px-4 py-3 shadow-2xl rounded-xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 min-w-[180px] relative group transition-all hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]`}>
    {/* Accent bar */}
    <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${color?.replace('border-', 'bg-') || 'bg-zinc-500'}`} />
    
    <div className="flex items-center pl-2">
      <div className={`rounded-lg w-9 h-9 flex items-center justify-center bg-white/5 mr-3 border border-white/5 group-hover:bg-white/10 transition-colors`}>
        {Icon && <Icon className={`w-5 h-5 ${color?.replace('border-', 'text-') || 'text-zinc-400'}`} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-[9px] font-black uppercase tracking-[0.15em] mb-0.5 opacity-70 ${color?.replace('border-', 'text-') || 'text-zinc-500'}`}>
          {type || 'Node'}
        </div>
        <div className="text-sm font-semibold text-white/90 truncate">
          {data.label || `${type} node`}
        </div>
      </div>
    </div>

    <Handle 
      type="target" 
      position={Position.Left} 
      className="w-2.5 h-2.5 !bg-zinc-800 border-2 border-zinc-400 !left-[-6px] hover:!scale-125 transition-transform" 
    />
    <Handle 
      type="source" 
      position={Position.Right} 
      className="w-2.5 h-2.5 !bg-zinc-800 border-2 border-zinc-400 !right-[-6px] hover:!scale-125 transition-transform" 
    />
  </div>
);


const HandleGlow = ({ color }: { color: string }) => (
  <div className={`absolute inset-[-4px] rounded-full blur-[6px] opacity-0 group-hover/handle:opacity-40 transition-opacity bg-${color.split('-')[1]}-500`} />
);

const SourceNodeHandle = ({ position, id = "main", color = 'border-gray-500', label, offset = '-7px' }: any) => (
  <div className={`group/handle absolute ${
    position === Position.Right ? `right-[${offset}] top-1/2 -translate-y-1/2` : 
    position === Position.Bottom ? `bottom-[${offset}] left-1/2 -translate-x-1/2` :
    position === Position.Top ? `top-[${offset}] left-1/2 -translate-x-1/2` :
    `left-[${offset}] top-1/2 -translate-y-1/2`
  } z-50`}>
    {label && (
      <div className={`absolute whitespace-nowrap px-2 py-1 rounded bg-[#252526] border border-white/20 text-[10px] font-black ${label === 'YES' ? 'text-emerald-400' : 'text-red-400'} shadow-xl transition-all ${
        position === Position.Right ? 'left-8 top-1/2 -translate-y-1/2' : 
        position === Position.Bottom ? 'top-8 left-1/2 -translate-x-1/2' :
        position === Position.Top ? 'bottom-8 left-1/2 -translate-x-1/2' :
        'right-8 top-1/2 -translate-y-1/2'
      }`}>
        {label}
      </div>
    )}
    <Handle 
      type="source" 
      position={position} 
      id={id} 
      className={`w-4 h-4 !bg-[#141415] border-2 ${color} hover:!scale-150 transition-all cursor-crosshair !m-0`} 
    />
  </div>
);

const TargetNodeHandle = ({ position, id = "input", color = 'border-gray-500', offset = '-8px' }: any) => (
  <div className={`group/handle absolute ${
    position === Position.Left ? `left-[${offset}] top-1/2 -translate-y-1/2` : 
    position === Position.Top ? `top-[${offset}] left-1/2 -translate-x-1/2` :
    position === Position.Bottom ? `bottom-[${offset}] left-1/2 -translate-x-1/2` :
    `right-[${offset}] top-1/2 -translate-y-1/2`
  } z-50`}>
    <Handle 
      type="target" 
      position={position} 
      id={id} 
      className={`w-4 h-4 !bg-[#141415] border-2 ${color} hover:!scale-150 transition-all cursor-crosshair !m-0`} 
    />
  </div>
);

// --- Custom Node Components (Premium Style) ---

const StartNode = ({ data }: any) => (
  <div className="modern-node border-emerald-500/30 overflow-hidden min-w-[160px]">
    <div className="node-accent bg-emerald-500" />
    <div className="node-header border-emerald-500/10 bg-emerald-500/10">
      <PlayCircle className="w-4 h-4 text-emerald-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">START</span>
    </div>
    <div className="node-body flex justify-center py-3">
      <div className="text-[11px] text-white/90 font-bold">{data.label || 'Begin Workflow'}</div>
    </div>
    <SourceNodeHandle position={Position.Right} color="border-emerald-500" />
  </div>
);

const InputNode = ({ data }: any) => (
  <div className="modern-node border-blue-500/30 overflow-hidden min-w-[180px]">
    <div className="node-accent bg-blue-500" />
    <TargetNodeHandle position={Position.Left} color="border-blue-500" />
    <div className="node-header border-blue-500/10 bg-blue-500/10">
      <Database className="w-4 h-4 text-blue-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">INPUT DATA</span>
    </div>
    <div className="node-body px-4 py-3">
      <div className="text-[10px] text-white/40 uppercase mb-1">Variable</div>
      <div className="text-xs font-bold text-white/90 truncate">{data.variable || 'input_var'}</div>
      {data.prompt && <div className="text-[9px] text-white/30 italic mt-1 truncate">"{data.prompt}"</div>}
    </div>
    <SourceNodeHandle position={Position.Right} color="border-blue-500" />
  </div>
);

const ProcessNode = ({ data }: any) => (
  <div className="modern-node border-purple-500/30 overflow-hidden min-w-[180px]">
    <div className="node-accent bg-purple-500" />
    <TargetNodeHandle position={Position.Left} color="border-purple-500" />
    <div className="node-header border-purple-500/10 bg-purple-500/10">
      <Activity className="w-4 h-4 text-purple-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">PROCESS</span>
    </div>
    <div className="node-body px-4 py-3">
      <div className="text-[10px] text-white/40 uppercase mb-1">Update Var</div>
      <div className="text-xs font-bold text-white/90 truncate">{data.variable || 'result'}</div>
      <div className="text-[10px] text-white/30 font-mono mt-1">Value: {data.value || 'null'}</div>
    </div>
    <SourceNodeHandle position={Position.Right} color="border-purple-500" />
  </div>
);

const PrintNode = ({ data }: any) => (
  <div className="modern-node border-cyan-500/30 overflow-hidden min-w-[180px]">
    <div className="node-accent bg-cyan-500" />
    <TargetNodeHandle position={Position.Left} color="border-cyan-500" />
    <div className="node-header border-cyan-500/10 bg-cyan-500/10">
      <Terminal className="w-4 h-4 text-cyan-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">PRINT</span>
    </div>
    <div className="node-body px-4 py-3">
      <div className="text-[10px] text-white/40 uppercase mb-1">Output</div>
      <div className="text-xs font-bold text-white/90 truncate">{data.label || "print(...)"}</div>
    </div>
    <SourceNodeHandle position={Position.Right} color="border-cyan-500" />
  </div>
);

const TriggerNode = ({ data }: any) => (
  <div className="modern-node border-indigo-500/30 overflow-hidden min-w-[170px]">
    <div className="node-accent bg-indigo-500" />
    <div className="node-header border-indigo-500/10 bg-indigo-500/10">
      <PlayCircle className="w-4 h-4 text-indigo-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">TRIGGER</span>
    </div>
    <div className="node-body flex justify-center py-3">
      <div className="text-[11px] text-white/90 font-bold">{data.label || "Start Trigger"}</div>
    </div>
    <SourceNodeHandle position={Position.Right} color="border-indigo-500" />
  </div>
);

const EndNode = ({ data }: any) => (
  <div className="modern-node border-rose-500/30 overflow-hidden min-w-[160px]">
    <div className="node-accent bg-rose-500" />
    <TargetNodeHandle position={Position.Left} color="border-rose-500" />
    <div className="node-header border-rose-500/10 bg-rose-500/10">
      <X className="w-4 h-4 text-rose-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">END</span>
    </div>
    <div className="node-body flex justify-center py-3">
      <div className="text-[11px] text-white/90 font-bold">{data.label || "Stop"}</div>
    </div>
  </div>
);

const ConditionNode = ({ data }: any) => {
  const branches = data.branches || [
    { type: 'if', condition: 'True', id: 'if' },
    { type: 'else', id: 'else' }
  ];
  
  return (
    <div className="modern-node border-amber-500/30 overflow-hidden min-w-[200px]">
      <div className="node-accent bg-amber-500" />
      <TargetNodeHandle position={Position.Left} color="border-amber-500" />
      <div className="node-header border-amber-500/10 bg-amber-500/10">
        <GitBranch className="w-4 h-4 text-amber-400" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">DECISION</span>
      </div>
      <div className="node-body px-2 py-3 space-y-2">
        {branches.map((branch: any, idx: number) => (
          <div key={idx} className="relative py-2 px-3 bg-white/5 rounded border border-white/5 group">
            <div className="flex items-center justify-between gap-4">
              <span className={`text-[9px] font-black uppercase ${branch.type === 'if' ? 'text-blue-400' : 'text-white/30'}`}>{branch.type}</span>
              {branch.type !== 'else' && (
                <span className="text-[10px] text-white/60 truncate max-w-[100px] font-mono">{branch.condition}</span>
              )}
            </div>
            <SourceNodeHandle position={Position.Right} id={branch.id || branch.type} color={branch.type === 'if' ? 'border-blue-500' : 'border-gray-600'} offset="-12px" />
          </div>
        ))}
      </div>
    </div>
  );
};





export const generateAgentCode = (data: any, nodes: any[] = []) => {
  const name = data.name || "AssistantBot";
  const systemPrompt = data.system_prompt || "You are a helpful assistant.";
  const modelName = data.model_name || "qwen:4b";

  const toolsNodes = nodes.filter(n => n.type === 'tools');
  const toolNames = toolsNodes.map(n => n.data?.function_name || "my_function").filter(Boolean);
  const toolNamesString = toolNames.length > 0 ? `[${toolNames.join(', ')}]` : '[]';

  let imports = `from yukta import create_agent\nfrom yukta.core.Clients.ollama_client import OllamaClient\n`;
  if (toolNames.length > 0) {
    imports += `from tools import *\n`;
  }

  let agentParams = `name="${name}",\nsystem_prompt="${systemPrompt}",\nllm_client=OllamaClient(model_name="${modelName}")`;
  if (toolNames.length > 0) {
    agentParams += `,\ntools=${toolNamesString}`;
  }

  return `${imports}
agent = create_agent(
${agentParams}
)

response = agent.invoke("What is Python?", use_llm=True)
print(response)
`;
};

const generateAndSaveAgentFile = async (data: any, nodes: any[] = []) => {
    try {
        await fetch('/api/files/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: 'Agent.py', content: generateAgentCode(data, nodes) })
        });
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch (e) {
        console.error(e);
    }
};

const deleteAgentFile = async () => {
    try {
        await fetch('/api/files/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: 'Agent.py' })
        });
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch (e) {
        console.error(e);
    }
};

export const generateToolsCode = (nodes: any[]) => {
  const toolsNodes = nodes.filter(n => n.type === 'tools');
  if (toolsNodes.length === 0) return '';

  let code = `from yukta.tools.tools_pro import register_tool\n\n`;

  toolsNodes.forEach(node => {
    const data = node?.data || {};
    const functionName = data.function_name || "my_function";
    const desc = data.description || "Description";
    const inputParams = data.input_params || "";
    const returnType = data.return_type || "None";

    code += `def ${functionName}(${inputParams}):\n`;
    code += `    """ ${desc}\n`;
    code += `    """\n`;
    code += `    # TODO: implement logic\n`;
    code += `    return ${returnType}\n\n`;
    code += `# Register tool\n`;
    code += `register_tool("${functionName}", ${functionName})\n\n`;
  });

  return code;
};

const generateAndSaveToolsFile = async (nodes: any[]) => {
    const toolsNodes = nodes.filter(n => n.type === 'tools');
    try {
        if (toolsNodes.length === 0) {
            await fetch('/api/files/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: 'tools.py' }) });
        } else {
            await fetch('/api/files/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileName: 'tools.py', content: generateToolsCode(nodes) })
            });
        }
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch(e) {}
};

const deleteToolsFile = async () => {
    try {
        await fetch('/api/files/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: 'tools.py' }) });
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch(e) {}
};

export const generateConfigCode = (data: any) => {
  const appName = data.app_name || "YuktaApp";
  const debug = data.debug !== undefined ? data.debug : true;
  const modelName = data.model_name || "qwen:4b";
  return `CONFIG = {
    "app_name": "${appName}",
    "debug": ${debug ? 'True' : 'False'},
    "model_name": "${modelName}"
}
`;
};

const generateAndSaveConfigFile = async (data: any) => {
    try {
        await fetch('/api/files/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: 'config.py', content: generateConfigCode(data) })
        });
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch(e) {}
};

const deleteConfigFile = async () => {
    try {
        await fetch('/api/files/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: 'config.py' }) });
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch(e) {}
};

export const generateRunCode = (data: any) => {
  const entryMessage = data.entry_message || "Hello";
  return `from agent import agent

if __name__ == "__main__":
    response = agent.invoke("${entryMessage}", use_llm=True)
    print(response)
`;
};

const generateAndSaveRunFile = async (data: any) => {
    try {
        await fetch('/api/files/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: 'run.py', content: generateRunCode(data) })
        });
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch(e) {}
};

const deleteRunFile = async () => {
    try {
        await fetch('/api/files/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: 'run.py' }) });
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch(e) {}
};

export const generateHostCode = (data: any) => {
  const host = data.host || "127.0.0.1";
  const port = data.port || 8000;
  return `from fastapi import FastAPI
from agent import agent

app = FastAPI()

@app.get("/")
def root():
    return {"message": "Yukta API running"}

@app.get("/ask")
def ask(q: str):
    return {"response": agent.invoke(q, use_llm=True)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="${host}", port=${port})
`;
};

const generateAndSaveHostFile = async (data: any) => {
    try {
        await fetch('/api/files/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: 'host.py', content: generateHostCode(data) })
        });
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch(e) {}
};

const deleteHostFile = async () => {
    try {
        await fetch('/api/files/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: 'host.py' }) });
        window.dispatchEvent(new CustomEvent('refresh-explorer'));
    } catch(e) {}
};

const AgentNode = ({ data }: any) => (
  <div className="modern-node border-pink-500/30 overflow-hidden min-w-[220px]">
    <div className="node-accent bg-pink-500" />
    <TargetNodeHandle position={Position.Left} color="border-pink-500" />
    <div className="node-header border-pink-500/10 bg-pink-500/10">
      <Sparkles className="w-4 h-4 text-pink-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">AGENT</span>
    </div>
    <div className="node-body px-4 py-3">
      <div className="text-[10px] text-white/40 uppercase mb-1">Name</div>
      <div className="text-xs font-bold text-white/90 truncate">{data.name || '<USER_INPUT_NAME>'}</div>
      <div className="text-[9px] text-white/30 italic mt-1 truncate">"{data.model_name || 'qwen:4b'}"</div>
    </div>
    <SourceNodeHandle position={Position.Right} color="border-pink-500" />
  </div>
);

const ToolsNode = ({ data }: any) => (
  <div className="modern-node border-orange-500/30 overflow-hidden min-w-[220px]">
    <div className="node-accent bg-orange-500" />
    <TargetNodeHandle position={Position.Left} color="border-orange-500" />
    <div className="node-header border-orange-500/10 bg-orange-500/10">
      <Code className="w-4 h-4 text-orange-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">TOOLS</span>
    </div>
    <div className="node-body px-4 py-3">
      <div className="text-[10px] text-white/40 uppercase mb-1">Function</div>
      <div className="text-xs font-bold text-white/90 truncate">{data.function_name || 'my_function'}</div>
    </div>
    <SourceNodeHandle position={Position.Right} color="border-orange-500" />
  </div>
);

const ConfigNode = ({ data }: any) => (
  <div className="modern-node border-teal-500/30 overflow-hidden min-w-[220px]">
    <div className="node-accent bg-teal-500" />
    <TargetNodeHandle position={Position.Left} color="border-teal-500" />
    <div className="node-header border-teal-500/10 bg-teal-500/10">
      <Settings className="w-4 h-4 text-teal-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">CONFIG</span>
    </div>
    <div className="node-body px-4 py-3">
      <div className="text-[10px] text-white/40 uppercase mb-1">App Name</div>
      <div className="text-xs font-bold text-white/90 truncate">{data.app_name || 'YuktaApp'}</div>
    </div>
    <SourceNodeHandle position={Position.Right} color="border-teal-500" />
  </div>
);

const RunNode = ({ data }: any) => (
  <div className="modern-node border-emerald-500/30 overflow-hidden min-w-[220px]">
    <div className="node-accent bg-emerald-500" />
    <TargetNodeHandle position={Position.Left} color="border-emerald-500" />
    <div className="node-header border-emerald-500/10 bg-emerald-500/10">
      <Play className="w-4 h-4 text-emerald-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">RUN</span>
    </div>
    <div className="node-body flex justify-center py-3">
      <div className="text-[11px] text-white/90 font-bold">{data.entry_message || "Hello"}</div>
    </div>
    <SourceNodeHandle position={Position.Right} color="border-emerald-500" />
  </div>
);

const HostNode = ({ data }: any) => (
  <div className="modern-node border-purple-500/30 overflow-hidden min-w-[220px]">
    <div className="node-accent bg-purple-500" />
    <TargetNodeHandle position={Position.Left} color="border-purple-500" />
    <div className="node-header border-purple-500/10 bg-purple-500/10">
      <Server className="w-4 h-4 text-purple-400" />
      <span className="text-[10px] font-black text-white uppercase tracking-widest">HOST</span>
    </div>
    <div className="node-body px-4 py-3">
      <div className="text-[10px] text-white/40 uppercase mb-1">Endpoints</div>
      <div className="text-xs font-bold text-white/90 truncate">{data.host || '127.0.0.1'}:{data.port || 8000}</div>
    </div>
    <SourceNodeHandle position={Position.Right} color="border-purple-500" />
  </div>
);

const nodeTypes = {
  start: StartNode,
  trigger: TriggerNode,
  end: EndNode,
  input: InputNode,
  variable: ProcessNode,
  display: PrintNode,
  condition: ConditionNode,
  agent: AgentNode,
  tools: ToolsNode,
  config: ConfigNode,
  run: RunNode,
  host: HostNode,
};

const getConditionBranches = (variant: string) => {
  switch (variant) {
    case 'if':
      return [{ type: 'if', condition: 'True', id: 'if' }];
    case 'if-else':
      return [
        { type: 'if', condition: 'True', id: 'if' },
        { type: 'else', id: 'else' }
      ];
    case 'if-else-if':
      return [
        { type: 'if', condition: 'x > 10', id: 'if' },
        { type: 'else-if', condition: 'x > 5', id: 'else-if' },
        { type: 'else', id: 'else' }
      ];
    case 'nested-if':
      return [
        { type: 'if', condition: 'x > 0', id: 'if' },
        { type: 'nested-if', condition: 'y > 0', id: 'nested-if' },
        { type: 'else', id: 'else' }
      ];
    case 'switch':
      return [
        { type: 'case', condition: 'case_1', id: 'case_1' },
        { type: 'case', condition: 'case_2', id: 'case_2' },
        { type: 'default', id: 'default' }
      ];
    case 'ternary':
      return [
        { type: 'condition', condition: 'x > 0', id: 'condition' },
        { type: 'true', condition: 'value_if_true', id: 'true' },
        { type: 'false', condition: 'value_if_false', id: 'false' }
      ];
    default:
      return [
        { type: 'if', condition: 'True', id: 'if' },
        { type: 'else', id: 'else' }
      ];
  }
};

const NODE_PALETTE = [
  { 
    type: 'condition',
    label: 'If',
    icon: GitBranch,
    color: 'text-amber-400',
    description: 'Single if branch',
    group: 'Conditional Statements',
    conditionVariant: 'if'
  },
  { 
    type: 'condition',
    label: 'If-Else',
    icon: GitBranch,
    color: 'text-amber-400',
    description: 'Two-way branch logic',
    group: 'Conditional Statements',
    conditionVariant: 'if-else'
  },
  { 
    type: 'condition',
    label: 'If-Else If',
    icon: GitBranch,
    color: 'text-amber-400',
    description: 'Multiple condition chain',
    group: 'Conditional Statements',
    conditionVariant: 'if-else-if'
  },
  { 
    type: 'condition',
    label: 'Nested If',
    icon: GitBranch,
    color: 'text-amber-400',
    description: 'Inner conditional branch',
    group: 'Conditional Statements',
    conditionVariant: 'nested-if'
  },
  { 
    type: 'condition',
    label: 'Switch',
    icon: ArrowUpDown,
    color: 'text-cyan-400',
    description: 'Case-based branch selection',
    group: 'Conditional Statements',
    conditionVariant: 'switch'
  },
  { 
    type: 'condition',
    label: 'Ternary',
    icon: Spline,
    color: 'text-violet-400',
    description: 'Compact true/false expression',
    group: 'Conditional Statements',
    conditionVariant: 'ternary'
  },
  {
    type: 'display',
    label: 'Print',
    icon: Terminal,
    color: 'text-cyan-400',
    description: 'Display/output a value',
    group: 'Conditional Statements'
  },
  {
    type: 'end',
    label: 'End',
    icon: X,
    color: 'text-rose-400',
    description: 'Terminate workflow path',
    group: 'Conditional Statements'
  },
  {
    type: 'trigger',
    label: 'Trigger',
    icon: PlayCircle,
    color: 'text-indigo-400',
    description: 'Entry trigger node',
    group: 'Conditional Statements'
  },
  {
    type: 'agent',
    label: 'Agent',
    icon: Sparkles,
    color: 'text-pink-400',
    description: 'Yukta Agent',
    group: 'Yukta Framework'
  },
  {
    type: 'tools',
    label: 'Tools',
    icon: Code,
    color: 'text-orange-400',
    description: 'Custom Function Tools',
    group: 'Yukta Framework'
  },
  {
    type: 'config',
    label: 'Config',
    icon: Settings,
    color: 'text-teal-400',
    description: 'App Configuration',
    group: 'Yukta Framework'
  },
  {
    type: 'run',
    label: 'Run',
    icon: Play,
    color: 'text-emerald-400',
    description: 'Execute Agent Runner',
    group: 'Yukta Framework'
  },
  {
    type: 'host',
    label: 'Host',
    icon: Server,
    color: 'text-purple-400',
    description: 'FastAPI Server Host',
    group: 'Yukta Framework'
  },
];

export const WorkflowBuilder: React.FC = () => {
  const { state, commands } = useApp();
  const { nodes, edges, isRunning, selectedNodeId, agentLogs, activeNodeId, workflowRightPanelWidth, isAIChatOpen, aiChatPanelWidth } = state;
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<number | null>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        if (resizeRef.current) return;
        resizeRef.current = requestAnimationFrame(() => {
          // Calculate width from the right, accounting for AI Chat Panel if open
          const offset = isAIChatOpen ? aiChatPanelWidth : 0;
          const newWidth = window.innerWidth - e.clientX - offset;
          if (newWidth > 200 && newWidth < 600) {
            commands.setWorkflowRightPanelWidth(newWidth);
          }
          resizeRef.current = null;
        });
      }
    },
    [isResizing, commands, isAIChatOpen, aiChatPanelWidth]
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



  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId), 
    [nodes, selectedNodeId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      commands.setNodes((nds: any) => applyNodeChanges(changes, nds));
    },
    [commands]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      commands.setEdges((eds: any) => applyEdgeChanges(changes, eds));
    },
    [commands]
  );

  const onConnect = useCallback(
    (params: Connection) => commands.setEdges((eds: any) => addEdge({
      ...params,
      type: 'smoothstep',
      animated: true,
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: '#6366f1',
        width: 20,
        height: 20
      },
      style: { stroke: '#6366f1', strokeWidth: 2.5, opacity: 0.8 },
      interactionWidth: 20,
    } as any, eds)),
    [commands]
  );

  const onNodeClick = useCallback((_: any, node: any) => {
    commands.setSelectedNodeId(node.id);
  }, [commands]);

  const onPaneClick = useCallback(() => {
    commands.setSelectedNodeId(null);
  }, [commands]);

  const updateNodeData = (id: string, newData: any) => {
    commands.setNodes((nds: any) => {
      const newNodes = nds.map((node: any) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      });

      const updatedNode = newNodes.find((n: any) => n.id === id);
      if (updatedNode) {
        if (updatedNode.type === 'agent') {
          generateAndSaveAgentFile(updatedNode.data, newNodes);
        } else if (updatedNode.type === 'tools') {
          generateAndSaveToolsFile(newNodes);
          const agentNode = newNodes.find((n: any) => n.type === 'agent');
          if (agentNode) generateAndSaveAgentFile(agentNode.data, newNodes);
        } else if (updatedNode.type === 'config') {
          generateAndSaveConfigFile(updatedNode.data);
        } else if (updatedNode.type === 'run') {
          generateAndSaveRunFile(updatedNode.data);
        } else if (updatedNode.type === 'host') {
          generateAndSaveHostFile(updatedNode.data);
        }
      }
      return newNodes;
    });
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');
      const conditionVariant = event.dataTransfer.getData('application/condition-variant');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = { x: event.clientX - 400, y: event.clientY - 100 }; // Rough estimate
      
      const defaultData: any = { 
        label: label || `${type} node`,
        variable: 'x',
        prompt: 'Enter value: ',
        expression: 'x',
        value: '',
        condition: 'True',
        iterator: 'i',
        loopStart: 0,
        loopEnd: 10,
        branches: type === 'condition' ? getConditionBranches(conditionVariant || 'if-else') : (type === 'options' ? [
          { label: 'Option 1', value: "'opt1'", id: 'opt1' }
        ] : undefined)
      };

      // Add specific defaults for new nodes
      if (type === 'condition') {
        defaultData.branches = getConditionBranches(conditionVariant || 'if-else');
      }

      const newNode = {
        id: `node-${Date.now()}`,
        type,
        position,
        sourcePosition: 'right',
        targetPosition: 'left',
        data: defaultData,
      };

      commands.setNodes((nds: any) => {
        const newNodes = nds.concat(newNode);
        if (type === 'agent') {
          defaultData.name = defaultData.name || "<USER_INPUT_NAME>";
          defaultData.system_prompt = defaultData.system_prompt || "<USER_INPUT_SYSTEM_PROMPT>";
          defaultData.model_name = defaultData.model_name || "qwen:4b";
          generateAndSaveAgentFile(defaultData, newNodes);
        } else if (type === 'tools') {
          defaultData.function_name = defaultData.function_name || "my_function";
          defaultData.description = defaultData.description || "Description";
          defaultData.input_params = defaultData.input_params || "";
          defaultData.return_type = defaultData.return_type || "None";
          generateAndSaveToolsFile(newNodes);
          const agentNode = newNodes.find((n: any) => n.type === 'agent');
          if (agentNode) generateAndSaveAgentFile(agentNode.data, newNodes);
        } else if (type === 'config') {
          defaultData.app_name = defaultData.app_name || "YuktaApp";
          defaultData.debug = defaultData.debug !== undefined ? defaultData.debug : true;
          defaultData.model_name = defaultData.model_name || "qwen:4b";
          generateAndSaveConfigFile(defaultData);
        } else if (type === 'run') {
          defaultData.entry_message = defaultData.entry_message || "Hello";
          generateAndSaveRunFile(defaultData);
        } else if (type === 'host') {
          defaultData.host = defaultData.host || "127.0.0.1";
          defaultData.port = defaultData.port || 8000;
          generateAndSaveHostFile(defaultData);
        }
        return newNodes;
      });
    },
    [commands]
  );

  return (
    <div className="flex h-full w-full bg-[#1e1e1e] overflow-hidden">
      {/* Central Area: Canvas */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="relative h-full w-full">
            <ReactFlow
                nodes={(nodes || []).map(n => ({
                  ...n,
                  position: n?.position || { x: 0, y: 0 },
                  style: { 
                    ...n?.style, 
                    border: activeNodeId === n?.id ? '2px solid #3b82f6' : n?.style?.border,
                    boxShadow: activeNodeId === n?.id ? '0 0 15px rgba(59, 130, 246, 0.5)' : n?.style?.boxShadow
                  }
                }))}
                edges={edges || []}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onDragOver={onDragOver}
                onDrop={onDrop}
                fitView
                style={{ background: '#1e1e1e' }}
                colorMode="dark"
              >
                <Background color="#2a2a2a" gap={25} variant={BackgroundVariant.Lines} size={1} />
                <Controls />
                <MiniMap 
                  style={{ background: '#252526' }} 
                  nodeColor={(n) => n.type === 'start' ? '#10b981' : n.type === 'end' ? '#ef4444' : '#8b5cf6'}
                />
                
                <Panel position="top-right" className="flex gap-2 bg-[#252526] p-2 rounded-lg border border-[#454545] shadow-xl">
                  <button 
                    onClick={() => {
                        const depths = new Map();
                        const startNodes = nodes.filter(n => n.type === 'start');
                        if (startNodes.length === 0 && nodes.length > 0) startNodes.push(nodes[0]);
                    
                        const queue = startNodes.map(n => ({ id: n.id, depth: 0 }));
                        startNodes.forEach(n => depths.set(n.id, 0));
                    
                        let head = 0;
                        while(head < queue.length) {
                            const { id, depth } = queue[head++];
                            const outgoing = edges.filter(e => e.source === id);
                            outgoing.forEach(e => {
                                if (!depths.has(e.target) || depths.get(e.target) < depth + 1) {
                                    depths.set(e.target, depth + 1);
                                    if (!queue.find(item => item.id === e.target)) {
                                       queue.push({ id: e.target, depth: depth + 1 });
                                    } else {
                                       const existing = queue.find(item => item.id === e.target);
                                       if (existing) existing.depth = depth + 1;
                                    }
                                }
                            });
                        }
                    
                        const levelCounts = new Map();
                        const newNodes = nodes.map(n => {
                            const depth = depths.has(n.id) ? depths.get(n.id) : 0;
                            const count = levelCounts.get(depth) || 0;
                            levelCounts.set(depth, count + 1);
                            return {
                                ...n,
                                position: { 
                                x: 250 + count * 350, 
                                y: 100 + depth * 200 
                                }
                            };
                        });
                        commands.setNodes(newNodes);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#3c3c3c] hover:bg-[#454545] text-white/70 hover:text-white text-xs font-bold rounded transition-all border border-[#454545]"
                    title="Organize nodes based on workflow logic"
                  >
                    <RefreshCw size={14} />
                    Auto-Layout
                  </button>
                  <button 
                    onClick={() => {
                      let fileToOpen = 'workflow.py';
                      if (selectedNodeId) {
                        const type = nodes.find(n => n.id === selectedNodeId)?.type;
                        if (type === 'agent') fileToOpen = 'Agent.py';
                        else if (type === 'tools') fileToOpen = 'tools.py';
                        else if (type === 'config') fileToOpen = 'config.py';
                        else if (type === 'run') fileToOpen = 'run.py';
                        else if (type === 'host') fileToOpen = 'host.py';
                      }
                      commands.setActiveFile(fileToOpen);
                      console.log("Viewing file:", fileToOpen);
                      commands.switchToWorkflowCode();
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#3c3c3c] hover:bg-[#454545] text-white/70 hover:text-white text-xs font-bold rounded transition-all border border-[#454545]"
                  >
                    <Code size={14} />
                    View Code
                  </button>
                  <div className="w-px bg-[#333] mx-1" />
                   <button 
                    onClick={() => commands.runActiveWorkflowInTerminal()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
                    title="Execute in terminal"
                  >
                    <Play size={14} fill="currentColor" />
                    Run
                  </button>
                  <button 
                    onClick={() => commands.execute("saveWorkflow")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-all"
                  >
                    <Save size={14} />
                    Save
                  </button>
                  <button 
                    onClick={() => commands.exportWorkflow()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#3c3c3c] hover:bg-[#454545] text-white/70 hover:text-white text-xs font-bold rounded transition-all border border-[#454545]"
                  >
                    <Download size={14} />
                    Export
                  </button>
                  <button 
                    onClick={() => commands.importWorkflow()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#3c3c3c] hover:bg-[#454545] text-white/70 hover:text-white text-xs font-bold rounded transition-all border border-[#454545]"
                  >
                    <Upload size={14} />
                    Import
                  </button>
                  <button 
                    onClick={() => commands.execute("clearWorkflow")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold rounded border border-red-600/30 transition-all"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </Panel>

              </ReactFlow>
          </div>
        </div>
      </div>

      {/* Right Panel: Node Library or Configuration */}
      <div 
        style={{ width: workflowRightPanelWidth }}
        className="bg-[#252526] flex flex-col border-l border-[#333] shadow-2xl z-10 relative"
      >
        {/* Resize Handle */}
        <div
          onMouseDown={startResizing}
          className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-50 ${
            isResizing ? "bg-blue-500" : "hover:bg-blue-500/30"
          }`}
        />
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div 
              key="config"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full"
            >
              <div className="p-4 border-b border-[#333] flex items-center gap-3 bg-[#2d2d2d]">
                <button 
                  onClick={() => commands.setSelectedNodeId(null)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/50 hover:text-white"
                  title="Back to Library"
                >
                  <ChevronLeft size={16} />
                </button>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 flex-1">
                  <Settings size={14} className="text-blue-400" />
                  Node Settings
                </h3>
                <button 
                  onClick={() => commands.setSelectedNodeId(null)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors"
                >
                  <X size={14} className="text-white/50" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Node ID</label>
                  <div className="px-3 py-2 bg-black/20 rounded border border-[#454545] text-xs text-white/60 font-mono">
                    {selectedNode.id}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Display Name</label>
                  <input 
                    type="text"
                    value={selectedNode.data?.label || ""}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                    className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#454545] rounded text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Node Type</label>
                  <div className="px-3 py-2 bg-black/20 rounded border border-[#454545] text-xs text-white/60 capitalize">
                    {selectedNode.type || 'default'}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#333] space-y-4">
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Python Mapping</h4>
                  
                  <div className="space-y-4">
                    {/* Common Variable Field */}
                    {(selectedNode.type === 'input' || selectedNode.type === 'variable') && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-white/70">Variable Name</span>
                        <input 
                          type="text" 
                          value={selectedNode.data?.variable || "x"}
                          onChange={(e) => updateNodeData(selectedNode.id, { variable: e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Type Specific Parameters */}
                    {selectedNode.type === 'input' && (
                      <>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Input Prompt</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.prompt || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                            placeholder="Enter value: "
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Static / Default Value</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.value || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                            placeholder="Optional: Default if empty"
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}

                    {selectedNode.type === 'variable' && (
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-white/70">Value</span>
                        <input 
                          type="text" 
                          value={selectedNode.data?.value || ""}
                          onChange={(e) => updateNodeData(selectedNode.id, { value: e.target.value })}
                          className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}

                    {selectedNode.type === 'agent' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.name || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">System Prompt</span>
                          <textarea 
                            value={selectedNode.data?.system_prompt || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { system_prompt: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500 min-h-[60px]"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Model Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.model_name || "qwen:4b"}
                            onChange={(e) => updateNodeData(selectedNode.id, { model_name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="pt-2">
                          <button 
                            onClick={() => {
                              commands.setActiveFile('Agent.py');
                              commands.switchToWorkflowCode();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold rounded border border-blue-600/30 transition-all"
                          >
                            <Code size={14} />
                            View Code
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'tools' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Function Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.function_name || "my_function"}
                            onChange={(e) => updateNodeData(selectedNode.id, { function_name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Description</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.description || "Description"}
                            onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Input Params</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.input_params || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { input_params: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Return Type</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.return_type || "None"}
                            onChange={(e) => updateNodeData(selectedNode.id, { return_type: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="pt-2">
                          <button 
                            onClick={() => {
                              commands.setActiveFile('tools.py');
                              commands.switchToWorkflowCode();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold rounded border border-blue-600/30 transition-all"
                          >
                            <Code size={14} />
                            View Code
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'config' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">App Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.app_name || "YuktaApp"}
                            onChange={(e) => updateNodeData(selectedNode.id, { app_name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Model Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.model_name || "qwen:4b"}
                            onChange={(e) => updateNodeData(selectedNode.id, { model_name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedNode.data?.debug !== false}
                            onChange={(e) => updateNodeData(selectedNode.id, { debug: e.target.checked })}
                            className="w-3 h-3 text-blue-500 bg-[#3c3c3c] border-[#454545] rounded"
                          />
                          <span className="text-[11px] text-white/70">Debug Mode</span>
                        </div>
                        <div className="pt-2">
                          <button 
                            onClick={() => {
                              commands.setActiveFile('config.py');
                              commands.switchToWorkflowCode();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold rounded border border-blue-600/30 transition-all"
                          >
                            <Code size={14} />
                            View Code
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'run' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Entry Message</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.entry_message || "Hello"}
                            onChange={(e) => updateNodeData(selectedNode.id, { entry_message: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="pt-2">
                          <button 
                            onClick={() => {
                              commands.setActiveFile('run.py');
                              commands.switchToWorkflowCode();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold rounded border border-blue-600/30 transition-all"
                          >
                            <Code size={14} />
                            View Code
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'host' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Host IP</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.host || "127.0.0.1"}
                            onChange={(e) => updateNodeData(selectedNode.id, { host: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Port</span>
                          <input 
                            type="number" 
                            value={selectedNode.data?.port || 8000}
                            onChange={(e) => updateNodeData(selectedNode.id, { port: parseInt(e.target.value) || 8000 })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="pt-2">
                          <button 
                            onClick={() => {
                              commands.setActiveFile('host.py');
                              commands.switchToWorkflowCode();
                            }}
                            className="w-full flex items-center justify-center gap-2 p-2 bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold rounded border border-blue-600/30 transition-all"
                          >
                            <Code size={14} />
                            View Code
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'condition' && (
                       <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Branches</span>
                            <button 
                              onClick={() => {
                                const branches = selectedNode.data?.branches || [{ type: 'if', condition: 'True', id: 'if' }];
                                branches.push({ type: 'elif', condition: 'False', id: `elif-${Date.now()}` });
                                updateNodeData(selectedNode.id, { branches: [...branches] });
                              }}
                              className="p-1 hover:bg-white/10 rounded transition-colors text-blue-400"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            {(selectedNode.data?.branches || [{ type: 'if', condition: 'True', id: 'if' }]).map((branch: any, idx: number) => (
                              <div key={branch.id} className="p-3 bg-[#2a2a2a] rounded-lg border border-white/5 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <select 
                                    value={branch.type}
                                    onChange={(e) => {
                                      const branches = [...(selectedNode.data?.branches || [])];
                                      branches[idx].type = e.target.value;
                                      updateNodeData(selectedNode.id, { branches });
                                    }}
                                    className="bg-transparent text-[10px] font-bold text-blue-400 uppercase focus:outline-none"
                                  >
                                    <option value="if">If</option>
                                    <option value="elif">Elif</option>
                                    <option value="else">Else</option>
                                  </select>
                                  {branch.type !== 'if' && (
                                    <button 
                                      onClick={() => {
                                        const branches = [...(selectedNode.data?.branches || [])];
                                        branches.splice(idx, 1);
                                        updateNodeData(selectedNode.id, { branches });
                                      }}
                                      className="p-1 hover:bg-red-500/10 rounded text-red-500/50 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                                {branch.type !== 'else' && (
                                  <textarea 
                                    value={branch.condition || ""}
                                    onChange={(e) => {
                                      const branches = [...(selectedNode.data?.branches || [])];
                                      branches[idx].condition = e.target.value;
                                      updateNodeData(selectedNode.id, { branches });
                                    }}
                                    placeholder="Condition..."
                                    className="w-full px-2 py-1.5 bg-[#1a1a1a] border border-white/5 rounded text-xs text-white h-12 resize-none focus:outline-none focus:border-blue-500/50 font-mono"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {!(selectedNode.data?.branches || []).some((b: any) => b.type === 'else') && (
                            <button 
                              onClick={() => {
                                const branches = selectedNode.data?.branches || [{ type: 'if', condition: 'True', id: 'if' }];
                                branches.push({ type: 'else', id: 'else' });
                                updateNodeData(selectedNode.id, { branches: [...branches] });
                              }}
                              className="w-full py-2 border border-dashed border-white/10 rounded-lg text-[11px] text-white/30 hover:text-white/60 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Else Branch
                            </button>
                          )}
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#1e1e1e] border-t border-[#333]">
                <button 
                  onClick={() => {
                    commands.setNodes((nds: any) => {
                      const newNodes = nds.filter((n: any) => n.id !== selectedNode.id);
                      if (selectedNode.type === 'agent') {
                        deleteAgentFile();
                      } else if (selectedNode.type === 'tools') {
                        generateAndSaveToolsFile(newNodes);
                        const agentNode = newNodes.find((n: any) => n.type === 'agent');
                        if (agentNode) generateAndSaveAgentFile(agentNode.data, newNodes);
                      } else if (selectedNode.type === 'config') {
                        deleteConfigFile();
                      } else if (selectedNode.type === 'run') {
                        deleteRunFile();
                      } else if (selectedNode.type === 'host') {
                        deleteHostFile();
                      }
                      return newNodes;
                    });
                    commands.setSelectedNodeId(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-2 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold rounded border border-red-600/30 transition-all"
                >
                  <Trash2 size={14} />
                  Delete Node
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="library"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="p-4 border-b border-[#333] flex items-center justify-between bg-[#2d2d2d]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layout size={14} className="text-blue-400" />
                  Node Library
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-8">
                {Object.entries(
                  NODE_PALETTE.reduce((acc, node) => {
                    const group = node.group || 'Other';
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(node);
                    return acc;
                  }, {} as Record<string, typeof NODE_PALETTE>)
                ).map(([group, items]) => (
                  <div key={group} className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px flex-1 bg-white/5" />
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{group}</span>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      {items.map((node) => (
                        <div
                          key={node.label}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/reactflow', node.type);
                            e.dataTransfer.setData('application/label', node.label);
                            if (node.conditionVariant) {
                              e.dataTransfer.setData('application/condition-variant', node.conditionVariant);
                            }
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          className="group flex items-center gap-3 p-2 bg-[#2d2d2d] hover:bg-zinc-800/80 border border-white/5 hover:border-blue-500/50 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] shadow-sm active:scale-100"
                        >
                          <div className={`p-2 rounded-md bg-black/20 ${node.color} group-hover:scale-110 transition-transform`}>
                            <node.icon size={16} />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-white/80 truncate group-hover:text-white transition-colors">{node.label}</span>
                            <span className="text-[9px] text-white/20 truncate leading-tight group-hover:text-white/40 transition-colors">{node.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}


              </div>

              <div className="p-4 bg-[#1e1e1e] border-t border-[#333]">
                <div className="flex items-center gap-2 text-[10px] text-white/30">
                  <Zap size={10} />
                  <span>AI Suggestions enabled</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
