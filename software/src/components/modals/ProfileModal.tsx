import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  User, 
  Mail, 
  CreditCard, 
  Activity, 
  Layout, 
  Play, 
  Edit3, 
  ArrowUpRight,
  LogOut
} from "lucide-react";
import { useApp } from "../../store";

export const ProfileModal: React.FC = () => {
  const { state, commands } = useApp();
  const { isProfileOpen, user } = state;

  if (!isProfileOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={commands.closeProfile}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-[#1e1e1e] border border-[#3c3c3c] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800">
          <button 
            onClick={commands.closeProfile}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white/80 hover:text-white transition-all z-10"
          >
            <X size={20} />
          </button>
          
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-blue-400 to-purple-500 border-4 border-[#1e1e1e] shadow-2xl flex items-center justify-center text-4xl font-bold text-white uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {user.name}
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] uppercase tracking-widest rounded-full border border-blue-500/30">
                  {user.plan}
                </span>
              </h2>
              <p className="text-white/50 text-sm flex items-center gap-1.5">
                <Mail size={14} />
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-20 p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="p-4 bg-[#252526] rounded-xl border border-[#3c3c3c] space-y-3">
              <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-wider">
                <CreditCard size={14} className="text-blue-500" />
                Subscription
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white">{user.plan} Plan</span>
                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors">
                  Upgrade Plan
                  <ArrowUpRight size={12} />
                </button>
              </div>
              <div className="h-1.5 w-full bg-[#3c3c3c] rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-1/3" />
              </div>
              <p className="text-[10px] text-white/30">Subscription active</p>
            </div>

            <div className="p-4 bg-[#252526] rounded-xl border border-[#3c3c3c] space-y-3">
              <div className="flex items-center gap-2 text-white/40 text-xs font-bold uppercase tracking-wider">
                <Activity size={14} className="text-purple-500" />
                Usage Stats
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xl font-bold text-white flex items-center gap-2">
                    <Layout size={16} className="text-white/20" />
                    {user.stats.workflows}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">Workflows</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-white flex items-center gap-2">
                    <Play size={16} className="text-white/20" />
                    {user.stats.runs}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">Runs</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest">Account Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2d2d2d] hover:bg-[#3c3c3c] text-white rounded-xl border border-[#3c3c3c] transition-all text-sm font-medium">
                <Edit3 size={16} className="text-blue-400" />
                Edit Profile
              </button>
              <button 
                onClick={commands.logout}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all text-sm font-medium"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#252526] border-t border-[#3c3c3c] flex justify-center">
          <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">AI Studio IDE</p>
        </div>
      </motion.div>
    </div>
  );
};
