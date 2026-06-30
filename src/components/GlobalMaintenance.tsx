import React from "react";
import { useConfig } from "../lib/config";
import { useAuth } from "../lib/auth";
import { Wrench, Ban } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function GlobalMaintenance() {
  const { settings } = useConfig();
  const { user } = useAuth();
  
  if (user?.isBanned) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-sm p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-zinc-50 dark:bg-[#0a0a0a] border border-red-900/30 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ban className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-black dark:text-white tracking-tight mb-3">Account Suspended</h2>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed mb-6">
              Your account has been suspended by an administrator. You can no longer access this platform.
            </p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // If not maintenance mode, or if user is admin, don't show the popup
  if (!settings?.maintenanceMode || user?.isAdmin) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-sm p-4"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-zinc-50 dark:bg-[#0a0a0a] border border-zinc-300 dark:border-zinc-800 rounded-2xl max-w-md w-full p-8 text-center shadow-2xl"
        >
          <div className="w-16 h-16 bg-orange-950/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-orange-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-black dark:text-white tracking-tight mb-3">Under Maintenance</h2>
          <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed mb-6">
            We are currently updating our app to bring you a better experience. Please check back soon!
          </p>
          <div className="text-xs text-zinc-600 font-bold uppercase tracking-widest">
            — The {settings.appName || "Store"} Team —
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
