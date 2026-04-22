import React from "react";
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertCircle, Info } from "lucide-react";
import { useApp } from "../../store";

export const ConfirmationModal: React.FC = () => {
  const { state, commands } = useApp();
  const { modal } = state;

  if (!modal) return null;

  const isAbout = modal.title === "About";

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-[#252526] border border-[#454545] shadow-2xl rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333333] bg-[#2d2d2d]">
          <div className="flex items-center gap-2">
            {isAbout ? (
              <Info size={18} className="text-blue-400" />
            ) : (
              <AlertCircle size={18} className="text-amber-400" />
            )}
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {modal.title}
            </h3>
          </div>
          <button
            onClick={() => commands.execute("closeModal")}
            className="p-1 hover:bg-white/10 rounded transition-colors text-white/50 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-white/80 leading-relaxed">
            {modal.message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 bg-[#1e1e1e] border-t border-[#333333]">
          {!isAbout && (
            <button
              onClick={() => commands.execute("closeModal")}
              className="px-4 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 rounded transition-all"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => {
              modal.onConfirm();
              commands.execute("closeModal");
            }}
            className="px-6 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            {isAbout ? "Close" : "Confirm"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
