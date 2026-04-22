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
  MarkerType,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useApp } from "../../store";
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
  Upload,
  Bot,
  Wrench,
  FolderPlus
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

const SyncIndicator = ({ synced }: { synced: boolean | 'dirty' | 'none' }) => (
  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/5 ml-auto">
    <div className={`w-1.5 h-1.5 rounded-full ${
      synced === true ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 
      synced === 'dirty' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' :
      'bg-red-500/50'
    }`} />
    <span className="text-[7px] font-black text-white/40 uppercase tracking-tighter">
      {synced === true ? 'Synced' : synced === 'dirty' ? 'Dirty' : 'No File'}
    </span>
  </div>
);

const AgentNode = ({ data, selected }: any) => (
  <div className={`relative ${selected ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}>
    <BaseNode data={data} type="Agent" icon={Bot} color="border-indigo-500" />
    <TargetNodeHandle position={Position.Left} />
    <SourceNodeHandle position={Position.Right} />
  </div>
);

const ToolNode = ({ data, selected }: any) => (
  <div className={`relative ${selected ? 'ring-2 ring-emerald-500 rounded-xl' : ''}`}>
    <BaseNode data={data} type="Tool" icon={Wrench} color="border-emerald-500" />
    <TargetNodeHandle position={Position.Left} />
    <SourceNodeHandle position={Position.Right} />
  </div>
);
const ConfigNode = ({ data, selected }: any) => (
  <div className={`relative ${selected ? 'ring-2 ring-yellow-500 rounded-xl' : ''}`}>
    <BaseNode data={data} type="Config" icon={Settings} color="border-yellow-500" />
    <TargetNodeHandle position={Position.Left} />
    <SourceNodeHandle position={Position.Right} />
  </div>
);

const HostNode = ({ data, selected }: any) => (
  <div className={`relative ${selected ? 'ring-2 ring-blue-500 rounded-xl' : ''}`}>
    <BaseNode data={data} type="Host" icon={Server} color="border-blue-500" />
    <TargetNodeHandle position={Position.Left} />
    <SourceNodeHandle position={Position.Right} />
  </div>
);

const ConditionNode = ({ data, selected }: any) => (
  <div className={`relative ${selected ? 'ring-2 ring-orange-500 rounded-xl' : ''}`}>
    <BaseNode data={data} type="Decision" icon={HelpCircle} color="border-orange-500" />
    <TargetNodeHandle position={Position.Left} />
    <SourceNodeHandle position={Position.Right} id="true" label="True" offset="-7px" />
    <SourceNodeHandle position={Position.Bottom} id="false" label="False" offset="-7px" />
  </div>
);

const ForLoopNode = ({ data, selected }: any) => (
  <div className={`relative ${selected ? 'ring-2 ring-pink-500 rounded-xl' : ''}`}>
    <BaseNode data={data} type="For Loop" icon={RefreshCw} color="border-pink-500" />
    <TargetNodeHandle position={Position.Left} />
    <SourceNodeHandle position={Position.Right} />
  </div>
);

const WhileLoopNode = ({ data, selected }: any) => (
  <div className={`relative ${selected ? 'ring-2 ring-purple-500 rounded-xl' : ''}`}>
    <BaseNode data={data} type="While Loop" icon={History} color="border-purple-500" />
    <TargetNodeHandle position={Position.Left} />
    <SourceNodeHandle position={Position.Right} />
  </div>
);
const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  config: ConfigNode,
  host: HostNode,
  condition: ConditionNode,
  for_loop: ForLoopNode,
  while_loop: WhileLoopNode
};

const NODE_PALETTE = [
  { 
    type: 'agent', 
    label: 'Yukta Agent', 
    icon: Bot, 
    color: 'text-indigo-400', 
    description: 'Yukta framework Agent',
    group: 'Yukta Core',
    defaultData: {
      agent_name: 'Yukta Agent',
      system_prompt: 'You are a helpful assistant.',
      model: 'gpt-4',
      temperature: 0.7,
      max_iter: 0,
      verbose: false,
      auto_save_chat: false,
      memory_enabled: true
    }
  },
  { 
    type: 'tool', 
    label: 'Yukta Tool', 
    icon: Wrench, 
    color: 'text-emerald-400', 
    description: 'Yukta framework Tool',
    group: 'Yukta Core',
    defaultData: {
      name: 'new_tool',
      description: 'A tool that performs a specific action.',
      function_name: 'process',
      tool_type: 'custom',
      parameters: []
    }
  },
  { 
    type: 'config', 
    label: 'Yukta Config', 
    icon: Settings, 
    color: 'text-yellow-400', 
    description: 'Yukta framework Config',
    group: 'Yukta Core',
    defaultData: {
      name: 'config',
      memory_type: 'local',
      logging_level: 'info'
    }
  },
  { 
    type: 'host', 
    label: 'Yukta Host', 
    icon: Server, 
    color: 'text-blue-400', 
    description: 'Yukta framework Host',
    group: 'Yukta Core',
    defaultData: {
      name: 'host',
      port: 8080,
      host_address: '0.0.0.0'
    }
  },
  { 
    type: 'condition', 
    label: 'Decision (If/Else)', 
    icon: HelpCircle, 
    color: 'text-orange-400', 
    description: 'If/Else conditional branching',
    group: 'Control Flow',
    defaultData: {
      condition: 'True',
    }
  },
  { 
    type: 'for_loop', 
    label: 'For Loop', 
    icon: RefreshCw, 
    color: 'text-pink-400', 
    description: 'Iterate over a collection',
    group: 'Control Flow',
    defaultData: {
      collection: 'items',
      item_var: 'item'
    }
  },
  { 
    type: 'while_loop', 
    label: 'While Loop', 
    icon: History, 
    color: 'text-purple-400', 
    description: 'Repeat while condition is true',
    group: 'Control Flow',
    defaultData: {
      condition: 'count < 10'
    }
  }
];

export const WorkflowBuilder: React.FC = () => (
  <ReactFlowProvider>
    <WorkflowBuilderContent />
  </ReactFlowProvider>
);

const WorkflowBuilderContent: React.FC = () => {
  const { state, commands } = useApp();
  const { screenToFlowPosition } = useReactFlow();
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
    
    // Rule: Clicking a Yukta node should open its associated code file
    const isYukta = ['agent', 'tool', 'run', 'config', 'host'].includes(node.type);
    if (isYukta && node.data.fileName) {
      const wfId = state.activeWorkflowId;
      const wf = wfId ? state.workflows[wfId] : null;
      if (wf && wf.folderName) {
        commands.openYuktaFile(`${wf.folderName}/${node.data.fileName}`, node.id);
      }
    }
  }, [commands, state.activeWorkflowId, state.workflows]);

  const onPaneClick = useCallback(() => {
    commands.setSelectedNodeId(null);
  }, [commands]);

  const updateNodeData = (id: string, newData: any) => {
    commands.setNodes((nds: any) =>
      nds.map((node: any) => {
        if (node.id === id) {
          // Rule: If a Yukta node's internal data changes, mark it as 'dirty' (out of sync)
          const isYukta = ['agent', 'tool', 'run', 'config', 'host'].includes(node.type);
          const syncState = isYukta ? { synced: 'dirty' } : {};
          return { ...node, data: { ...node.data, ...newData, ...syncState } };
        }
        return node;
      })
    );
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

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const paletteNode = NODE_PALETTE.find(n => n.type === type);
      const defaultData: any = { 
        label: label || `${type} node`,
        ...(paletteNode?.defaultData || {})
      };

      if (type === 'condition') {
        defaultData.branches = [
          { type: 'if', condition: 'True', id: 'if' },
          { type: 'else', id: 'else' }
        ];
      }

      const newNode = {
        id: `node-${Date.now()}`,
        type,
        position,
        sourcePosition: 'right',
        targetPosition: 'left',
        data: defaultData,
      };

      // Rule 1: Set filename for Yukta nodes and trigger physical file creation on drop
      if (['agent', 'tool', 'run', 'config', 'host'].includes(type)) {
        // Ensure a folder (workflow) exists before creating a file
        if (!state.activeWorkflowId) {
          commands.createNewWorkflow((id: string, folderName?: string) => {
            if (id) {
               // Proceed with creating the file after folder creation
               createFileForNode(type, newNode, id, folderName);
            }
          });
          return;
        }

        createFileForNode(type, newNode, state.activeWorkflowId);
      } else {
        commands.setNodes((nds: any) => nds.concat(newNode));
      }
    },
    [commands, screenToFlowPosition, state.activeWorkflowId]
  );

  const createFileForNode = (type: string, newNode: any, workflowId: string, folderName?: string) => {
    if (!newNode.data.fileName) {
        let fileName = "";
        if (type === 'run') fileName = "run.py";
        else if (type === 'config') fileName = "config.py";
        else if (type === 'host') fileName = "host.py";
        else {
            const name = newNode.data.label?.replace(/\s+/g, '_').toLowerCase() || type;
            fileName = `${name}_${Date.now().toString().slice(-4)}.py`;
        }
        newNode.data.fileName = fileName;
    }
    
    // Add to state first
    commands.setNodes((nds: any) => nds.concat(newNode));
    
    // Then create the physical file
    const targetFolder = folderName || state.workflows[workflowId]?.folderName;
    commands.createYuktaFile(type as any, newNode.data.fileName, newNode.data, newNode.id, targetFolder);
  };

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
                  nodeColor={(n) => n.type === 'agent' ? '#3b82f6' : n.type === 'tool' ? '#8b5cf6' : '#454545'}
                />
                
                <Panel position="top-right" className="flex gap-2 bg-[#252526] p-2 rounded-lg border border-[#454545] shadow-xl">
                  <button 
                    onClick={() => {
                        const targetIds = new Set(edges.map(e => e.target));
                        const startNodes = nodes.filter(n => !targetIds.has(n.id));
                        if (startNodes.length === 0 && nodes.length > 0) startNodes.push(nodes[0]);
                    
                        const queue = startNodes.map(n => ({ id: n.id, depth: 0 }));
                        const depths = new Map();
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
                    onClick={() => commands.switchToWorkflowCode()}
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
                    onClick={() => commands.createNewWorkflow()}
                    className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-all shadow-lg shadow-indigo-500/20 text-sm font-medium"
                  >
                    <FolderPlus size={16} />
                    <span>Create New Folder</span>
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




                    {selectedNode.type === 'agent' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Agent Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.agent_name || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { agent_name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">System Prompt</span>
                          <textarea 
                            value={selectedNode.data?.system_prompt || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { system_prompt: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white h-24 resize-none focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-white/70">Model</span>
                            <input 
                              type="text" 
                              value={selectedNode.data?.model || "gpt-4"}
                              onChange={(e) => updateNodeData(selectedNode.id, { model: e.target.value })}
                              className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] text-white/70">Temperature</span>
                            <input 
                              type="number" 
                              step="0.1"
                              value={selectedNode.data?.temperature || 0.7}
                              onChange={(e) => updateNodeData(selectedNode.id, { temperature: parseFloat(e.target.value) })}
                              className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Max Iterations (0 = unlimited)</span>
                          <input 
                            type="number" 
                            value={selectedNode.data?.max_iter || 0}
                            onChange={(e) => updateNodeData(selectedNode.id, { max_iter: parseInt(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                            <span className="text-[11px] text-white/70">Memory Enabled</span>
                            <input 
                              type="checkbox" 
                              checked={selectedNode.data?.memory_enabled !== false}
                              onChange={(e) => updateNodeData(selectedNode.id, { memory_enabled: e.target.checked })}
                              className="w-4 h-4 bg-[#3c3c3c] border-[#454545] rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                            <span className="text-[11px] text-white/70">Verbose Mode</span>
                            <input 
                              type="checkbox" 
                              checked={selectedNode.data?.verbose || false}
                              onChange={(e) => updateNodeData(selectedNode.id, { verbose: e.target.checked })}
                              className="w-4 h-4 bg-[#3c3c3c] border-[#454545] rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
                            <span className="text-[11px] text-white/70">Auto Save Chat</span>
                            <input 
                              type="checkbox" 
                              checked={selectedNode.data?.auto_save_chat || false}
                              onChange={(e) => updateNodeData(selectedNode.id, { auto_save_chat: e.target.checked })}
                              className="w-4 h-4 bg-[#3c3c3c] border-[#454545] rounded"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'tool' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Tool Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.name || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Function Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.function_name || "process"}
                            onChange={(e) => updateNodeData(selectedNode.id, { function_name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Description</span>
                          <textarea 
                            value={selectedNode.data?.description || ""}
                            onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white h-20 resize-none focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'config' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Config Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.name || "config"}
                            onChange={(e) => updateNodeData(selectedNode.id, { name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Memory Type</span>
                          <select 
                            value={selectedNode.data?.memory_type || "local"}
                            onChange={(e) => updateNodeData(selectedNode.id, { memory_type: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="local">Local</option>
                            <option value="redis">Redis</option>
                            <option value="mongo">MongoDB</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Logging Level</span>
                          <select 
                            value={selectedNode.data?.logging_level || "info"}
                            onChange={(e) => updateNodeData(selectedNode.id, { logging_level: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          >
                            <option value="debug">DEBUG</option>
                            <option value="info">INFO</option>
                            <option value="warn">WARN</option>
                            <option value="error">ERROR</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'host' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Host Name</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.name || "host"}
                            onChange={(e) => updateNodeData(selectedNode.id, { name: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Host Address</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.host_address || "0.0.0.0"}
                            onChange={(e) => updateNodeData(selectedNode.id, { host_address: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Port</span>
                          <input 
                            type="number" 
                            value={selectedNode.data?.port || 8080}
                            onChange={(e) => updateNodeData(selectedNode.id, { port: parseInt(e.target.value) })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'condition' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Condition (Python Expression)</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.condition || "True"}
                            onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'for_loop' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Collection Variable</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.collection || "items"}
                            onChange={(e) => updateNodeData(selectedNode.id, { collection: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Item Variable</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.item_var || "item"}
                            onChange={(e) => updateNodeData(selectedNode.id, { item_var: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {selectedNode.type === 'while_loop' && (
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] text-white/70">Condition Expression</span>
                          <input 
                            type="text" 
                            value={selectedNode.data?.condition || "count < 10"}
                            onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                            className="w-full px-3 py-1.5 bg-[#3c3c3c] border border-[#454545] rounded text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          />
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              </div>

              <div className="p-4 bg-[#1e1e1e] border-t border-[#333]">
                <button 
                  onClick={() => {
                    commands.setNodes((nds: any) => nds.filter((n: any) => n.id !== selectedNode.id));
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
