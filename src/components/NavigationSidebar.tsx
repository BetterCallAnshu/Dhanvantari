import React from "react";
import {
  LayoutDashboard,
  Map,
  TrendingUp,
  Boxes,
  FileCheck,
  AlertOctagon,
  Radio,
} from "lucide-react";

interface NavigationSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  alertsCount?: number;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onSelectTab,
  alertsCount = 0,
}) => {
  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "map", label: "India Risk Map", icon: Map },
    { id: "priority", label: "District Priority", icon: TrendingUp },
    { id: "decision", label: "Decision Support", icon: Boxes },
    { id: "reports", label: "Incident Reports", icon: FileCheck },
    {
      id: "alerts",
      label: "Alerts & Audit",
      icon: AlertOctagon,
      badge: alertsCount > 0 ? alertsCount : null,
    },
  ];

  return (
    <aside className="w-16 md:w-56 bg-panel border-r border-hud flex flex-col justify-between shrink-0">
      <div className="py-3 px-2 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-wider text-gray-500 uppercase hidden md:block">
          COMMAND MODULES
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm transition-all text-xs font-mono ${
                isActive
                  ? "bg-cyan-primary/15 text-cyan-primary border-l-2 border-cyan-primary font-semibold glow-cyan"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-cyan-primary" : "text-gray-400"
                  }`}
                />
                <span className="hidden md:inline">{item.label}</span>
              </div>

              {item.badge && (
                <span className="hidden md:inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500 text-white animate-pulse">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Info */}
    </aside>
  );
};
