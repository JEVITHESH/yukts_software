import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Send, 
  Bot, 
  User, 
  X, 
  Trash2, 
  Sparkles,
  Code,
  Zap,
  ChevronDown,
  ChevronUp,
  Terminal,
  GitBranch,
  CheckCircle2,
  Copy,
  Check
} from "lucide-react";
import { useApp } from "../../store";

// ─── Code Block Renderer ──────────────────────────────────────────────────────
const CodeBlock = ({ code, lang = "python" }: { code: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);
  const { commands } = useApp();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePushToEditor = () => {
    commands.setWorkflowCode(code);
    commands.syncCodeToWorkflow(code);
    commands.switchToWorkflowCode();
  };

  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-[#0d0d0e]">
      {/* Code header bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal size={12} className="text-green-400" />
          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">{lang}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePushToEditor}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 transition-all"
          >
            <Zap size={10} />
            Push to Editor
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-lg text-[10px] transition-all"
          >
            {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-[12px] leading-relaxed font-mono text-green-300/90 whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
};

// ─── Message Content Renderer (handles markdown-ish formatting) ───────────────
const MessageContent = ({ content }: { content: string }) => {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const textPart = content.slice(lastIndex, match.index);
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">{textPart}</span>
      );
    }
    parts.push(
      <div key={`code-${match.index}`}>
        <CodeBlock lang={match[1] || "python"} code={match[2].trim()} />
      </div>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(
      <span key={`text-end`} className="whitespace-pre-wrap">{content.slice(lastIndex)}</span>
    );
  }

  return <div className="text-sm leading-relaxed">{parts}</div>;
};

// ─── Backend Analysis Panel ───────────────────────────────────────────────────
const AnalysisPanel = ({ analysis }: { analysis: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFullPrompt, setShowFullPrompt] = useState(false);

  return (
    <div className="mt-2 rounded-xl border border-white/10 overflow-hidden bg-black/30">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black uppercase tracking-widest text-blue-400/80 hover:text-blue-400 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-2">
          <Zap size={10} />
          <span>Antigravity Backend Analysis</span>
          {analysis.codeGenerated && (
            <span className="flex items-center gap-1 text-green-400 ml-2">
              <CheckCircle2 size={10} />
              Code Generated
            </span>
          )}
        </div>
        {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-3 border-t border-white/5">

              {/* Intent Type Badge */}
              {analysis.intentType && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] text-white/30 uppercase tracking-widest">Intent:</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    analysis.intentType === "build"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    {analysis.intentType === "build" ? "⚙ BUILD / CODE GEN" : "💬 QUERY"}
                  </span>
                </div>
              )}

              {/* System Prompt */}
              {analysis.systemPrompt && (
                <div>
                  <button
                    onClick={() => setShowFullPrompt(p => !p)}
                    className="flex items-center gap-2 text-[9px] text-white/30 uppercase tracking-widest mb-1 hover:text-white/50 transition-colors"
                  >
                    <span className="underline">System Prompt</span>
                    <span className="text-blue-400">{showFullPrompt ? "[hide]" : "[show full]"}</span>
                  </button>
                  {showFullPrompt ? (
                    <pre className="text-[10px] text-white/60 font-mono bg-white/5 p-2 rounded-lg whitespace-pre-wrap leading-relaxed border border-white/5">
                      {analysis.systemPrompt}
                    </pre>
                  ) : (
                    <p className="text-[10px] text-white/50 italic bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 line-clamp-2">
                      "{analysis.systemPrompt.split('\n')[0]}..."
                    </p>
                  )}
                </div>
              )}

              {/* Human Requirement */}
              {analysis.humanRequirement && (
                <div>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest block mb-1 underline">User Instruction</span>
                  <p className="text-[11px] text-white/80 bg-white/5 px-2 py-1.5 rounded-lg border border-white/5">
                    {analysis.humanRequirement}
                  </p>
                </div>
              )}

              {/* Agent Analysis */}
              {analysis.agentAnalysis && (
                <div>
                  <span className="text-[9px] text-white/30 uppercase tracking-widest block mb-1 underline">Agent Analysis</span>
                  <p className="text-[11px] text-amber-300/80 leading-relaxed whitespace-pre-wrap">
                    {analysis.agentAnalysis}
                  </p>
                </div>
              )}

              {/* Nodes Used */}
              {analysis.nodesUsed && analysis.nodesUsed.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <GitBranch size={10} className="text-white/30" />
                    <span className="text-[9px] text-white/30 uppercase tracking-widest underline">Workflow Nodes</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.nodesUsed.map((node: string, idx: number) => (
                      <span key={idx} className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 text-[10px] font-semibold">
                        {node}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Node */}
              {analysis.customNodeNeeded && (
                <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <span className="text-[9px] text-purple-400 font-black uppercase tracking-widest block mb-1">✦ Custom Node Required</span>
                  <p className="text-[11px] text-purple-300/80">{analysis.customNodeNeeded}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Chat Panel ───────────────────────────────────────────────────────────
export const AIChatPanel: React.FC = () => {
  const { state, commands } = useApp();
  const { isAIChatOpen, aiMessages, isAILoading, settings, aiChatPanelWidth } = state;
  const [input, setInput] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiMessages]);

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
          const newWidth = window.innerWidth - e.clientX;
          if (newWidth > 200 && newWidth < 700) {
            (commands as any).setAiChatPanelWidth(newWidth);
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

  const handleSend = () => {
    if (!input.trim() || isAILoading) return;
    commands.sendAIMessage(input);
    setInput("");
  };

  if (!isAIChatOpen) return null;

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ width: aiChatPanelWidth, x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={isResizing ? { duration: 0 } : { duration: 0.2 }}
      className="border-l border-white/10 flex flex-col z-40 relative bg-[#141415]"
      style={{ minWidth: 280 }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={startResizing}
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors z-50 ${
          isResizing ? "bg-blue-500" : "hover:bg-blue-500/30"
        }`}
      />

      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#1a1a1b]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white tracking-tight">Antigravity</div>
            <div className="text-[9px] text-green-400 font-bold uppercase tracking-widest">● Online · v2.0</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={commands.clearAIChat}
            className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-red-400 transition-all"
            title="Clear Chat"
          >
            <Trash2 size={15} />
          </button>
          <button 
            onClick={commands.toggleAIChat}
            className="p-2 hover:bg-white/5 rounded-xl text-white/30 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar"
      >
        {aiMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center">
              <Sparkles size={28} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white/80">Antigravity is ready</p>
              <p className="text-[11px] text-white/30 mt-1">Ask me to build, explain, or generate code</p>
            </div>
          </div>
        )}

        {aiMessages.map((msg: any, i: number) => (
          <div 
            key={i} 
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              msg.role === "assistant" 
                ? "bg-gradient-to-br from-blue-500 to-violet-600" 
                : "bg-gradient-to-br from-purple-500 to-pink-600"
            }`}>
              {msg.role === "assistant" ? <Bot size={15} className="text-white" /> : <User size={15} className="text-white" />}
            </div>

            <div className={`max-w-[88%] flex flex-col gap-2`}>
              {/* Role label */}
              <div className={`text-[9px] font-black uppercase tracking-widest ${msg.role === "assistant" ? "text-blue-400" : "text-purple-400 text-right"}`}>
                {msg.role === "assistant" ? "Antigravity" : "You"}
              </div>

              {/* Message bubble */}
              <div className={`p-3 rounded-2xl text-sm ${
                msg.role === "assistant" 
                  ? "bg-[#1e1e20] border border-white/5 text-white/90 rounded-tl-sm"
                  : "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-sm"
              }`}>
                <MessageContent content={msg.content} />
              </div>

              {/* Analysis Panel (only for assistant with analysis) */}
              {msg.role === "assistant" && msg.analysis && (
                <AnalysisPanel analysis={msg.analysis} />
              )}
            </div>
          </div>
        ))}

        {isAILoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg">
              <Bot size={15} className="text-white" />
            </div>
            <div className="bg-[#1e1e20] border border-white/5 p-3 rounded-2xl rounded-tl-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] text-white/30 font-mono">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5">
        {[
          { icon: Code, label: "Build even/odd checker" },
          { icon: Zap, label: "Generate calculator" },
          { icon: Sparkles, label: "Analyze data file" }
        ].map(s => (
          <button 
            key={s.label}
            onClick={() => commands.sendAIMessage(s.label)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 bg-white/5 hover:border-blue-500/50 hover:text-blue-400 text-white/40 transition-all whitespace-nowrap"
          >
            <s.icon size={10} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end gap-2 p-2 rounded-2xl border border-white/10 bg-[#1e1e20] focus-within:border-blue-500/50 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Antigravity to build something..."
            rows={2}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-white/20 text-white resize-none leading-relaxed"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isAILoading}
            className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
              input.trim() && !isAILoading 
                ? "bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95" 
                : "bg-white/5 text-white/20 cursor-not-allowed"
            }`}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[9px] text-white/20 text-center mt-2">Shift+Enter for new line · Enter to send</p>
      </div>
    </motion.div>
  );
};
