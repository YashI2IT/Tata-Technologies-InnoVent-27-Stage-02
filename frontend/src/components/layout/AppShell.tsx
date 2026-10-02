import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { StatusBar } from "./StatusBar";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { pageTransitionVariants } from "@/lib/motion";

export function AppShell() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex h-screen bg-background flex-col overflow-hidden font-sans text-text-primary">
      <TopHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        <AnimatePresence mode="wait">
          <motion.main 
            key={location.pathname}
            className="flex-1 overflow-y-auto p-8 relative z-0"
            variants={shouldReduceMotion ? {} : pageTransitionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
      <StatusBar />
    </div>
  );
}
