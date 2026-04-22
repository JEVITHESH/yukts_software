import React from "react";
import { 
  Files, 
  Search, 
  Workflow,
  Bot,
  Sparkles
} from "lucide-react";
import { useApp, PanelType } from "../../store";

interface SidebarIconProps {
  icon: React.ElementType;
  label: string;
  panel?: PanelType;
  active?: boolean;
  onClick: () => void;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ icon: Icon, label, active, onClick }) => (
  <div 
    className="group relative flex items-center justify-center w-12 h-12 cursor-pointer"
    onClick={onClick}
  >
    {active && <div className="absolute left-0 w-0.5 h-full bg-white" />}
    <Icon 
      size={24} 
      className={`transition-colors ${active ? "text-white" : "text-white/40 group-hover:text-white/70"}`} 
    />
    {/* Tooltip */}
    <div className="absolute left-full ml-2 px-2 py-1 bg-[#252526] text-white text-[11px] rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] border border-[#454545]">
      {label}
    </div>
  </div>
);

export const Sidebar: React.FC = () => {
  const { state, commands } = useApp();
  const { activePanel, isSidebarOpen } = state;

  const items = [
    { icon: Workflow, label: "Workflow Builder", panel: "workflow" as PanelType },
    { icon: Sparkles, label: "Yukta Assistant", panel: "assistant" as PanelType },
  ];

  return (
    <div className="w-12 bg-[#333333] flex flex-col items-center py-2 border-r border-[#1e1e1e] z-50">
      <div className="flex-1 flex flex-col gap-1">
        {items.map((item) => (
          <SidebarIcon
            key={item.label}
            icon={item.icon}
            label={item.label}
            panel={item.panel}
            active={isSidebarOpen && activePanel === item.panel}
            onClick={() => commands.setActivePanel(item.panel)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1 relative">
        {/* Account and Settings removed */}
      </div>
    </div>
  );
};
