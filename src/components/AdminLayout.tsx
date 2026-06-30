import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { LogOut, Home, Settings, Package, Users, Wallet, ShoppingCart, History } from "lucide-react";
import { Button } from "./ui";

export function AdminLayout() {
  const { logout } = useAuth();
  const { settings } = useConfig();

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white font-sans md:h-screen w-full flex flex-col md:flex-row selection:bg-zinc-800 selection:text-black dark:text-white">
      {/* Sidebar / Topnav on mobile */}
      <aside className="w-full md:w-64 bg-white dark:bg-black border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-900 flex flex-col z-10 relative shadow-2xl flex-shrink-0">
        <div className="p-4 md:p-8 flex justify-between items-center md:block">
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter text-black dark:text-white flex items-center gap-2 md:gap-3">
            {settings?.appName || "Admin"}
          </Link>
          <Button variant="ghost" onClick={logout} className="md:hidden text-red-500 hover:bg-red-950/30 hover:text-red-400 px-3">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
        
        <nav className="flex-1 px-4 py-2 md:py-0 space-y-0 md:space-y-1 flex md:block overflow-x-auto md:overflow-y-auto whitespace-nowrap scrollbar-hide">
          <Link to="/" className="inline-flex md:flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-900 hover:text-black dark:text-white rounded-xl font-bold transition-colors mb-2 md:mb-4">
            <Home className="w-4 h-4 md:w-5 h-5 flex-shrink-0" />
            Back to App
          </Link>
          <Link to="/admin" className="inline-flex md:flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-900 hover:text-black dark:text-white rounded-xl font-bold transition-colors">
            <Package className="w-4 h-4 md:w-5 h-5 flex-shrink-0" />
            Products
          </Link>
          <Link to="/admin/users" className="inline-flex md:flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-900 hover:text-black dark:text-white rounded-xl font-bold transition-colors">
            <Users className="w-4 h-4 md:w-5 h-5 flex-shrink-0" />
            Users
          </Link>
          <Link to="/admin/deposits" className="inline-flex md:flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-900 hover:text-black dark:text-white rounded-xl font-bold transition-colors">
            <Wallet className="w-4 h-4 md:w-5 h-5 flex-shrink-0" />
            Deposits
          </Link>
          <Link to="/admin/orders" className="inline-flex md:flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-900 hover:text-black dark:text-white rounded-xl font-bold transition-colors">
            <ShoppingCart className="w-4 h-4 md:w-5 h-5 flex-shrink-0" />
            Orders
          </Link>
          <Link to="/admin/transactions" className="inline-flex md:flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-900 hover:text-black dark:text-white rounded-xl font-bold transition-colors">
            <History className="w-4 h-4 md:w-5 h-5 flex-shrink-0" />
            Transactions
          </Link>
          <Link to="/admin/settings" className="inline-flex md:flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-900 hover:text-black dark:text-white rounded-xl font-bold transition-colors">
            <Settings className="w-4 h-4 md:w-5 h-5 flex-shrink-0" />
            Settings
          </Link>
        </nav>

        <div className="p-6 hidden md:block">
          <Button variant="ghost" onClick={logout} className="w-full justify-start text-red-500 hover:bg-red-950/30 hover:text-red-400">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen md:min-h-0 md:h-screen overflow-y-auto bg-[#050505]">
        <Outlet />
      </main>
    </div>
  );
}
