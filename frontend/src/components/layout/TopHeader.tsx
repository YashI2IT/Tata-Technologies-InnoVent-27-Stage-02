import { useState, useEffect } from "react";
import { Search, Bell, LogOut, ChevronDown, User as UserIcon, Settings, Shield, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationPanel } from "./NotificationPanel";
import { ProfileSettingsModal } from "./ProfileSettingsModal";
import { api, User } from "@/services/api";
import { AnimatePresence, motion } from "framer-motion";
import { slideDownPop } from "@/lib/motion";

export function TopHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Profile settings modal state
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [profileTab, setProfileTab] = useState<"profile" | "security" | "preferences">("profile");
  
  // Local Trusted Desktop Application default user
  const user: User = {
    id: 1,
    username: "admin",
    role: "Lead Technician",
    full_name: "Arjun Verma",
    email: "arjun.verma@aeroedgex.com",
    technician_id: "Tech-07",
    station: "Hangar 3 - Turbine & Propulsion Bay",
    phone: "+91 98765 43210"
  };

  // Helper mappings for display identity
  const getDisplayName = (u: User | null) => {
    if (!u) return "Technician";
    if (u.full_name) return u.full_name;
    return u.username.toLowerCase() === "admin" ? "Arjun Verma" : u.username;
  };

  const getDisplayRole = (u: User | null) => {
    if (!u) return "Technician";
    if (u.username?.toLowerCase() === "admin") return "Lead Technician";
    return u.role || "Technician";
  };

  const getInitials = (name: string) => {
    if (!name) return "AV";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const displayName = getDisplayName(user);
  const displayRole = getDisplayRole(user);
  const initials = getInitials(displayName);
  const technicianId = user?.technician_id || "Tech-07";

  // Fetch initial unread count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await api.getNotifications(100);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUnread();
  }, [refreshTrigger]);

  // Keyboard shortcut for search & custom event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Listen for custom events
    const handleRefreshEvent = () => setRefreshTrigger((prev) => prev + 1);
    const handleOpenSettingsEvent = (e: any) => {
      setProfileTab(e.detail?.tab || "profile");
      setIsProfileSettingsOpen(true);
    };

    window.addEventListener("refresh-notifications", handleRefreshEvent);
    window.addEventListener("open-profile-settings", handleOpenSettingsEvent);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("refresh-notifications", handleRefreshEvent);
      window.removeEventListener("open-profile-settings", handleOpenSettingsEvent);
    };
  }, []);

  const openSettingsTab = (tab: "profile" | "security" | "preferences") => {
    setIsProfileOpen(false);
    setProfileTab(tab);
    setIsProfileSettingsOpen(true);
  };

  const handleUserUpdated = (updatedUser: User) => {
    // Local user update (ignored in strict local mode)
  };

  return (
    <>
      <header className="h-[72px] bg-surface border-b border-border-subtle flex items-center justify-between px-7 shrink-0 z-10 text-sm relative">
        {/* Left Section: Branding */}
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="h-14 flex items-center justify-center shrink-0">
            <img
              src="./logo.png"
              alt="AeroEdge-X Logo"
              className="h-full w-auto object-contain"
            />
          </div>
        </div>

        {/* Center Section: Global Search Bar */}
        <div className="hidden md:flex flex-1 items-center justify-center max-w-xl mx-8">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 w-full max-w-md h-10 px-4 bg-surface-secondary border border-border-subtle hover:border-[#CBD5E1] rounded-full text-text-muted hover:text-text-primary transition-all text-[13px] text-left relative shadow-sm"
          >
            <Search size={16} />
            <span>Search inspections, manuals, or assets...</span>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-surface border border-border-subtle rounded text-[10px] font-bold text-text-disabled shadow-sm">
                Ctrl
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-surface border border-border-subtle rounded text-[10px] font-bold text-text-disabled shadow-sm">
                K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3 relative">
          <button
            title="Notifications"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`w-10 h-10 flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20 relative ${
              isNotificationsOpen
                ? "bg-surface-secondary text-brand"
                : "text-text-muted hover:text-brand hover:bg-surface-secondary"
            }`}
          >
            <Bell size={18} strokeWidth={2} />
            {/* Unread indicator */}
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF9C00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF9C00] border border-white"></span>
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full hover:bg-surface-secondary transition-all border border-border-subtle/50 hover:border-border-subtle shadow-xs"
              >
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ring-2 ring-brand/10">
                  {initials}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-text-primary leading-tight">
                    {displayName}
                  </span>
                  <span className="text-[10px] text-text-muted leading-tight">
                    {displayRole}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-text-muted transition-transform duration-200 hidden sm:block ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    variants={slideDownPop}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl shadow-xl border border-border-subtle py-2 z-50 origin-top-right overflow-hidden"
                  >
                    {/* Header info */}
                    <div className="px-4 py-2.5 border-b border-border-subtle bg-surface-secondary/40">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {displayName}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <p className="text-[11px] font-medium text-emerald-600">
                          {displayRole}
                        </p>
                      </div>
                      <p className="text-[10px] text-text-muted mt-1 font-mono">
                        ID: {technicianId} • User: {user.username}
                      </p>
                    </div>

                    {/* Menu Actions */}
                    <div className="py-1">
                      <button
                        onClick={() => openSettingsTab("profile")}
                        className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <UserIcon size={14} className="text-brand" />
                          <span>Edit Profile Settings</span>
                        </div>
                        <span className="text-[10px] text-brand bg-brand/10 px-1.5 py-0.5 rounded font-semibold">
                          Edit
                        </span>
                      </button>

                      <button
                        onClick={() => openSettingsTab("security")}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                      >
                        <Shield size={14} className="text-brand" />
                        <span>Security & Password</span>
                      </button>

                      <button
                        onClick={() => openSettingsTab("preferences")}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-secondary transition-colors"
                      >
                        <Sliders size={14} className="text-brand" />
                        <span>Station Preferences</span>
                      </button>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          {/* Floating Notification Panel */}
          <NotificationPanel
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            refreshTrigger={refreshTrigger}
            onUnreadCountChange={(count) => setUnreadCount(count)}
          />
        </div>

        {/* Global Search Overlay */}
        <GlobalSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      </header>

      {/* Profile & Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
        currentUser={user}
        onUserUpdated={handleUserUpdated}
        initialTab={profileTab}
      />
    </>
  );
}
