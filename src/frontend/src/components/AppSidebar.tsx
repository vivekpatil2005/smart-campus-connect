import { Button } from "@/components/ui/button";
import {
  Bell,
  BookOpen,
  Calendar,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetMyProfile } from "../hooks/useQueries";
import { getInitials } from "../utils/timeUtils";

export type Page =
  | "dashboard"
  | "study"
  | "doubts"
  | "events"
  | "announcements"
  | "chat"
  | "students"
  | "profile";

const NAV_ITEMS: {
  id: Page;
  label: string;
  icon: React.ReactNode;
  ocid?: string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    id: "study",
    label: "Study Materials",
    icon: <BookOpen className="h-4 w-4" />,
  },
  { id: "doubts", label: "Doubts", icon: <HelpCircle className="h-4 w-4" /> },
  { id: "events", label: "Events", icon: <Calendar className="h-4 w-4" /> },
  {
    id: "announcements",
    label: "Announcements",
    icon: <Bell className="h-4 w-4" />,
  },
  { id: "chat", label: "Chat", icon: <MessageCircle className="h-4 w-4" /> },
  {
    id: "students",
    label: "Students",
    icon: <Users className="h-4 w-4" />,
    ocid: "nav.students_link",
  },
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
];

interface AppSidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function AppSidebar({ currentPage, onPageChange }: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useGetMyProfile();

  const displayName =
    profile?.displayName ||
    `${identity?.getPrincipal().toString().slice(0, 10)}...`;
  const initials = getInitials(profile?.displayName || "U");

  const handleNav = (page: Page) => {
    onPageChange(page);
    setMobileOpen(false);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <div className="font-heading font-bold text-sidebar-foreground text-sm leading-tight">
              Smart Campus
            </div>
            <div className="font-heading font-bold text-sidebar-primary text-xs leading-tight">
              Connect
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => handleNav(item.id)}
              data-ocid={item.ocid}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${
                  isActive
                    ? "bg-sidebar-primary/10 text-sidebar-primary border border-sidebar-primary/20"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }
              `}
            >
              <span className={isActive ? "text-sidebar-primary" : ""}>
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sidebar-foreground text-sm font-medium truncate">
              {displayName}
            </div>
            <div className="text-sidebar-foreground/50 text-xs">
              {profile?.role || "Student"}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            className="h-7 w-7 text-sidebar-foreground/50 hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 xl:w-64 h-screen fixed left-0 top-0 bg-sidebar border-r border-sidebar-border z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <GraduationCap className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-sidebar-foreground text-sm">
            Smart Campus Connect
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="text-sidebar-foreground"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50"
            >
              <div className="flex items-center justify-end p-3 border-b border-sidebar-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  className="text-sidebar-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
