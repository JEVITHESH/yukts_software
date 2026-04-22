import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import * as socketIo from "socket.io-client";
import "@xterm/xterm/css/xterm.css";
import { useApp } from "../../store";

// @ts-ignore - handle potential import issues in this environment
const io = (socketIo as any).io || (socketIo as any).default || socketIo;

interface TerminalProps {
  id: string;
  active: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ id, active }) => {
  const { state } = useApp();
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const socketRef = useRef<any>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  const terminalData = state.terminals.find(t => t.id === id);
  const lastClearTime = terminalData?.lastClearTime;

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#1e1e1e",
        foreground: "#cccccc",
        cursor: "#51afef",
        selectionBackground: "#3e4451",
      },
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    
    // Initial fit
    setTimeout(() => fitAddon.fit(), 0);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Connect to Socket.io with config
    const shellConfig = terminalData?.config || { type: "local" };
    const socket = io({
      query: {
        shellConfig: JSON.stringify(shellConfig)
      }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      term.write("\r\n\x1b[32mConnected to local OS terminal\x1b[0m\r\n");
      // Request initial size
      socket.emit("resize", { cols: term.cols, rows: term.rows });
    });

    socket.on("output", (data: string) => {
      console.log("Terminal component received output:", data.substring(0, 20));
      term.write(data);
    });

    socket.on("disconnect", () => {
      term.write("\r\n\x1b[31mDisconnected from terminal\x1b[0m\r\n");
    });

    term.onData((data) => {
      console.log("Terminal input:", data);
      socket.emit("input", data);
    });

    // Handle resizing using ResizeObserver for better reliability than window resize
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current && xtermRef.current) {
        fitAddonRef.current.fit();
        // Delay size emission to ensure xterm.js internal state has settled
        setTimeout(() => {
          if (xtermRef.current && socketRef.current) {
            socketRef.current.emit("resize", { 
              cols: xtermRef.current.cols, 
              rows: xtermRef.current.rows 
            });
          }
        }, 50);
      }
    });
    
    if (terminalRef.current) {
      resizeObserver.observe(terminalRef.current);
    }

    // Handle paste events specifically
    const handlePaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text");
      if (text) {
        socket.emit("input", text);
      }
    };

    const handleExternalCommand = (e: any) => {
      if (e.detail && e.detail.id === id) {
        socket.emit("input", e.detail.command);
      }
    };

    terminalRef.current?.addEventListener("paste", handlePaste as any);
    window.addEventListener("terminal-send-command", handleExternalCommand);

    return () => {
      resizeObserver.disconnect();
      terminalRef.current?.removeEventListener("paste", handlePaste as any);
      window.removeEventListener("terminal-send-command", handleExternalCommand);
      socket.disconnect();
      term.dispose();
    };
  }, [id]);

  // Handle clearing
  useEffect(() => {
    if (lastClearTime && xtermRef.current) {
      xtermRef.current.clear();
      // Also send clear command to shell if possible, but clear() handles the UI
    }
  }, [lastClearTime]);

  // Re-fit and focus when the panel becomes active
  useEffect(() => {
    if (active && fitAddonRef.current && xtermRef.current) {
      setTimeout(() => {
        fitAddonRef.current?.fit();
        xtermRef.current?.focus();
      }, 100);
    }
  }, [active]);

  return (
    <div 
      className="w-full h-full bg-[#1e1e1e] overflow-hidden"
      onClick={() => xtermRef.current?.focus()}
    >
      <div ref={terminalRef} className="w-full h-full" />
    </div>
  );
};
