import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { AppSidebar, type Page } from "./components/AppSidebar";
import { useAutoRegister } from "./hooks/useAutoRegister";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ChatPage from "./pages/ChatPage";
import DashboardPage from "./pages/DashboardPage";
import DoubtsPage from "./pages/DoubtsPage";
import EventsPage from "./pages/EventsPage";
import LandingPage from "./pages/LandingPage";
import ProfilePage from "./pages/ProfilePage";
import StudentsPage from "./pages/StudentsPage";
import StudyMaterialsPage from "./pages/StudyMaterialsPage";

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case "dashboard":
      return <DashboardPage />;
    case "study":
      return <StudyMaterialsPage />;
    case "doubts":
      return <DoubtsPage />;
    case "events":
      return <EventsPage />;
    case "announcements":
      return <AnnouncementsPage />;
    case "chat":
      return <ChatPage />;
    case "students":
      return <StudentsPage />;
    case "profile":
      return <ProfilePage />;
    default:
      return <DashboardPage />;
  }
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  // Auto-register the user in the background — does NOT block rendering
  useAutoRegister();

  // Only show loading while the Internet Identity SDK is initializing
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">
            Loading Smart Campus Connect...
          </p>
        </div>
        <Toaster />
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LandingPage />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-background">
        <AppSidebar currentPage={currentPage} onPageChange={setCurrentPage} />

        {/* Main content */}
        <main className="flex-1 lg:ml-56 xl:ml-64 pt-14 lg:pt-0 min-h-screen">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <PageContent page={currentPage} />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <Toaster richColors position="bottom-right" />
    </>
  );
}
