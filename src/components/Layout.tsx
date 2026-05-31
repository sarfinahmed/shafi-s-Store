import React from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useConfig } from "../lib/config";
import { LogOut, User as UserIcon, LayoutDashboard, Home } from "lucide-react";
import { Button } from "./ui";

export function Layout() {
  const { user, logout } = useAuth();
  const { settings } = useConfig();

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-10 h-16 md:h-20 flex items-center justify-between">
          <Link to="/" className="text-xl md:text-2xl font-black tracking-tighter text-white flex items-center gap-2 md:gap-3">
            {settings?.appName || "Loading..."}
          </Link>
          <nav className="flex items-center gap-1 sm:gap-4 font-semibold">
            <Link to="/">
              <Button variant="ghost" className="px-2 sm:px-4 text-zinc-400 hover:text-white hover:bg-zinc-900">
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" className="px-2 sm:px-4 text-zinc-400 hover:text-white hover:bg-zinc-900">
                Contact
              </Button>
            </Link>
            {user ? (
              <>
                <Link to="/profile">
                  <Button variant="ghost" className="px-2 sm:px-4 text-zinc-400 hover:text-white hover:bg-zinc-900">
                    <UserIcon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Profile</span>
                  </Button>
                </Link>
                {user.isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" className="px-2 sm:px-4 text-zinc-400 hover:text-white hover:bg-zinc-900">
                      <LayoutDashboard className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" onClick={logout} className="px-2 sm:px-4 text-zinc-500 hover:text-red-400 hover:bg-red-950/30">
                  <LogOut className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button className="bg-white text-black hover:bg-zinc-200 px-3 py-1.5 md:px-4 md:py-2 text-sm">Sign In</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Outlet />
      </main>
      <footer className="border-t border-zinc-900 bg-black text-center py-6 mx-4 md:mx-0 md:py-8 text-xs md:text-sm text-zinc-600 font-medium">
        © {new Date().getFullYear()} {settings?.appName || "Loading..."}. All rights reserved.
      </footer>
    </div>
  );
}
