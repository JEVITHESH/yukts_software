import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, HelpCircle, Send } from "lucide-react";
import { useApp } from "../store";

export const PromptModal: React.FC = () => {
  const { state, commands } = useApp();
  const { promptModal } = state;
  const [value, setValue] = useState("");

  useEffect(() => {
    if (promptModal) {
      setValue(promptModal.defaultValue || "");
    }
  }, [promptModal]);

  if (!promptModal) return null;

  const handleSubmit = () => {
    promptModal.onConfirm(value);
    commands.closePromptModal();
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        className="w-full max-w-md bg-[#252526] border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)] rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333333] bg-gradient-to-r from-[#2d2d2d] to-[#252526]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
              <HelpCircle size={20} />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">
              {promptModal.title}
            </h3>
          </div>
          <button
            onClick={() => commands.closePromptModal()}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 space-y-6">
          <p className="text-sm text-white/70 leading-relaxed font-medium">
            {promptModal.message}
          </p>
          
          <div className="relative group">
            <input
              autoFocus
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-[#1e1e1e] border-2 border-[#3c3c3c] focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-white/10"
              placeholder="Type your response here..."
            />
            <div className="absolute inset-0 rounded-xl bg-blue-500/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#1e1e1e]/50 border-t border-[#333333]">
          <button
            onClick={() => commands.closePromptModal()}
            className="px-5 py-2 text-xs font-bold text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-2.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-95 group"
          >
            Submit
            <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
