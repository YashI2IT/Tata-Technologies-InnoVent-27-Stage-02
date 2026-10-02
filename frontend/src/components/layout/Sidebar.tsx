import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Search, 
  BookOpen, 
  Box, 
  FileText, 
  BarChart3, 
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, SystemStatus } from "@/services/api";

import { motion } from "framer-motion";
import { TRANSITION_STANDARD } from "@/lib/motion";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Inspection", path: "/inspection", icon: Search },
  { name: "Digital Twin", path: "/digital-twin", icon: Box },
  { name: "Reports", path: "/reports", icon: FileText },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    version: 'Loading...',
    database: 'Loading...',
    last_sync: 'Loading...'
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await api.getSystemStatus();
        setSystemStatus(status);
      } catch (err) {
        console.error("Failed to fetch system status");
      }
    };
    fetchStatus();
  }, []);

  return (
    <aside className="w-64 bg-surface border-r border-border-subtle flex flex-col justify-between overflow-y-auto shrink-0 z-0">
      <div className="py-6">
        <nav className="flex flex-col gap-1.5 px-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative mx-1"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      className="absolute inset-0 bg-[#F1F5F9] border border-[#D9E1EA]/50 rounded-xl shadow-sm"
                      initial={false}
                      transition={TRANSITION_STANDARD}
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 flex items-center gap-3 px-3 py-2.5 text-[14px] transition-colors rounded-xl",
                      isActive
                        ? "text-brand font-semibold"
                        : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium"
                    )}
                  >
                    <item.icon size={20} />
                    {item.name}
                  </div>
                </>
              )}
            </NavLink>
          ))}

          <div className="pt-2 mt-2 border-t border-border-subtle/60 mx-1">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-profile-settings'))}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[14px] text-text-secondary hover:bg-surface-secondary hover:text-text-primary font-medium rounded-xl transition-colors text-left"
            >
              <Settings size={20} className="shrink-0" />
              <span>Profile & Settings</span>
            </button>
          </div>
        </nav>
      </div>

      <div className="p-6 border-t border-border-subtle mt-auto">
        <div className="text-[11px] text-text-disabled space-y-3 font-medium">
          <div className="flex justify-between items-center">
            <span className="text-text-muted font-semibold">System Version</span>
            <span>{systemStatus.version}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted font-semibold">Database</span>
            <span>{systemStatus.database}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted font-semibold">Last Sync</span>
            <span>{systemStatus.last_sync}</span>
          </div>
          <div className="pt-4 border-t border-gray-50 mt-4 text-center">
            © 2026 AeroEdge-X<br/>
            All Rights Reserved
          </div>
        </div>
      </div>
    </aside>
  );
}
